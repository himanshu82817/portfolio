import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Architecture, DiagramNode, Tier } from './case-study.model';

type Diagram = Architecture['diagram'];

/** Left-to-right column order. Only tiers that have nodes get a column. */
const TIER_ORDER: readonly Tier[] = ['client', 'edge', 'service', 'data', 'external'];

export const TIER_LABEL: Record<Tier, string> = {
  client: 'Clients',
  edge: 'Edge',
  service: 'Services',
  data: 'Data',
  external: 'External',
};

const TIER_DOT: Record<Tier, string> = {
  client: 'fill-tertiary',
  edge: 'fill-[#4286f5]',
  service: 'fill-primary',
  data: 'fill-[#fabc05]',
  external: 'fill-outline',
};

export const DIAGRAM_LAYOUT = {
  nodeW: 168,
  nodeH: 58,
  colGap: 72,
  rowGap: 24,
  pad: 20,
  header: 30,
  /** Characters that fit on a node before truncating — the full text stays in <title>. */
  labelChars: 18,
  sublabelChars: 24,
  /**
   * Edge-label box estimate: average glyph width of 10.5px semibold text, plus
   * padding. Used for collision avoidance, so it errs slightly wide.
   */
  labelCharW: 5.6,
  labelPadX: 4,
  labelH: 14,
} as const;

export interface PlacedNode extends DiagramNode {
  x: number;
  y: number;
  col: number;
  shortLabel: string;
  shortSub: string;
}

export interface PlacedEdge {
  key: string;
  d: string;
  label?: string;
  /** Label anchor: horizontal centre and text baseline. */
  lx: number;
  ly: number;
}

export interface DiagramLayout {
  width: number;
  height: number;
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  headers: { label: string; x: number; y: number }[];
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The area an edge label occupies, estimated from its length. */
export function labelBox(edge: Pick<PlacedEdge, 'label' | 'lx' | 'ly'>): Box {
  const { labelCharW, labelPadX, labelH } = DIAGRAM_LAYOUT;
  const w = (edge.label?.length ?? 0) * labelCharW + labelPadX * 2;
  return { x: edge.lx - w / 2, y: edge.ly - 11, w, h: labelH };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * The t at which a curve's x reaches `targetX`, by bisection. Every edge curve
 * here has both control points between its endpoints, so x(t) is monotonic.
 */
function tAtX(x0: number, c1: number, c2: number, x3: number, targetX: number): number {
  const increasing = x3 >= x0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (cubic(x0, c1, c2, x3, mid) < targetX === increasing) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Vertical offsets tried, in order, when a label would collide with something. */
const LABEL_NUDGES = [0, -14, 14, -28, 28, -42, 42];

/**
 * Pure layout: tier columns, nodes centred vertically within each column, and
 * cubic Bézier edges. Kept free of Angular so it can be unit-tested directly.
 *
 * Label placement has two rules. A label sits in the column gap next to its
 * edge's source, never at the curve's midpoint — for an edge spanning several
 * columns the midpoint lands on whatever node is in between. Then each label is
 * nudged vertically until it clears every node and every label placed before it.
 */
export function layoutDiagram(diagram: Diagram): DiagramLayout {
  const { nodeW, nodeH, colGap, rowGap, pad, header } = DIAGRAM_LAYOUT;

  const columns = TIER_ORDER.map(tier => ({
    tier,
    nodes: diagram.nodes.filter(node => node.tier === tier),
  })).filter(column => column.nodes.length > 0);

  const maxRows = Math.max(1, ...columns.map(column => column.nodes.length));
  const bodyH = maxRows * nodeH + (maxRows - 1) * rowGap;
  const width = pad * 2 + columns.length * nodeW + Math.max(0, columns.length - 1) * colGap;
  const height = pad * 2 + header + bodyH;

  const byId = new Map<string, PlacedNode>();
  const nodes: PlacedNode[] = [];

  columns.forEach((column, col) => {
    const columnH = column.nodes.length * nodeH + (column.nodes.length - 1) * rowGap;
    const top = pad + header + (bodyH - columnH) / 2;

    column.nodes.forEach((node, row) => {
      const placed: PlacedNode = {
        ...node,
        col,
        x: pad + col * (nodeW + colGap),
        y: top + row * (nodeH + rowGap),
        shortLabel: truncate(node.label, DIAGRAM_LAYOUT.labelChars),
        shortSub: truncate(node.sublabel ?? '', DIAGRAM_LAYOUT.sublabelChars),
      };
      nodes.push(placed);
      byId.set(node.id, placed);
    });
  });

  const headers = columns.map((column, col) => ({
    label: TIER_LABEL[column.tier].toUpperCase(),
    x: pad + col * (nodeW + colGap) + nodeW / 2,
    y: pad + 12,
  }));

  const pairKey = (a: string, b: string) => [a, b].sort().join('|');
  const pairTotal = new Map<string, number>();
  for (const edge of diagram.edges) {
    const key = pairKey(edge.from, edge.to);
    pairTotal.set(key, (pairTotal.get(key) ?? 0) + 1);
  }
  const pairSeen = new Map<string, number>();

  const edges: PlacedEdge[] = [];
  diagram.edges.forEach((edge, index) => {
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) return;

    const key = pairKey(edge.from, edge.to);
    const nth = pairSeen.get(key) ?? 0;
    pairSeen.set(key, nth + 1);
    const shift = (nth - ((pairTotal.get(key) ?? 1) - 1) / 2) * 12;

    const y1 = a.y + nodeH / 2 + shift;
    const y2 = b.y + nodeH / 2 + shift;
    let x1: number, x2: number, c1x: number, c2x: number;
    let lx: number, ly: number;

    if (b.col === a.col) {
      // Same column: loop out through the gap on the right, label in that gap.
      x1 = a.x + nodeW;
      x2 = b.x + nodeW;
      c1x = x1 + colGap * 0.55;
      c2x = x2 + colGap * 0.55;
      lx = x1 + colGap / 2;
      ly = (y1 + y2) / 2 - 5;
    } else {
      const forward = b.col > a.col;
      x1 = forward ? a.x + nodeW : a.x;
      x2 = forward ? b.x : b.x + nodeW;
      const mid = (x1 + x2) / 2;
      c1x = mid;
      c2x = mid;
      // The centre of the gap beside the source.
      const t = tAtX(x1, c1x, c2x, x2, forward ? x1 + colGap / 2 : x1 - colGap / 2);
      lx = cubic(x1, c1x, c2x, x2, t);
      ly = cubic(y1, y1, y2, y2, t) - 5;
    }

    edges.push({
      key: `${edge.from}>${edge.to}#${index}`,
      d: `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`,
      label: edge.label,
      lx,
      ly,
    });
  });

  // Nudge labels clear of nodes and of each other, in edge order.
  const obstacles: Box[] = nodes.map(node => ({ x: node.x, y: node.y, w: nodeW, h: nodeH }));
  const minY = pad + 16;
  for (const edge of edges) {
    if (!edge.label) continue;
    const baseline = edge.ly;
    for (const dy of LABEL_NUDGES) {
      const box = labelBox({ ...edge, ly: baseline + dy });
      if (box.y < minY || box.y + box.h > height) continue;
      if (!obstacles.some(obstacle => boxesOverlap(box, obstacle))) {
        edge.ly = baseline + dy;
        break;
      }
    }
    obstacles.push(labelBox(edge));
  }

  return { width, height, nodes, edges, headers };
}

let instance = 0;

/**
 * Draws an architecture diagram from data rather than shipping a static image, so
 * it follows the light/dark theme (static SVGs in an <img> can't read CSS
 * variables) and a new case study never needs a hand-drawn asset.
 */
@Component({
  selector: 'app-architecture-diagram',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <div
        class="overflow-x-auto rounded-[2rem] border border-gray-200/80 dark:border-white/10 bg-surface-variant/60 p-4 md:p-6"
      >
        <svg
          role="img"
          [attr.aria-labelledby]="uid + '-title'"
          [attr.viewBox]="'0 0 ' + layout().width + ' ' + layout().height"
          class="mx-auto block h-auto w-full"
          [style.max-width.px]="layout().width"
          [style.min-width.px]="layout().width * 0.78"
        >
          <title [attr.id]="uid + '-title'">{{ diagram().caption }}</title>
          <defs>
            <marker
              [attr.id]="uid + '-arrow'"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" class="fill-gray-400 dark:fill-gray-500" />
            </marker>
          </defs>

          @for (header of layout().headers; track header.label) {
            <text
              [attr.x]="header.x"
              [attr.y]="header.y"
              text-anchor="middle"
              font-size="10.5"
              font-weight="700"
              letter-spacing="1.5"
              class="fill-gray-500 dark:fill-gray-400"
            >
              {{ header.label }}
            </text>
          }

          @for (edge of layout().edges; track edge.key) {
            <path
              [attr.d]="edge.d"
              fill="none"
              stroke-width="1.5"
              class="stroke-gray-400 dark:stroke-gray-500"
              [attr.marker-end]="'url(#' + uid + '-arrow)'"
            />
          }

          @for (node of layout().nodes; track node.id) {
            <g [attr.transform]="'translate(' + node.x + ' ' + node.y + ')'">
              <title>{{ node.label }}{{ node.sublabel ? ' — ' + node.sublabel : '' }}</title>
              <rect
                [attr.width]="nodeW"
                [attr.height]="nodeH"
                rx="14"
                stroke-width="1.5"
                class="fill-surface-elevated"
                [ngClass]="
                  node.ownership ? 'stroke-primary' : 'stroke-gray-300 dark:stroke-white/15'
                "
                [attr.stroke-dasharray]="node.tier === 'external' ? '5 4' : null"
              />
              @if (node.ownership) {
                <rect x="0" y="12" width="4" [attr.height]="nodeH - 24" rx="2" class="fill-primary" />
              }
              <circle cx="16" cy="18" r="4" [ngClass]="tierDot[node.tier]" />
              <text
                x="28"
                y="23"
                font-size="13"
                font-weight="700"
                class="fill-gray-900 dark:fill-gray-100"
              >
                {{ node.shortLabel }}
              </text>
              @if (node.shortSub) {
                <text x="16" y="44" font-size="11" class="fill-gray-600 dark:fill-gray-400">
                  {{ node.shortSub }}
                </text>
              }
            </g>
          }

          <!-- Drawn after the nodes so a label is never hidden behind one. -->
          @for (edge of layout().edges; track edge.key) {
            @if (edge.label) {
              <text
                [attr.x]="edge.lx"
                [attr.y]="edge.ly"
                text-anchor="middle"
                font-size="10.5"
                font-weight="600"
                paint-order="stroke"
                stroke-width="4"
                stroke-linejoin="round"
                class="fill-gray-600 dark:fill-gray-300 stroke-surface-variant"
              >
                {{ edge.label }}
              </text>
            }
          }
        </svg>
      </div>

      <figcaption
        class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ diagram().caption }}</span>
        <ul
          class="flex list-none flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-gray-600 dark:text-gray-400"
          aria-label="Legend"
        >
          @for (entry of legend(); track entry.tier) {
            <li class="inline-flex items-center gap-1.5">
              <svg width="8" height="8" aria-hidden="true">
                <circle cx="4" cy="4" r="4" [ngClass]="tierDot[entry.tier]" />
              </svg>
              {{ entry.label }}
            </li>
          }
          @if (hasOwned()) {
            <li class="inline-flex items-center gap-1.5">
              <span class="h-3 w-1 rounded-full bg-primary" aria-hidden="true"></span>
              My work
            </li>
          }
        </ul>
      </figcaption>
      <p class="mt-2 text-xs text-gray-600 dark:text-gray-400 md:hidden">Scroll sideways to see the whole diagram.</p>
    </figure>
  `,
})
export class ArchitectureDiagramComponent {
  readonly diagram = input.required<Diagram>();

  readonly layout = computed(() => layoutDiagram(this.diagram()));

  readonly legend = computed(() =>
    TIER_ORDER.filter(tier => this.diagram().nodes.some(node => node.tier === tier)).map(
      tier => ({ tier, label: TIER_LABEL[tier] })
    )
  );

  readonly hasOwned = computed(() => this.diagram().nodes.some(node => !!node.ownership));

  /** Marker and title ids must be unique per page. */
  readonly uid = `arch-${instance++}`;
  readonly nodeW = DIAGRAM_LAYOUT.nodeW;
  readonly nodeH = DIAGRAM_LAYOUT.nodeH;
  readonly tierDot = TIER_DOT;
}
