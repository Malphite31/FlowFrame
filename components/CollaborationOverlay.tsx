import React, { useState, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCollaborativeCursors } from '../hooks/useCollaborativeCursors';
import { CollaborativeCursors } from './CollaborativeCursors';
import { UserIdentity } from '../hooks/useCollaborativeIdentity';

interface CollaborationOverlayProps {
    projectId: string | null;
    me: UserIdentity;
}

export const CollaborationOverlay: React.FC<CollaborationOverlayProps> = ({ projectId, me }) => {
    const { screenToFlowPosition } = useReactFlow();
    const { cursors, broadcastMove } = useCollaborativeCursors(projectId, me);

    // -- Cursor Chat State --
    const [isCursorChatActive, setIsCursorChatActive] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // -- Collaborator Notification --
    useEffect(() => {
        const handleJoin = (e: Event) => {
            const customEvent = e as CustomEvent;
            const name = customEvent.detail.name;
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-[#3b82f6] text-white px-4 py-2 rounded-full shadow-lg z-[100] text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300';
            toast.textContent = `${name} joined the session`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        };
        window.addEventListener('collaborator-joined', handleJoin);
        return () => window.removeEventListener('collaborator-joined', handleJoin);
    }, []);

    // -- Cursor Chat Logic --
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // If editing text in a node or input, ignore
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
                if (e.key === 'Escape' && isCursorChatActive) {
                    setIsCursorChatActive(false);
                    setChatMessage('');
                    broadcastMove(0, 0, '');
                }
                return;
            }

            if (e.key === '/' && !isCursorChatActive) {
                e.preventDefault();
                setIsCursorChatActive(true);
                setChatMessage('');
                return;
            }

            if (isCursorChatActive) {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    e.preventDefault();
                    setIsCursorChatActive(false);
                    setTimeout(() => {
                        setChatMessage('');
                        broadcastMove(0, 0, '');
                    }, 3000);
                } else if (e.key === 'Backspace') {
                    setChatMessage(prev => {
                        const next = prev.slice(0, -1);
                        broadcastMove(0, 0, next);
                        return next;
                    });
                } else if (e.key.length === 1) {
                    setChatMessage(prev => {
                        const next = prev + e.key;
                        broadcastMove(0, 0, next);
                        return next;
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCursorChatActive, broadcastMove]);

    // -- Mouse Tracking --
    // We attach to window to catch movements everywhere
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Only track if we have a project open
            if (!projectId) return;

            const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            setMousePos(pos);

            // Broadcast
            broadcastMove(pos.x, pos.y, isCursorChatActive || chatMessage ? chatMessage : undefined);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [projectId, screenToFlowPosition, broadcastMove, isCursorChatActive, chatMessage]);


    // -- Hide Default Cursor --
    const shouldHideCursor = cursors.length > 0 || isCursorChatActive;

    return (
        <>
            {shouldHideCursor && (
                <style>{`
          .react-flow, 
          .react-flow__pane,
          .react-flow__node,
          .react-flow__edge,
          .react-flow__handle,
          .react-flow * {
            cursor: none !important;
          }
        `}</style>
            )}

            <CollaborativeCursors
                cursors={cursors}
                myCursor={isCursorChatActive || chatMessage ? { ...me, x: mousePos.x, y: mousePos.y, message: chatMessage, lastUpdate: Date.now() } : undefined}
            />
        </>
    );
};
