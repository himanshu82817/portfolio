import {
  DIAGRAM_LAYOUT,
  DiagramLayout,
  boxesOverlap,
  labelBox,
  layoutDiagram,
} from './architecture-diagram.component';
import { Architecture } from './case-study.model';
import { CASE_STUDIES } from './registry';

type Diagram = Architecture['diagram'];

const { nodeW, nodeH } = DIAGRAM_LAYOUT;

function diagram(partial: Partial<Diagram>): Diagram {
  return { caption: 'Test diagram', nodes: [], edges: [], ...partial };
}

/** Every label that sits on a node or on another label, described for the failure message. */
function collisions(layout: DiagramLayout): string[] {
  const nodes = layout.nodes.map(node => ({
    name: node.label,
    box: { x: node.x, y: node.y, w: nodeW, h: nodeH },
  }));
  const labels = layout.edges
    .filter(edge => edge.label)
    .map(edge => ({ name: edge.label!, box: labelBox(edge) }));

  const found: string[] = [];
  for (const label of labels) {
    for (const node of nodes) {
      if (boxesOverlap(label.box, node.box)) found.push(`"${label.name}" on node ${node.name}`);
    }
  }
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      if (boxesOverlap(labels[i].box, labels[j].box)) {
        found.push(`"${labels[i].name}" on "${labels[j].name}"`);
      }
    }
  }
  return found;
}

describe('diagram edge labels', () => {
  it('parks the label of a long edge in the gap beside its source, not on a node it crosses', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'auth', label: 'Auth', tier: 'service' },
          { id: 'db', label: 'DB', tier: 'data' },
          { id: 'google', label: 'Google', tier: 'external' },
        ],
        edges: [{ from: 'auth', to: 'google', label: 'OAuth' }],
      })
    );
    const auth = layout.nodes.find(node => node.id === 'auth')!;
    const db = layout.nodes.find(node => node.id === 'db')!;
    const [edge] = layout.edges;

    expect(edge.lx).withContext('label must start after the source').toBeGreaterThan(auth.x + nodeW);
    expect(edge.lx).withContext('label must end before the node in between').toBeLessThan(db.x);
    expect(collisions(layout)).toEqual([]);
  });

  it('keeps a request and its response from printing on top of each other', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'a', label: 'App', tier: 'client' },
          { id: 'b', label: 'API', tier: 'service' },
        ],
        edges: [
          { from: 'a', to: 'b', label: 'request' },
          { from: 'b', to: 'a', label: 'response' },
        ],
      })
    );
    expect(collisions(layout)).toEqual([]);
  });

  it('keeps same-column loop labels clear of the nodes they run past', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'top', label: 'Top', tier: 'client' },
          { id: 'middle', label: 'Middle', tier: 'client' },
          { id: 'bottom', label: 'Bottom', tier: 'client' },
        ],
        edges: [
          { from: 'top', to: 'bottom', label: 'paint first' },
          { from: 'middle', to: 'top', label: 'app shell' },
        ],
      })
    );
    expect(collisions(layout)).toEqual([]);
  });

  it('places labels inside the canvas', () => {
    const layout = layoutDiagram(
      diagram({
        nodes: [
          { id: 'a', label: 'A', tier: 'client' },
          { id: 'b', label: 'B', tier: 'service' },
        ],
        edges: [{ from: 'a', to: 'b', label: 'call' }],
      })
    );
    const box = labelBox(layout.edges[0]);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.h).toBeLessThanOrEqual(layout.height);
  });

  // The real diagrams are the ones that matter: a label added to a case study that
  // lands on a node fails here, not in front of a reader.
  for (const study of CASE_STUDIES) {
    it(`never prints a label on a node or another label in the ${study.slug} diagram`, () => {
      expect(collisions(layoutDiagram(study.architecture.diagram))).toEqual([]);
    });
  }
});
