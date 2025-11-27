import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserIdentity } from './useCollaborativeIdentity';
import { NodeChange, EdgeChange } from '@xyflow/react';

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

import { ViewMode } from '../types';

export const useRealtime = (
    projectId: string | null,
    me: UserIdentity,
    onRemoteNodeChanges?: (changes: NodeChange[]) => void,
    onRemoteEdgeChanges?: (changes: EdgeChange[]) => void,
    onGetLocalState?: () => { nodes: any[], edges: any[], viewMode: ViewMode },
    onRestoreState?: (state: { nodes: any[], edges: any[], viewMode: ViewMode }) => void,
    onRemoteViewModeChange?: (mode: ViewMode) => void
) => {
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
                // Request initial state from peers
                newSocket.emit('request-state', projectId);
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

        newSocket.on('node-change', (changes: NodeChange[]) => {
            if (onRemoteNodeChanges) onRemoteNodeChanges(changes);
        });

        newSocket.on('edge-change', (changes: EdgeChange[]) => {
            if (onRemoteEdgeChanges) onRemoteEdgeChanges(changes);
        });

        newSocket.on('view-mode-change', (mode: ViewMode) => {
            if (onRemoteViewModeChange) onRemoteViewModeChange(mode);
        });

        // -- State Sync Handlers --
        newSocket.on('request-state', (requesterSocketId: string) => {
            if (onGetLocalState) {
                const state = onGetLocalState();
                // Only send if we actually have something (basic check)
                if (state.nodes.length > 0) {
                    newSocket.emit('sync-state', { targetSocketId: requesterSocketId, state });
                }
            }
        });

        newSocket.on('receive-state', (state: { nodes: any[], edges: any[], viewMode: ViewMode }) => {
            console.log('Received state sync from peer', state);
            if (onRestoreState) {
                onRestoreState(state);
            }
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
    }, []); // Run once

    // Handle Project ID changes
    useEffect(() => {
        if (socket && projectId) {
            socket.emit('join', { ...me, projectId });
            socket.emit('request-state', projectId);
        }
    }, [socket, projectId, me.name, me.color]);

    // Clean up stale cursors
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

    const broadcastNodeChange = useCallback((changes: NodeChange[]) => {
        if (!socket || !projectId) return;
        socket.emit('node-change', { projectId, changes });
    }, [socket, projectId]);

    const broadcastEdgeChange = useCallback((changes: EdgeChange[]) => {
        if (!socket || !projectId) return;
        socket.emit('edge-change', { projectId, changes });
    }, [socket, projectId]);

    const broadcastViewModeChange = useCallback((mode: ViewMode) => {
        if (!socket || !projectId) return;
        socket.emit('view-mode-change', { projectId, mode });
    }, [socket, projectId]);

    return { cursors, broadcastMove, broadcastNodeChange, broadcastEdgeChange, broadcastViewModeChange };
};
