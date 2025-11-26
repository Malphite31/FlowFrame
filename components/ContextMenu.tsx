
import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'node' | 'edge';
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  canGroup: boolean;
  canUngroup: boolean;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, y, type, onDuplicate, onDelete, onGroup, onUngroup, canGroup, canUngroup, onClose 
}) => {
  return (
    <div 
      className="fixed z-50 bg-[#262626] border border-[#3d3d3d] rounded-lg shadow-2xl flex flex-col py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
      onMouseLeave={onClose}
    >
      {type === 'node' && (
        <>
          <button 
            onClick={onDuplicate} 
            className="text-left px-4 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
            Duplicate
          </button>

          {/* Grouping Actions */}
          {canGroup && onGroup && (
            <>
               <div className="h-[1px] bg-[#3d3d3d] mx-1 my-1"></div>
               <button 
                onClick={onGroup} 
                className="text-left px-4 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                Group Selection
              </button>
            </>
          )}

          {canUngroup && onUngroup && (
            <>
               <div className="h-[1px] bg-[#3d3d3d] mx-1 my-1"></div>
               <button 
                onClick={onUngroup} 
                className="text-left px-4 py-2 text-xs text-gray-300 hover:bg-[#3d3d3d] hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                Ungroup
              </button>
            </>
          )}

          <div className="h-[1px] bg-[#3d3d3d] mx-1 my-1"></div>
        </>
      )}

      <button 
        onClick={onDelete} 
        className="text-left px-4 py-2 text-xs text-red-400 hover:bg-[#3d3d3d] hover:text-red-300 transition-colors flex items-center gap-2"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        {type === 'edge' ? 'Disconnect Nodes' : 'Delete'}
      </button>
    </div>
  );
};

export default ContextMenu;
