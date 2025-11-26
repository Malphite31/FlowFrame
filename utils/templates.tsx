import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { ProjectTemplate, StoryNodeData, NODE_COLORS } from '../types';

// Helper to create a basic node
const createNode = (
    id: string,
    label: string,
    x: number,
    y: number,
    color: string,
    variant: StoryNodeData['variant'] = 'scene',
    description: string = ''
): Node<StoryNodeData> => ({
    id,
    type: 'fusionNode',
    position: { x, y },
    data: {
        label,
        description,
        duration: 3,
        image: null,
        fileName: null,
        color,
        variant,
        mediaType: 'image'
    }
});

// Helper to create a basic edge
const createEdge = (source: string, target: string): Edge => ({
    id: `e${source}-${target}`,
    source,
    target,
    type: 'default',
    style: { stroke: '#555', strokeWidth: 2 },
    animated: false
});

export const TEMPLATES: ProjectTemplate[] = [
    {
        id: 'moodboard-brand',
        name: 'Brand Identity Moodboard',
        description: 'Define visual direction with color palettes, typography, and inspiration for brand identity projects.',
        previewColor: 'from-purple-500 to-pink-500',
        data: {
            viewMode: 'moodboard',
            aspectRatio: '16:9',
            projectNotes: '# Brand Identity Goals\n- Define core values\n- Establish visual language\n- Select typography\n- Create color palette',
            nodes: [
                createNode('1', 'Core Values', 100, 100, NODE_COLORS.Purple, 'idea', 'Keywords: Modern, Trustworthy, Bold'),
                createNode('2', 'Color Palette', 400, 100, NODE_COLORS.Blue, 'mood', 'Primary and secondary colors'),
                createNode('3', 'Typography', 700, 100, NODE_COLORS.Gray, 'mood', 'Header and Body fonts'),
                createNode('4', 'Logo Inspiration', 100, 400, NODE_COLORS.Orange, 'image', 'Competitor logos and style refs'),
                createNode('5', 'Photography Style', 400, 400, NODE_COLORS.Green, 'image', 'Lighting and composition references'),
                createNode('6', 'UI/UX Elements', 700, 400, NODE_COLORS.Teal, 'image', 'Button styles, icons, and layout ideas'),
            ],
            edges: []
        }
    },
    {
        id: 'moodboard-logo',
        name: 'Logo Design Exploration',
        description: 'A workspace for logo concepts, symbolism, sketches, and mockups.',
        previewColor: 'from-blue-400 to-cyan-300',
        data: {
            viewMode: 'moodboard',
            aspectRatio: '1:1',
            projectNotes: '# Logo Design Brief\n- Company Name:\n- Industry:\n- Key Attributes:',
            nodes: [
                createNode('1', 'Brief & Keywords', 100, 100, NODE_COLORS.Blue, 'idea', 'Abstract, Minimal, Tech'),
                createNode('2', 'Symbolism', 400, 100, NODE_COLORS.Purple, 'idea', 'Shapes and metaphors'),
                createNode('3', 'Rough Sketches', 100, 350, NODE_COLORS.Gray, 'image', 'Upload hand-drawn sketches here'),
                createNode('4', 'Vector Drafts', 400, 350, NODE_COLORS.Orange, 'image', 'Illustrator screenshots'),
                createNode('5', 'Mockups', 700, 200, NODE_COLORS.Green, 'image', 'Business cards, signage, merchandise'),
            ],
            edges: [
                createEdge('1', '2'),
                createEdge('3', '4'),
                createEdge('4', '5')
            ]
        }
    },
    {
        id: 'mindmap-general',
        name: 'Brainstorming Mind Map',
        description: 'Organize thoughts and ideas hierarchically starting from a central concept.',
        previewColor: 'from-emerald-400 to-teal-500',
        data: {
            viewMode: 'mindmap',
            aspectRatio: '16:9',
            projectNotes: '',
            nodes: [
                createNode('root', 'Central Idea', 400, 300, NODE_COLORS.Red, 'idea', 'Main topic'),
                createNode('b1', 'Branch 1', 150, 150, NODE_COLORS.Blue, 'idea', 'Subtopic A'),
                createNode('b2', 'Branch 2', 650, 150, NODE_COLORS.Green, 'idea', 'Subtopic B'),
                createNode('b3', 'Branch 3', 150, 450, NODE_COLORS.Orange, 'idea', 'Subtopic C'),
                createNode('b4', 'Branch 4', 650, 450, NODE_COLORS.Purple, 'idea', 'Subtopic D'),
            ],
            edges: [
                createEdge('root', 'b1'),
                createEdge('root', 'b2'),
                createEdge('root', 'b3'),
                createEdge('root', 'b4'),
            ]
        }
    },
    {
        id: 'storyboard-logo-anim',
        name: 'Logo Animation Storyboard',
        description: 'Plan out the motion of a logo reveal, from initial state to final lockup.',
        previewColor: 'from-orange-400 to-red-500',
        data: {
            viewMode: 'storyboard',
            aspectRatio: '16:9',
            projectNotes: 'Animation Duration: 3-5 seconds\nFrame rate: 60fps',
            nodes: [
                createNode('1', 'Empty State', 100, 200, NODE_COLORS.Gray, 'scene', 'Clean background'),
                createNode('2', 'Entrance/Reveal', 400, 200, NODE_COLORS.Blue, 'scene', 'Elements fly in or fade in'),
                createNode('3', 'Main Action', 700, 200, NODE_COLORS.Orange, 'scene', 'The core movement/transformation'),
                createNode('4', 'Settle/Lockup', 1000, 200, NODE_COLORS.Green, 'scene', 'Final logo placement'),
                createNode('5', 'Loop/Outro', 1300, 200, NODE_COLORS.Purple, 'scene', 'Subtle idle animation or fade out'),
            ],
            edges: [
                createEdge('1', '2'),
                createEdge('2', '3'),
                createEdge('3', '4'),
                createEdge('4', '5'),
            ]
        }
    },
    {
        id: 'storyboard-viral',
        name: 'Viral Short / TikTok Edit',
        description: 'Structure a high-retention short video: Hook, Build-up, Payoff, and CTA.',
        previewColor: 'from-pink-500 to-rose-500',
        data: {
            viewMode: 'storyboard',
            aspectRatio: '9:16',
            projectNotes: 'Target Platform: TikTok / Reels / Shorts\nTotal Duration: < 60s',
            nodes: [
                createNode('1', 'The Hook (0-3s)', 100, 200, NODE_COLORS.Red, 'scene', 'Grab attention immediately. Visual or Audio shock.'),
                createNode('2', 'The Setup', 400, 200, NODE_COLORS.Blue, 'scene', 'Introduce the context or problem.'),
                createNode('3', 'The Build-up', 700, 200, NODE_COLORS.Orange, 'scene', 'Rising tension or fast-paced editing.'),
                createNode('4', 'The Climax/Payoff', 1000, 200, NODE_COLORS.Green, 'scene', 'The main event or reveal.'),
                createNode('5', 'CTA / Loop', 1300, 200, NODE_COLORS.Purple, 'scene', 'Call to action or seamless loop point.'),
            ],
            edges: [
                createEdge('1', '2'),
                createEdge('2', '3'),
                createEdge('3', '4'),
                createEdge('4', '5'),
            ]
        }
    },
    {
        id: 'storyboard-apple-ui',
        name: 'Apple-style UI Animation',
        description: 'Choreograph smooth, physics-based UI interactions and transitions.',
        previewColor: 'from-gray-200 to-gray-400',
        data: {
            viewMode: 'storyboard',
            aspectRatio: '16:9', // or device specific
            projectNotes: 'Focus on: Fluidity, Spring Physics, Continuity',
            nodes: [
                createNode('1', 'Initial State', 100, 200, NODE_COLORS.Gray, 'scene', 'UI before interaction'),
                createNode('2', 'Touch Down', 400, 200, NODE_COLORS.Blue, 'scene', 'Scale down or highlight state'),
                createNode('3', 'Gesture/Drag', 700, 200, NODE_COLORS.Orange, 'scene', 'Follow finger, rubber-banding effect'),
                createNode('4', 'Transition', 1000, 200, NODE_COLORS.Green, 'scene', 'Morphing to new state'),
                createNode('5', 'Final State', 1300, 200, NODE_COLORS.Purple, 'scene', 'New UI layout settled'),
            ],
            edges: [
                createEdge('1', '2'),
                createEdge('2', '3'),
                createEdge('3', '4'),
                createEdge('4', '5'),
            ]
        }
    }
];
