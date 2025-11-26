

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData } from '../types';
import { sortNodesByTimeline, getExportableNodes } from '../utils/exportUtils';
import { secondsToTimecode } from '../utils/timeUtils';

interface TimelinePanelProps {
  nodes: Node<StoryNodeData>[];
  selectedNodeIds: string[];
  onSelectNode: (id: string | null, multi?: boolean) => void;
  onUpdateDuration: (id: string, duration: number) => void;
}

const MIN_ZOOM = 10;
const MAX_ZOOM = 100;

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ 
  nodes, 
  selectedNodeIds, 
  onSelectNode,
  onUpdateDuration 
}) => {
  const [zoom, setZoom] = useState(30); // pixels per second
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Resizing State
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartDuration, setResizeStartDuration] = useState(0);

  // Scrubbing State
  const isScrubbingRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Filter and sort nodes for the timeline track
  const timelineNodes = useMemo(() => {
    return sortNodesByTimeline(getExportableNodes(nodes));
  }, [nodes]);

  // Calculate total duration
  useEffect(() => {
    const total = timelineNodes.reduce((acc, node) => acc + (node.data.duration || 1), 0);
    setTotalDuration(total);
  }, [timelineNodes]);

  // --- PLAYBACK LOGIC ---
  const animate = useCallback((time: number) => {
    if (!isPlaying) return;
    
    // Calculate delta based on real time to ensure accurate playback speed
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000; // seconds
    
    // Check if we reached the end
    if (elapsed >= totalDuration) {
      setIsPlaying(false);
      setCurrentTime(totalDuration);
      return;
    }

    setCurrentTime(elapsed);

    requestRef.current = requestAnimationFrame(() => animate(Date.now()));
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (isPlaying) {
      // If starting from end, reset
      let startOffset = currentTime;
      if (currentTime >= totalDuration) {
          startOffset = 0;
          setCurrentTime(0);
      }
      
      startTimeRef.current = Date.now() - (startOffset * 1000);
      requestRef.current = requestAnimationFrame(() => animate(Date.now()));
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, totalDuration]); // Dependencies restricted to restart animation loop correctly

  const togglePlay = () => setIsPlaying(!isPlaying);

  // --- SCRUBBING LOGIC ---
  const calculateTimeFromEvent = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left + containerRef.current.scrollLeft;
    return Math.max(0, Math.min(totalDuration, offsetX / zoom));
  };

  const updateScrub = useCallback((clientX: number) => {
    const newTime = calculateTimeFromEvent(clientX);
    setCurrentTime(newTime);
  }, [zoom, totalDuration]);

  const handleMouseDown = (e: React.MouseEvent) => {
      // Prevent scrubbing if we are clicking a resize handle
      if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
      
      e.preventDefault();
      setIsPlaying(false); // Pause playback when scrubbing starts
      isScrubbingRef.current = true;
      
      // Pass shiftKey to enable multi-select on click
      updateScrub(e.clientX);

      const onMouseMove = (moveEvent: MouseEvent) => {
          if (isScrubbingRef.current) {
             // Dragging scrub forces single select for clarity
             updateScrub(moveEvent.clientX);
          }
      };

      const onMouseUp = () => {
          isScrubbingRef.current = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
  };

  // --- RESIZE HANDLERS ---
  const handleResizeStart = (e: React.MouseEvent, node: Node<StoryNodeData>) => {
    e.stopPropagation(); // Prevent scrubbing trigger
    setResizingNodeId(node.id);
    setResizeStartX(e.clientX);
    setResizeStartDuration(node.data.duration || 1);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingNodeId) return;
    
    const deltaPixels = e.clientX - resizeStartX;
    const deltaSeconds = deltaPixels / zoom;
    const newDuration = Math.max(1, Math.round(resizeStartDuration + deltaSeconds)); // Min 1 sec
    
    onUpdateDuration(resizingNodeId, newDuration);
  }, [resizingNodeId, resizeStartX, resizeStartDuration, zoom, onUpdateDuration]);

  const handleResizeEnd = useCallback(() => {
    setResizingNodeId(null);
  }, []);

  useEffect(() => {
    if (resizingNodeId) {
        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizingNodeId, handleResizeMove, handleResizeEnd]);


  return (
    <div className="h-48 bg-[#181818] border-t border-black flex flex-col select-none">
      {/* Toolbar */}
      <div className="h-10 bg-[#262626] border-b border-[#3d3d3d] flex items-center justify-between px-4">
         <div className="flex items-center gap-4">
             <button 
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center bg-[#3d3d3d] hover:bg-[#5e9aff] hover:text-[#181818] rounded-full transition-colors text-white"
             >
                {isPlaying ? (
                     <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                     <svg className="w-4 h-4 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
             </button>
             <div className="text-xl font-mono text-davinci-accent tracking-widest font-bold">
                 {secondsToTimecode(currentTime)}
             </div>
             <div className="text-xs text-gray-500 font-mono pt-1">
                 Total: {secondsToTimecode(totalDuration)}
             </div>
         </div>

         <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-500 uppercase font-bold">Zoom</span>
             <input 
                type="range" 
                min={MIN_ZOOM} 
                max={MAX_ZOOM} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-24 h-1 bg-[#3d3d3d] rounded-lg appearance-none cursor-pointer"
             />
         </div>
      </div>

      {/* Timeline Track Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar" ref={containerRef}>
         <div 
            className="h-full relative min-w-full cursor-text" 
            style={{ width: Math.max(containerRef.current?.clientWidth || 0, totalDuration * zoom + 100) }}
            onMouseDown={handleMouseDown}
         >
             {/* Ruler */}
             <div className="h-6 border-b border-[#3d3d3d] bg-[#1a1a1a] relative flex items-end pointer-events-none">
                 {Array.from({ length: Math.ceil(totalDuration + 2) }).map((_, sec) => (
                     <div 
                        key={sec} 
                        className="absolute bottom-0 border-l border-[#555] h-2 text-[9px] text-gray-500 pl-1 font-mono"
                        style={{ left: sec * zoom }}
                     >
                        {sec}s
                     </div>
                 ))}
             </div>

             {/* Clips Container */}
             <div className="mt-2 h-20 relative">
                 {timelineNodes.reduce<{ accTime: number; els: React.ReactNode[] }>((state, node, idx) => {
                     const duration = node.data.duration || 1;
                     const startX = state.accTime * zoom;
                     const width = duration * zoom;
                     const isSelected = selectedNodeIds.includes(node.id);
                     
                     state.els.push(
                         <div 
                            key={node.id}
                            className={`
                                absolute top-1 h-16 rounded border overflow-hidden group cursor-pointer transition-colors
                                ${isSelected ? 'border-davinci-accent bg-[#3d3d3d]' : 'border-black bg-[#262626] hover:border-gray-500'}
                            `}
                            style={{ left: startX, width: width }}
                            onMouseDown={(e) => {
                                e.stopPropagation(); // Stop bubbling to prevent background scrub handler from taking over
                                onSelectNode(node.id, e.shiftKey || e.metaKey || e.ctrlKey);
                            }}
                         >
                            {/* Clip Content */}
                            <div className="flex h-full pointer-events-none">
                                {node.data.image && (
                                    <div className="h-full aspect-square bg-black flex-shrink-0">
                                        {node.data.mediaType === 'video' ? (
                                            <video src={node.data.image} className="h-full w-full object-cover" />
                                        ) : node.data.mediaType === 'embed' ? (
                                            <div className="h-full w-full flex flex-col items-center justify-center bg-[#222]">
                                                <svg className="w-5 h-5 text-red-500 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                                <span className="text-[8px] text-gray-500 font-mono">EMBED</span>
                                            </div>
                                        ) : (
                                            <img src={node.data.image} alt="" className="h-full w-full object-cover" draggable={false} />
                                        )}
                                    </div>
                                )}
                                <div className="p-2 min-w-0 flex flex-col justify-center">
                                    <span className={`text-[10px] font-bold truncate block ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                        {idx + 1}. {node.data.label}
                                    </span>
                                    <span className="text-[9px] text-gray-600 font-mono">
                                        {duration}s
                                    </span>
                                </div>
                            </div>
                            
                            {/* Color Bar Top */}
                            <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none" style={{ backgroundColor: node.data.color }}></div>

                            {/* Resize Handle (Interactive) */}
                            <div 
                                className="resize-handle absolute top-0 bottom-0 right-0 w-2 cursor-col-resize hover:bg-davinci-accent/50 z-10"
                                onMouseDown={(e) => handleResizeStart(e, node)}
                            />
                         </div>
                     );
                     
                     state.accTime += duration;
                     return state;
                 }, { accTime: 0, els: [] }).els}
             </div>

             {/* Playhead */}
             <div 
                className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-20 pointer-events-none flex flex-col items-center"
                style={{ left: currentTime * zoom }}
             >
                 <div className="w-3 h-3 -mt-1.5 bg-red-500 rotate-45 transform origin-center shadow-sm"></div>
             </div>
         </div>
      </div>
    </div>
  );
};