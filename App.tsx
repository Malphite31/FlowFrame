
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  NodeTypes,
  BackgroundVariant,
  useReactFlow,
  SelectionMode,
  OnSelectionChangeParams,
} from '@xyflow/react';

import FusionNode from './components/FusionNode';
import GroupNode from './components/GroupNode';
import TopBar from './components/TopBar';
import Inspector from './components/Inspector';
import ContextMenu from './components/ContextMenu';
import { PresentationMode } from './components/PresentationMode';
import { LibraryPanel } from './components/LibraryPanel';
import { StoryNodeData, NODE_COLORS, AspectRatio, Asset, MediaType } from './types';
import { generateUUID, sortNodesByTimeline, getExportableNodes } from './utils/exportUtils';
import { SettingsContext } from './context/SettingsContext';

// Initial Nodes for demo
const initialNodes: Node<StoryNodeData>[] = [
  {
    id: '1',
    type: 'fusionNode',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Main Concept', 
      description: 'Central idea for the campaign', 
      duration: 5, 
      image: null, 
      fileName: null,
      color: NODE_COLORS.Orange,
      variant: 'idea',
      mediaType: 'image'
    },
  },
  {
    id: '2',
    type: 'fusionNode',
    position: { x: 450, y: 100 },
    data: { 
      label: 'Scene 1: Intro', 
      description: 'Wide shot of the city skyline at dawn.', 
      duration: 4, 
      image: null, 
      fileName: null,
      color: NODE_COLORS.Blue,
      variant: 'scene',
      shotType: 'est',
      mediaType: 'image'
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: false, style: { stroke: '#888', strokeWidth: 2 }, type: 'default' }
];

// Define outside component to avoid recreation
const nodeTypes: NodeTypes = { 
  fusionNode: FusionNode,
  groupNode: GroupNode
};

const AppContent = () => {
  const [nodes, setNodes] = useState<Node<StoryNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [projectName, setProjectName] = useState('MyStoryboard');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  
  // -- New Features State --
  const [projectNotes, setProjectNotes] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // -- Context Menu State --
  const [menu, setMenu] = useState<{ id: string; top: number; left: number; type: 'node' | 'edge' } | null>(null);

  // -- Figma Style Controls State --
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const { screenToFlowPosition } = useReactFlow();

  // -- Settings Context Value --
  const settingsValue = useMemo(() => ({ aspectRatio }), [aspectRatio]);

  // -- Keyboard Event Listeners for Spacebar --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If presentation is open, let it handle keyboard events
      if (isPresentationOpen) return;

      if (e.code === 'Space' && !e.repeat) {
        // Check if we are focused on an input element
        const target = e.target as HTMLElement;
        const isInput = target.matches('input, textarea, [contenteditable]');
        
        if (!isInput) {
          e.preventDefault(); // Prevent page scrolling
          setIsSpacePressed(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPresentationOpen]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) return;
      setEdges((eds) => addEdge({ ...params, type: 'default', style: { stroke: '#888', strokeWidth: 2 } }, eds));
    },
    []
  );

  // FIX: Selection logic to handle drag-selection (multi-select)
  const onSelectionChange = useCallback(({ nodes: selectedNodesList }: OnSelectionChangeParams) => {
    setSelectedNodes(selectedNodesList);
    // If nodes are selected, pick the last one (or primary one) for the inspector
    if (selectedNodesList.length > 0) {
      setSelectedNodeId(selectedNodesList[selectedNodesList.length - 1].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault(); // Prevent native browser context menu
      
      // Calculate position relative to the viewport
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
        type: 'node'
      });
    },
    []
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setMenu({
        id: edge.id,
        top: event.clientY,
        left: event.clientX,
        type: 'edge'
      });
    },
    []
  );

  // --- GROUPING LOGIC ---
  const handleGroupNodes = useCallback(() => {
    setMenu(null);
    if (selectedNodes.length < 2) return;

    // 1. Calculate Bounding Box of selected nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach(n => {
       // Estimate width/height if not measured yet (fallback)
       const w = n.measured?.width || 250; 
       const h = n.measured?.height || 250;
       
       if (n.position.x < minX) minX = n.position.x;
       if (n.position.y < minY) minY = n.position.y;
       if (n.position.x + w > maxX) maxX = n.position.x + w;
       if (n.position.y + h > maxY) maxY = n.position.y + h;
    });

    const padding = 40;
    const groupX = minX - padding;
    const groupY = minY - padding;
    const groupWidth = (maxX - minX) + (padding * 2);
    const groupHeight = (maxY - minY) + (padding * 2);

    // 2. Create Group Node
    const groupId = generateUUID();
    const groupNode: Node<StoryNodeData> = {
      id: groupId,
      type: 'groupNode',
      position: { x: groupX, y: groupY },
      style: { width: groupWidth, height: groupHeight },
      data: {
        label: 'New Group',
        description: '',
        duration: 0,
        image: null,
        fileName: null,
        color: NODE_COLORS.Gray,
        variant: 'group'
      },
      selected: true
    };

    // 3. Update Selected Nodes: Set Parent and Adjust Position to Relative
    const updatedSelectedNodes = selectedNodes.map(node => {
        // The child position is relative to the parent (0,0 is top-left of parent)
        const relativeX = node.position.x - groupX;
        const relativeY = node.position.y - groupY;

        return {
            ...node,
            parentId: groupId,
            extent: 'parent', // Constrain to parent bounds? Optional. 'parent' forces it inside.
            position: { x: relativeX, y: relativeY },
            selected: false // Deselect children so we see the group selected
        };
    });

    // 4. Update Node State
    // Remove the old versions of selected nodes, add the group, add the new versions of selected nodes
    setNodes(nds => {
        const remainingNodes = nds.filter(n => !selectedNodes.find(sn => sn.id === n.id));
        return [...remainingNodes, groupNode, ...updatedSelectedNodes];
    });

  }, [selectedNodes]);

  const handleUngroupNodes = useCallback(() => {
    setMenu(null);
    // Find the currently selected group node
    if (!menu) return;
    const groupNode = nodes.find(n => n.id === menu.id);
    
    if (!groupNode || groupNode.type !== 'groupNode') return;

    // Find children
    const children = nodes.filter(n => n.parentId === groupNode.id);

    // Update children to have absolute positions again
    const updatedChildren = children.map(child => {
        return {
            ...child,
            parentId: undefined,
            extent: undefined,
            position: {
                x: groupNode.position.x + child.position.x,
                y: groupNode.position.y + child.position.y
            }
        };
    });

    // Remove group node, update children
    setNodes(nds => {
        const others = nds.filter(n => n.id !== groupNode.id && n.parentId !== groupNode.id);
        return [...others, ...updatedChildren];
    });

  }, [menu, nodes]);

  // --- CONTEXT MENU ACTIONS ---
  const handleDuplicateNode = useCallback(() => {
    if (!menu || menu.type !== 'node') return;
    const nodeToDuplicate = nodes.find((n) => n.id === menu.id);
    if (!nodeToDuplicate) return;

    const newNode: Node<StoryNodeData> = {
      ...nodeToDuplicate,
      id: generateUUID(),
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      data: {
        ...nodeToDuplicate.data,
        label: `${nodeToDuplicate.data.label} (Copy)`
      },
      selected: true, // Select the new node
    };

    // Deselect original
    setNodes((nds) => 
      nds.map(n => ({...n, selected: false})).concat(newNode)
    );
    setMenu(null);
  }, [menu, nodes]);

  const handleDelete = useCallback(() => {
    if (!menu) return;
    
    if (menu.type === 'node') {
        const node = nodes.find(n => n.id === menu.id);
        
        let idsToDelete = [menu.id];
        if (node?.type === 'groupNode') {
           const children = nodes.filter(n => n.parentId === menu.id);
           idsToDelete = [...idsToDelete, ...children.map(c => c.id)];
        }

        setNodes((nds) => nds.filter((n) => !idsToDelete.includes(n.id)));
        setEdges((eds) => eds.filter((e) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)));
        setSelectedNodeId(null);
    } else {
        // Delete Edge
        setEdges((eds) => eds.filter((e) => e.id !== menu.id));
    }
    
    setMenu(null);
  }, [menu, nodes]);

  const handleAddNode = useCallback(() => {
    const id = generateUUID();
    const newNode: Node<StoryNodeData> = {
      id,
      type: 'fusionNode',
      position: { x: 100 + (nodes.length * 50), y: 100 + (nodes.length * 50) },
      data: {
        label: `Node ${nodes.length + 1}`,
        description: '',
        duration: 3,
        image: null,
        fileName: null,
        color: NODE_COLORS.Blue,
        variant: 'scene',
        shotType: 'wide',
        mediaType: 'image'
      }
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes]);

  const handleUpdateNode = useCallback((id: string, newData: Partial<StoryNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, []);

  // -- Asset Management Handlers --
  const handleAddAssets = useCallback((files: FileList) => {
    const fileList = Array.from(files);
    
    // Use Promise.all to handle multiple file reads cleanly and update state once
    const filePromises = fileList.map(file => {
      return new Promise<Asset | null>(resolve => {
        let type: MediaType = 'image';
        if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (!file.type.startsWith('image/')) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve({
              id: generateUUID(),
              type,
              url: e.target.result as string,
              name: file.name,
              tags: [],
              dateAdded: Date.now()
            });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(results => {
      const validAssets = results.filter((a): a is Asset => a !== null);
      if (validAssets.length > 0) {
        setAssets(prev => [...validAssets, ...prev]);
      }
    });
  }, []);

  const handleUpdateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const handleDeleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleApplyColor = useCallback((color: string) => {
    // Apply to all selected nodes
    if(selectedNodes.length === 0) return;
    
    setNodes((nds) => nds.map(n => {
        if (n.selected) {
             return { ...n, data: { ...n.data, color } };
        }
        return n;
    }));
  }, [selectedNodes]);

  const selectedNode = useMemo(() => 
    nodes.find((n) => n.id === selectedNodeId) || null, 
  [nodes, selectedNodeId]);

  // -- Canvas Drag & Drop Logic --
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // 1. Handle Internal Asset Drop (from Library)
      const type = event.dataTransfer.getData('application/reactflow/type');
      const assetMediaType = event.dataTransfer.getData('application/reactflow/mediaType') as MediaType;
      const assetSource = event.dataTransfer.getData('application/reactflow/source');
      
      if (type === 'asset' && assetSource) {
         const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
         
         const newNode: Node<StoryNodeData> = {
            id: generateUUID(),
            type: 'fusionNode',
            position,
            data: {
                label: 'New Asset',
                description: '',
                duration: 3,
                image: assetSource,
                fileName: 'asset',
                color: NODE_COLORS.Blue,
                variant: 'scene',
                shotType: 'med',
                mediaType: assetMediaType || 'image'
            },
         };
         setNodes((nds) => nds.concat(newNode));
         setSelectedNodeId(newNode.id);
         return;
      }

      // 2. Handle External File Drop (from Desktop)
      const file = event.dataTransfer.files[0];
      if (file) {
        let mediaType: MediaType = 'image';
        if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';
        else if (!file.type.startsWith('image/')) return; // Unsupported type

        const reader = new FileReader();
        reader.onload = (e) => {
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          
          const resultUrl = e.target?.result as string;

          const newNode: Node<StoryNodeData> = {
            id: generateUUID(),
            type: 'fusionNode',
            position,
            data: {
              label: file.name.split('.')[0] || 'New Node',
              description: '',
              duration: 3,
              image: resultUrl,
              fileName: file.name,
              color: NODE_COLORS.Blue,
              variant: 'scene', // Audio might want different variant later, but FusionNode handles display
              shotType: 'med',
              mediaType: mediaType
            },
          };

          setNodes((nds) => nds.concat(newNode));
          setSelectedNodeId(newNode.id);

          // NEW: Also add the file to the Asset Library automatically
          const newAsset: Asset = {
            id: generateUUID(),
            type: mediaType,
            url: resultUrl,
            name: file.name,
            tags: ['dropped'],
            dateAdded: Date.now()
          };
          setAssets(prev => [newAsset, ...prev]);
        };
        reader.readAsDataURL(file);
      }
    },
    [screenToFlowPosition]
  );

  // Determine context menu capabilities
  const canGroup = selectedNodes.length > 1;
  const canUngroup = useMemo(() => {
      if (!menu) return false;
      const node = nodes.find(n => n.id === menu.id);
      return node?.type === 'groupNode';
  }, [menu, nodes]);

  // Sort nodes for presentation (Timeline order, filtering out ideas/moods)
  const presentationNodes = useMemo(() => {
    if (!isPresentationOpen) return [];
    return sortNodesByTimeline(getExportableNodes(nodes));
  }, [nodes, isPresentationOpen]);

  return (
    <SettingsContext.Provider value={settingsValue}>
      <div className="flex flex-col h-screen w-screen bg-davinci-bg text-davinci-text font-sans">
        <TopBar 
          nodes={nodes} 
          onAddNode={handleAddNode} 
          projectName={projectName}
          setProjectName={setProjectName}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          onPlay={() => setIsPresentationOpen(true)}
        />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Library Panel */}
          <LibraryPanel 
            nodes={nodes}
            projectNotes={projectNotes}
            setProjectNotes={setProjectNotes}
            onApplyColor={handleApplyColor}
            assets={assets}
            onAddAssets={handleAddAssets}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
          />

          {/* Center: Main Canvas */}
          <div 
            className="flex-1 relative border-r border-black" 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              
              // REPLACED onNodeClick with onSelectionChange for better reliability
              onSelectionChange={onSelectionChange}
              
              onPaneClick={onPaneClick}
              onNodeContextMenu={onNodeContextMenu} // Enable right click for nodes
              onEdgeContextMenu={onEdgeContextMenu} // Enable right click for edges
              nodeTypes={nodeTypes}
              
              defaultEdgeOptions={{ 
                type: 'default', 
                style: { stroke: '#888', strokeWidth: 2 } 
              }}
              
              fitView
              snapToGrid={true}
              snapGrid={[15, 15]}
              
              panOnDrag={isSpacePressed}
              selectionOnDrag={!isSpacePressed}
              selectionMode={SelectionMode.Partial}
              panOnScroll={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Background 
                color="#2a2a2a" 
                variant={BackgroundVariant.Dots} 
                gap={20} 
                size={1} 
              />
              <Controls className="!bg-[#262626] !border-[#3d3d3d] [&>button]:!fill-gray-400 [&>button]:!border-b-[#3d3d3d] hover:[&>button]:!bg-[#3d3d3d] hover:[&>button]:!fill-white" />
              <MiniMap 
                nodeColor={(n) => n.data.color || '#3d3d3d'} 
                maskColor="#181818" 
                className="!bg-[#262626] !border-[#3d3d3d]"
              />
            </ReactFlow>
            
            {menu && (
              <ContextMenu 
                x={menu.left} 
                y={menu.top} 
                type={menu.type}
                onDuplicate={handleDuplicateNode} 
                onDelete={handleDelete} 
                onGroup={handleGroupNodes}
                onUngroup={handleUngroupNodes}
                canGroup={canGroup}
                canUngroup={canUngroup}
                onClose={() => setMenu(null)}
              />
            )}
            
            <div className="absolute bottom-4 left-4 bg-[#262626]/80 p-2 rounded text-xs text-gray-400 pointer-events-none border border-[#3d3d3d] z-50">
               <p>Pre-Production Fusion v1.7</p>
               <p>Format: {aspectRatio} • Nodes: {nodes.length}</p>
               <p className="text-[10px] mt-1 text-davinci-accent opacity-70">
                  {isSpacePressed ? '[HAND TOOL ACTIVE]' : 'Hold Space to Pan • Right Click for Menu'}
               </p>
            </div>
          </div>

          {/* Right: Inspector Panel */}
          <Inspector 
            selectedNode={selectedNode} 
            onUpdateNode={handleUpdateNode}
            aspectRatio={aspectRatio}
          />
        </div>

        {/* Presentation Overlay */}
        {isPresentationOpen && (
          <PresentationMode 
            nodes={presentationNodes} 
            onClose={() => setIsPresentationOpen(false)} 
          />
        )}
      </div>
    </SettingsContext.Provider>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}
