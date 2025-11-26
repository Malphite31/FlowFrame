
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData, NODE_COLORS, Asset, MediaType } from '../types';
import { 
  hexToHSL, 
  hslToHex, 
  generateTints, 
  generateShades, 
  generateTones, 
  generateHarmonies 
} from '../utils/colorUtils';

interface LibraryPanelProps {
  nodes: Node<StoryNodeData>[];
  projectNotes: string;
  setProjectNotes: (notes: string) => void;
  onApplyColor: (color: string) => void;
  assets: Asset[];
  onAddAssets: (files: FileList) => void;
  onUpdateAsset: (id: string, updates: Partial<Asset>) => void;
  onDeleteAsset: (id: string) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ 
  nodes, projectNotes, setProjectNotes, onApplyColor, assets, onAddAssets, onUpdateAsset, onDeleteAsset
}) => {
  const [activeTab, setActiveTab] = useState<'assets' | 'notes' | 'colors'>('assets');
  
  // -- Asset Manager State --
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // -- Color Studio State --
  const [colorState, setColorState] = useState({ h: 237, s: 100, l: 50 });
  const [hexInput, setHexInput] = useState('#5e9aff');
  const [savedColors, setSavedColors] = useState<string[]>(Object.values(NODE_COLORS));
  
  const slPickerRef = useRef<HTMLDivElement>(null);
  const huePickerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSL, setIsDraggingSL] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // Sync Hex input when internal color state changes
  useEffect(() => {
    const newHex = hslToHex(colorState.h, colorState.s, colorState.l);
    setHexInput(newHex);
  }, [colorState]);

  // Derived Harmonies
  const harmonies = useMemo(() => {
    return generateHarmonies(colorState.h, colorState.s, colorState.l);
  }, [colorState]);

  const tints = useMemo(() => generateTints(colorState.h, colorState.s, colorState.l), [colorState]);
  const shades = useMemo(() => generateShades(colorState.h, colorState.s, colorState.l), [colorState]);
  const tones = useMemo(() => generateTones(colorState.h, colorState.s, colorState.l), [colorState]);

  // Handlers for Color Studio
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setColorState(hexToHSL(val));
    }
  };

  // --- SL Picker Logic ---
  const updateSL = (clientX: number, clientY: number) => {
    if (!slPickerRef.current) return;
    const rect = slPickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    
    // X axis: Saturation (0 -> 100)
    // Y axis: Lightness Inverse (100 -> 0)
    setColorState(prev => ({ 
        ...prev, 
        s: Math.round(x * 100), 
        l: Math.round((1 - y) * 100) 
    }));
  };

  const handleSLMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSL(true);
    updateSL(e.clientX, e.clientY);
  };

  // --- Hue Picker Logic (Custom Vertical Slider) ---
  const updateHue = (clientX: number, clientY: number) => {
    if (!huePickerRef.current) return;
    const rect = huePickerRef.current.getBoundingClientRect();
    // Y axis: Hue (0 at top -> 360 at bottom)
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    
    setColorState(prev => ({ 
      ...prev, 
      h: Math.round(y * 360) 
    }));
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    setIsDraggingHue(true);
    updateHue(e.clientX, e.clientY);
  };

  // Global Mouse Events for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSL) updateSL(e.clientX, e.clientY);
      if (isDraggingHue) updateHue(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      setIsDraggingSL(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSL || isDraggingHue) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSL, isDraggingHue]);


  // Filter and Sort Assets
  const filteredAssets = useMemo(() => {
    let result = assets.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || a.type === filterType;
      return matchesSearch && matchesType;
    });

    return result.sort((a, b) => {
      if (sortBy === 'date') return b.dateAdded - a.dateAdded; // Newest first
      return a.name.localeCompare(b.name);
    });
  }, [assets, searchTerm, filterType, sortBy]);

  const selectedAsset = useMemo(() => assets.find(a => a.id === selectedAssetId), [assets, selectedAssetId]);

  // Asset Handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddAssets(e.dataTransfer.files);
    }
  }, [onAddAssets]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0){
          onAddAssets(e.target.files);
      }
  };

  const handleAssetDragStart = (event: React.DragEvent, asset: Asset) => {
    event.dataTransfer.setData('application/reactflow/type', 'asset');
    event.dataTransfer.setData('application/reactflow/id', asset.id);
    event.dataTransfer.setData('application/reactflow/mediaType', asset.type);
    event.dataTransfer.setData('application/reactflow/source', asset.url);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && selectedAssetId) {
       const newTag = tagInput.trim();
       const currentTags = selectedAsset?.tags || [];
       if (!currentTags.includes(newTag)) {
           onUpdateAsset(selectedAssetId, { tags: [...currentTags, newTag] });
       }
       setTagInput('');
    }
  };

  const removeTag = (assetId: string, tagToRemove: string) => {
     const asset = assets.find(a => a.id === assetId);
     if (asset) {
       onUpdateAsset(assetId, { tags: asset.tags.filter(t => t !== tagToRemove) });
     }
  };

  const handleColorClick = (color: string) => {
      onApplyColor(color);
      setColorState(hexToHSL(color));
  };

  const saveCurrentColor = () => {
     if(!savedColors.includes(hexInput)) {
         setSavedColors([...savedColors, hexInput]);
     }
  };

  // Helper for rendering harmony swatches
  const renderSwatches = (colors: string[], label: string) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{label}</span>
      <div className="flex gap-1">
        {colors.map(c => (
           <div 
             key={c} 
             onClick={() => handleColorClick(c)} 
             className="h-6 flex-1 rounded-sm cursor-pointer border border-black/20 hover:scale-105 hover:z-10 transition-transform relative group" 
             style={{ background: c }} 
           >
             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/20 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
             </div>
           </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-80 bg-[#262626] border-r border-black flex flex-col h-full flex-shrink-0 z-20">
       {/* Tab Headers */}
       <div className="flex border-b border-[#3d3d3d] bg-[#1a1a1a]">
          {['assets', 'notes', 'colors'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all 
                    ${activeTab === tab 
                        ? 'bg-[#262626] text-davinci-accent border-t-2 border-t-davinci-accent' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]'}`}
              >
                  {tab}
              </button>
          ))}
       </div>
       
       {/* Tab Content */}
       <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
          
          {/* ASSETS TAB */}
          {activeTab === 'assets' && (
             <div className="flex flex-col h-full gap-4">
                {/* Upload Zone */}
                <label 
                   className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-all group cursor-pointer
                     ${dragActive ? 'border-davinci-accent bg-davinci-accent/10' : 'border-[#3d3d3d] hover:border-davinci-accent hover:bg-[#333]'}
                   `}
                   onDragEnter={handleDrag}
                   onDragLeave={handleDrag}
                   onDragOver={handleDrag}
                   onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                        <svg className="w-6 h-6 text-gray-500 group-hover:text-davinci-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                        <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-white transition-colors">Upload Files</span>
                        <span className="text-[9px] text-gray-600">Img, Vid, Audio</span>
                    </div>
                    <input type="file" className="hidden" multiple accept="image/*,video/*,audio/*" onChange={handleFileUpload} />
                </label>

                {/* Filters */}
                <div className="flex flex-col gap-2 bg-[#1a1a1a] p-2 rounded border border-[#3d3d3d]">
                   <input 
                      type="text" 
                      placeholder="Search assets or tags..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#121212] border border-[#3d3d3d] rounded px-2 py-1 text-xs text-gray-300 focus:border-davinci-accent outline-none"
                   />
                   <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                          {(['all', 'image', 'video', 'audio'] as const).map(type => (
                             <button 
                               key={type}
                               onClick={() => setFilterType(type)}
                               className={`p-1 rounded text-xs ${filterType === type ? 'bg-[#3d3d3d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                               title={`Filter ${type}`}
                             >
                                {type === 'all' && 'All'}
                                {type === 'image' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                {type === 'video' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                                {type === 'audio' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>}
                             </button>
                          ))}
                      </div>
                      <select 
                         value={sortBy} 
                         onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                         className="bg-[#121212] text-xs text-gray-400 border border-[#3d3d3d] rounded px-1 py-0.5 outline-none"
                      >
                         <option value="date">Newest</option>
                         <option value="name">A-Z</option>
                      </select>
                   </div>
                </div>

                {/* Asset Grid */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {filteredAssets.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 pb-20">
                          {filteredAssets.map((asset) => (
                              <div 
                                  key={asset.id} 
                                  className={`
                                    relative group rounded overflow-hidden border cursor-pointer bg-[#121212] flex flex-col
                                    ${selectedAssetId === asset.id ? 'border-davinci-accent ring-1 ring-davinci-accent' : 'border-[#3d3d3d] hover:border-gray-500'}
                                  `}
                                  onClick={() => setSelectedAssetId(asset.id)}
                                  draggable
                                  onDragStart={(e) => handleAssetDragStart(e, asset)}
                              >
                                  {/* Thumbnail */}
                                  <div className="aspect-square w-full bg-[#000] flex items-center justify-center relative overflow-hidden">
                                      {asset.type === 'image' && (
                                        <img src={asset.url} className="w-full h-full object-cover" loading="lazy" />
                                      )}
                                      {asset.type === 'video' && (
                                        <>
                                            <video src={asset.url} className="w-full h-full object-cover pointer-events-none" muted />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <svg className="w-6 h-6 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                            </div>
                                        </>
                                      )}
                                      {asset.type === 'audio' && (
                                         <div className="flex flex-col items-center gap-1 p-2 text-center">
                                             <svg className="w-8 h-8 text-davinci-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                         </div>
                                      )}
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                          <span className="text-[9px] text-white font-bold truncate w-full">{asset.name}</span>
                                      </div>
                                  </div>
                                  
                                  {asset.tags.length > 0 && (
                                      <div className="h-1 w-full flex">
                                          {asset.tags.slice(0,3).map((_, i) => (
                                              <div key={i} className="flex-1 bg-davinci-accent opacity-50 odd:opacity-30"></div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
                          <span className="text-xs">No assets found</span>
                      </div>
                  )}
                </div>

                {selectedAsset && (
                    <div className="mt-auto bg-[#1a1a1a] p-3 rounded border-t border-[#3d3d3d] flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="overflow-hidden">
                                <h4 className="text-xs font-bold text-white truncate w-48" title={selectedAsset.name}>{selectedAsset.name}</h4>
                                <span className="text-[9px] text-gray-500 uppercase">{selectedAsset.type}</span>
                            </div>
                            <button 
                                onClick={() => {
                                    onDeleteAsset(selectedAsset.id);
                                    setSelectedAssetId(null);
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Delete Asset"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap gap-1">
                                {selectedAsset.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-[#3d3d3d] rounded text-[9px] text-gray-300 flex items-center gap-1 group">
                                        {tag}
                                        <button onClick={() => removeTag(selectedAsset.id, tag)} className="hover:text-white hidden group-hover:inline">&times;</button>
                                    </span>
                                ))}
                            </div>
                            <input 
                                type="text"
                                placeholder="+ Add Tag (Enter)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="bg-[#121212] text-[10px] text-white p-1.5 rounded border border-[#3d3d3d] focus:border-davinci-accent outline-none w-full"
                            />
                        </div>
                    </div>
                )}
             </div>
          )}
          
          {/* NOTES TAB */}
          {activeTab === 'notes' && (
             <div className="h-full flex flex-col gap-2">
                 <div className="text-[10px] text-gray-500 uppercase font-bold flex justify-between">
                    <span>Project Script</span>
                    <span className="text-davinci-accent">{projectNotes.length} chars</span>
                 </div>
                 <textarea 
                    value={projectNotes}
                    onChange={(e) => setProjectNotes(e.target.value)}
                    className="flex-1 bg-[#121212] text-gray-300 p-3 text-sm rounded border border-[#3d3d3d] focus:border-davinci-accent outline-none resize-none leading-relaxed font-mono"
                    placeholder="SCENE 1 - INT. COFFEE SHOP - DAY&#10;&#10;Use this space to draft your shot list, screenplay, or creative notes..."
                 />
             </div>
          )}

          {/* COLORS TAB - COLOR STUDIO */}
          {activeTab === 'colors' && (
              <div className="flex flex-col gap-4 pb-10">
                  
                  {/* 1. Color Picker Area */}
                  <div className="flex flex-col gap-3 p-3 bg-[#1a1a1a] rounded border border-[#3d3d3d]">
                      
                      {/* Sat/Light Box & Hue Slider Row */}
                      <div className="flex gap-3 h-32">
                         {/* Saturation/Lightness Picker */}
                         <div 
                           className="flex-1 relative cursor-crosshair rounded overflow-hidden border border-[#333]"
                           ref={slPickerRef}
                           onMouseDown={handleSLMouseDown}
                           style={{
                               background: `hsl(${colorState.h}, 100%, 50%)`,
                           }}
                         >
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff 0%, transparent 100%)' }}></div>
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, #000 100%)' }}></div>
                            
                            {/* Marker */}
                            <div 
                                className="absolute w-3 h-3 border-2 border-white rounded-full -translate-x-1.5 -translate-y-1.5 shadow-sm pointer-events-none"
                                style={{ 
                                    left: `${colorState.s}%`, 
                                    top: `${100 - colorState.l}%`
                                }}
                            />
                         </div>

                         {/* Vertical Hue Slider (Custom) */}
                         <div 
                           className="w-6 relative rounded-full overflow-hidden border border-[#333] cursor-pointer"
                           ref={huePickerRef}
                           onMouseDown={handleHueMouseDown}
                         >
                             {/* Gradient matches standard HSL wheel: Red at 0deg (Top) -> Red at 360deg (Bottom) */}
                             <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}></div>
                             {/* Indicator Line */}
                             <div 
                                className="absolute left-0 right-0 h-1 bg-white border border-black/20 shadow pointer-events-none -translate-y-0.5" 
                                style={{ top: `${(colorState.h / 360) * 100}%` }}
                             ></div>
                         </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex gap-2 items-center">
                          <div 
                             className="w-8 h-8 rounded border border-[#3d3d3d] shadow-inner" 
                             style={{ backgroundColor: hexInput }}
                          />
                          <div className="flex-1 relative">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">#</span>
                             <input 
                                type="text" 
                                value={hexInput.replace('#', '')}
                                onChange={e => handleHexChange({ target: { value: '#' + e.target.value } } as any)}
                                className="w-full bg-[#121212] border border-[#3d3d3d] rounded py-1 pl-4 pr-2 text-xs text-white font-mono uppercase focus:border-davinci-accent outline-none"
                             />
                          </div>
                          <div className="flex flex-col gap-0.5 text-[9px] text-gray-500 font-mono w-16 text-right">
                              <span>H: {colorState.h}°</span>
                              <span>S: {colorState.s}%</span>
                              <span>L: {colorState.l}%</span>
                          </div>
                      </div>
                  </div>

                  {/* 2. Generated Harmonies Grid */}
                  <div className="flex flex-col gap-4">
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                             {renderSwatches(tints, "Tints")}
                        </div>
                        <div className="col-span-1">
                             {renderSwatches(tones, "Tones")}
                        </div>
                        <div className="col-span-1">
                             {renderSwatches(shades, "Shades")}
                        </div>
                      </div>

                      {/* Harmony List */}
                      <div className="flex flex-col gap-3 bg-[#1a1a1a] p-3 rounded border border-[#3d3d3d]">
                          <div className="flex justify-between items-center pb-2 border-b border-[#3d3d3d]">
                             <span className="text-[10px] text-gray-400 font-bold uppercase">Color Harmonies</span>
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hexInput }}></div>
                          </div>
                          
                          {/* Grid Layout for Harmonies */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                              {renderSwatches(harmonies.complementary, "Complementary")}
                              {renderSwatches(harmonies.analogous, "Analogous")}
                              {renderSwatches(harmonies.splitComplementary, "Split Comp")}
                              {renderSwatches(harmonies.triadic, "Triadic")}
                              {renderSwatches(harmonies.tetradic, "Tetradic")}
                              {renderSwatches(harmonies.square, "Square")}
                          </div>
                      </div>
                  </div>
                  
                  {/* 3. Project Palette (Saved) */}
                  <div className="border-t border-[#3d3d3d] pt-4">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-[10px] text-gray-500 font-bold uppercase">Saved Palette</h3>
                          <button 
                             onClick={saveCurrentColor}
                             className="text-[10px] bg-[#333] hover:bg-[#444] px-2 py-0.5 rounded text-white transition-colors flex items-center gap-1"
                          >
                             <span>+ Save</span>
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hexInput }}></div>
                          </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {savedColors.map((color, idx) => (
                            <button
                                key={`${color}-${idx}`}
                                onClick={() => handleColorClick(color)}
                                className="aspect-square rounded border border-black transition-all hover:scale-110 relative group shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                            >
                                <div 
                                    onClick={(e) => { e.stopPropagation(); setSavedColors(savedColors.filter((_, i) => i !== idx)); }}
                                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 shadow-md text-[10px] leading-none"
                                >
                                    &times;
                                </div>
                            </button>
                        ))}
                      </div>
                  </div>
                  
                  <div className="p-2 bg-[#1a1a1a] rounded border border-[#3d3d3d] flex items-center gap-2">
                      <svg className="w-4 h-4 text-davinci-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-[9px] text-gray-500 leading-tight">
                          Select a node on the canvas to apply active color.
                      </p>
                  </div>
              </div>
          )}
       </div>
    </div>
  );
};
