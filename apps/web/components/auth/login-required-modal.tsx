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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#4C4541] dark:bg-[#3A3533]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-[#F1E7DF]">
                            Sign in required
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#CDBFB6]">
                            Please sign in to generate your lesson and save your learning progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-[#CDBFB6] dark:hover:bg-[#2F2A28]"
                    >
                        ✕
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F1E7DF] dark:text-[#2D2B2B]"
                >
                    {isLoading ? "Signing in..." : "Continue with Google"}
                </button>

                {error ? (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : null}
            </div>
        </div>
    );
}