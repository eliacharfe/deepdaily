
// apps/web/components/auth/login-required-modal.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function LoginRequiredModal({ open, onClose }: Props) {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!open) return null;

    async function handleGoogleSignIn() {
        try {
            setError("");
            setIsLoading(true);
            await signInWithGoogle();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to sign in");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl border border-teal-200/40 bg-white p-6 shadow-2xl dark:border-teal-500/20 dark:bg-[#0F1720]">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Sign in required
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Please sign in to generate your lesson and save your learning progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                {/* Google Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#1A222C] dark:text-white dark:hover:bg-[#222B36]"
                >
                    {isLoading ? (
                        <span>Signing in...</span>
                    ) : (
                        <>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 48 48"
                                className="h-5 w-5 shrink-0"
                            >
                                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19.7-8.4 19.7-20c0-1.3-.1-2.3-.1-3.5z" />
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 12 24 12c3 0 5.8 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.4 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
                                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-3 5-5.6 6.6l6.3 5.2C39.6 36.6 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
                            </svg>

                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                {/* Error */}
                {error && (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                {/* Teal Accent Glow */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-teal-400/10 dark:ring-teal-400/20" />
            </div>
        </div>
    );
}