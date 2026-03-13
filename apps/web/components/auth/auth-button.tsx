//apps/web/components/auth/auth-button.tsx

"use client";

import { useAuth } from "@/components/providers/auth-provider";

export default function AuthButton() {
    const { user, loading, signInWithGoogle, logout } = useAuth();

    if (loading) {
        return (
            <div className="text-sm text-slate-500 dark:text-[#CDBFB6]">
                Loading...
            </div>
        );
    }

    if (!user) {
        return (
            <button
                onClick={signInWithGoogle}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-[#F1E7DF] dark:text-[#2D2B2B]"
            >
                Sign in
            </button>
        );
    }

    const rawName = user.displayName ?? user.email ?? "User";
    const firstName = rawName.split(" ")[0];

    return (
        <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-2 py-1 shadow-sm backdrop-blur dark:border-[#4C4541] dark:bg-[#3A3533]/80">
            {user.photoURL ? (
                <img
                    src={user.photoURL}
                    alt={rawName}
                    className="h-8 w-8 rounded-full"
                />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-[#4A4441] dark:text-[#F1E7DF]">
                    {firstName.charAt(0).toUpperCase()}
                </div>
            )}

            <span className="max-w-[120px] truncate text-sm text-slate-700 dark:text-[#F1E7DF]">
                {firstName}
            </span>

            <button
                onClick={logout}
                className="rounded-full px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-[#D5C6BC] dark:hover:bg-[#2F2A28]"
            >
                Logout
            </button>
        </div>
    );
}