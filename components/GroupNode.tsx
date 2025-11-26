import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { StoryNodeData } from '../types';

const GroupNode = ({ data, selected }: NodeProps<StoryNodeData>) => {
  return (
    <>
      <NodeResizer 
        minWidth={100} 
        minHeight={100} 
        isVisible={selected} 
        lineStyle={{ border: '1px solid #5e9aff' }} 
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />
      <div 
        className={`w-full h-full rounded-lg bg-[#262626]/40 border-2 transition-all duration-300 backdrop-blur-sm flex flex-col
          ${selected ? 'border-davinci-accent/50' : 'border-dashed border-[#3d3d3d]'}
        `}
      >
        <div 
            className="w-full px-4 py-2 rounded-t-lg bg-[#3d3d3d]/50 border-b border-transparent flex items-center justify-between"
            style={{ backgroundColor: data.color ? `${data.color}40` : '#3d3d3d40' }}
        >
          <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">
            {data.label || 'Group'}
          </span>
          {data.color && (
            <div className="w-2 h-2 rounded-full opacity-80" style={{ backgroundColor: data.color }} />
          )}
        </div>
        <div className="flex-1 w-full h-full relative -z-10">
            {/* The content area where children sit */}
        </div>
      </div>
    </>
  );
};

export default memo(GroupNode);