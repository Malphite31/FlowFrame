import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData, AspectRatio, ViewMode } from '../types';
import { ExportModal } from './ExportModal';
import { ShareModal } from './ShareModal';

interface TopBarProps {
  nodes: Node<StoryNodeData>[];
  projectId: string | null;
  onAddNode: (type: 'text' | 'image' | 'video' | 'audio') => void;
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

export const TopBar: React.FC<TopBarProps> = ({
  nodes,
  projectId,
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
  userName = 'Anonymous',
  onUpdateUserName = (_: string) => { },
  userColor = '#3b82f6'
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Sync temp name when prop changes
  useEffect(() => {
    setTempName(userName);
  }, [userName]);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onUpdateUserName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <>
      <div className="h-14 bg-[#1e1e1e] border-b border-[#3d3d3d] flex items-center justify-between px-4 z-50 select-none">
        <div className="flex items-center gap-4">
          {showBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2 hover:bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Back to Dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm outline-none w-48 hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] px-2 py-1 rounded transition-colors"
            />
          </div>

          <div className="h-6 w-px bg-[#3d3d3d] mx-2" />

          {/* Aspect Ratio Selector */}
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-[#262626] border border-[#3d3d3d] text-white text-xs font-medium px-2 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-[#2a2a2a] transition-colors"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="4:3">4:3</option>
            <option value="21:9">21:9</option>
          </select>

          <div className="h-6 w-px bg-[#3d3d3d] mx-2" />

          {/* Add Node Buttons */}
          <div className="flex items-center gap-1 bg-[#262626] rounded-lg p-1 border border-[#3d3d3d]">
            <button onClick={() => onAddNode('text')} className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors min-w-[40px]" title="Add Scene Card">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></svg>
              <span className="text-[9px] font-medium leading-none">Scene</span>
            </button>
            <button onClick={() => onAddNode('text')} className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors min-w-[40px]" title="Add Mind Map Node">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 15v6" /><path d="M12 9V3" /><path d="M15 12h6" /><path d="M9 12H3" /><path d="M14.5 14.5L19 19" /><path d="M9.5 9.5L5 5" /><path d="M14.5 9.5L19 5" /><path d="M9.5 14.5L5 19" /></svg>
              <span className="text-[9px] font-medium leading-none">Mind</span>
            </button>
            <button onClick={() => onAddNode('image')} className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors min-w-[40px]" title="Add Mood Image">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              <span className="text-[9px] font-medium leading-none">Mood</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="bg-[#262626] border border-[#3d3d3d] text-white text-xs font-medium px-2 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-[#2a2a2a] transition-colors"
          >
            <option value="flow">Flow View</option>
            <option value="storyboard">Storyboard</option>
            <option value="mindmap">Mind Map</option>
            <option value="moodboard">Mood Board</option>
          </select>

          <div className="h-6 w-px bg-[#3d3d3d] mx-2" />

          {/* Layout Presets */}
          <div className="relative">
            <button
              onClick={() => setIsLayoutOpen(!isLayoutOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#262626] border border-[#3d3d3d] text-white text-xs font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <span>Layout</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isLayoutOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isLayoutOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLayoutOpen(false)} />
                <div className="absolute top-full right-0 mt-1 w-48 bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg shadow-xl z-50 py-1 flex flex-col overflow-hidden">
                  <button
                    onClick={() => { onLayout('radial'); setIsLayoutOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#2a2a2a] text-left transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">◎</span>
                    Radial Map
                  </button>
                  <button
                    onClick={() => { onLayout('tree-tb'); setIsLayoutOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#2a2a2a] text-left transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">↓</span>
                    Tree (Top-Bottom)
                  </button>
                  <button
                    onClick={() => { onLayout('tree-lr'); setIsLayoutOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#2a2a2a] text-left transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">→</span>
                    Logic (Left-Right)
                  </button>
                  <button
                    onClick={() => { onLayout('organic'); setIsLayoutOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#2a2a2a] text-left transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">⋈</span>
                    Organic Concept
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-[#3d3d3d] mx-2" />

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${canUndo ? 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]' : 'text-gray-600 cursor-not-allowed'}`}
            title="Undo (Ctrl+Z)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${canRedo ? 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]' : 'text-gray-600 cursor-not-allowed'}`}
            title="Redo (Ctrl+Y)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
          </button>

          <div className="h-6 w-px bg-[#3d3d3d] mx-2" />

          {/* User Badge / Share Button */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#2a2a2a] cursor-pointer transition-colors border border-transparent hover:border-[#3d3d3d]"
              onClick={() => setIsShareOpen(true)}
              title="Click to edit profile"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-sm"
                style={{ backgroundColor: userColor, color: ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5', '#D8B4FE'].includes(userColor) ? '#000' : '#fff' }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 font-medium max-w-[100px] truncate">{userName}</span>
            </div>

            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </button>
          </div>

          <div className="h-6 w-px bg-[#3d3d3d] mx-2" />

          <button
            onClick={onPlay}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-white text-sm font-medium rounded-lg transition-colors border border-[#3d3d3d]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectUrl={`${window.location.origin}?project=${projectId}`}
        projectName={projectName}
        userName={userName}
        onUpdateUserName={onUpdateUserName}
        userColor={userColor}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projectName={projectName}
        nodes={nodes}
        aspectRatio={aspectRatio}
      />
    </>
  );
};
