// apps/web/components/auth/auth-button.tsx

"use client";

import { useAuth } from "@/components/providers/auth-provider";

export default function AuthButton() {
    const { user, loading, signInWithGoogle, logout } = useAuth();

    if (loading) {
        return (
            <div className="rounded-full border border-teal-400/20 bg-teal-500/5 px-4 py-2 text-sm text-teal-100/80 backdrop-blur">
                Loading...
            </div>
        );
    }

    if (!user) {
        return (
            <button
                onClick={signInWithGoogle}
                className="
                    rounded-full
                    border border-teal-400/30
                    bg-teal-500/10
                    px-4 py-2
                    text-sm font-medium text-teal-300
                    shadow-sm backdrop-blur
                    transition
                    hover:border-teal-400/50
                    hover:bg-teal-500/20
                    active:scale-[0.98]
                "
            >
                Sign in
            </button>
        );
    }

    const rawName = user.displayName ?? user.email ?? "User";
    const firstName = rawName.split(" ")[0];

    return (
        <div
            className="
                flex items-center gap-2
                rounded-full
                border border-teal-400/25
                bg-teal-500/10
                px-2 py-1
                shadow-sm backdrop-blur
                transition
                hover:border-teal-400/40
                hover:bg-teal-500/15
            "
        >
            {user.photoURL ? (
                <img
                    src={user.photoURL}
                    alt={rawName}
                    className="h-8 w-8 rounded-full ring-1 ring-teal-300/30"
                />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400/80 text-xs font-semibold text-white">
                    {firstName.charAt(0).toUpperCase()}
                </div>
            )}

            <span className="max-w-[120px] truncate text-sm font-medium text-white">
                {firstName}
            </span>

            <button
                onClick={logout}
                className="
                    rounded-full
                    border border-transparent
                    px-3 py-1
                    text-sm text-teal-100/90
                    transition
                    hover:border-teal-300/20
                    hover:bg-white/8
                    hover:text-white
                    active:scale-[0.98]
                "
            >
                Logout
            </button>
        </div>
    );
}