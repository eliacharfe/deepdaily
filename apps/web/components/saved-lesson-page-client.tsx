// apps/web/app/components/saved-lesson-page-client.tsx

"use client";

import { useEffect, useState } from "react";
import AuthButton from "@/components/auth/auth-button";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import StreamingLesson from "@/components/streaming-lesson";
import { useAuth } from "@/components/providers/auth-provider";
import { getSavedLessonById } from "@/lib/lessons-api";
import type { SavedLesson } from "@/types/lesson";

type Props = {
    lessonId: string;
};

export default function SavedLessonPageClient({ lessonId }: Props) {
    const { user, loading } = useAuth();

    const [lesson, setLesson] = useState<SavedLesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadLesson() {
            if (loading) return;

            if (!user) {
                setShowLoginModal(true);
                setIsLoading(false);
                return;
            }

            try {
                setError("");
                setIsLoading(true);

                const token = await user.getIdToken();
                const data = await getSavedLessonById(lessonId, token);

                if (!cancelled) {
                    setLesson(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load lesson");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadLesson();

        return () => {
            cancelled = true;
        };
    }, [lessonId, user, loading]);

    if (isLoading) {
        return (
            <main className="min-h-screen px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40">
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">Loading saved lesson...</h1>
                    <div className="mt-6 flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-[#4C4541] dark:border-t-[#F1E7DF]" />
                    </div>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <>
                <main className="min-h-screen  px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                        <h1 className="text-2xl font-semibold">Sign in to view saved lessons</h1>
                        <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                            Your saved lessons are attached to your account.
                        </p>
                    </div>
                </main>

                <LoginRequiredModal
                    open={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                />
            </>
        );
    }

    if (error || !lesson) {
        return (
            <main className="min-h-screen px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40">
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">Could not load saved lesson</h1>
                    <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                        {error || "Lesson not found"}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-20 px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
            <div className="fixed right-20 top-5 z-40">
                <AuthButton />
            </div>

            <div className="mx-auto max-w-5xl space-y-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                        DeepDaily lesson
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                        {lesson.lesson.title}
                    </h1>

                    <p className="mt-4 text-sm text-slate-500 dark:text-[#CDBFB6]">
                        Topic:{" "}
                        <span className="font-medium text-slate-800 dark:text-[#F1E7DF]">
                            {lesson.topic}
                        </span>
                        {" · "}
                        Level:{" "}
                        <span className="font-medium capitalize text-slate-800 dark:text-[#F1E7DF]">
                            {lesson.level}
                        </span>
                    </p>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-[#CDBFB6]">
                            Today&apos;s focus
                        </h2>
                        <p className="mt-2 text-base text-slate-700 dark:text-[#F1E7DF]">
                            {lesson.lesson.today_focus}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Summary</h2>
                        <p className="mt-3 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                            {lesson.lesson.summary}
                        </p>
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Lesson sections</h2>

                            <div className="mt-6 space-y-6">
                                {lesson.lesson.sections.map((section) => (
                                    <article
                                        key={section.title}
                                        className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-[#4C4541] dark:bg-[#2F2A28]"
                                    >
                                        <h3 className="text-lg font-semibold">{section.title}</h3>
                                        <p className="mt-2 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                            {section.content}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Resources</h2>

                            <div className="mt-6 space-y-4">
                                {lesson.resources.map((resource) => (
                                    <a
                                        key={`${resource.title}-${resource.url}`}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-300 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B]"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1E7DF]">
                                                {resource.title}
                                            </h3>
                                            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                                {resource.type}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-slate-600 dark:text-[#D5C6BC]">
                                            {resource.reason}
                                        </p>

                                        {resource.snippet ? (
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-[#B8AAA1]">
                                                {resource.snippet}
                                            </p>
                                        ) : null}

                                        <p className="mt-3 text-sm text-slate-500 dark:text-[#A89B92]">
                                            {resource.url}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Roadmap</h2>

                            <ol className="mt-6 space-y-3">
                                {lesson.roadmap.map((item, index) => (
                                    <li
                                        key={`${index}-${item}`}
                                        className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-[#2F2A28]"
                                    >
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white dark:bg-[#F1E7DF] dark:text-[#2D2B2B]">
                                            {index + 1}
                                        </span>
                                        <span className="leading-6 text-slate-700 dark:text-[#D5C6BC]">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Next step</h2>
                            <p className="mt-4 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                {lesson.lesson.next_step}
                            </p>
                        </div>
                    </aside>
                </section>

                <StreamingLesson topic={lesson.topic} level={lesson.level} />
            </div>
        </main>
    );
}