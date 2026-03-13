// apps/web/components/app-shell.tsx

"use client";

import { usePathname } from "next/navigation";
import SavedLessonsSidebar from "@/components/saved-lessons-sidebar";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const showSidebar =
        pathname.startsWith("/learn") || pathname.startsWith("/lessons/");

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
            <div className="flex min-h-screen">
                <SavedLessonsSidebar />
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </div>
    );
}