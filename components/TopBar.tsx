
import React from 'react';
import { generateXML, generateEDL, generateJSON, downloadFile } from '../utils/exportUtils';
import { Node } from '@xyflow/react';
import { StoryNodeData, AspectRatio } from '../types';

export type ViewMode = 'storyboard' | 'mindmap';

interface TopBarProps {
  nodes: Node<StoryNodeData>[];
  onAddNode: () => void;
  projectName: string;
  setProjectName: (name: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  onPlay: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onLayout: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  canGroup: boolean;
  canUngroup: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onBackToDashboard?: () => void;
  showBackToDashboard?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ 
  nodes, 
  onAddNode, 
  projectName, 
  setProjectName, 
  aspectRatio, 
  setAspectRatio, 
  onPlay,
  viewMode,
  setViewMode,
  onLayout,
  onGroup,
  onUngroup,
  canGroup,
  canUngroup,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onBackToDashboard,
  showBackToDashboard
}) => {
  
  const handleExportXML = () => {
    const xml = generateXML(nodes, projectName, aspectRatio);
    downloadFile(xml, `${projectName}.xml`, 'text/xml');
  };

  const handleExportEDLMarkers = () => {
    const edl = generateEDL(nodes, projectName);
    downloadFile(edl, `${projectName}_Markers.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = generateJSON(nodes, projectName, aspectRatio);
    downloadFile(json, `${projectName}.json`, 'application/json');
  };

  return (
    <div className="h-14 bg-[#262626] border-b border-black flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-4">
        {showBackToDashboard && (
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-[#1f1f1f] px-2 py-1 rounded border border-[#3d3d3d] transition-colors"
            title="Back to Projects"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Projects
          </button>
        )}

        <div className="text-davinci-accent font-bold text-lg tracking-wider flex items-center gap-2 select-none">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 19h20L12 2zm0 3.8l6.5 11.2H5.5L12 5.8z"/>
          </svg>
          FLOWFRAME
        </div>
        
        {/* View Mode Switcher */}
        <div className="bg-[#121212] rounded p-0.5 flex border border-[#3d3d3d] ml-2">
            <button 
                onClick={() => setViewMode('storyboard')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'storyboard' ? 'bg-[#3d3d3d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Storyboard
            </button>
            <button 
                onClick={() => setViewMode('mindmap')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'mindmap' ? 'bg-[#3d3d3d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Mind Map
            </button>
        </div>

        <div className="h-6 w-[1px] bg-[#3d3d3d] mx-2"></div>
        
        <input 
          type="text" 
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-[#121212] border border-[#3d3d3d] text-white text-sm px-2 py-1 rounded focus:border-davinci-accent outline-none w-40"
          placeholder="Project Name"
        />
        
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-2 ml-2">
          <select 
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-[#121212] border border-[#3d3d3d] text-white text-xs px-2 py-1.5 rounded focus:border-davinci-accent outline-none cursor-pointer"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#121212] rounded p-0.5 border border-[#3d3d3d] mr-2">
           <button 
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo (Ctrl+Z)"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
           </button>
           <div className="w-[1px] bg-[#3d3d3d] h-4 mx-1"></div>
           <button 
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo (Ctrl+Shift+Z)"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
           </button>
        </div>

        {/* Layout & Grouping Controls */}
        <div className="flex items-center bg-[#121212] rounded p-0.5 border border-[#3d3d3d] mr-2">
            <button
                onClick={onLayout}
                className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors flex items-center gap-1"
                title="Auto Layout Nodes"
            >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                 Layout
            </button>
            <div className="w-[1px] bg-[#3d3d3d] h-4 mx-1"></div>
            <button
                onClick={onGroup}
                disabled={!canGroup}
                className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Group Selected (Ctrl+G)"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            </button>
            <button
                onClick={onUngroup}
                disabled={!canUngroup}
                className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Ungroup Selected"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
        </div>

        {/* Play Button - Only show in Storyboard mode */}
        {viewMode === 'storyboard' && (
          <button 
            onClick={onPlay}
            className="flex items-center gap-2 bg-davinci-accent hover:bg-blue-400 text-[#181818] px-4 py-1.5 rounded text-xs font-bold transition-all hover:scale-105 shadow-[0_0_10px_rgba(94,154,255,0.3)] mr-2"
            title="Play Animatic"
          >
             <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
             PLAY
          </button>
        )}

         {/* Add Node Button */}
         <button 
          onClick={onAddNode}
          className="flex items-center gap-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white px-4 py-1.5 rounded text-xs transition-colors border border-transparent hover:border-gray-500 shadow-sm"
          title="Add New Node"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Node</span>
        </button>

        <div className="h-6 w-[1px] bg-[#3d3d3d] mx-2"></div>

        {/* Export Group */}
        <div className="flex bg-[#121212] rounded p-0.5 gap-0.5 border border-[#3d3d3d]">
          <button 
            onClick={handleExportXML}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors"
            title="Export for Premiere & Resolve"
          >
            XML
          </button>
          <div className="w-[1px] bg-[#3d3d3d] my-1"></div>
          <button 
            onClick={handleExportEDLMarkers}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors"
            title="Export Markers"
          >
            Markers
          </button>
          <div className="w-[1px] bg-[#3d3d3d] my-1"></div>
          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors"
            title="Export JSON"
          >
            JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
