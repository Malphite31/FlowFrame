import React from 'react';
import { generateXML, generateEDL, generateJSON, downloadFile } from '../utils/exportUtils';
import { Node } from '@xyflow/react';
import { StoryNodeData, AspectRatio } from '../types';

interface TopBarProps {
  nodes: Node<StoryNodeData>[];
  onAddNode: () => void;
  projectName: string;
  setProjectName: (name: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  onPlay: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ nodes, onAddNode, projectName, setProjectName, aspectRatio, setAspectRatio, onPlay }) => {
  
  const handleExportXML = () => {
    const xml = generateXML(nodes, projectName, aspectRatio);
    downloadFile(xml, `${projectName}.xml`, 'text/xml');
  };

  const handleExportEDLMarkers = () => {
    const edl = generateEDL(nodes, projectName);
    downloadFile(edl, `${projectName}_Markers.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = generateJSON(nodes, projectName, aspectRatio);
    downloadFile(json, `${projectName}.json`, 'application/json');
  };

  return (
    <div className="h-14 bg-[#262626] border-b border-black flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-4">
        <div className="text-davinci-accent font-bold text-lg tracking-wider flex items-center gap-2 select-none">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 19h20L12 2zm0 3.8l6.5 11.2H5.5L12 5.8z"/>
          </svg>
          FLOWFRAME
        </div>
        <div className="h-6 w-[1px] bg-[#3d3d3d] mx-2"></div>
        <input 
          type="text" 
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-[#121212] border border-[#3d3d3d] text-white text-sm px-2 py-1 rounded focus:border-davinci-accent outline-none w-48"
          placeholder="Project Name"
        />
        
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-gray-500 uppercase font-bold select-none">Ratio</span>
          <select 
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-[#121212] border border-[#3d3d3d] text-white text-xs px-2 py-1.5 rounded focus:border-davinci-accent outline-none cursor-pointer"
          >
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Portrait</option>
            <option value="1:1">1:1 Square</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Play Button */}
        <button 
          onClick={onPlay}
          className="flex items-center gap-2 bg-davinci-accent hover:bg-blue-400 text-[#181818] px-4 py-1.5 rounded text-xs font-bold transition-all hover:scale-105 shadow-[0_0_10px_rgba(94,154,255,0.3)] mr-2"
          title="Play Animatic"
        >
           <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
           PLAY
        </button>

         {/* Add Node Button */}
         <button 
          onClick={onAddNode}
          className="flex items-center gap-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white px-4 py-1.5 rounded text-xs transition-colors border border-transparent hover:border-gray-500 shadow-sm"
          title="Add New Node"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Node</span>
        </button>

        <div className="h-6 w-[1px] bg-[#3d3d3d] mx-2"></div>

        {/* Export Group */}
        <div className="flex bg-[#121212] rounded p-0.5 gap-0.5 border border-[#3d3d3d]">
          <button 
            onClick={handleExportXML}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors"
            title="Export for Premiere & Resolve"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            XML
          </button>
          <div className="w-[1px] bg-[#3d3d3d] my-1"></div>
          <button 
            onClick={handleExportEDLMarkers}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors"
            title="Export Markers for DaVinci"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Markers
          </button>
          <div className="w-[1px] bg-[#3d3d3d] my-1"></div>
          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors"
            title="Export for After Effects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;