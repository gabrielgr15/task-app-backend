// components/Container.tsx - REFORGED

import React from "react";
import clsx from "clsx";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function Container({ children, className }: ContainerProps) {
  return (
    <div className={clsx(
      "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-serif text-parchment",
      className
    )}
    >
      {children}
    </div>
  );
}