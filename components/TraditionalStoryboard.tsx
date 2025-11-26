import React, { useMemo } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData, AspectRatio } from '../types';
import { sortNodesByTimeline, getExportableNodes } from '../utils/exportUtils';

interface TraditionalStoryboardProps {
    nodes: Node<StoryNodeData>[];
    aspectRatio: AspectRatio;
}

export const TraditionalStoryboard: React.FC<TraditionalStoryboardProps> = ({ nodes, aspectRatio }) => {
    const sortedNodes = useMemo(() => {
        return sortNodesByTimeline(getExportableNodes(nodes));
    }, [nodes]);

    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case '9:16': return 'aspect-[9/16]';
            case '1:1': return 'aspect-square';
            case '16:9':
            default: return 'aspect-video';
        }
    };

    return (
        <div className="flex-1 bg-[#1a1a1a] overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sortedNodes.map((node, index) => (
                        <div key={node.id} className="bg-[#262626] text-gray-200 rounded-lg overflow-hidden shadow-lg flex flex-col border border-[#3d3d3d]">
                            {/* Header: Scene Number & Shot Type */}
                            <div className="px-4 py-2 bg-[#1f1f1f] border-b border-[#3d3d3d] flex justify-between items-center">
                                <span className="font-bold text-lg text-davinci-accent">#{index + 1}</span>
                                {node.data.shotType && (
                                    <span className="px-2 py-0.5 bg-[#3d3d3d] text-gray-300 rounded text-xs font-mono uppercase border border-[#555]">
                                        {node.data.shotType}
                                    </span>
                                )}
                            </div>

                            {/* Image Area */}
                            <div className={`w-full bg-[#121212] relative ${getAspectRatioClass()} border-b border-[#3d3d3d]`}>
                                {node.data.image ? (
                                    node.data.mediaType === 'video' ? (
                                        <video src={node.data.image} className="w-full h-full object-cover" controls={false} />
                                    ) : (
                                        <img src={node.data.image} alt={node.data.label} className="w-full h-full object-cover" />
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#3d3d3d] text-sm">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono border border-white/10">
                                    {node.data.duration}s
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-4 flex-1 flex flex-col gap-2">
                                <h3 className="font-bold text-lg leading-tight text-white">{node.data.label}</h3>
                                <p className="text-sm text-gray-400 whitespace-pre-wrap flex-1">
                                    {node.data.description || <span className="text-gray-600 italic">No description...</span>}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2 bg-[#1f1f1f] border-t border-[#3d3d3d] text-xs text-gray-500 flex justify-between">
                                <span>Duration: {node.data.duration}s</span>
                                {node.data.fileName && <span className="truncate max-w-[150px]" title={node.data.fileName}>{node.data.fileName}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {sortedNodes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        <p className="text-xl">No scenes to display</p>
                        <p className="text-sm mt-2">Add nodes to the canvas to generate a storyboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
