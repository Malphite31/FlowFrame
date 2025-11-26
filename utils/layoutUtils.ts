import dagre from 'dagre';
import { Node, Edge, Position } from '@xyflow/react';
import { StoryNodeData } from '../types';

// Default dimensions if not measured yet
const DEFAULT_WIDTH = 250;
const DEFAULT_HEIGHT = 300;
const GROUP_PADDING = 40;

export const getLayoutedElements = (
  nodes: Node<StoryNodeData>[],
  edges: Edge[],
  direction = 'LR',
  layoutType: 'default' | 'mindmap' | 'radial' | 'organic' = 'default'
) => {
  const isHorizontal = direction === 'LR';
  const g = new dagre.graphlib.Graph({ compound: true });

  const isMindMap = layoutType === 'mindmap';

  if (layoutType === 'radial') {
    return getRadialLayout(nodes, edges);
  }

  if (layoutType === 'organic') {
    return getOrganicLayout(nodes, edges);
  }

  g.setGraph({
    rankdir: direction,
    ranksep: isMindMap ? 150 : 80,
    nodesep: isMindMap ? 100 : 40,
    marginx: 20,
    marginy: 20
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach((node) => {
    // If it's a group, we let dagre calculate size based on children, 
    // unless it has no children, then we give it a default size.
    // However, dagre's compound layout is tricky with fixed sizes.
    // We will set dimensions for all nodes.
    const width = node.measured?.width || (node.type === 'groupNode' ? 400 : DEFAULT_WIDTH);
    const height = node.measured?.height || (node.type === 'groupNode' ? 300 : DEFAULT_HEIGHT);

    g.setNode(node.id, { width, height });

    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Apply new positions
  const newNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);

    // Dagre returns center coordinates, we need top-left
    let x = nodeWithPosition.x - nodeWithPosition.width / 2;
    let y = nodeWithPosition.y - nodeWithPosition.height / 2;

    // IMPORTANT: If node has a parent, dagre gives absolute coordinates for everything in compound mode.
    // We must convert these back to relative coordinates for React Flow.
    if (node.parentId) {
      const parentNode = g.node(node.parentId);
      const parentX = parentNode.x - parentNode.width / 2;
      const parentY = parentNode.y - parentNode.height / 2;

      x = x - parentX;
      y = y - parentY;
    }

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y },
      style: { ...node.style } // preserve other styles
    };
  });

  return { nodes: newNodes, edges };
};

// --- RADIAL LAYOUT ---
const getRadialLayout = (nodes: Node<StoryNodeData>[], edges: Edge[]) => {
  // Simple radial layout: find root (node with no incoming edges), then place children in circles
  // This is a simplified implementation. For complex graphs, a proper library is better.

  const rootNode = nodes.find(n => !edges.some(e => e.target === n.id)) || nodes[0];
  if (!rootNode) return { nodes, edges };

  const newNodes = [...nodes];
  const visited = new Set<string>();
  const queue: { id: string; level: number; angleStart: number; angleEnd: number }[] = [];

  // Initialize root
  const rootIndex = newNodes.findIndex(n => n.id === rootNode.id);
  newNodes[rootIndex] = {
    ...newNodes[rootIndex],
    position: { x: 0, y: 0 }
  };
  visited.add(rootNode.id);

  // Find children
  const children = edges.filter(e => e.source === rootNode.id).map(e => e.target);
  children.forEach((childId, i) => {
    const angleStep = (2 * Math.PI) / children.length;
    queue.push({
      id: childId,
      level: 1,
      angleStart: i * angleStep,
      angleEnd: (i + 1) * angleStep
    });
  });

  // BFS
  while (queue.length > 0) {
    const { id, level, angleStart, angleEnd } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const nodeIndex = newNodes.findIndex(n => n.id === id);
    if (nodeIndex === -1) continue;

    const radius = level * 300; // Distance between levels
    const angle = (angleStart + angleEnd) / 2;

    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    newNodes[nodeIndex] = {
      ...newNodes[nodeIndex],
      position: { x, y }
    };

    // Process children
    const nodeChildren = edges.filter(e => e.source === id).map(e => e.target);
    if (nodeChildren.length > 0) {
      const angleSpan = angleEnd - angleStart;
      const childAngleStep = angleSpan / nodeChildren.length;

      nodeChildren.forEach((childId, i) => {
        queue.push({
          id: childId,
          level: level + 1,
          angleStart: angleStart + (i * childAngleStep),
          angleEnd: angleStart + ((i + 1) * childAngleStep)
        });
      });
    }
  }

  return { nodes: newNodes, edges };
};

// --- ORGANIC LAYOUT (Force Directed Simulation) ---
const getOrganicLayout = (nodes: Node<StoryNodeData>[], edges: Edge[]) => {
  // A very simple force-directed layout simulation
  // In a real app, use d3-force or similar. Here we do a few iterations of repulsion/attraction.

  let simNodes = nodes.map(n => ({ ...n, x: n.position?.x || 0, y: n.position?.y || 0, vx: 0, vy: 0 }));
  const iterations = 50;
  const repulsion = 5000;
  const attraction = 0.05;
  const damping = 0.9;

  for (let i = 0; i < iterations; i++) {
    // Repulsion
    for (let a = 0; a < simNodes.length; a++) {
      for (let b = a + 1; b < simNodes.length; b++) {
        const nodeA = simNodes[a];
        const nodeB = simNodes[b];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distSq = dx * dx + dy * dy || 1;
        const force = repulsion / distSq;

        const fx = (dx / Math.sqrt(distSq)) * force;
        const fy = (dy / Math.sqrt(distSq)) * force;

        nodeA.vx += fx;
        nodeA.vy += fy;
        nodeB.vx -= fx;
        nodeB.vy -= fy;
      }
    }

    // Attraction (Springs)
    edges.forEach(edge => {
      const source = simNodes.find(n => n.id === edge.source);
      const target = simNodes.find(n => n.id === edge.target);
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const force = (dist - 200) * attraction; // Rest length 200

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    });

    // Apply velocity
    simNodes.forEach(node => {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
    });
  }

  const newNodes = nodes.map(n => {
    const simNode = simNodes.find(sn => sn.id === n.id);
    return {
      ...n,
      position: { x: simNode?.x || 0, y: simNode?.y || 0 }
    };
  });

  return { nodes: newNodes, edges };
};