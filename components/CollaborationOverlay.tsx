import React, { useState, useEffect, useRef } from 'react';
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

    // Ref for local cursor to bypass React render cycle for movement
    const localCursorRef = useRef<HTMLDivElement>(null);

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

            // 1. Instant Local Update (Bypass React Render Cycle)
            if (localCursorRef.current) {
                localCursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }

            // 2. Broadcast (Flow Coordinates)
            // We throttle this slightly implicitly by React state updates if we were using state, 
            // but here we just call it. The hook might handle throttling.
            const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

            broadcastMove(pos.x, pos.y, isCursorChatActive || chatMessage ? chatMessage : undefined);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [projectId, screenToFlowPosition, broadcastMove, isCursorChatActive, chatMessage]);




    // -- Hide Default Cursor --
    const shouldHideCursor = cursors.length > 0 || isCursorChatActive || true; // Always hide if we want custom cursor for self

    return (
        <>
            {shouldHideCursor && (
                <style>{`
          body,
          body * {
            cursor: none !important;
          }
        `}</style>
            )}

            {/* Local Cursor (Direct DOM) */}
            <div
                ref={localCursorRef}
                className="fixed top-0 left-0 pointer-events-none z-[10000] flex flex-col items-start transition-none will-change-transform"
                style={{ transform: 'translate3d(-100px, -100px, 0)' }} // Start off-screen
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-md"
                    style={{ transform: 'translate(-1px, -1px)' }}
                >
                    <path
                        d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                        fill={me.color}
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>

                {(isCursorChatActive || chatMessage) ? (
                    <div
                        className="ml-0 px-3 py-2 rounded-xl rounded-tl-none text-sm font-medium shadow-lg whitespace-nowrap z-50"
                        style={{
                            backgroundColor: me.color,
                            color: ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5', '#D8B4FE'].includes(me.color) ? '#000' : '#fff'
                        }}
                    >
                        {chatMessage}
                    </div>
                ) : (
                    <div
                        className="ml-2 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm border border-white/20"
                        style={{
                            backgroundColor: me.color,
                            color: ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5', '#D8B4FE'].includes(me.color) ? '#000' : '#fff'
                        }}
                    >
                        {me.name}
                    </div>
                )}
            </div>

            <CollaborativeCursors
                cursors={cursors}
                myCursor={undefined}
            />
        </>
    );
};
