// components/CreateTaskModal.tsx - LOGIC CORRECTED

'use client'
import React, { useState } from "react";
import { useAuth } from "@/context/Authcontext";
import Button from "./Button";
import Input from "./Input";
import { ITasksApiResponse } from "@/types";
import { KeyedMutator } from "swr";

interface CreateTaskModalProps {
    onClose: () => void;
    mutate: KeyedMutator<ITasksApiResponse>;
}

export default function CreateTaskModal({ onClose, mutate }: CreateTaskModalProps) {
    const { accessToken } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Pending');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- THIS FUNCTION HAS BEEN REFORGED WITH YOUR ORIGINAL, ROBUST LOGIC ---
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        if (!title) {
            setError("A contract must have a name.");
            return;
        }
        setIsSubmitting(true);

        try {
            // Step 1: Make the API call, just like in your original code.
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ title, description, status }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to forge the contract.');
            }

            // Step 2: If successful, update the local cache with the REAL data from the server.
            // This uses the bound mutate function, which is cleaner.
            await mutate(async (currentData) => {
                if (!currentData) return currentData;
                return {
                    ...currentData,
                    tasks: [data.task, ...currentData.tasks] // Use the real task from the response
                };
            }, false); // 'false' prevents a redundant re-fetch

            // Step 3: Close the modal.
            onClose();

        } catch (err: any) {
            console.error("Failed to create task:", err);
            setError(err.message || 'The contract was rejected by an unknown force.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-tomb-mold/80 backdrop-blur-sm flex items-center justify-center z-50 font-serif fog-container p-4" onClick={onClose}>

            <div
                className="w-full max-w-lg bg-tomb-mold/90 p-8 shadow-2xl shadow-black/80 yharnam-frame"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-8">
                    <h2 className="text-4xl text-parchment uppercase tracking-[0.4em] text-shadow-md">
                        Forge Contract
                    </h2>
                    <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-paleblood-sky/30 to-transparent mx-auto mt-4"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        type="text"
                        placeholder="Contract's Name"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                    <Input
                        type="text"
                        placeholder="Inscription (Description)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        disabled={isSubmitting}
                    />

                    <div>
                        <label className="text-xs uppercase tracking-widest text-parchment/60 mb-2 block">
                            Contract's State
                        </label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-tomb-mold/80 border-2 border-yharnam-stone/60 text-parchment rounded-none px-4 py-3 font-sans focus:outline-none focus:ring-0 focus:border-paleblood-sky focus:shadow-glow-paleblood appearance-none"
                        >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                        </select>
                    </div>

                    {error && (
                        <p className="text-blood-echo text-center font-serif text-sm animate-pulse pt-2">{error}</p>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="bg-transparent border-yharnam-stone/50 text-parchment/60 hover:bg-yharnam-stone/40 hover:text-parchment hover:border-yharnam-stone"
                        >
                            Return
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Forging...' : 'Seal Contract'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}