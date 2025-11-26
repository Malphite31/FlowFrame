import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData } from '../types';

interface PresentationModeProps {
  nodes: Node<StoryNodeData>[];
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ nodes, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const currentNode = nodes[currentIndex];
  const duration = useMemo(() => (currentNode?.data.duration || 3) * 1000, [currentNode]);
  
  const startTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>();

  useEffect(() => {
    // Reset start time whenever we change slides manually or duration changes
    if (isPlaying) {
      startTimeRef.current = Date.now() - (progress * duration);
    }
  }, [currentIndex, duration, isPlaying]); // Intentionally omitting progress

  useEffect(() => {
    const animate = () => {
      if (!isPlaying) return;

      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setProgress(newProgress);

      if (newProgress >= 1) {
        if (currentIndex < nodes.length - 1) {
          // Move to next slide
          setCurrentIndex(prev => prev + 1);
          setProgress(0);
          startTimeRef.current = Date.now();
        } else {
          // End of timeline
          setIsPlaying(false);
        }
      } else {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, currentIndex, duration, nodes.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
      if (e.key === 'ArrowRight') {
        if (currentIndex < nodes.length - 1) {
            setCurrentIndex(i => i + 1);
            setProgress(0);
        }
      }
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            setProgress(0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes.length, onClose, currentIndex]);

  if (!currentNode) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans">
       {/* Header */}
       <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentNode.data.color }} />
             <div>
                <h1 className="text-lg font-bold tracking-wide">{currentNode.data.label}</h1>
                <div className="text-xs text-gray-400 font-mono">
                    SCENE {currentIndex + 1} / {nodes.length} • {currentNode.data.duration}s
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
       </div>

       {/* Main Stage */}
       <div className="flex-1 flex items-center justify-center p-8 bg-[#121212]">
          {currentNode.data.image ? (
            <img 
                src={currentNode.data.image} 
                alt="Scene" 
                className="max-h-full max-w-full object-contain shadow-2xl rounded-sm" 
            />
          ) : (
            <div className="text-gray-600 text-xl font-bold uppercase tracking-widest border-2 border-gray-700 p-10 rounded border-dashed">
                No Image Available
            </div>
          )}
       </div>

       {/* Subtitles / Description */}
       {currentNode.data.description && (
         <div className="absolute bottom-24 w-full text-center px-10">
            <span className="inline-block bg-black/60 px-4 py-2 text-xl md:text-2xl text-yellow-400 font-medium shadow-lg rounded backdrop-blur-sm max-w-[80%]">
                {currentNode.data.description}
            </span>
         </div>
       )}

       {/* Timeline Controls */}
       <div className="h-20 bg-[#181818] border-t border-[#333] flex items-center px-6 gap-6">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
          >
            {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
            ) : (
                <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <div className="flex-1 flex flex-col gap-2">
             <div className="flex justify-between text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                <span>Current Scene Progress</span>
                <span>{Math.round(progress * 100)}%</span>
             </div>
             <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden">
                <div 
                    className="h-full bg-davinci-accent transition-all duration-75 ease-linear"
                    style={{ width: `${progress * 100}%` }} 
                />
             </div>
          </div>

          <div className="flex gap-2">
             <button 
                onClick={() => {
                    if (currentIndex > 0) {
                        setCurrentIndex(i => i - 1);
                        setProgress(0);
                    }
                }}
                disabled={currentIndex === 0}
                className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"
             >
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
             </button>
             <button 
                onClick={() => {
                    if (currentIndex < nodes.length - 1) {
                        setCurrentIndex(i => i + 1);
                        setProgress(0);
                    }
                }}
                disabled={currentIndex === nodes.length - 1}
                className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"
             >
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
             </button>
          </div>
       </div>
    </div>
  )
}
