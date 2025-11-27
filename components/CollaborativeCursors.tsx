import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { UserCursor } from '../hooks/useRealtime';

interface CollaborativeCursorsProps {
    cursors: UserCursor[];
    myCursor?: UserCursor;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({ cursors, myCursor }) => {
    const { flowToScreenPosition } = useReactFlow();

    const allCursors = myCursor ? [...(cursors || []), myCursor] : (cursors || []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {allCursors.map(cursor => {
                const screenPos = flowToScreenPosition({ x: cursor.x, y: cursor.y });
                const isMe = cursor.id === myCursor?.id;

                return (
                    <div
                        key={cursor.id}
                        className={`absolute flex flex-col items-start ${isMe ? 'transition-none' : 'transition-all duration-100 ease-linear'}`}
                        style={{
                            left: screenPos.x,
                            top: screenPos.y,
                            zIndex: isMe ? 100 : 50
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="drop-shadow-md"
                            style={{ transform: 'translate(-1px, -1px)' }} // Pixel perfect alignment
                        >
                            <path
                                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                                fill={cursor.color}
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* Chat Bubble */}
                        {cursor.message ? (
                            <div
                                className={`px-3 py-2 rounded-xl rounded-tl-none text-sm font-medium shadow-lg whitespace-nowrap z-50 ${isMe ? 'ml-0' : 'ml-4 -mt-6'}`}
                                style={{
                                    backgroundColor: cursor.color,
                                    color: ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5', '#D8B4FE'].includes(cursor.color) ? '#000' : '#fff'
                                }}
                            >
                                {cursor.message}
                            </div>
                        ) : (
                            /* Name Tag */
                            <div
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm border border-white/20 ${isMe ? 'ml-2 mt-2' : 'ml-4 -mt-4'}`}
                                style={{
                                    backgroundColor: cursor.color,
                                    color: ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5', '#D8B4FE'].includes(cursor.color) ? '#000' : '#fff'
                                }}
                            >
                                {cursor.name}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
