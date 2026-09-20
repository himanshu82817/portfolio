#!/usr/bin/env bash
#
# One-time Google Cloud setup for the dev environment: the Cloud Run service
# behind https://dev.himanshusehlangia.dev that .github/workflows/deploy-dev.yml
# deploys to. Kept in the repo as the record of what exists and why; every step
# checks before it creates, so re-running it is safe.
#
# Run from the repo root, signed in as a project owner:
#   bash deploy/cloudrun/setup-gcp.sh
#
# What it costs: the service scales to zero and sits inside Cloud Run's free
# tier for a test site; the registry keeps only the five newest images.

set -euo pipefail

PROJECT_ID=portfolio-hub-488305
REGION=us-central1              # same region as the VM; supports Cloud Run domain mappings
SERVICE=portfolio-dev
AR_REPO=portfolio
DOMAIN=dev.himanshusehlangia.dev
DNS_ZONE=himanshusehlangia-dev  # the Cloud DNS zone that already serves the apex
POOL=github
PROVIDER=portfolio-repo

# GitHub's numeric IDs for himanshu82817/portfolio and its owner. Names on GitHub
# can be renamed, deleted and then registered again by someone else; these cannot.
#   curl -s https://api.github.com/repos/himanshu82817/portfolio | jq '.id, .owner.id'
GITHUB_REPO_ID=1115069602
GITHUB_OWNER_ID=83991324

RUNTIME_SA="portfolio-dev-run@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_SA="github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

g() { gcloud --project "$PROJECT_ID" --quiet "$@"; }
exists() { "$@" >/dev/null 2>&1; }
# IAM is eventually consistent: a service account created seconds ago is often
# not yet visible to the call that binds a role to it. (`until` is exempt from -e.)
retry() {
  local n=0
  until "$@"; do
    n=$((n + 1))
    [ "$n" -ge 6 ] && return 1
    echo "  not ready yet, retrying in $((n * 5))s..." >&2
    sleep $((n * 5))
  done
}
# Pools and providers are soft-deleted for 30 days, during which `describe` still
# succeeds — so existence alone would skip re-creating one that was torn down.
wif_state() { g iam workload-identity-pools "$@" --format 'value(state)' 2>/dev/null || true; }

echo "== APIs"
g services enable run.googleapis.com artifactregistry.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com

echo "== Artifact Registry"
exists g artifacts repositories describe "$AR_REPO" --location "$REGION" ||
  g artifacts repositories create "$AR_REPO" --repository-format=docker \
    --location "$REGION" --description "Container images for the portfolio"
# Every push to dev adds an image; without this they pile up and get billed.
g artifacts repositories set-cleanup-policies "$AR_REPO" --location "$REGION" \
  --policy deploy/cloudrun/ar-cleanup-policy.json --no-dry-run

echo "== Service accounts"
# The service runs as an identity with no roles at all: a static site needs
# none, and the default compute account it would otherwise get is a project Editor.
exists g iam service-accounts describe "$RUNTIME_SA" ||
  g iam service-accounts create portfolio-dev-run \
    --display-name "Portfolio dev (Cloud Run runtime)"
exists g iam service-accounts describe "$DEPLOYER_SA" ||
  g iam service-accounts create github-deployer \
    --display-name "GitHub Actions deployer"

echo "== What the deployer may do (its Cloud Run role follows, on the one service)"
# Push images to this one repository.
retry g artifacts repositories add-iam-policy-binding "$AR_REPO" --location "$REGION" \
  --member "serviceAccount:${DEPLOYER_SA}" --role roles/artifactregistry.writer >/dev/null
# Deploy revisions that run as the runtime account — and only that account.
retry g iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member "serviceAccount:${DEPLOYER_SA}" --role roles/iam.serviceAccountUser >/dev/null

echo "== Keyless login from GitHub Actions (Workload Identity Federation)"
case "$(wif_state describe "$POOL" --location global)" in
  ACTIVE) ;;
  DELETED) g iam workload-identity-pools undelete "$POOL" --location global ;;
  *) g iam workload-identity-pools create "$POOL" --location global \
       --display-name "GitHub Actions" ;;
esac
# The condition is the security boundary: GitHub signs tokens for every
# repository on github.com, and only ones issued to this repository — by its
# immutable ID, not its reusable name — are accepted.
WIF_MAPPING="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref"
WIF_CONDITION="assertion.repository_owner_id=='${GITHUB_OWNER_ID}' && assertion.repository_id=='${GITHUB_REPO_ID}'"
PROVIDER_STATE=$(wif_state providers describe "$PROVIDER" \
  --location global --workload-identity-pool "$POOL")
if [ "$PROVIDER_STATE" = DELETED ]; then
  g iam workload-identity-pools providers undelete "$PROVIDER" \
    --location global --workload-identity-pool "$POOL"
fi
if [ -n "$PROVIDER_STATE" ]; then
  # Re-applied on every run, so the condition here is always the one in force.
  g iam workload-identity-pools providers update-oidc "$PROVIDER" \
    --location global --workload-identity-pool "$POOL" \
    --attribute-mapping "$WIF_MAPPING" --attribute-condition "$WIF_CONDITION"
else
  g iam workload-identity-pools providers create-oidc "$PROVIDER" \
    --location global --workload-identity-pool "$POOL" \
    --display-name "portfolio repo" \
    --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "$WIF_MAPPING" --attribute-condition "$WIF_CONDITION"
fi
retry g iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository_id/${GITHUB_REPO_ID}" >/dev/null

echo "== Cloud Run service"
# Created once with Google's placeholder image so the domain can be mapped before
# the first real build; the workflow only ever swaps the image afterwards.
exists g run services describe "$SERVICE" --region "$REGION" ||
  g run deploy "$SERVICE" --region "$REGION" \
    --image us-docker.pkg.dev/cloudrun/container/hello \
    --service-account "$RUNTIME_SA" --allow-unauthenticated \
    --port 8080 --cpu 1 --memory 256Mi --concurrency 200 \
    --min-instances 0 --max-instances 2
# Roll out revisions of THIS service — not create, change or delete any other
# service or job in the project, and not change who can reach this one (that
# needs run.admin). Bound here rather than on the project for exactly that reason.
g run services add-iam-policy-binding "$SERVICE" --region "$REGION" \
  --member "serviceAccount:${DEPLOYER_SA}" --role roles/run.developer >/dev/null

echo "== Custom domain"
# himanshusehlangia.dev is already verified for this Google account, which is
# what lets a subdomain of it be mapped. Google issues and renews the certificate.
exists g beta run domain-mappings describe --domain "$DOMAIN" --region "$REGION" ||
  g beta run domain-mappings create --service "$SERVICE" --domain "$DOMAIN" --region "$REGION"
exists g dns record-sets describe "${DOMAIN}." --zone "$DNS_ZONE" --type CNAME ||
  g dns record-sets create "${DOMAIN}." --zone "$DNS_ZONE" --type CNAME --ttl 300 \
    --rrdatas "ghs.googlehosted.com."

echo
echo "Workload identity provider (deploy-dev.yml, WIF_PROVIDER):"
echo "  projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"
echo "Certificate status — 'Ready' can take 15-60 minutes after the DNS record exists:"
g beta run domain-mappings describe --domain "$DOMAIN" --region "$REGION" \
  --format 'table(status.conditions[].type,status.conditions[].status)'
