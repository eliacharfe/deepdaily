// apps/web/components/saved-lessons-sidebar.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getSavedLessons, deleteLesson } from "@/lib/lessons-api";
import type { LessonPreview } from "@/types/lesson";

export default function SavedLessonsSidebar() {
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
        <aside className="hidden w-[320px] shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur dark:border-[#4C4541] dark:bg-[#332F2D] lg:block">
            <div className="sticky top-0 h-screen overflow-y-auto px-4 py-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-[#FFF7F1]">
                        Saved lessons
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-[#CDBFB6]">
                        Revisit and continue learning.
                    </p>
                </div>

                {!user ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-[#4C4541] dark:bg-[#3A3533] dark:text-[#CDBFB6]">
                        Sign in to save lessons and see them here.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-[#423C39]"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                        {error}
                    </div>
                ) : lessons.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-[#4C4541] dark:bg-[#3A3533] dark:text-[#CDBFB6]">
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
                                    className={`rounded-2xl border p-4 transition ${isActive
                                        ? "border-slate-900 bg-slate-100 dark:border-[#F1E7DF] dark:bg-[#3D3735]"
                                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-[#4C4541] dark:bg-[#3A3533] dark:hover:bg-[#413B39]"
                                        }`}
                                >
                                    <Link href={href} className="block">
                                        <p className="line-clamp-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-[#B9AAA0]">
                                            {lesson.level}
                                        </p>

                                        <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-[#FFF7F1]">
                                            {lesson.title}
                                        </h3>

                                        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-[#CDBFB6]">
                                            {lesson.topic}
                                        </p>
                                    </Link>

                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteLesson(e, lesson.id)}
                                            disabled={isDeleting}
                                            aria-label={`Delete ${lesson.title}`}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4C4541] dark:text-[#CDBFB6] dark:hover:border-red-900/40 dark:hover:bg-red-950/20 dark:hover:text-red-300"
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
        </aside>
    );
}
