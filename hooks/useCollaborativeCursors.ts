import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { generateUUID } from '../utils/exportUtils';
import { NODE_COLORS } from '../types';

const SOCKET_URL = 'http://localhost:3002';

export interface UserCursor {
    id: string;
    x: number;
    y: number;
    name: string;
    color: string;
    lastUpdate: number;
    message?: string;
}

// Random name generator
const ADJECTIVES = ['Swift', 'Bright', 'Cosmic', 'Neon', 'Flow', 'Zen', 'Hyper', 'Sonic'];
const NOUNS = ['Designer', 'Coder', 'Artist', 'Mind', 'Spark', 'Wave', 'Pulse', 'Star'];
const getRandomName = () => `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;

// Random color from our palette
const COLORS = Object.values(NODE_COLORS);
const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const useCollaborativeCursors = (projectId: string | null) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [cursors, setCursors] = useState<UserCursor[]>([]);
    const [me, setMe] = useState<{ id: string; name: string; color: string }>(() => ({
        id: generateUUID(),
        name: getRandomName(),
        color: getRandomColor()
    }));

    const throttleRef = useRef<number>(0);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Connected to collab server');
            if (projectId) {
                // Announce presence in specific project room
                newSocket.emit('join', { ...me, projectId });
            }
        });

        newSocket.on('user-joined', (user: { name: string }) => {
            // You could use a toast library here, for now we'll just log it
            console.log(`${user.name} joined the session`);
            // Create a temporary "notification" cursor or event if needed
            // For now we rely on the cursor appearing

            // Dispatch a custom event that App.tsx can listen to for notifications
            window.dispatchEvent(new CustomEvent('collaborator-joined', { detail: { name: user.name } }));
        });

        newSocket.on('cursor-update', (data: UserCursor) => {
            setCursors(prev => {
                const existing = prev.find(c => c.id === data.id);
                if (existing) {
                    return prev.map(c => c.id === data.id ? data : c);
                }
                return [...prev, data];
            });
        });

        newSocket.on('user-disconnected', (id: string) => {
            setCursors(prev => prev.filter(c => c.id !== id));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [me, projectId]);

    // Clean up stale cursors (inactive for > 10s)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCursors(prev => prev.filter(c => now - c.lastUpdate < 10000));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const broadcastMove = useCallback((x: number, y: number, message?: string) => {
        if (!socket || !projectId) return;

        const now = Date.now();
        // If message is changing, don't throttle
        if (!message && now - throttleRef.current < 30) return;
        throttleRef.current = now;

        socket.emit('move', {
            id: me.id,
            projectId,
            x,
            y,
            name: me.name,
            color: me.color,
            lastUpdate: now,
            message
        });
    }, [socket, me, projectId]);

    const updateName = useCallback((newName: string) => {
        setMe(prev => ({ ...prev, name: newName }));
        // Re-announce join to update name for others immediately
        if (socket && projectId) {
            socket.emit('join', { ...me, name: newName, projectId });
        }
    }, [socket, me, projectId]);

    return { cursors, broadcastMove, me, updateName };
};
