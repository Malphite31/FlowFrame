
import React, { useCallback, useState } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData, NODE_COLORS, AspectRatio, ShotType } from '../types';

interface InspectorProps {
  selectedNode: Node<StoryNodeData> | null;
  onUpdateNode: (id: string, data: Partial<StoryNodeData>) => void;
  aspectRatio: AspectRatio;
}

const SHOT_TYPES: { value: ShotType; label: string }[] = [
  { value: 'est', label: 'Establish (EST)' },
  { value: 'wide', label: 'Wide Shot (WS)' },
  { value: 'med', label: 'Medium (MED)' },
  { value: 'MCU', label: 'Med. Close (MCU)' },
  { value: 'CU', label: 'Close Up (CU)' },
  { value: 'ECU', label: 'Ext. Close (ECU)' },
  { value: 'pov', label: 'POV' },
  { value: 'drone', label: 'Drone / Aerial' },
];

const Inspector: React.FC<InspectorProps> = ({ selectedNode, onUpdateNode, aspectRatio }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Safe access to ID for hooks (hooks must be unconditional)
  const nodeId = selectedNode?.id;

  // Auto-calculate duration based on word count (approx 2.5 words/sec)
  const handleScriptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!nodeId) return;
    const text = e.target.value;
    const wordCount = text.trim().split(/\s+/).length;
    // Base duration 2s + 0.4s per word
    const newDuration = text.length === 0 ? 5 : Math.ceil(2 + (wordCount * 0.4));
    
    onUpdateNode(nodeId, {
      description: text,
      duration: newDuration
    });
  }, [nodeId, onUpdateNode]);

  const processFile = useCallback((file: File) => {
    if (!nodeId) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateNode(nodeId, {
        image: reader.result as string,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  }, [nodeId, onUpdateNode]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, [processFile]);

  // Determine aspect ratio class for preview
  const getAspectRatioClass = () => {
    if (aspectRatio === '9:16') return 'aspect-[9/16]';
    if (aspectRatio === '1:1') return 'aspect-square';
    return 'aspect-video'; // 16:9
  };

  // --- EARLY RETURN FOR EMPTY STATE ---
  // Must be placed AFTER all hooks are defined
  if (!selectedNode) {
    return (
      <div className="w-80 bg-[#262626] border-l border-black p-4 flex flex-col gap-4">
        <div className="text-gray-500 text-sm text-center mt-10">
          Select a node to inspect
        </div>
      </div>
    );
  }

  const { data, id } = selectedNode;
  const isGroup = data.variant === 'group';
  const isLink = data.variant === 'link';

  return (
    <div className="w-80 bg-[#262626] border-l border-black flex flex-col h-full">
      {/* Selected Node Header Info */}
      <div className="p-3 border-b border-[#3d3d3d] bg-[#1a1a1a] flex flex-col gap-1">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-gray-200">Inspector</h3>
           <div className="flex items-center gap-2">
             <span className="text-[9px] text-gray-500 font-mono">{id.slice(0,4)}...</span>
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
           </div>
        </div>
        <div className="text-xs text-davinci-accent font-medium truncate">
           {data.label || 'Untitled Node'}
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        
        {/* Node Type Selector (Hide for Group) */}
        {!isGroup && !isLink && (
          <div className="flex bg-[#121212] p-1 rounded border border-[#3d3d3d]">
            <button 
              onClick={() => onUpdateNode(id, { variant: 'scene' })}
              className={`flex-1 py-1 text-xs rounded transition-colors ${!data.variant || data.variant === 'scene' ? 'bg-[#3d3d3d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Scene
            </button>
            <button 
              onClick={() => onUpdateNode(id, { variant: 'idea' })}
              className={`flex-1 py-1 text-xs rounded transition-colors ${data.variant === 'idea' ? 'bg-[#3d3d3d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Mind Map
            </button>
             <button 
              onClick={() => onUpdateNode(id, { variant: 'mood' })}
              className={`flex-1 py-1 text-xs rounded transition-colors ${data.variant === 'mood' ? 'bg-[#3d3d3d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Mood
            </button>
          </div>
        )}

        {/* Label Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 font-bold uppercase">{isGroup ? 'Group Name' : 'Node Name'}</label>
          <input 
            type="text" 
            value={data.label}
            onChange={(e) => onUpdateNode(id, { label: e.target.value })}
            className="bg-[#121212] border border-[#3d3d3d] text-white p-2 rounded text-sm focus:border-davinci-accent outline-none"
          />
        </div>

        {/* LINK SPECIFIC FIELDS */}
        {isLink && (
            <div className="flex flex-col gap-4 border-b border-[#3d3d3d] pb-4">
                <div className="flex flex-col gap-2">
                   <label className="text-xs text-gray-400 font-bold uppercase">URL</label>
                   <input 
                      type="text" 
                      value={data.linkUrl || ''}
                      onChange={(e) => onUpdateNode(id, { linkUrl: e.target.value })}
                      className="bg-[#121212] border border-[#3d3d3d] text-davinci-accent p-2 rounded text-xs focus:border-davinci-accent outline-none font-mono"
                   />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs text-gray-400 font-bold uppercase">Preview Title</label>
                   <input 
                      type="text" 
                      value={data.linkTitle || ''}
                      onChange={(e) => onUpdateNode(id, { linkTitle: e.target.value })}
                      className="bg-[#121212] border border-[#3d3d3d] text-white p-2 rounded text-sm focus:border-davinci-accent outline-none"
                   />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs text-gray-400 font-bold uppercase">Description</label>
                   <textarea 
                      value={data.linkDescription || ''}
                      onChange={(e) => onUpdateNode(id, { linkDescription: e.target.value })}
                      rows={3}
                      className="bg-[#121212] border border-[#3d3d3d] text-gray-300 p-2 rounded text-sm focus:border-davinci-accent outline-none resize-none"
                   />
                </div>
            </div>
        )}

        {/* Color Picker */}
        {!isLink && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 font-bold uppercase">{isGroup ? 'Group Color' : 'Node Color'}</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(NODE_COLORS).map(([name, color]) => (
              <button
                key={name}
                onClick={() => onUpdateNode(id, { color: color })}
                className={`w-6 h-6 rounded-full border border-black transition-transform hover:scale-110 ${data.color === color ? 'ring-2 ring-white' : ''}`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>
        )}

        {/* Shot Type Selector (Only for Scenes) */}
        {(!data.variant || data.variant === 'scene') && !isGroup && (
           <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-bold uppercase">Shot Type</label>
            <select 
              value={data.shotType || ''}
              onChange={(e) => onUpdateNode(id, { shotType: e.target.value as ShotType })}
              className="bg-[#121212] border border-[#3d3d3d] text-white text-xs px-2 py-2 rounded focus:border-davinci-accent outline-none cursor-pointer"
            >
              <option value="">-- Select Shot --</option>
              {SHOT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Media (Only show for Scene/Mood type) */}
        {(!data.variant || data.variant === 'scene' || data.variant === 'mood') && !isGroup && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-bold uppercase">Media ({aspectRatio})</label>
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative group w-full flex justify-center bg-[#121212] border ${isDragOver ? 'border-davinci-accent bg-davinci-accent/10' : 'border-[#3d3d3d]'} rounded p-2 transition-colors`}
            >
              <div className={`w-full ${getAspectRatioClass()} bg-[#000] flex items-center justify-center overflow-hidden pointer-events-none`}>
                 {data.image ? (
                   <img src={data.image} alt="preview" className="w-full h-full object-contain" />
                 ) : (
                   <span className="text-xs text-gray-600">{isDragOver ? 'Drop Image' : 'No Image'}</span>
                 )}
              </div>
            </div>
             <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-2 text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#3d3d3d] file:text-white hover:file:bg-[#4d4d4d]"
              />
          </div>
        )}

        {/* Script & Duration (Hidden for Mood, Group, Link) */}
        {data.variant !== 'mood' && data.variant !== 'link' && !isGroup && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400 font-bold uppercase">
                {data.variant === 'idea' ? 'Idea Notes' : 'Script / Action'}
              </label>
              {(!data.variant || data.variant === 'scene') && (
                <span className="text-[10px] text-davinci-accent">Est. Duration: {data.duration}s</span>
              )}
            </div>
            <textarea 
              value={data.description}
              onChange={handleScriptChange}
              rows={6}
              className="bg-[#121212] border border-[#3d3d3d] text-gray-300 p-2 rounded text-sm focus:border-davinci-accent outline-none resize-none"
              placeholder={data.variant === 'idea' ? 'Brainstorm your concept here...' : 'Enter dialogue or action here...'}
            />
          </div>
        )}

        {/* Manual Duration (Only for Scene) */}
        {(!data.variant || data.variant === 'scene') && !isGroup && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-bold uppercase">Manual Duration (sec)</label>
            <input 
              type="number" 
              value={data.duration}
              onChange={(e) => onUpdateNode(id, { duration: parseInt(e.target.value) || 1 })}
              className="bg-[#121212] border border-[#3d3d3d] text-white p-2 rounded text-sm focus:border-davinci-accent outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
