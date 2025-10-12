// components/DeleteTaskModal.tsx - REFORGED

'use client'
import React, { useState } from "react";
import { useAuth } from "@/context/Authcontext";
import { ITask, ITasksApiResponse } from "@/types";
import { KeyedMutator } from "swr";
import Button from "./Button";

interface DeleteTaskModalProps {
    onClose: () => void;
    task: ITask;
    mutate: KeyedMutator<ITasksApiResponse>;
}

export default function DeleteTaskModal({ onClose, task, mutate }: DeleteTaskModalProps) {
    const { accessToken } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            await mutate(async (currentData) => {
                if (!currentData) return currentData;
                const updatedTasks = currentData.tasks.filter(t => t._id !== task._id);
                return { ...currentData, tasks: updatedTasks };
            }, false);

            onClose();

        } catch (err: any) {
            console.error("Failed to delete task:", err);
            setError(err.message || "The contract resisted being discarded.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-tomb-mold/80 backdrop-blur-sm flex items-center justify-center z-50 font-serif fog-container p-4" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-tomb-mold/90 p-8 text-center shadow-2xl shadow-black/80 yharnam-frame"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-4xl text-parchment uppercase tracking-[0.2em] text-shadow-md">
                    Discard Contract?
                </h2>
                <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-blood-echo/40 to-transparent mx-auto mt-4 mb-6"></div>

                <p className="mb-4 text-parchment/80 font-sans">
                    This action will permanently erase the contract:
                </p>
                <p className="font-serif text-xl text-white my-4 text-shadow-md">
                    &ldquo;{task.title}&rdquo;
                </p>
                <p className="text-sm text-paleblood-sky/60 mb-6 italic">
                    Echoes of this hunt will be lost forever.
                </p>

                {error && <p className="text-blood-echo mb-4 animate-pulse">{error}</p>}

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                    <Button type="button" onClick={onClose} disabled={isDeleting} className="bg-transparent border-yharnam-stone/50 text-parchment/60 hover:bg-yharnam-stone/40 hover:text-parchment hover:border-yharnam-stone">
                        Show Mercy
                    </Button>
                    {/* A special, dangerous-looking button */}
                    <Button onClick={handleDeleteConfirm} disabled={isDeleting} className="border-blood-echo/50 text-blood-echo hover:bg-blood-echo/20 hover:text-blood-echo hover:border-blood-echo hover:shadow-[0_0_15px_3px_rgba(140,28,28,0.3)]">
                        {isDeleting ? 'Discarding...' : 'Discard'}
                    </Button>
                </div>
            </div>
        </div>
    );
}