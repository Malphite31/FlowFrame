import React, { useState, useEffect } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectUrl: string;
    projectName: string;
    userName: string;
    onUpdateUserName: (name: string) => void;
    userColor: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    projectUrl,
    projectName,
    userName,
    onUpdateUserName,
    userColor
}) => {
    const [copied, setCopied] = useState(false);
    const [tempName, setTempName] = useState(userName);

    useEffect(() => {
        setTempName(userName);
    }, [userName]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(projectUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempName(e.target.value);
    };

    const handleNameSubmit = () => {
        if (tempName.trim()) {
            onUpdateUserName(tempName.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#1e1e1e] border border-[#3d3d3d] rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#3d3d3d]">
                    <h2 className="text-lg font-semibold text-white">Share Project</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Profile Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Profile</label>
                        <div className="flex items-center gap-3 bg-[#262626] p-3 rounded-lg border border-[#3d3d3d]">
                            <div
                                className="w-8 h-8 rounded-full shadow-[0_0_10px_currentColor] flex items-center justify-center text-xs font-bold text-black"
                                style={{ backgroundColor: userColor, color: ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5', '#D8B4FE'].includes(userColor) ? '#000' : '#fff' }}
                            >
                                {tempName.charAt(0).toUpperCase()}
                            </div>
                            <input
                                type="text"
                                value={tempName}
                                onChange={handleNameChange}
                                onBlur={handleNameSubmit}
                                onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                                className="bg-transparent text-white text-sm font-medium outline-none flex-1"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    {/* Link Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Invite Collaborators</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-[#262626] border border-[#3d3d3d] rounded-lg px-3 py-2 text-sm text-gray-300 truncate font-mono">
                                {projectUrl}
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    }`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Scan to Join</label>
                        <div className="flex justify-center bg-white p-4 rounded-xl w-fit mx-auto">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(projectUrl)}&bgcolor=ffffff`}
                                alt="Project QR Code"
                                className="w-32 h-32"
                            />
                        </div>
                        <p className="text-center text-xs text-gray-500">
                            Anyone with the link can join this session.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
