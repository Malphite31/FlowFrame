import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserIdentity } from './useCollaborativeIdentity';

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

export const useCollaborativeCursors = (projectId: string | null, me: UserIdentity) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [cursors, setCursors] = useState<UserCursor[]>([]);

    const throttleRef = useRef<number>(0);

    // Socket Connection
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Connected to collab server');
            if (projectId) {
                newSocket.emit('join', { ...me, projectId });
            }
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

        newSocket.on('user-joined', (user: { name: string }) => {
            console.log(`${user.name} joined the session`);
            window.dispatchEvent(new CustomEvent('collaborator-joined', { detail: { name: user.name } }));
        });

        newSocket.on('user-disconnected', (id: string) => {
            setCursors(prev => prev.filter(c => c.id !== id));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []); // Only run once on mount (or if projectId changes? No, we handle projectId changes below)

    // Handle Project ID changes and Identity changes
    useEffect(() => {
        if (socket && projectId) {
            // Re-announce presence when project or identity changes
            socket.emit('join', { ...me, projectId });
        }
    }, [socket, projectId, me.name, me.color]);

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

    return { cursors, broadcastMove };
};
