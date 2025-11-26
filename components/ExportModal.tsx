
import React from 'react';
import { Node } from '@xyflow/react';
import { StoryNodeData, AspectRatio } from '../types';
import { generateXML, generateEDL, generateJSON, downloadFile } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node<StoryNodeData>[];
  projectName: string;
  aspectRatio: AspectRatio;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, nodes, projectName, aspectRatio }) => {
  if (!isOpen) return null;

  const handleExportXML = () => {
    const xml = generateXML(nodes, projectName, aspectRatio);
    downloadFile(xml, `${projectName}.xml`, 'text/xml');
    onClose();
  };

  const handleExportEDLMarkers = () => {
    const edl = generateEDL(nodes, projectName);
    downloadFile(edl, `${projectName}_Markers.csv`, 'text/csv');
    onClose();
  };

  const handleExportJSON = () => {
    const json = generateJSON(nodes, projectName, aspectRatio);
    downloadFile(json, `${projectName}.json`, 'application/json');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#1e1e1e] border border-[#3d3d3d] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3d3d3d] flex justify-between items-center bg-[#262626]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Export Project</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select a format for your production workflow.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#3d3d3d] rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* XML Option */}
          <button 
            onClick={handleExportXML}
            className="group flex flex-col gap-3 p-4 rounded-lg border border-[#3d3d3d] bg-[#1a1a1a] hover:bg-[#262626] hover:border-davinci-accent/50 hover:shadow-[0_0_20px_rgba(94,154,255,0.1)] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 group-hover:text-davinci-accent">FCP7 XML</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Standard timeline format compatible with Premiere Pro, DaVinci Resolve, and Final Cut.
              </p>
            </div>
          </button>

          {/* EDL Option */}
          <button 
            onClick={handleExportEDLMarkers}
            className="group flex flex-col gap-3 p-4 rounded-lg border border-[#3d3d3d] bg-[#1a1a1a] hover:bg-[#262626] hover:border-davinci-accent/50 hover:shadow-[0_0_20px_rgba(94,154,255,0.1)] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 group-hover:text-davinci-accent">Resolve Markers</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                CSV format for importing timeline markers directly into DaVinci Resolve's edit page.
              </p>
            </div>
          </button>

          {/* JSON Option */}
          <button 
            onClick={handleExportJSON}
            className="group flex flex-col gap-3 p-4 rounded-lg border border-[#3d3d3d] bg-[#1a1a1a] hover:bg-[#262626] hover:border-davinci-accent/50 hover:shadow-[0_0_20px_rgba(94,154,255,0.1)] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 group-hover:text-davinci-accent">Project JSON</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Raw data export. Useful for scripting, After Effects automation, or backups.
              </p>
            </div>
          </button>

        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-[#151515] border-t border-[#3d3d3d] flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-davinci-accent animate-pulse"></div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Ready to Export</span>
            </div>
            <span className="text-[10px] text-gray-600 font-mono">{nodes.length} Nodes • {aspectRatio}</span>
        </div>
      </div>
    </div>
  );
};
