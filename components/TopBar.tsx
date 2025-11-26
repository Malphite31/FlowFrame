import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData, AspectRatio, ViewMode } from '../types';
import { ExportModal } from './ExportModal';

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
  onLayout: (type?: string) => void;
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
  userName?: string;
  onUpdateUserName?: (name: string) => void;
  userColor?: string;
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
  showBackToDashboard,
  userName,
  onUpdateUserName,
  userColor
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName || '');

  const handleNameSubmit = () => {
    if (onUpdateUserName && tempName.trim()) {
      onUpdateUserName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <>
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
              <path d="M12 2L2 19h20L12 2zm0 3.8l6.5 11.2H5.5L12 5.8z" />
            </svg>
            FLOWFRAME
          </div>

          {/* View Mode Switcher */}
          <div className="bg-[#121212] rounded p-0.5 flex border border-[#3d3d3d] ml-2">
            <button
              onClick={() => setViewMode('storyboard')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'storyboard' ? 'bg-[#3d3d3d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Flow
            </button>
            <button
              onClick={() => setViewMode('traditional')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'traditional' ? 'bg-[#3d3d3d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Traditional
            </button>
            <button
              onClick={() => setViewMode('mindmap')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'mindmap' ? 'bg-[#3d3d3d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Mind Map
            </button>
            <button
              onClick={() => setViewMode('moodboard')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'moodboard' ? 'bg-[#3d3d3d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Mood Board
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
            {/* Layout Dropdown */}
            <div className="relative group">
              <button
                className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors flex items-center gap-1"
                title="Auto Layout Nodes"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Layout
              </button>
              <div className="absolute top-full left-0 mt-1 w-32 bg-[#1f1f1f] border border-[#3d3d3d] rounded shadow-xl hidden group-hover:block z-50">
                <button onClick={() => onLayout('tree-lr')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white">Tree (Left-Right)</button>
                <button onClick={() => onLayout('tree-tb')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white">Tree (Top-Down)</button>
                <button onClick={() => onLayout('mindmap')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white">Mind Map</button>
                <button onClick={() => onLayout('radial')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white">Radial</button>
                <button onClick={() => onLayout('organic')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white">Organic</button>
              </div>
            </div>
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
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
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

          {/* Collaboration User Badge */}
          {userName && (
            <div className="relative ml-2">
              {isEditingName ? (
                <div className="flex items-center bg-[#121212] border border-[#3d3d3d] rounded px-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                    onBlur={handleNameSubmit}
                    autoFocus
                    className="bg-transparent text-xs text-white outline-none w-24 py-1"
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempName(userName);
                    setIsEditingName(true);
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#3d3d3d] transition-colors border border-transparent hover:border-[#555]"
                  title="Click to change your display name"
                >
                  <div
                    className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]"
                    style={{ backgroundColor: userColor || '#4ade80', color: userColor || '#4ade80' }}
                  ></div>
                  <span className="text-xs text-gray-300 font-medium max-w-[100px] truncate">
                    {userName}
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="h-6 w-[1px] bg-[#3d3d3d] mx-2"></div>

          {/* Single Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-[#3d3d3d] rounded text-xs text-gray-300 hover:text-white hover:border-davinci-accent transition-all shadow-sm"
            title="Export Project"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Export
          </button>
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        nodes={nodes}
        projectName={projectName}
        aspectRatio={aspectRatio}
      />
    </>
  );
};

export default TopBar;
