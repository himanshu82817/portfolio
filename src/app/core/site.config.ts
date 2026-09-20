/**
 * Single source of truth for site-wide facts that appear in more than one place
 * (SEO tags, structured data, the hero, the footer, the sitemap).
 *
 * `siteUrl` is the production origin. It is also written into src/index.html,
 * public/sitemap.xml and public/robots.txt — change all four together.
 */
export const SITE = {
  /** Absolute origin, no trailing slash. Used for canonical + Open Graph URLs. */
  siteUrl: 'https://himanshusehlangia.dev',

  name: 'Himanshu Sehlangia',
  shortName: 'Himanshu',
  role: 'Full Stack Engineer',
  location: 'New Delhi, India',
  locality: 'New Delhi',
  region: 'DL',
  country: 'IN',

  email: 'himanshu82817@gmail.com',
  phone: '+91-9466082817',

  /** The month work experience began — years of experience are derived from this,
   *  so the number on the site can never drift out of date. */
  careerStart: new Date(2021, 11), // December 2021

  description:
    'Full Stack Engineer in New Delhi building Angular front-ends and Node/SQL ' +
    'services for fintech and edtech — loan origination, learning platforms, and ' +
    'the reporting systems behind them.',

  social: {
    github: 'https://github.com/himanshu82817',
    linkedin: 'https://www.linkedin.com/in/himanshu82817',
  },

  /**
   * Set to '/resume.pdf' once you drop the file into `public/`.
   * While this is null the download buttons are not rendered at all —
   * better no button than a button that 404s.
   */
  resumeUrl: null as string | null,

  /**
   * Web3Forms access key (https://web3forms.com — free, no account needed).
   * While this is null the contact form falls back to composing a mailto:
   * message, so it always does something real. See README.
   */
  contactFormKey: null as string | null,
} as const;

/** Whole years since `careerStart`, floored. Recomputed on every page load. */
export function yearsOfExperience(now: Date = new Date()): number {
  const start = SITE.careerStart;
  let years = now.getFullYear() - start.getFullYear();
  if (now.getMonth() < start.getMonth()) years--;
  return Math.max(0, years);
}
