// apps/web/components/page-shell.tsx

"use client";

import type { ReactNode } from "react";
import TopNavbar from "@/components/top-navbar";

type Props = {
    children: ReactNode;
    showBack?: boolean;
    backLessonId?: string;
    showHome?: boolean;
    showAuth?: boolean;
    showThemeToggle?: boolean;
    className?: string;
};

export default function PageShell({
    children,
    showBack = false,
    backLessonId,
    showHome = true,
    showAuth = true,
    showThemeToggle = true,
    className = "",
}: Props) {
    return (
        <main
            className={[
                "min-h-screen bg-(--bg) pt-24 text-(--text) transition-colors",
                className,
            ].join(" ")}
        >
            <TopNavbar
                showBack={showBack}
                backLessonId={backLessonId}
                showHome={showHome}
                showAuth={showAuth}
                showThemeToggle={showThemeToggle}
            />
            {children}
        </main>
    );
}