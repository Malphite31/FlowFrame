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
  direction = 'LR'
) => {
  const isHorizontal = direction === 'LR';
  const g = new dagre.graphlib.Graph({ compound: true });
  
  g.setGraph({ 
    rankdir: direction, 
    ranksep: 80, 
    nodesep: 40,
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