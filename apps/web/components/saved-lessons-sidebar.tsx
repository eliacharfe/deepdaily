// apps/web/components/saved-lessons-sidebar.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Trash2,
    BookOpen,
    ChevronRight,
    ChevronLeft,
    PanelLeftClose,
    PanelLeftOpen,
    X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getSavedLessons, deleteLesson } from "@/lib/lessons-api";
import type { LessonPreview } from "@/types/lesson";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    desktopCollapsed: boolean;
    onToggleDesktop: () => void;
};

export default function SavedLessonsSidebar({
    isOpen,
    onClose,
    desktopCollapsed,
    onToggleDesktop,
}: Props) {
    const { user } = useAuth();
    const pathname = usePathname();

    const [lessons, setLessons] = useState<LessonPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

    const loadLessons = useCallback(async () => {
        if (!user) {
            setLessons([]);
            setIsLoading(false);
            return;
        }

        try {
            setError("");
            setIsLoading(true);

            const token = await user.getIdToken();
            const data = await getSavedLessons(token);
            setLessons(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load lessons");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadLessons();
    }, [loadLessons]);

    useEffect(() => {
        function handleRefresh() {
            loadLessons();
        }

        window.addEventListener("lessons:refresh", handleRefresh);

        return () => {
            window.removeEventListener("lessons:refresh", handleRefresh);
        };
    }, [loadLessons]);

    async function handleDeleteLesson(
        e: React.MouseEvent<HTMLButtonElement>,
        lessonId: string
    ) {
        e.preventDefault();
        e.stopPropagation();

        if (!user) return;

        const confirmed = window.confirm("Delete this lesson?");
        if (!confirmed) return;

        try {
            setError("");
            setDeletingLessonId(lessonId);

            const token = await user.getIdToken();
            await deleteLesson(lessonId, token);

            setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete lesson");
        } finally {
            setDeletingLessonId(null);
        }
    }

    return (
        <>
            <aside
                className={[
                    "fixed bottom-0 left-0 top-0 z-50 w-[320px] max-w-[85vw] border-r border-slate-200 bg-slate-50/95 backdrop-blur transition-transform duration-300 dark:border-slate-800 dark:bg-[#0F1720]/95",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    desktopCollapsed ? "lg:w-[72px]" : "lg:w-[380px]",
                    "lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:translate-x-0 lg:shrink-0 lg:transition-[width] lg:duration-300",
                ].join(" ")}
            >
                {desktopCollapsed ? (
                    <div className="hidden h-full flex-col items-center justify-start px-3 py-5 lg:flex">
                        <button
                            type="button"
                            onClick={onToggleDesktop}
                            aria-label="Expand sidebar"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <PanelLeftOpen className="h-5 w-5" />
                        </button>

                        <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto px-4 py-6">
                        <div className="mb-5 px-1">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">
                                        <BookOpen className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">
                                            Library
                                        </p>

                                        <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                                            Saved lessons
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            Revisit and continue learning.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onToggleDesktop}
                                        aria-label="Collapse sidebar"
                                        className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
                                    >
                                        <PanelLeftClose className="h-5 w-5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Close sidebar"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 border-b border-slate-200 dark:border-slate-700" />
                        </div>

                        {!user ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                Sign in to save lessons and see them here.
                            </div>
                        ) : isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                                    />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                                {error}
                            </div>
                        ) : lessons.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                No saved lessons yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lessons.map((lesson) => {
                                    const href = `/lessons/${lesson.id}`;
                                    const isActive = pathname === href;
                                    const isDeleting = deletingLessonId === lesson.id;

                                    return (
                                        <div
                                            key={lesson.id}
                                            className={[
                                                "group rounded-2xl border p-4 shadow-sm transition",
                                                isActive
                                                    ? "border-teal-200 bg-teal-50/70 dark:border-teal-500/30 dark:bg-teal-950/20"
                                                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-500/20 dark:hover:bg-slate-900",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Link
                                                    href={href}
                                                    className="min-w-0 flex-1"
                                                    onClick={onClose}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p
                                                                    className={[
                                                                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                                                        isActive
                                                                            ? "border-teal-200 bg-white text-teal-700 dark:border-teal-400/30 dark:bg-teal-950/20 dark:text-teal-300"
                                                                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                                                    ].join(" ")}
                                                                >
                                                                    {lesson.level}
                                                                </p>
                                                            </div>

                                                            <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
                                                                {lesson.title}
                                                            </h3>

                                                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                                {lesson.topic}
                                                            </p>
                                                        </div>

                                                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                                    </div>
                                                </Link>
                                            </div>

                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        handleDeleteLesson(e, lesson.id)
                                                    }
                                                    disabled={isDeleting}
                                                    aria-label={`Delete ${lesson.title}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900/40 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </aside>

        </>
    );
}