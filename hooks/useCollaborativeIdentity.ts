import { useState, useCallback } from 'react';
import { generateUUID } from '../utils/exportUtils';
import { NODE_COLORS } from '../types';

// Random name generator
const ADJECTIVES = ['Swift', 'Bright', 'Cosmic', 'Neon', 'Flow', 'Zen', 'Hyper', 'Sonic'];
const NOUNS = ['Designer', 'Coder', 'Artist', 'Mind', 'Spark', 'Wave', 'Pulse', 'Star'];
const getRandomName = () => `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;

// Random color from our palette
const COLORS = Object.values(NODE_COLORS);
const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export interface UserIdentity {
    id: string;
    name: string;
    color: string;
}

export const useCollaborativeIdentity = () => {
    const [me, setMe] = useState<UserIdentity>(() => {
        // Try to load from local storage
        const saved = localStorage.getItem('flowframe_identity');
        if (saved) {
            return JSON.parse(saved);
        }
        const newIdentity = {
            id: generateUUID(),
            name: getRandomName(),
            color: getRandomColor()
        };
        localStorage.setItem('flowframe_identity', JSON.stringify(newIdentity));
        return newIdentity;
    });

    const updateName = useCallback((newName: string) => {
        setMe(prev => {
            const updated = { ...prev, name: newName };
            localStorage.setItem('flowframe_identity', JSON.stringify(updated));
            return updated;
        });
    }, []);

    return { me, updateName };
};
