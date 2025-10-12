// components/AuthFormContainer.tsx - NEW COMPONENT

import React from "react";

interface AuthFormContainerProps {
    title: string;
    children: React.ReactNode;
}

export default function AuthFormContainer({ title, children }: AuthFormContainerProps) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center font-serif fog-container p-4">
            <div className="w-full max-w-md bg-tomb-mold/90 p-8 shadow-2xl shadow-black/80 yharnam-frame">
                <div className="text-center mb-8">
                    <h1 className="text-4xl text-parchment uppercase tracking-[0.4em] text-shadow-md">
                        {title}
                    </h1>
                    <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-paleblood-sky/30 to-transparent mx-auto mt-4"></div>
                </div>
                {children}
            </div>
        </div>
    );
}