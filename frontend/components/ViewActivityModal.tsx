'use client'
import React from "react"
import { useAuth } from "@/context/Authcontext"
import { IActivityApiResponse, IActivity } from "@/types"
import useSWR from "swr"
import { fetcher } from "@/utils/fetcher"
import ActivityItem from "./ActivityItem";

interface ViewActivityModalProps {
    onClose: () => void
}

const formatGothicDate = (isoString: string | Date): string => {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB', {
            year: 'numeric', month: 'short', day: 'numeric',
        }).replace(/ /g, '. ');
    } catch (e) {
        return "Time is Convoluted";
    }
}

export default function ViewActivityModal({ onClose }: ViewActivityModalProps) {
    const { accessToken } = useAuth()
    const { data, error, isLoading } = useSWR<IActivityApiResponse>(
        accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activity`, accessToken] : null,
        fetcher
    )

    // --- LOADING/ERROR STATES ---
    const renderOverlayContent = (text: string, colorClass: string, isPulsing: boolean = false) => (
        <div className="fixed inset-0 bg-tomb-mold/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <p className={`font-serif text-2xl text-center ${colorClass} text-shadow-lg ${isPulsing ? 'animate-pulse' : ''}`}>
                {text}
            </p>
        </div>
    );

    if (isLoading) return renderOverlayContent("Awaiting Communion with the Great Ones...", "text-paleblood-sky", true);
    if (error) return renderOverlayContent(`Insight reveals a nightmare: ${error.message}`, "text-blood-echo");

    const activities: IActivity[] = data?.activities || [];

    // --- THE MAIN MODAL ---
    return (
        // The overlay is now the FOG-CONTAINER
        <div className="fixed inset-0 bg-tomb-mold/80 backdrop-blur-sm flex items-center justify-center z-50 font-serif fog-container" onClick={onClose}>

            <style jsx global>{`
                /* ... scrollbar style remains the same ... */
            `}</style>

            {/* Modal Container: We now apply our .yharnam-frame utility! */}
            <div
                className="w-full max-w-2xl bg-tomb-mold/90 p-8 shadow-2xl shadow-black/80 yharnam-frame"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-4xl text-parchment uppercase tracking-[0.4em] text-shadow-md">
                        Hunter's Journal
                    </h2>
                    {/* A more thematic divider */}
                    <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-paleblood-sky/30 to-transparent mx-auto mt-4"></div>
                </div>

                {/* Activity List: Added a textured background here too! */}
                <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 yharnam-scrollbar shadow-inner shadow-black/80 bg-black/30 bg-[url('/grunge-texture.png')] bg-blend-overlay">
                    {activities.length > 0 ? (
                        <div className="divide-y divide-paleblood-sky/20">
                            {activities.map((activity) => (
                                <ActivityItem
                                    key={activity.id}
                                    message={activity.message}
                                    timestamp={formatGothicDate(activity.timestamp)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-parchment/60 italic">The journal is empty. No echoes linger here.</p>
                        </div>
                    )}
                </div>

                {/* Footer & Close Button: Added a glow for more impact */}
                <div className="mt-8 pt-6 border-t border-paleblood-sky/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-3 text-parchment uppercase tracking-widest font-semibold border-2 border-paleblood-sky/50 transition-all duration-300 ease-in-out hover:bg-paleblood-sky/10 hover:border-paleblood-sky hover:text-white hover:shadow-glow-paleblood"
                    >
                        End the Dream
                    </button>
                </div>
            </div>
        </div>
    );
}