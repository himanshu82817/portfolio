import { TestBed } from '@angular/core/testing';

import {
  ArchitectureDiagramComponent,
  DIAGRAM_LAYOUT,
  layoutDiagram,
} from './architecture-diagram.component';
import { Architecture } from './case-study.model';

type Diagram = Architecture['diagram'];

const { nodeW, nodeH, colGap, rowGap, pad, header } = DIAGRAM_LAYOUT;

function diagram(partial: Partial<Diagram>): Diagram {
  return { caption: 'Test diagram', nodes: [], edges: [], ...partial };
}

/** Parses "M x1 y1 C c1x c1y, c2x c2y, x2 y2" into its endpoints. */
function endpoints(d: string) {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return { x1: n[0], y1: n[1], x2: n[6], y2: n[7] };
}

describe('layoutDiagram', () => {
  it('creates one column per tier that has nodes, ordered left to right', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'db', label: 'DB', tier: 'data' },
          { id: 'app', label: 'App', tier: 'client' },
          { id: 'api', label: 'API', tier: 'service' },
        ],
      })
    );

    const x = (id: string) => layout.nodes.find(node => node.id === id)!.x;
    expect(x('app')).toBeLessThan(x('api'));
    expect(x('api')).toBeLessThan(x('db'));
    expect(layout.headers.map(h => h.label)).toEqual(['CLIENTS', 'SERVICES', 'DATA']);
    expect(layout.width).toBe(pad * 2 + 3 * nodeW + 2 * colGap);
  });

  it('sizes the canvas to the tallest column and centres shorter ones', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'a', label: 'A', tier: 'service' },
          { id: 'b', label: 'B', tier: 'service' },
          { id: 'c', label: 'C', tier: 'service' },
          { id: 'solo', label: 'Solo', tier: 'data' },
        ],
      })
    );

    const bodyH = 3 * nodeH + 2 * rowGap;
    expect(layout.height).toBe(pad * 2 + header + bodyH);

    const middle = layout.nodes.find(node => node.id === 'b')!;
    const solo = layout.nodes.find(node => node.id === 'solo')!;
    expect(solo.y).withContext('a lone node sits level with the middle of three').toBe(middle.y);
  });

  it('runs forward edges from the right side of the source to the left side of the target', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'app', label: 'App', tier: 'client' },
          { id: 'api', label: 'API', tier: 'service' },
        ],
        edges: [{ from: 'app', to: 'api' }],
      })
    );
    const app = layout.nodes.find(node => node.id === 'app')!;
    const api = layout.nodes.find(node => node.id === 'api')!;
    const { x1, x2 } = endpoints(layout.edges[0].d);

    expect(x1).toBe(app.x + nodeW);
    expect(x2).toBe(api.x);
  });

  it('runs backward edges from the left side of the source', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'app', label: 'App', tier: 'client' },
          { id: 'push', label: 'Push', tier: 'external' },
        ],
        edges: [{ from: 'push', to: 'app' }],
      })
    );
    const app = layout.nodes.find(node => node.id === 'app')!;
    const push = layout.nodes.find(node => node.id === 'push')!;
    const { x1, x2 } = endpoints(layout.edges[0].d);

    expect(x1).toBe(push.x);
    expect(x2).toBe(app.x + nodeW);
  });

  it('separates A→B from B→A so they do not draw on top of each other', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'a', label: 'A', tier: 'client' },
          { id: 'b', label: 'B', tier: 'service' },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'a' },
        ],
      })
    );

    const [there, back] = layout.edges.map(edge => endpoints(edge.d));
    expect(there.y1).not.toBe(back.y2);
  });

  it('drops edges that point at nodes which do not exist', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [{ id: 'a', label: 'A', tier: 'client' }],
        edges: [{ from: 'a', to: 'ghost' }],
      })
    );
    expect(layout.edges).toEqual([]);
  });

  it('truncates long labels for the node but keeps the full label on the data', () => {
    const long = 'An extremely long component name';
    const layout = layoutDiagram(
      diagram({ nodes: [{ id: 'x', label: long, tier: 'service' }] })
    );
    const node = layout.nodes[0];

    expect(node.shortLabel.length).toBeLessThanOrEqual(DIAGRAM_LAYOUT.labelChars);
    expect(node.shortLabel.endsWith('…')).toBeTrue();
    expect(node.label).toBe(long);
  });
});

describe('ArchitectureDiagramComponent', () => {
  function render(value: Diagram): HTMLElement {
    const fixture = TestBed.createComponent(ArchitectureDiagramComponent);
    fixture.componentRef.setInput('diagram', value);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders every node and exposes the caption as the accessible name', () => {
    const el = render(
      diagram({
        caption: 'Checkout system',
        nodes: [
          { id: 'app', label: 'App', tier: 'client' },
          { id: 'api', label: 'API', tier: 'service' },
        ],
        edges: [{ from: 'app', to: 'api', label: 'REST' }],
      })
    );

    const svg = el.querySelector('svg[role="img"]')!;
    const titleId = svg.getAttribute('aria-labelledby')!;
    expect(el.querySelector(`[id="${titleId}"]`)?.textContent?.trim()).toBe('Checkout system');
    expect(svg.querySelectorAll(':scope > g').length).toBe(2);
    expect(svg.textContent).toContain('REST');
  });

  it('shows the "My work" legend entry only when a node is marked as the owner’s', () => {
    const plain = render(diagram({ nodes: [{ id: 'a', label: 'A', tier: 'client' }] }));
    expect(plain.textContent).not.toContain('My work');

    const owned = render(
      diagram({ nodes: [{ id: 'a', label: 'A', tier: 'client', ownership: 'built' }] })
    );
    expect(owned.textContent).toContain('My work');
  });
});
