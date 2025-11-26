
import React from 'react';
import { Node, Edge } from '@xyflow/react';

export type ViewMode = 'storyboard' | 'mindmap' | 'moodboard' | 'traditional';

export interface StoryNodeData {
  label: string;
  description: string;
  duration: number; // in seconds
  image: string | null;
  fileName: string | null;
  color: string; // Hex color for markers
  variant?: 'scene' | 'idea' | 'mood' | 'group' | 'link' | 'image';
  shotType?: ShotType;
  mediaType?: MediaType; // New field for video/audio support

  // Mind Map specific options
  mindMapShape?: 'rounded' | 'circle' | 'capsule' | 'square';
  borderStyle?: 'solid' | 'dashed' | 'dotted';

  // Link specific data
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkDomain?: string;
  linkImage?: string;
  [key: string]: unknown;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  icon?: React.ReactNode;
  data: {
    nodes: Node<StoryNodeData>[];
    edges: Edge[];
    projectNotes: string;
    viewMode: ViewMode;
    aspectRatio?: AspectRatio;
  }
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type ShotType = 'WS' | 'wide' | 'med' | 'MCU' | 'CU' | 'ECU' | 'pov' | 'drone' | 'est';

export type MediaType = 'image' | 'video' | 'audio' | 'link' | 'embed';

export interface NodePreset {
  id: string;
  name: string;
  data: Partial<StoryNodeData>;
}

export interface Asset {
  id: string;
  type: MediaType;
  url: string;
  name: string;
  tags: string[];
  dateAdded: number;
  meta?: {
    title?: string;
    description?: string;
    image?: string;
    originalUrl?: string;
    provider?: string;
  };
}

export interface Marker {
  name: string;
  startTime: number;
  duration: number;
  color: string;
  notes: string;
}

// Map node colors to Resolve marker colors
export enum MarkerColor {
  Blue = 'Blue',
  Cyan = 'Cyan',
  Green = 'Green',
  Yellow = 'Yellow',
  Red = 'Red',
  Pink = 'Pink',
  Purple = 'Purple',
  Fuchsia = 'Fuchsia',
  Rose = 'Rose',
  Lavender = 'Lavender',
  Mint = 'Mint',
  Lemon = 'Lemon',
  Sand = 'Sand',
  Cocoa = 'Cocoa',
  Cream = 'Cream'
}

export const NODE_COLORS = {
  Blue: '#5e9aff',
  Red: '#ff5e5e',
  Green: '#5eff8b',
  Yellow: '#ffe65e',
  Purple: '#bd5eff',
  Orange: '#ff915e',
  Teal: '#5efff5',
  Gray: '#808080' // Added for Mood boards
};
