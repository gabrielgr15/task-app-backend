// components/Button.tsx - REFORGED

import React from "react";
import clsx from "clsx";

export default function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={clsx(
                "w-full py-3 text-parchment uppercase tracking-widest font-semibold font-serif border-2 border-paleblood-sky/40",
                "transition-all duration-300 ease-in-out",
                "hover:bg-paleblood-sky/10 hover:border-paleblood-sky/80 hover:text-white hover:shadow-glow-paleblood",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none",
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}