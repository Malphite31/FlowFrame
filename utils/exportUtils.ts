import { StoryNodeData, AspectRatio } from '../types';
import { Node } from '@xyflow/react';
import { FPS, secondsToFrames, secondsToTimecode, framesToTimecode } from './timeUtils';

// Helper to sort nodes by X position (Timeline Order)
export const sortNodesByTimeline = (nodes: Node<StoryNodeData>[]): Node<StoryNodeData>[] => {
  return [...nodes].sort((a, b) => a.position.x - b.position.x);
};

// Polyfill for random UUID to ensure compatibility in all environments
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getResolution = (ratio: AspectRatio) => {
  switch (ratio) {
    case '9:16': return { w: 1080, h: 1920 };
    case '1:1': return { w: 1080, h: 1080 };
    case '16:9': default: return { w: 1920, h: 1080 };
  }
};

// Filter out mood/idea nodes for exports and playback
export const getExportableNodes = (nodes: Node<StoryNodeData>[]) => {
  // Only include nodes explicitly marked as 'scene' or undefined (legacy default)
  return nodes.filter(n => !n.data.variant || n.data.variant === 'scene');
};

// 1. GENERATE FCP7 XML (Compatible with Premiere & Resolve)
export const generateXML = (nodes: Node<StoryNodeData>[], projectName: string, aspectRatio: AspectRatio): string => {
  const exportNodes = getExportableNodes(nodes);
  const sortedNodes = sortNodesByTimeline(exportNodes);
  const { w, h } = getResolution(aspectRatio);
  
  let currentTime = 0;
  let trackItems = '';

  sortedNodes.forEach((node, index) => {
    const durationSec = node.data.duration || 5;
    const durationFrames = secondsToFrames(durationSec);
    const startFrames = secondsToFrames(currentTime);
    const endFrames = startFrames + durationFrames;
    
    // Resolve handles importing files better if we provide a dummy path that the user relinks
    const fileUrl = node.data.fileName ? `file://localhost/${node.data.fileName}` : '';
    const name = node.data.label || `Scene ${index + 1}`;
    
    trackItems += `
      <clipitem id="clipitem-${index + 1}">
        <name>${name}</name>
        <duration>${durationFrames}</duration>
        <rate>
          <ntsc>FALSE</ntsc>
          <timebase>${FPS}</timebase>
        </rate>
        <start>${startFrames}</start>
        <end>${endFrames}</end>
        <in>0</in>
        <out>${durationFrames}</out>
        <file id="file-${index + 1}">
          <name>${node.data.fileName || 'Placeholder.png'}</name>
          <pathurl>${fileUrl}</pathurl>
          <rate>
            <timebase>${FPS}</timebase>
          </rate>
          <duration>${durationFrames}</duration>
          <media>
            <video>
              <samplecharacteristics>
                <width>${w}</width>
                <height>${h}</height>
              </samplecharacteristics>
            </video>
          </media>
        </file>
        <labels>
          <label2>${node.data.description || ''}</label2>
        </labels>
      </clipitem>
    `;
    
    currentTime += durationSec;
  });

  const totalDurationFrames = secondsToFrames(currentTime);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <project>
    <name>${projectName}</name>
    <children>
      <sequence id="sequence-1">
        <name>${projectName}_Sequence</name>
        <duration>${totalDurationFrames}</duration>
        <rate>
          <ntsc>FALSE</ntsc>
          <timebase>${FPS}</timebase>
        </rate>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>${w}</width>
                <height>${h}</height>
                <pixelaspectratio>square</pixelaspectratio>
                <rate>
                  <timebase>${FPS}</timebase>
                </rate>
              </samplecharacteristics>
            </format>
            <track>
              ${trackItems}
            </track>
          </video>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;
};

// 2. GENERATE EDL MARKERS (CSV Style for Resolve Import)
export const generateEDL = (nodes: Node<StoryNodeData>[], projectName: string): string => {
  const exportNodes = getExportableNodes(nodes);
  const sortedNodes = sortNodesByTimeline(exportNodes);
  
  // DaVinci Resolve Marker CSV Format
  // Header: Source In,Source Out,Start TC,End TC,Color,Name,Notes
  let csvContent = "Source In,Source Out,Start TC,End TC,Color,Name,Notes\n";
  
  // Reset time
  let currentTime = 0; // Timeline starts at 0 or 01:00:00:00. Let's use relative 00:00:00:00
  
  sortedNodes.forEach((node) => {
    const durationSec = node.data.duration || 5;
    const startTC = secondsToTimecode(currentTime); // Timeline In
    const endTC = secondsToTimecode(currentTime + durationSec); // Timeline Out
    
    // Map hex color to Closest Resolve Marker Color Name
    let markerColor = "Blue";
    if (node.data.color === '#ff5e5e') markerColor = "Red";
    if (node.data.color === '#5eff8b') markerColor = "Green";
    if (node.data.color === '#ffe65e') markerColor = "Yellow";
    if (node.data.color === '#bd5eff') markerColor = "Purple";
    if (node.data.color === '#ff915e') markerColor = "Rose";
    if (node.data.color === '#5efff5') markerColor = "Cyan";

    const name = (node.data.label || "Scene").replace(/,/g, '');
    const notes = (node.data.description || "").replace(/,/g, ' ');

    // Resolve CSV line
    csvContent += `00:00:00:00,${secondsToTimecode(durationSec)},${startTC},${endTC},${markerColor},"${name}","${notes}"\n`;

    currentTime += durationSec;
  });

  return csvContent;
};

// 3. GENERATE JSON (For After Effects Scripts)
export const generateJSON = (nodes: Node<StoryNodeData>[], projectName: string, aspectRatio: AspectRatio): string => {
  const exportNodes = getExportableNodes(nodes);
  const sortedNodes = sortNodesByTimeline(exportNodes);
  const { w, h } = getResolution(aspectRatio);
  const data = {
    project: projectName,
    fps: FPS,
    resolution: { width: w, height: h, ratio: aspectRatio },
    totalDuration: sortedNodes.reduce((acc, node) => acc + (node.data.duration || 0), 0),
    scenes: sortedNodes.map((node, i) => ({
      index: i,
      id: node.id,
      type: node.data.variant || 'scene',
      name: node.data.label,
      description: node.data.description,
      durationSec: node.data.duration,
      durationFrames: secondsToFrames(node.data.duration),
      imageFileName: node.data.fileName,
      position: node.position
    }))
  };
  return JSON.stringify(data, null, 2);
};

export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
};