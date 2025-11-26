
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  ConnectionLineType,
} from '@xyflow/react';

import FusionNode from './components/FusionNode';
import GroupNode from './components/GroupNode';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Inspector from './components/Inspector';
import ContextMenu from './components/ContextMenu';
import { PresentationMode } from './components/PresentationMode';
import { LibraryPanel } from './components/LibraryPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { TraditionalStoryboard } from './components/TraditionalStoryboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StoryNodeData, NODE_COLORS, AspectRatio, Asset, MediaType, ProjectTemplate, ViewMode } from './types';
import { TEMPLATES } from './utils/templates';
import { generateUUID, sortNodesByTimeline, getExportableNodes } from './utils/exportUtils';
import { isValidURL, fetchLinkMetadata, getDomain, getEmbedInfo } from './utils/linkUtils';
import { getLayoutedElements } from './utils/layoutUtils';
import { SettingsContext } from './context/SettingsContext';
import MobileWarning from './components/MobileWarning';


// Initial Nodes for fallback demo
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

interface HistoryState {
  nodes: Node<StoryNodeData>[];
  edges: Edge[];
}

interface ProjectRecord {
  id: string;
  name: string;
  nodes: Node<StoryNodeData>[];
  edges: Edge[];
  projectNotes: string;
  assets: Asset[];
  aspectRatio: AspectRatio;
  viewMode: ViewMode;
  lastOpenedAt: number;
  updatedAt: number;
  createdAt: number;
  thumbnailUrl?: string | null;
  isArchived: boolean;

  // Mode-specific data
  storyboardNodes?: Node<StoryNodeData>[];
  storyboardEdges?: Edge[];
  mindMapNodes?: Node<StoryNodeData>[];
  mindMapEdges?: Edge[];
  moodBoardNodes?: Node<StoryNodeData>[];
  moodBoardEdges?: Edge[];
}

const PROJECTS_STORAGE_KEY = 'flowframe-projects';

const AppContent = () => {
  const loadProjects = useCallback((): ProjectRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProjectRecord[];
        return parsed.map(p => ({
          ...p,
          nodes: Array.isArray(p.nodes) ? p.nodes : [],
          edges: Array.isArray(p.edges) ? p.edges : [],
          projectNotes: p.projectNotes || '',
          assets: Array.isArray(p.assets) ? p.assets : [],
          aspectRatio: p.aspectRatio || '16:9',
          viewMode: p.viewMode || 'storyboard',
          createdAt: p.createdAt ?? Date.now(),
          updatedAt: p.updatedAt ?? Date.now(),
          lastOpenedAt: p.lastOpenedAt ?? Date.now(),
          isArchived: p.isArchived ?? false,
          thumbnailUrl: p.thumbnailUrl ?? null,
          storyboardNodes: p.storyboardNodes || p.nodes || [],
          storyboardEdges: p.storyboardEdges || p.edges || [],
          mindMapNodes: p.mindMapNodes || [],
          mindMapEdges: p.mindMapEdges || [],
          moodBoardNodes: p.moodBoardNodes || [],
          moodBoardEdges: p.moodBoardEdges || []
        }));
      }
    } catch (e) {
      console.error('Failed to load projects from storage', e);
    }
    const demo: ProjectRecord = {
      id: generateUUID(),
      name: 'Demo Project',
      nodes: initialNodes,
      edges: initialEdges,
      projectNotes: '',
      assets: [],
      aspectRatio: '16:9',
      viewMode: 'storyboard',
      lastOpenedAt: Date.now(),
      updatedAt: Date.now(),
      createdAt: Date.now(),
      thumbnailUrl: initialNodes[1]?.data?.image || initialNodes[0]?.data?.image || null,
      isArchived: false
    };
    return [demo];
  }, []);

  const [projects, setProjects] = useState<ProjectRecord[]>(loadProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId) || null, [projects, activeProjectId]);

  const [nodes, setNodes] = useState<Node<StoryNodeData>[]>(activeProject?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(activeProject?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [projectName, setProjectName] = useState(activeProject?.name || '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(activeProject?.aspectRatio || '16:9');
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // -- New Features State --
  const [projectNotes, setProjectNotes] = useState(activeProject?.projectNotes || '');
  const [assets, setAssets] = useState<Asset[]>(activeProject?.assets || []);
  const [viewMode, setViewMode] = useState<ViewMode>(activeProject?.viewMode || 'storyboard');

  // -- Context Menu State --
  const [menu, setMenu] = useState<{ id: string; top: number; left: number; type: 'node' | 'edge' } | null>(null);

  // -- Figma Style Controls State --
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // -- Undo/Redo State --
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: activeProject?.nodes || [], edges: activeProject?.edges || [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [projectHistories, setProjectHistories] = useState<Record<string, { history: HistoryState[]; index: number }>>({});

  // Ref to hold state before a drag operation starts
  const dragStartRef = useRef<HistoryState | null>(null);

  const { screenToFlowPosition, getNodes, getEdges: getEdgesFlow, getIntersectingNodes } = useReactFlow();

  // -- Settings Context Value --
  const settingsValue = useMemo(() => ({ aspectRatio }), [aspectRatio]);

  // Persist projects whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      } catch (error) {
        console.error('Failed to save projects to local storage:', error);
        // Alert user about quota limit
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('Local storage is full. Images might be too large.');
        }
      }
    }
  }, [projects]);

  // Navigation Helper: Use Hash Routing to prevent SecurityError in Sandboxes/Blobs
  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = path;
    }
  }, []);

  const updateActiveProject = useCallback((updates: Partial<ProjectRecord>, touchUpdated = true) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...updates, updatedAt: touchUpdated ? Date.now() : p.updatedAt } : p));
  }, [activeProjectId]);

  const openProject = useCallback((projectId: string, pushRoute: boolean = true) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setActiveProjectId(projectId);
    setShowDashboard(false);

    // Load correct nodes based on view mode
    let initialNodes = project.storyboardNodes || project.nodes || [];
    let initialEdges = project.storyboardEdges || project.edges || [];

    if (project.viewMode === 'mindmap') {
      initialNodes = project.mindMapNodes || [];
      initialEdges = project.mindMapEdges || [];
    } else if (project.viewMode === 'moodboard') {
      initialNodes = project.moodBoardNodes || [];
      initialEdges = project.moodBoardEdges || [];
    }

    setNodes(initialNodes);
    setEdges(initialEdges);
    setProjectName(project.name);
    setAspectRatio(project.aspectRatio);
    setProjectNotes(project.projectNotes);
    setAssets(project.assets);
    setViewMode(project.viewMode);
    setSelectedNodeId(null);
    setSelectedNodes([]);
    setHistory([{ nodes: initialNodes, edges: initialEdges }]);
    setHistoryIndex(0);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, lastOpenedAt: Date.now() } : p));

    if (pushRoute) navigate(`/projects/${projectId}`);
  }, [projects, projectHistories, navigate]);

  const handleCreateProject = useCallback(() => {
    const id = generateUUID();
    const newProject: ProjectRecord = {
      id,
      name: 'Untitled Project',
      nodes: [],
      edges: [],
      projectNotes: '',
      assets: [],
      aspectRatio: '16:9',
      viewMode: 'storyboard',
      lastOpenedAt: Date.now(),
      updatedAt: Date.now(),
      createdAt: Date.now(),
      thumbnailUrl: null,
      isArchived: false
    };

    const initialHistory = { history: [{ nodes: [], edges: [] }], index: 0 };
    setProjects(prev => [newProject, ...prev]);
    setProjectHistories(prev => ({ ...prev, [id]: initialHistory }));

    setActiveProjectId(id);
    setShowDashboard(false);
    setNodes(newProject.nodes);
    setEdges(newProject.edges);
    setProjectName(newProject.name);
    setAspectRatio(newProject.aspectRatio);
    setProjectNotes('');
    setAssets([]);
    setViewMode('storyboard');
    setHistory(initialHistory.history);
    setHistoryIndex(initialHistory.index);
    setSelectedNodeId(null);
    setSelectedNodes([]);
    navigate(`/projects/${id}`);
  }, [navigate]);

  // --- CREATE FROM TEMPLATE LOGIC ---
  const handleCreateFromTemplate = useCallback((template: ProjectTemplate) => {
    const id = generateUUID();
    // Deep copy to avoid reference issues
    const newNodes = JSON.parse(JSON.stringify(template.data.nodes));
    const newEdges = JSON.parse(JSON.stringify(template.data.edges));

    const newProject: ProjectRecord = {
      id,
      name: template.name,
      nodes: newNodes,
      edges: newEdges,
      projectNotes: template.data.projectNotes || '',
      assets: [],
      aspectRatio: '16:9',
      viewMode: template.data.viewMode || 'storyboard',
      lastOpenedAt: Date.now(),
      updatedAt: Date.now(),
      createdAt: Date.now(),
      thumbnailUrl: null,
      isArchived: false,
      // Populate mode-specific keys based on template type
      storyboardNodes: template.data.viewMode === 'storyboard' ? newNodes : [],
      storyboardEdges: template.data.viewMode === 'storyboard' ? newEdges : [],
      mindMapNodes: template.data.viewMode === 'mindmap' ? newNodes : [],
      mindMapEdges: template.data.viewMode === 'mindmap' ? newEdges : [],
    };

    const initialHistory = { history: [{ nodes: newNodes, edges: newEdges }], index: 0 };
    setProjects(prev => [newProject, ...prev]);
    setProjectHistories(prev => ({ ...prev, [id]: initialHistory }));

    setActiveProjectId(id);
    setShowDashboard(false);
    setNodes(newNodes);
    setEdges(newEdges);
    setProjectName(newProject.name);
    setAspectRatio('16:9');
    setProjectNotes(newProject.projectNotes);
    setAssets([]);
    setViewMode(newProject.viewMode);
    setHistory(initialHistory.history);
    setHistoryIndex(initialHistory.index);
    setSelectedNodeId(null);
    setSelectedNodes([]);
    navigate(`/projects/${id}`);
  }, [navigate]);

  const goToDashboard = useCallback(() => {
    if (activeProjectId) {
      const previewImage = nodes.find(n => (n.data as StoryNodeData)?.image)?.data.image || null;
      updateActiveProject({ nodes, edges, projectNotes, assets, aspectRatio, viewMode, thumbnailUrl: previewImage });
      setProjectHistories(prev => ({ ...prev, [activeProjectId]: { history, index: historyIndex } }));
    }
    setShowDashboard(true);
    setActiveProjectId(null);
    setSelectedNodeId(null);
    setSelectedNodes([]);
    setIsPresentationOpen(false);
    setMenu(null);
    navigate('/projects');
  }, [activeProjectId, nodes, edges, projectNotes, assets, aspectRatio, viewMode, history, historyIndex, navigate, updateActiveProject]);

  const handleRenameProject = useCallback((name: string) => {
    setProjectName(name);
    updateActiveProject({ name });
  }, [updateActiveProject]);

  const handleAspectRatioChange = useCallback((ratio: AspectRatio) => {
    setAspectRatio(ratio);
    updateActiveProject({ aspectRatio: ratio });
  }, [updateActiveProject]);

  const handleSetViewMode = useCallback((mode: ViewMode) => {
    if (mode === viewMode) return;

    // Save current state to the correct bucket before switching
    const currentNodes = nodes;
    const currentEdges = edges;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updates: Partial<ProjectRecord> = { viewMode: mode };

        // Save current mode data
        if (viewMode === 'storyboard' || viewMode === 'traditional') {
          updates.storyboardNodes = currentNodes;
          updates.storyboardEdges = currentEdges;
          updates.nodes = currentNodes;
          updates.edges = currentEdges;
        } else if (viewMode === 'mindmap') {
          updates.mindMapNodes = currentNodes;
          updates.mindMapEdges = currentEdges;
        } else if (viewMode === 'moodboard') {
          updates.moodBoardNodes = currentNodes;
          updates.moodBoardEdges = currentEdges;
        }

        return { ...p, ...updates };
      }
      return p;
    }));

    // Load new mode data
    const project = projects.find(p => p.id === activeProjectId);
    if (project) {
      let nextNodes: Node<StoryNodeData>[] = [];
      let nextEdges: Edge[] = [];

      if (mode === 'storyboard' || mode === 'traditional') {
        nextNodes = project.storyboardNodes || project.nodes || [];
        nextEdges = project.storyboardEdges || project.edges || [];
      } else if (mode === 'mindmap') {
        nextNodes = project.mindMapNodes || [];
        nextEdges = project.mindMapEdges || [];
      } else if (mode === 'moodboard') {
        nextNodes = project.moodBoardNodes || [];
        nextEdges = project.moodBoardEdges || [];
      }

      setNodes(nextNodes);
      setEdges(nextEdges);
      setHistory([{ nodes: nextNodes, edges: nextEdges }]);
      setHistoryIndex(0);
    }

    setViewMode(mode);
  }, [viewMode, nodes, edges, activeProjectId, projects]);

  const handleSetProjectNotes = useCallback((notes: string) => {
    setProjectNotes(notes);
    updateActiveProject({ projectNotes: notes });
  }, [updateActiveProject]);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, updatedAt: Date.now() } : p));
    if (id === activeProjectId) {
      setProjectName(name);
    }
  }, [activeProjectId]);

  const duplicateProject = useCallback((id: string) => {
    const source = projects.find(p => p.id === id);
    if (!source) return;
    const newId = generateUUID();
    const now = Date.now();
    const clone: ProjectRecord = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      isArchived: false
    };
    setProjects(prev => [clone, ...prev]);
  }, [projects]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      goToDashboard();
    }
  }, [activeProjectId, goToDashboard]);

  const archiveProject = useCallback((id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isArchived: true, updatedAt: Date.now() } : p));
  }, []);

  // Hash-Based Routing Effect (Safe for Blobs/Sandboxes)
  useEffect(() => {
    const applyRoute = () => {
      // Get hash part, remove leading '#'
      const hash = window.location.hash; // e.g., "#/projects/123"
      const path = hash.replace(/^#/, '');

      if (path.startsWith('/projects/')) {
        const id = path.replace('/projects/', '');
        if (activeProjectId === id) return;
        if (projects.find(p => p.id === id)) {
          openProject(id, false);
          return;
        }
      }

      // Default to dashboard if no valid project path
      if ((!path || path === '/' || path === '/projects') && (!showDashboard || activeProjectId)) {
        setShowDashboard(true);
        setActiveProjectId(null);
        // Clean up URL if we were on a dead project link
        if (path !== '/' && path !== '/projects') {
          // Safer than pushState in strict mode, just clear hash
          window.location.hash = '/projects';
        }
      }
    };

    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    return () => window.removeEventListener('hashchange', applyRoute);
  }, [projects, openProject, activeProjectId, showDashboard]);


  const recordHistory = useCallback((newNodes: Node<StoryNodeData>[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);

    setHistory(prev => {
      const past = prev.slice(0, historyIndex + 1);
      const updatedHistory = [...past, { nodes: newNodes, edges: newEdges }];
      if (activeProjectId) {
        setProjectHistories(ph => ({ ...ph, [activeProjectId]: { history: updatedHistory, index: historyIndex + 1 } }));
        const previewImage = newNodes.find(n => (n.data as StoryNodeData)?.image)?.data.image || null;
        updateActiveProject({ nodes: newNodes, edges: newEdges, thumbnailUrl: previewImage }, true);
      }
      return updatedHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, activeProjectId, updateActiveProject]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
      if (activeProjectId) {
        setProjectHistories(ph => ({ ...ph, [activeProjectId]: { history, index: newIndex } }));
        updateActiveProject({ nodes: state.nodes, edges: state.edges }, false);
      }
    }
  }, [history, historyIndex, activeProjectId, updateActiveProject]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
      if (activeProjectId) {
        setProjectHistories(ph => ({ ...ph, [activeProjectId]: { history, index: newIndex } }));
        updateActiveProject({ nodes: state.nodes, edges: state.edges }, false);
      }
    }
  }, [history, historyIndex, activeProjectId, updateActiveProject]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // -- Asset Helper --
  const handleAddAsset = useCallback((asset: Asset) => {
    setAssets(prev => {
      const next = [asset, ...prev];
      updateActiveProject({ assets: next });
      return next;
    });
  }, [updateActiveProject]);

  // -- Helper to Create Link Node --
  const createLinkNode = useCallback(async (url: string, position: { x: number, y: number }) => {
    const id = generateUUID();
    // Placeholder node
    const newNode: Node<StoryNodeData> = {
      id,
      type: 'fusionNode',
      position,
      data: {
        label: 'Loading Link...',
        description: 'Fetching metadata...',
        duration: 0,
        image: null,
        fileName: null,
        color: NODE_COLORS.Gray,
        variant: 'link',
        linkUrl: url,
        linkDomain: getDomain(url)
      }
    };

    const nextNodes = [...nodes, newNode];
    recordHistory(nextNodes, edges);

    const metadata = await fetchLinkMetadata(url);

    setNodes(nds => nds.map(n => {
      if (n.id === id) {
        return {
          ...n,
          data: {
            ...n.data,
            label: metadata.title || 'External Link',
            linkTitle: metadata.title,
            linkDescription: metadata.description,
            linkImage: metadata.image,
            description: metadata.description || '' // fallback
          }
        };
      }
      return n;
    }));

    // Add to Assets Library
    const linkAsset: Asset = {
      id: generateUUID(),
      type: 'link',
      url: url,
      name: metadata.title || url,
      tags: ['link'],
      dateAdded: Date.now(),
      meta: {
        title: metadata.title,
        description: metadata.description,
        image: metadata.image
      }
    };
    handleAddAsset(linkAsset);

  }, [nodes, edges, recordHistory, handleAddAsset]);

  // -- Global Paste Listener for URLs and Images --
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // If presentation is open or focusing an input, ignore
      if (isPresentationOpen) return;
      const target = e.target as HTMLElement;
      if (target.matches('input, textarea, [contenteditable]')) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // 1. Check for File (Binary Image Copy)
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const resultUrl = event.target?.result as string;

              const lastNode = nodes[nodes.length - 1];
              const pos = lastNode ? { x: lastNode.position.x + 50, y: lastNode.position.y + 50 } : { x: 200, y: 200 };

              // Create Node
              const newNode: Node<StoryNodeData> = {
                id: generateUUID(),
                type: 'fusionNode',
                position: pos,
                data: {
                  label: 'Pasted Image',
                  description: '',
                  duration: 3,
                  image: resultUrl,
                  fileName: `pasted_image_${Date.now()}.png`,
                  color: NODE_COLORS.Blue,
                  variant: 'scene',
                  shotType: 'med',
                  mediaType: 'image'
                }
              };

              const nextNodes = [...nodes, newNode];
              recordHistory(nextNodes, edges);
              setSelectedNodeId(newNode.id);

              // Create Asset
              const newAsset: Asset = {
                id: generateUUID(),
                type: 'image',
                url: resultUrl,
                name: `Pasted_Image_${Date.now()}.png`,
                tags: ['pasted'],
                dateAdded: Date.now()
              };
              handleAddAsset(newAsset);
            };
            reader.readAsDataURL(blob);
          }
          return; // Stop after finding image
        }
      }

      // 2. Check for Text (URL)
      const text = e.clipboardData?.getData('text');
      if (text && isValidURL(text.trim())) {
        e.preventDefault();
        const lastNode = nodes[nodes.length - 1];
        const pos = lastNode ? { x: lastNode.position.x + 50, y: lastNode.position.y + 50 } : { x: 200, y: 200 };

        // Check if embeddable video URL (YouTube, Vimeo)
        const embedInfo = getEmbedInfo(text.trim());
        if (embedInfo) {
          const newNode: Node<StoryNodeData> = {
            id: generateUUID(),
            type: 'fusionNode',
            position: pos,
            data: {
              label: `${embedInfo.provider} Video`,
              description: '',
              duration: 10,
              image: embedInfo.url, // The embed URL
              fileName: `${embedInfo.provider} Video`,
              color: NODE_COLORS.Red,
              variant: 'scene',
              mediaType: 'embed'
            }
          };
          const nextNodes = [...nodes, newNode];
          recordHistory(nextNodes, edges);
          setSelectedNodeId(newNode.id);

          // Add asset
          const newAsset: Asset = {
            id: generateUUID(),
            type: 'embed',
            url: embedInfo.url,
            name: `${embedInfo.provider} Video`,
            tags: ['video', 'embed', embedInfo.provider.toLowerCase()],
            dateAdded: Date.now(),
            meta: {
              originalUrl: embedInfo.originalUrl,
              provider: embedInfo.provider,
              image: embedInfo.thumbnail
            }
          };
          handleAddAsset(newAsset);
          return;
        }

        // Check if image URL
        if (text.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
          // Treat as image node
          const newNode: Node<StoryNodeData> = {
            id: generateUUID(),
            type: 'fusionNode',
            position: pos,
            data: {
              label: 'Linked Image',
              description: '',
              duration: 3,
              image: text.trim(),
              fileName: text.split('/').pop() || 'image.png',
              color: NODE_COLORS.Blue,
              variant: 'scene',
              shotType: 'med',
              mediaType: 'image'
            }
          };
          const nextNodes = [...nodes, newNode];
          recordHistory(nextNodes, edges);
          setSelectedNodeId(newNode.id);

          // Add asset (External URL)
          const newAsset: Asset = {
            id: generateUUID(),
            type: 'image',
            url: text.trim(),
            name: text.split('/').pop() || 'image.png',
            tags: ['linked'],
            dateAdded: Date.now()
          };
          handleAddAsset(newAsset);
        } else {
          // Treat as Link Node (Existing logic)
          createLinkNode(text.trim(), pos);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isPresentationOpen, nodes, edges, createLinkNode, recordHistory, handleAddAsset]);


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
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<StoryNodeData>[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) return;
      // Fusion style: Default is Bezier curve
      const newEdges = addEdge({ ...params, type: 'default', style: { stroke: '#888', strokeWidth: 2 } } as Edge, edges);
      recordHistory(nodes, newEdges);
    },
    [nodes, edges, recordHistory]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodesList }: OnSelectionChangeParams) => {
    // PARENT DOMINANCE LOGIC:
    // If a parent node (Group) is selected, force deselect its children.
    // This prevents "double movement" where dragging the group moves children twice (once via parent, once via own selection)
    // and visually fixes the "Select All" appearance when selecting a group.

    const selectedIds = new Set(selectedNodesList.map(n => n.id));
    const childrenToDeselect = selectedNodesList.filter(n => n.parentId && selectedIds.has(n.parentId));

    if (childrenToDeselect.length > 0) {
      // Enforce deselection by updating state
      setNodes(nds => nds.map(n => {
        if (childrenToDeselect.some(child => child.id === n.id)) {
          return { ...n, selected: false };
        }
        return n;
      }));

      // Update local selection state optimistically
      const validSelection = selectedNodesList.filter(n => !n.parentId || !selectedIds.has(n.parentId));
      setSelectedNodes(validSelection);

      if (validSelection.length > 0) {
        setSelectedNodeId(validSelection[validSelection.length - 1].id);
      } else {
        setSelectedNodeId(null);
      }
    } else {
      setSelectedNodes(selectedNodesList);
      if (selectedNodesList.length > 0) {
        setSelectedNodeId(selectedNodesList[selectedNodesList.length - 1].id);
      } else {
        setSelectedNodeId(null);
      }
    }
  }, []);

  const handleSelectNode = useCallback((id: string | null, multi: boolean = false) => {
    if (id === null) {
      setSelectedNodeId(null);
      setSelectedNodes([]);
      setNodes(nds => nds.map(n => ({ ...n, selected: false })));
      return;
    }

    // If multi-select is enabled (e.g. Shift+Click in timeline), we add/toggle instead of replace
    setNodes(nds => nds.map(n => {
      if (n.id === id) return { ...n, selected: true };
      if (multi) return n; // Keep existing selection
      return { ...n, selected: false }; // Clear others
    }));

    // We rely on onSelectionChange to update selectedNodes and selectedNodeId state
  }, []);

  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
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

  // --- DRAG HISTORY LOGIC ---
  const onNodeDragStart = useCallback(() => {
    dragStartRef.current = { nodes, edges };
  }, [nodes, edges]);

  // --- DRAG TO GROUP LOGIC ---
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // Only handle if single node drag (for simplicity)
    if (node.type === 'groupNode') {
      recordHistory(nodes, edges);
      return;
    }

    // Determine new state based on dropping logic
    let nextNodes = [...nodes];
    let changed = false;

    // Find intersecting group
    const intersections = getIntersectingNodes(node).filter(n => n.type === 'groupNode');
    const groupNode = intersections[intersections.length - 1]; // Top-most group

    // Case 1: Dragged INTO a group
    if (groupNode && node.parentId !== groupNode.id) {
      nextNodes = nextNodes.map(n => {
        if (n.id === node.id) {
          const relX = node.position.x - groupNode.position.x;
          const relY = node.position.y - groupNode.position.y;
          changed = true;
          return {
            ...n,
            parentId: groupNode.id,
            extent: 'parent',
            position: { x: relX, y: relY }
          };
        }
        return n;
      });
    }

    // Case 2: Dragged OUT of a group (no intersection with parent)
    if (!groupNode && node.parentId) {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent) {
        nextNodes = nextNodes.map(n => {
          if (n.id === node.id) {
            const absX = parent.position.x + node.position.x;
            const absY = parent.position.y + node.position.y;
            changed = true;
            return {
              ...n,
              parentId: undefined,
              extent: undefined,
              position: { x: absX, y: absY }
            };
          }
          return n;
        });
      }
    }

    // Even if not grouped/ungrouped, position changed. Record history.
    recordHistory(nextNodes, edges);

  }, [nodes, edges, getIntersectingNodes, recordHistory]);


  // --- AUTO LAYOUT LOGIC ---
  const handleAutoLayout = useCallback((type?: string) => {
    let layoutType: any = 'default';
    let direction = 'LR';

    if (type === 'mindmap') { layoutType = 'mindmap'; direction = 'LR'; }
    else if (type === 'radial') { layoutType = 'radial'; }
    else if (type === 'organic') { layoutType = 'organic'; }
    else if (type === 'tree-tb') { layoutType = 'default'; direction = 'TB'; }
    else if (type === 'tree-lr') { layoutType = 'default'; direction = 'LR'; }
    else {
      // Default behavior based on viewMode
      layoutType = viewMode === 'mindmap' ? 'mindmap' : 'default';
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction, layoutType);
    recordHistory(layoutedNodes, layoutedEdges);
  }, [nodes, edges, recordHistory, viewMode]);


  // --- GROUPING LOGIC ---
  const handleGroupNodes = useCallback(() => {
    setMenu(null);
    if (selectedNodes.length < 2) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach(n => {
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

    const updatedSelectedNodes = selectedNodes.map(node => {
      const relativeX = node.position.x - groupX;
      const relativeY = node.position.y - groupY;

      return {
        ...node,
        parentId: groupId,
        extent: 'parent',
        position: { x: relativeX, y: relativeY },
        selected: false
      };
    }) as Node<StoryNodeData>[];

    const remainingNodes = nodes.filter(n => !selectedNodes.find(sn => sn.id === n.id));
    const nextNodes = [...remainingNodes, groupNode, ...updatedSelectedNodes] as Node<StoryNodeData>[];

    recordHistory(nextNodes, edges);

  }, [selectedNodes, nodes, edges, recordHistory]);

  const handleUngroupNodes = useCallback(() => {
    setMenu(null);

    // Support ungrouping if menu is active OR if selection contains a group
    let groupNodeId: string | undefined;

    if (menu && menu.type === 'node') {
      groupNodeId = menu.id;
    } else if (selectedNodes.length === 1 && selectedNodes[0].type === 'groupNode') {
      groupNodeId = selectedNodes[0].id;
    }

    if (!groupNodeId) return;

    const groupNode = nodes.find(n => n.id === groupNodeId);
    if (!groupNode || groupNode.type !== 'groupNode') return;

    const children = nodes.filter(n => n.parentId === groupNode.id);

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
    }) as Node<StoryNodeData>[];

    const others = nodes.filter(n => n.id !== groupNode.id && n.parentId !== groupNode.id);
    const nextNodes = [...others, ...updatedChildren] as Node<StoryNodeData>[];

    recordHistory(nextNodes, edges);

  }, [menu, nodes, edges, selectedNodes, recordHistory]);

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
      selected: true,
    };

    const nextNodes = (nodes.map(n => ({ ...n, selected: false })) as Node<StoryNodeData>[]).concat(newNode);
    recordHistory(nextNodes, edges);
    setMenu(null);
  }, [menu, nodes, edges, recordHistory]);

  const handleDelete = useCallback(() => {
    if (!menu) return;

    if (menu.type === 'node') {
      const node = nodes.find(n => n.id === menu.id);

      let idsToDelete = [menu.id];
      if (node?.type === 'groupNode') {
        const children = nodes.filter(n => n.parentId === menu.id);
        idsToDelete = [...idsToDelete, ...children.map(c => c.id)];
      }

      const nextNodes = nodes.filter((n) => !idsToDelete.includes(n.id));
      const nextEdges = edges.filter((e) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target));
      recordHistory(nextNodes, nextEdges);
      setSelectedNodeId(null);
    } else {
      const nextEdges = edges.filter((e) => e.id !== menu.id);
      recordHistory(nodes, nextEdges);
    }

    setMenu(null);
  }, [menu, nodes, edges, recordHistory]);

  const handleAddNode = useCallback(() => {
    const id = generateUUID();
    const isMindMap = viewMode === 'mindmap';
    const isMoodBoard = viewMode === 'moodboard';

    let variant: 'scene' | 'idea' | 'mood' = 'scene';
    let color = NODE_COLORS.Blue;
    let label = `Node ${nodes.length + 1}`;

    if (isMindMap) {
      variant = 'idea';
      color = NODE_COLORS.Purple;
      label = 'New Idea';
    } else if (isMoodBoard) {
      variant = 'mood';
      color = NODE_COLORS.Gray;
      label = 'New Mood';
    }

    const newNode: Node<StoryNodeData> = {
      id,
      type: 'fusionNode',
      position: { x: 100 + (nodes.length * 50), y: 100 + (nodes.length * 50) },
      data: {
        label,
        description: '',
        duration: 3,
        image: null,
        fileName: null,
        color,
        variant,
        shotType: 'med',
        mediaType: 'image'
      }
    };
    const nextNodes = [...nodes, newNode];
    recordHistory(nextNodes, edges);
  }, [nodes, edges, recordHistory, viewMode]);

  const handleUpdateDuration = useCallback((id: string, duration: number) => {
    // Discrete action from Timeline
    const nextNodes = nodes.map(n => n.id === id ? { ...n, data: { ...n.data, duration } } : n);
    recordHistory(nextNodes, edges);
  }, [nodes, edges, recordHistory]);

  const handleUpdateNodeHistory = useCallback((id: string, newData: Partial<StoryNodeData>) => {
    const nextNodes = nodes.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...newData } };
      }
      return node;
    });
    recordHistory(nextNodes, edges);
  }, [nodes, edges, recordHistory]);

  const handleApplyColor = useCallback((color: string) => {
    if (selectedNodes.length === 0) return;
    const nextNodes = nodes.map(n => {
      if (n.selected) {
        return { ...n, data: { ...n.data, color } };
      }
      return n;
    });
    recordHistory(nextNodes, edges);
  }, [selectedNodes, nodes, edges, recordHistory]);

  // -- Asset Management Handlers --
  const handleAddAssets = useCallback((files: FileList) => {
    const fileList = Array.from(files);
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
        setAssets(prev => {
          const next = [...validAssets, ...prev];
          updateActiveProject({ assets: next });
          return next;
        });
      }
    });
  }, [updateActiveProject]);

  const handleUpdateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updates } : a);
      updateActiveProject({ assets: next });
      return next;
    });
  }, [updateActiveProject]);

  const handleDeleteAsset = useCallback((id: string) => {
    setAssets(prev => {
      const next = prev.filter(a => a.id !== id);
      updateActiveProject({ assets: next });
      return next;
    });
  }, [updateActiveProject]);

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

      const type = event.dataTransfer.getData('application/reactflow/type');
      const assetMediaType = event.dataTransfer.getData('application/reactflow/mediaType') as MediaType;
      const assetSource = event.dataTransfer.getData('application/reactflow/source');

      if (type === 'asset' && assetSource) {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

        if (assetMediaType === 'link') {
          const metaStr = event.dataTransfer.getData('application/reactflow/linkMeta');
          const meta = metaStr ? JSON.parse(metaStr) : {};

          const newNode: Node<StoryNodeData> = {
            id: generateUUID(),
            type: 'fusionNode',
            position,
            data: {
              label: meta.title || assetSource,
              description: meta.description || '',
              duration: 0,
              image: null,
              fileName: null,
              color: NODE_COLORS.Gray,
              variant: 'link',
              linkUrl: assetSource,
              linkTitle: meta.title,
              linkDescription: meta.description,
              linkImage: meta.image,
              linkDomain: getDomain(assetSource)
            }
          };
          const nextNodes = [...nodes, newNode];
          recordHistory(nextNodes, edges);
          setSelectedNodeId(newNode.id);
          return;
        }

        if (assetMediaType === 'embed') {
          const metaStr = event.dataTransfer.getData('application/reactflow/embedMeta');
          const meta = metaStr ? JSON.parse(metaStr) : {};

          const newNode: Node<StoryNodeData> = {
            id: generateUUID(),
            type: 'fusionNode',
            position,
            data: {
              label: `${meta.provider || 'Video'} Embed`,
              description: '',
              duration: 10,
              image: assetSource, // embed url
              fileName: 'embed',
              color: NODE_COLORS.Red,
              variant: 'scene',
              mediaType: 'embed'
            }
          };
          const nextNodes = [...nodes, newNode];
          recordHistory(nextNodes, edges);
          setSelectedNodeId(newNode.id);
          return;
        }

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
        const nextNodes = [...nodes, newNode];
        recordHistory(nextNodes, edges);
        setSelectedNodeId(newNode.id);
        return;
      }

      const textData = event.dataTransfer.getData('text/plain');
      if (textData && isValidURL(textData)) {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

        // Check if embed
        const embedInfo = getEmbedInfo(textData);
        if (embedInfo) {
          const newNode: Node<StoryNodeData> = {
            id: generateUUID(),
            type: 'fusionNode',
            position,
            data: {
              label: `${embedInfo.provider} Video`,
              description: '',
              duration: 10,
              image: embedInfo.url,
              fileName: 'embed',
              color: NODE_COLORS.Red,
              variant: 'scene',
              mediaType: 'embed'
            }
          };
          const nextNodes = [...nodes, newNode];
          recordHistory(nextNodes, edges);
          setSelectedNodeId(newNode.id);

          const newAsset: Asset = {
            id: generateUUID(),
            type: 'embed',
            url: embedInfo.url,
            name: `${embedInfo.provider} Video`,
            tags: ['video', 'embed', embedInfo.provider.toLowerCase()],
            dateAdded: Date.now(),
            meta: {
              originalUrl: embedInfo.originalUrl,
              provider: embedInfo.provider,
              image: embedInfo.thumbnail
            }
          };
          setAssets(prev => [newAsset, ...prev]);
          return;
        }

        createLinkNode(textData, position);
        return;
      }

      const file = event.dataTransfer.files[0];
      if (file) {
        let mediaType: MediaType = 'image';
        if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';
        else if (!file.type.startsWith('image/')) return;

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
              variant: 'scene',
              shotType: 'med',
              mediaType: mediaType
            },
          };

          const nextNodes = [...nodes, newNode];
          recordHistory(nextNodes, edges);
          setSelectedNodeId(newNode.id);

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
    [screenToFlowPosition, createLinkNode, nodes, edges, recordHistory]
  );

  const canGroup = selectedNodes.length > 1;
  const canUngroup = useMemo(() => {
    if (menu && nodes.find(n => n.id === menu.id)?.type === 'groupNode') return true;
    if (selectedNodes.length === 1 && selectedNodes[0].type === 'groupNode') return true;
    return false;
  }, [menu, nodes, selectedNodes]);

  const presentationNodes = useMemo(() => {
    return sortNodesByTimeline(getExportableNodes(nodes));
  }, [nodes]);

  if (showDashboard) {
    return (
      <SettingsContext.Provider value={settingsValue}>
        <Dashboard
          projects={projects}
          templates={TEMPLATES}
          onOpenProject={openProject}
          onCreateProject={handleCreateProject}
          onCreateFromTemplate={handleCreateFromTemplate}
          onRenameProject={renameProject}
          onDuplicateProject={duplicateProject}
          onDeleteProject={deleteProject}
          onArchiveProject={archiveProject}
        />
      </SettingsContext.Provider>
    );
  }

  // Safety: if there's no active project, return to dashboard
  if (!activeProjectId || !activeProject) {
    return (
      <SettingsContext.Provider value={settingsValue}>
        <Dashboard
          projects={projects}
          templates={TEMPLATES}
          onOpenProject={openProject}
          onCreateProject={handleCreateProject}
          onCreateFromTemplate={handleCreateFromTemplate}
          onRenameProject={renameProject}
          onDuplicateProject={duplicateProject}
          onDeleteProject={deleteProject}
          onArchiveProject={archiveProject}
        />
      </SettingsContext.Provider>
    );
  }

  return (
    <SettingsContext.Provider value={settingsValue}>
      <div className="flex flex-col h-screen w-screen bg-davinci-bg text-davinci-text font-sans">
        <TopBar
          nodes={nodes}
          onAddNode={handleAddNode}
          projectName={projectName}
          setProjectName={handleRenameProject}
          aspectRatio={aspectRatio}
          setAspectRatio={handleAspectRatioChange}
          onPlay={() => setIsPresentationOpen(true)}
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
          onLayout={handleAutoLayout}
          onGroup={handleGroupNodes}
          onUngroup={handleUngroupNodes}
          canGroup={canGroup}
          canUngroup={canUngroup}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onBackToDashboard={goToDashboard}
          showBackToDashboard
        />

        <div className="flex flex-1 overflow-hidden">
          <LibraryPanel
            nodes={nodes}
            projectNotes={projectNotes}
            setProjectNotes={handleSetProjectNotes}
            onApplyColor={handleApplyColor}
            assets={assets}
            onAddAssets={handleAddAssets}
            onAddAsset={handleAddAsset}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
          />

          <div className="flex-1 flex flex-col border-r border-black overflow-hidden relative">
            {viewMode === 'traditional' ? (
              <TraditionalStoryboard nodes={nodes} aspectRatio={aspectRatio} />
            ) : (
              <div
                className="flex-1 relative"
                onDragOver={onDragOver}
                onDrop={onDrop}
                style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
              >
                <ErrorBoundary>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onSelectionChange={onSelectionChange}
                    onPaneClick={onPaneClick}
                    onNodeContextMenu={onNodeContextMenu}
                    onEdgeContextMenu={onEdgeContextMenu}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={{
                      type: 'default', // Ensures default Bezier
                      style: { stroke: '#888', strokeWidth: 2 }
                    }}
                    connectionLineType={ConnectionLineType.Bezier} // Fusion-style drawing line
                    fitView
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    panOnDrag={isSpacePressed}
                    selectionOnDrag={false} // prevent accidental marquee that selects extra nodes
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
                    <Controls
                      className="!bg-[#262626] !border !border-[#3d3d3d] !shadow-lg !rounded-lg [&>button]:!bg-[#262626] [&>button]:!border-b-[#3d3d3d] [&>button]:!text-gray-400 hover:[&>button]:!text-white hover:[&>button]:!bg-[#3d3d3d] [&_svg]:!fill-current [&_path]:!fill-current [&>button:last-child]:!border-b-0"
                    />
                    <MiniMap
                      nodeColor={(n) => (n.data.color as string) || '#3d3d3d'}
                      maskColor="#181818"
                      className="!bg-[#262626] !border-[#3d3d3d]"
                    />
                  </ReactFlow>
                </ErrorBoundary>

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

                <div className="absolute top-4 left-4 bg-[#262626]/80 p-2 rounded text-xs text-gray-400 pointer-events-none border border-[#3d3d3d] z-50">
                  <p>Pre-Production Fusion v1.9</p>
                  <p className="text-[10px] mt-1 text-davinci-accent opacity-70">
                    {isSpacePressed ? '[HAND TOOL ACTIVE]' : 'Paste Image/URL • Drag into Groups • Ctrl+Z Undo'}
                  </p>
                </div>
              </div>
            )}

            {viewMode === 'storyboard' && (
              <TimelinePanel
                nodes={nodes}
                selectedNodeIds={selectedNodes.map(n => n.id)}
                onSelectNode={handleSelectNode}
                onUpdateDuration={handleUpdateDuration}
              />
            )}
          </div>

          <Inspector
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNodeHistory}
            aspectRatio={aspectRatio}
          />
        </div>

        {isPresentationOpen && (
          <PresentationMode
            nodes={presentationNodes}
            onClose={() => setIsPresentationOpen(false)}
            aspectRatio={aspectRatio}
          />
        )}
      </div>
    </SettingsContext.Provider>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <MobileWarning />
      <AppContent />
    </ReactFlowProvider>
  );
}
