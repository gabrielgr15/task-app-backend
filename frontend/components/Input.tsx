// components/Input.tsx - REFORGED

import React from "react";
import clsx from "clsx";

export default function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full bg-tomb-mold/80 border-2 border-yharnam-stone/60 text-parchment rounded-none px-4 py-2",
        "font-sans transition-all duration-300 ease-in-out placeholder:text-parchment/40",
        "focus:outline-none focus:ring-0 focus:border-paleblood-sky focus:shadow-glow-paleblood",
        className
      )}
      {...props}
    />
  );
}