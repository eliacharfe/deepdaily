// apps/web/components/app-shell.tsx

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import SavedLessonsSidebar from "@/components/saved-lessons-sidebar";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const showSidebar =
        pathname === "/" ||
        pathname.startsWith("/learn") ||
        pathname.startsWith("/lessons/");

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
            <div className="flex min-h-screen">
                <SavedLessonsSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    desktopCollapsed={desktopCollapsed}
                    onToggleDesktop={() => setDesktopCollapsed((prev) => !prev)}
                />

                <div className="min-w-0 flex-1">
                    {!sidebarOpen ? (
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open saved lessons"
                            className="fixed left-0 top-24 z-100 inline-flex h-14 w-12 items-center justify-center rounded-r-2xl border border-l-0 border-teal-500/20 bg-[#08111D]/90 text-teal-300 shadow-lg backdrop-blur-md transition hover:w-14 hover:bg-[#0D1726] active:scale-[0.98] lg:hidden"
                        >
                            <PanelLeft className="h-5 w-5" />
                        </button>
                    ) : null}
                    {/* {!sidebarOpen ? (
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open saved lessons"
                            className="fixed left-4 top-24 z-[100] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/20 bg-[#0B1220]/85 text-teal-300 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:scale-[1.02] hover:bg-[#0F172A] active:scale-[0.98] lg:hidden"
                        >
                            <PanelLeft className="h-5 w-5" />
                        </button>
                    ) : null} */}

                    <div className="min-w-0">{children}</div>
                </div>
            </div>

            {sidebarOpen ? (
                <button
                    type="button"
                    aria-label="Close overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                />
            ) : null}
        </div>
    );
}