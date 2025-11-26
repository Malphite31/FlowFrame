
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData, AspectRatio } from '../types';

interface PresentationModeProps {
  nodes: Node<StoryNodeData>[];
  onClose: () => void;
  aspectRatio: AspectRatio;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ nodes, onClose, aspectRatio }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // Dimensions state for the player frame
  const [frameDimensions, setFrameDimensions] = useState({ width: 0, height: 0 });

  const currentNode = nodes[currentIndex];
  const duration = useMemo(() => (currentNode?.data.duration || 3) * 1000, [currentNode]);
  
  const startTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>();
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Handle Window Resize to constrain player to Aspect Ratio
  useEffect(() => {
    const handleResize = () => {
      const padding = 40; // Total padding (20px each side)
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - padding;
      
      const [rW, rH] = aspectRatio.split(':').map(Number);
      const targetRatio = rW / rH;
      const windowRatio = availableWidth / availableHeight;

      let width, height;

      if (windowRatio > targetRatio) {
        // Window is wider than target -> Height constrained
        height = availableHeight;
        width = height * targetRatio;
      } else {
        // Window is taller than target -> Width constrained
        width = availableWidth;
        height = width / targetRatio;
      }

      setFrameDimensions({ width, height });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [aspectRatio]);


  // Auto-hide controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
    }, 2500);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    // Reset start time whenever we change slides manually or duration changes
    if (isPlaying) {
      startTimeRef.current = Date.now() - (progress * duration);
    }
  }, [currentIndex, duration, isPlaying]);

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
          setShowControls(true);
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
        setShowControls(true);
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
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center font-sans">
       
       {/* THE PLAYER FRAME */}
       <div 
          className="relative bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden"
          style={{ width: frameDimensions.width, height: frameDimensions.height }}
       >
          {/* IMAGE LAYER */}
          <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
              {currentNode.data.image ? (
                currentNode.data.mediaType === 'video' ? (
                   <video src={currentNode.data.image} className="w-full h-full object-contain" muted />
                ) : (
                   <img 
                      src={currentNode.data.image} 
                      alt="Scene" 
                      className="w-full h-full object-contain" 
                  />
                )
              ) : (
                <div className="text-gray-600 text-sm md:text-xl font-bold uppercase tracking-widest border-2 border-gray-800 p-10 rounded border-dashed opacity-50">
                    No Image
                </div>
              )}
          </div>

          {/* HEADER OVERLAY */}
          <div 
            className={`absolute top-0 w-full p-4 md:p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: currentNode.data.color, color: currentNode.data.color }} />
                <div>
                    <h1 className="text-sm md:text-xl font-bold tracking-wide drop-shadow-md text-white">{currentNode.data.label}</h1>
                    <div className="text-[10px] md:text-xs text-gray-300 font-mono opacity-80">
                        SCENE {currentIndex + 1} / {nodes.length} • {currentNode.data.duration}s
                    </div>
                </div>
              </div>
          </div>

          {/* SUBTITLES / NOTES OVERLAY */}
          {currentNode.data.description && (
            <div className={`absolute bottom-20 md:bottom-28 w-full text-center px-6 md:px-10 z-10 pointer-events-none transition-all duration-300 ${showControls ? 'translate-y-0' : 'translate-y-8'}`}>
                <span className="inline-block bg-black/70 px-4 py-2 md:px-6 md:py-3 text-sm md:text-lg text-yellow-400 font-medium shadow-xl rounded-lg backdrop-blur-md max-w-[90%] leading-relaxed border border-white/5">
                    {currentNode.data.description}
                </span>
            </div>
          )}

          {/* CONTROLS OVERLAY */}
          <div 
            className={`absolute bottom-0 w-full h-20 md:h-28 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end pb-4 md:pb-8 px-4 md:px-8 gap-4 md:gap-6 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] flex-shrink-0"
              >
                {isPlaying ? (
                    <svg className="w-3 h-3 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                ) : (
                    <svg className="w-3 h-3 md:w-5 md:h-5 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              
              <div className="flex-1 flex flex-col gap-1 md:gap-2 mb-1 md:mb-1.5">
                <div className="flex justify-between text-[8px] md:text-[10px] text-gray-300 font-mono uppercase tracking-wider drop-shadow-sm">
                    <span>Timeline Progress</span>
                    <span>{Math.round(progress * 100)}%</span>
                </div>
                <div 
                    className="h-1.5 md:h-2 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer backdrop-blur-sm group"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const p = (e.clientX - rect.left) / rect.width;
                        setProgress(Math.max(0, Math.min(1, p)));
                        startTimeRef.current = Date.now() - (p * duration);
                    }}
                >
                    <div 
                        className="h-full bg-davinci-accent shadow-[0_0_10px_#5e9aff] group-hover:bg-blue-400 transition-colors"
                        style={{ width: `${progress * 100}%` }} 
                    />
                </div>
              </div>

              <div className="flex gap-2 mb-0.5 md:mb-1 flex-shrink-0">
                <button 
                    onClick={() => {
                        if (currentIndex > 0) {
                            setCurrentIndex(i => i - 1);
                            setProgress(0);
                        }
                    }}
                    disabled={currentIndex === 0}
                    className="p-2 md:p-3 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors backdrop-blur-sm bg-black/20"
                >
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button 
                    onClick={() => {
                        if (currentIndex < nodes.length - 1) {
                            setCurrentIndex(i => i + 1);
                            setProgress(0);
                        }
                    }}
                    disabled={currentIndex === nodes.length - 1}
                    className="p-2 md:p-3 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors backdrop-blur-sm bg-black/20"
                >
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
              </div>
          </div>
       </div>

       {/* CLOSE BUTTON (OUTSIDE FRAME) */}
       <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
       </button>
    </div>
  )
}
