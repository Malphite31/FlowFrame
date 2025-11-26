import React, { useEffect, useState } from 'react';

const MobileWarning = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Check for mobile/tablet width (less than 1024px)
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isMobile) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0f1115] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 mb-8 rounded-full bg-davinci-accent/10 flex items-center justify-center shadow-[0_0_30px_rgba(94,154,255,0.2)] border border-davinci-accent/20">
                <svg className="w-10 h-10 text-davinci-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Desktop Only</h2>
            <p className="text-gray-400 max-w-md text-lg leading-relaxed">
                FlowFrame requires a larger screen for its node-based interface. Please switch to a desktop or laptop computer.
            </p>
            <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-davinci-accent animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-davinci-accent animate-pulse delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-davinci-accent animate-pulse delay-150"></div>
            </div>
        </div>
    );
};

export default MobileWarning;
