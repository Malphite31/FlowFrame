
import React, { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StoryNodeData, MediaType } from '../types';
import { useSettings } from '../context/SettingsContext';

const getShotTypeIcon = (shotType?: string) => {
  if (!shotType) return null;
  const type = shotType.toLowerCase();
  const className = "w-3 h-3 text-gray-400";

  // POV / Eye
  if (type === 'pov' || type === 'ecu') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  // Drone
  if (type === 'drone') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="7" width="20" height="2" rx="1" />
        <line x1="5" y1="7" x2="5" y2="4" />
        <line x1="19" y1="7" x2="19" y2="4" />
        <line x1="2" y1="4" x2="8" y2="4" />
        <line x1="16" y1="4" x2="22" y2="4" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  // Establish (House)
  if (type === 'est') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 21h18M5 21V7l8-4 8 4v14M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
      </svg>
    );
  }

  // Close Up (Head)
  if (['cu', 'mcu', 'close up'].includes(type)) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="10" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      </svg>
    );
  }

  // Medium (Person waist)
  if (['med', 'medium'].includes(type)) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  // Wide / Default (Frame with Bars)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="6" y1="3" x2="6" y2="21" />
      <line x1="18" y1="3" x2="18" y2="21" />
    </svg>
  );
};

const FusionNode = ({ id, data: propData, selected }: NodeProps) => {
  const data = propData as StoryNodeData;
  const isIdea = data.variant === 'idea';
  const isMood = data.variant === 'mood';
  const isLink = data.variant === 'link';
  const { updateNodeData } = useReactFlow();
  const { aspectRatio } = useSettings(); // Global Aspect Ratio
  const [isDragOver, setIsDragOver] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation(); // Prevent canvas drop
      setIsDragOver(false);

      // Check for internal asset drop (From Library)
      const type = event.dataTransfer.getData('application/reactflow/type');
      const assetImage = event.dataTransfer.getData('application/reactflow/source');
      const assetMediaType = event.dataTransfer.getData('application/reactflow/mediaType') as MediaType;

      if (type === 'asset' && assetImage) {
        updateNodeData(id, { image: assetImage, mediaType: assetMediaType || 'image' });
        return;
      }

      // Check for external file drop
      const file = event.dataTransfer.files[0];
      if (file) {
        let mediaType: MediaType = 'image';
        if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';
        else if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          updateNodeData(id, {
            image: e.target?.result as string,
            fileName: file.name,
            mediaType: mediaType
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [id, updateNodeData]
  );

  // --- DYNAMIC DIMENSIONS BASED ON ASPECT RATIO ---
  const getDimensions = () => {
    switch (aspectRatio) {
      case '9:16':
        return { widthClass: 'w-48', heightClass: 'h-[340px]', previewHeightClass: 'h-[270px]' };
      case '1:1':
        return { widthClass: 'w-56', heightClass: 'h-auto', previewHeightClass: 'h-56' };
      case '16:9':
      default:
        return { widthClass: 'w-64', heightClass: 'h-auto', previewHeightClass: 'h-36' };
    }
  };

  const { widthClass, heightClass, previewHeightClass } = getDimensions();

  // --- STYLE FOR LINK NODES (FIGMA STYLE) ---
  if (isLink) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative w-72 rounded-lg bg-[#262626] flex flex-col overflow-hidden transition-all duration-300
          ${selected
            ? 'ring-2 ring-davinci-accent shadow-[0_0_20px_rgba(94,154,255,0.3)]'
            : 'shadow-lg border border-[#3d3d3d] hover:border-gray-500'}
        `}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white/10 !border-0 hover:!bg-davinci-accent transition-colors"
          style={{ left: '-5px', opacity: 0.5 }}
        />

        {/* Thumbnail Area */}
        {data.linkImage ? (
          <div className="h-32 w-full bg-black relative">
            <img src={data.linkImage} alt="Link Preview" className="w-full h-full object-cover opacity-90" draggable={false} />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10"></div>
          </div>
        ) : (
          <div className="h-16 w-full bg-[#1a1a1a] flex items-center justify-center border-b border-[#3d3d3d]">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </div>
        )}

        {/* Content Area */}
        <div className="p-3 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-bold text-gray-200 leading-tight line-clamp-2">{data.linkTitle || data.label}</span>
            {/* External Link Icon Button */}
            <a
              href={data.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-gray-500 hover:text-davinci-accent transition-colors bg-[#121212] p-1 rounded"
              title="Open Link"
              onMouseDown={(e) => e.stopPropagation()} // Prevent node selection when clicking link
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>

          <span className="text-[10px] text-davinci-accent/80 font-mono truncate">{data.linkDomain}</span>

          {data.linkDescription && (
            <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
              {data.linkDescription}
            </p>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white/10 !border-0 hover:!bg-davinci-accent transition-colors"
          style={{ right: '-5px', opacity: 0.5 }}
        />
      </div>
    );
  }

  // --- STYLE FOR MOOD BOARD NODES ---
  if (isMood) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative group transition-all duration-300 ease-out ${selected ? 'z-10' : ''}`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white/20 !border-0 hover:!bg-davinci-accent"
          style={{ left: '-5px', opacity: 0 }}
        />
        <div className={`
            overflow-hidden rounded-lg bg-[#121212] transition-all duration-300 ease-out flex items-center justify-center
            ${selected
            ? 'ring-2 ring-davinci-accent shadow-[0_0_25px_rgba(94,154,255,0.4)] scale-[1.02]'
            : 'shadow-xl hover:shadow-2xl hover:scale-[1.01]'}
            ${isDragOver ? 'ring-2 ring-davinci-accent ring-offset-2 ring-offset-[#181818] opacity-80' : ''}
          `}
          style={{ minWidth: '160px', minHeight: '160px' }}
        >
          {data.image ? (
            data.mediaType === 'video' ? (
              <video src={data.image} className="w-full h-full object-cover" controls={false} muted loop />
            ) : (
              <img
                src={data.image}
                alt="Mood Board Ref"
                className="block w-full h-full object-cover max-w-[500px] max-h-[500px]"
                draggable={false}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center w-[200px] h-[200px] border-2 border-dashed border-[#333] hover:border-[#555] transition-colors gap-3">
              <div className="p-3 rounded-full bg-[#1a1a1a]">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Drop Ref</span>
            </div>
          )}
        </div>
        <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#181818]/90 border border-[#333] text-gray-300 text-[9px] rounded-full transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {data.label || 'Mood Node'}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white/20 !border-0 hover:!bg-davinci-accent"
          style={{ right: '-5px', opacity: 0 }}
        />
      </div>
    );
  }

  // --- STYLE FOR MIND MAP IDEA NODES ---
  if (isIdea) {
    return (
      <div
        className={`
          relative min-w-[150px] max-w-[280px] px-6 py-4 rounded-2xl shadow-lg border transition-all duration-300 ease-out flex items-center justify-center text-center backdrop-blur-md
          ${selected
            ? 'border-davinci-accent ring-2 ring-davinci-accent/30 shadow-[0_0_25px_rgba(94,154,255,0.5)] scale-105'
            : 'border-white/10 hover:border-white/30 hover:scale-105 hover:shadow-xl'}
        `}
        style={{
          background: data.color ? `linear-gradient(135deg, ${data.color}dd, ${data.color}99)` : 'linear-gradient(135deg, #333, #222)',
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-white/80 !border-0 hover:!bg-white transition-all"
          style={{ left: '-1px' }}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-white drop-shadow-sm tracking-wide">{data.label}</span>
          {data.description && (
            <span className="text-[11px] text-white/80 font-medium leading-tight max-w-[200px]">{data.description}</span>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !bg-white/80 !border-0 hover:!bg-white transition-all"
          style={{ right: '-1px' }}
        />
      </div>
    );
  }

  // --- STYLE FOR STANDARD SCENE NODES (Fusion Style) ---
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        relative ${widthClass} ${heightClass} bg-[#262626] rounded-lg shadow-xl border 
        ${selected
          ? 'border-davinci-accent ring-1 ring-davinci-accent shadow-[0_0_15px_rgba(94,154,255,0.4)] scale-[1.02] z-10'
          : 'border-black hover:border-gray-600'}
        ${isDragOver ? 'ring-2 ring-davinci-accent border-davinci-accent' : ''}
        flex flex-col transition-all duration-300 ease-out
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-4 !h-4 !bg-[#ffe65e] !border-0 !rounded-none hover:scale-125 transition-transform"
        style={{
          clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
          left: '-10px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          filter: 'drop-shadow(0 0 3px rgba(255, 230, 94, 0.6))'
        }}
      />

      <div className="w-full h-full rounded-lg overflow-hidden flex flex-col">
        {/* Node Header */}
        <div className={`px-3 py-1 border-b border-[#3d3d3d] flex justify-between items-center transition-colors ${selected ? 'bg-davinci-accent/10' : 'bg-[#1a1a1a]'}`}>
          <span className={`text-xs font-bold truncate ${data.shotType ? 'w-[55%]' : 'w-[85%]'} ${selected ? 'text-davinci-accent' : 'text-gray-400'}`} title={data.label}>
            {data.label || 'Untitled Node'}
          </span>

          <div className="flex items-center gap-2">
            {/* Shot Type Icon + Label */}
            {data.shotType && (
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-[#121212]/50 rounded border border-[#3d3d3d]/50" title={`Shot Type: ${data.shotType}`}>
                {getShotTypeIcon(data.shotType)}
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight leading-none pt-[1px]">{data.shotType}</span>
              </div>
            )}

            <div
              className="w-2 h-2 rounded-full shadow-sm"
              style={{ backgroundColor: data.color || '#5e9aff' }}
            />
          </div>
        </div>

        {/* Preview Area (Dynamic Height) */}
        <div className={`w-full ${previewHeightClass} bg-[#121212] flex items-center justify-center overflow-hidden relative group transition-colors ${isDragOver ? 'bg-davinci-accent/20' : ''}`}>

          {data.image ? (
            <>
              {/* Image Render */}
              {(!data.mediaType || data.mediaType === 'image') && (
                <img src={data.image} alt="prev" className="w-full h-full object-cover" />
              )}

              {/* Video Render */}
              {data.mediaType === 'video' && (
                <video
                  src={data.image}
                  className="w-full h-full object-cover"
                  controls
                  controlsList="nodownload noremoteplayback"
                />
              )}

              {/* Audio Render */}
              {data.mediaType === 'audio' && (
                <div className="flex flex-col items-center justify-center gap-2 w-full px-4">
                  <svg className="w-10 h-10 text-davinci-accent animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  <audio src={data.image} controls className="w-full h-8" />
                </div>
              )}
            </>
          ) : (
            <div className={`text-[#3d3d3d] text-xs text-center p-2 select-none transition-colors ${isDragOver ? 'text-white' : ''}`}>
              {isDragOver ? 'Drop Media Here' : <>No Media<br />Drag & Drop</>}
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[10px] text-white font-mono">
            {data.duration}s
          </div>
        </div>

        {/* Details / Script Snippet */}
        <div className="p-2 bg-[#262626] flex-1">
          <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
            {data.description || "No script notes..."}
          </p>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3.5 !h-3.5 !bg-white !border-0 !rounded-none hover:scale-125 transition-transform"
        style={{
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))'
        }}
      />
    </div>
  );
};

export default memo(FusionNode);
