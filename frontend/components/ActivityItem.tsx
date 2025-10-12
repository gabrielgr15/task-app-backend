import React from 'react';

interface ActivityItemProps {
    message: string;
    timestamp: string; // Assumes pre-formatted string
}

const ActivityItem: React.FC<ActivityItemProps> = ({ message, timestamp }) => {
    return (
        // Container: Subtle glow on hover. Padding creates space.
        <div className="group flex justify-between items-start gap-6 py-4 px-2 transition-colors duration-300 hover:bg-paleblood-sky/5">

            {/* Main Message: Uses a more readable sans-serif for long text, but styled to fit. */}
            <p className="font-sans text-base text-parchment/90 group-hover:text-parchment transition-colors duration-300">
                {message}
            </p>

            {/* Timestamp: Secondary info, less prominent but sharp. */}
            <p className="font-serif text-sm text-paleblood-sky/60 whitespace-nowrap pt-px group-hover:text-paleblood-sky transition-colors duration-300">
                {timestamp}
            </p>

        </div>
    );
};

export default ActivityItem;