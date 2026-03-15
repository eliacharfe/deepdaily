// apps/web/components/learn-page-client.tsx

"use client";

import { useEffect, useState } from "react";
import StreamingLesson from "@/components/streaming-lesson";
import AuthButton from "@/components/auth/auth-button";
import SaveLessonButton from "@/components/save-lesson-button";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { config } from "@/lib/config";
import { getSavedLessonById, saveLesson } from "@/lib/lessons-api";
import type { TopicLevel } from "@/types/topic";
import type { LessonData, SavedLesson } from "@/types/lesson";
import HomeButton from "@/components/home-button";
import CurriculumCtaCard from "@/components/curriculum-cta-card";
import { useRouter } from "next/navigation";
import { createCurriculum, getCurriculaByLesson } from "@/lib/curricula-api";
import ResumeCurriculumCard from "@/components/resume-curriculum-card";
import type { Curriculum } from "@/types/curriculum";

type Props =
    | {
        topic: string;
        level: TopicLevel;
        lessonId?: never;
    }
    | {
        lessonId: string;
        topic?: never;
        level?: never;
    };

function normalizeSavedLesson(savedLesson: SavedLesson): LessonData {
    return {
        id: savedLesson.id,
        topic: savedLesson.topic,
        level: savedLesson.level,
        roadmap: savedLesson.roadmap,
        lesson: savedLesson.lesson,
        resources: savedLesson.resources,
        deepDive: savedLesson.deepDive ?? [],
        streamedLesson: savedLesson.streamedLesson ?? "",
    };
}

export default function LearnPageClient(props: Props) {
    const { user, loading: authLoading } = useAuth();

    const isSavedLessonMode = "lessonId" in props;
    const lessonId = "lessonId" in props ? props.lessonId : undefined;
    const topic = "topic" in props ? props.topic : undefined;
    const level = "level" in props ? props.level : undefined;

    const [streamedLesson, setStreamedLesson] = useState("");
    const [data, setData] = useState<LessonData | null>(null);
    const [savedLessonId, setSavedLessonId] = useState<string | null>(
        lessonId ?? null
    );

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [isCreatingCurriculum, setIsCreatingCurriculum] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<7 | 30 | null>(null);
    const [curriculumMessage, setCurriculumMessage] = useState("");
    const [existingCurricula, setExistingCurricula] = useState<Curriculum[]>([]);

    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (authLoading) return;

            if (!user) {
                setShowLoginModal(true);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const token = await user.getIdToken();

                if (isSavedLessonMode && lessonId) {
                    const savedLesson = await getSavedLessonById(lessonId, token);

                    if (!cancelled) {
                        const normalized = normalizeSavedLesson(savedLesson);
                        setData(normalized);
                        setStreamedLesson(normalized.streamedLesson ?? "");
                        setSavedLessonId(savedLesson.id);

                        const curricula = await getCurriculaByLesson(savedLesson.id, token);
                        setExistingCurricula(curricula);
                    }

                    return;
                }

                const res = await fetch(`${config.apiBaseUrl}/lessons/generate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ topic, level }),
                });

                const contentType = res.headers.get("content-type") || "";

                if (!res.ok) {
                    if (contentType.includes("application/json")) {
                        const errData = await res.json();
                        throw new Error(errData.detail || "Failed to generate lesson");
                    }
                    throw new Error(`Failed to generate lesson (${res.status})`);
                }

                const result = (await res.json()) as LessonData;

                if (!cancelled) {
                    setData(result);
                    setStreamedLesson(result.streamedLesson ?? "");

                    if (result.id) {
                        const curricula = await getCurriculaByLesson(result.id, token);
                        setExistingCurricula(curricula);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load lesson");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [authLoading, user, isSavedLessonMode, lessonId, topic, level]);

    async function handleCreateCurriculum(durationDays: 7 | 30) {
        if (!user || !data || isCreatingCurriculum) return;

        try {
            setCurriculumMessage("");
            setIsCreatingCurriculum(true);
            setSelectedDuration(durationDays);

            const token = await user.getIdToken();

            let effectiveLessonId = savedLessonId ?? data.id;

            if (!effectiveLessonId) {
                setCurriculumMessage("Saving lesson before creating your curriculum...");

                const savedLesson = await saveLesson(
                    {
                        ...data,
                        streamedLesson,
                    },
                    token
                );

                effectiveLessonId = savedLesson.id;
                setSavedLessonId(savedLesson.id);
                setData((prev) => (prev ? { ...prev, id: savedLesson.id } : prev));
            }

            setCurriculumMessage(`Creating your ${durationDays}-day curriculum...`);

            const curriculum = await createCurriculum(token, {
                lessonId: effectiveLessonId,
                durationDays,
            });

            router.push(`/curriculum/${curriculum.id}`);
        } catch (err) {
            setCurriculumMessage(
                err instanceof Error ? err.message : "Failed to create curriculum"
            );
        } finally {
            setIsCreatingCurriculum(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen pt-20 px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40 flex items-center gap-3">
                    <HomeButton />
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">
                        {isSavedLessonMode ? "Loading saved lesson..." : "Generating your lesson..."}
                    </h1>
                    <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                        {isSavedLessonMode
                            ? "Please wait while DeepDaily loads your saved lesson."
                            : "Please wait while DeepDaily prepares your learning path."}
                    </p>

                    <div className="mt-8 flex justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
                    </div>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <>
                <main className="min-h-screen px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                    <div className="fixed right-20 top-5 z-40 flex items-center gap-3">
                        <HomeButton />
                        <AuthButton />
                    </div>

                    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                        <h1 className="text-2xl font-semibold">Sign in required</h1>
                        <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                            Please sign in to generate and view lessons.
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

    if (error || !data) {
        return (
            <main className="min-h-screen px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40 flex items-center gap-3">
                    <HomeButton />
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">
                        {isSavedLessonMode ? "Could not load saved lesson" : "Could not generate lesson"}
                    </h1>
                    <p className="mt-3 text-red-600 dark:text-red-400">
                        {error || "Unknown error"}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-20 px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
            <div className="fixed right-20 top-5 z-40 flex items-center gap-3">
                <HomeButton />
                <AuthButton />
            </div>

            <div className="mx-auto max-w-5xl space-y-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                                DeepDaily lesson
                            </p>

                            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                {data.lesson.title}
                            </h1>

                            <p className="mt-4 text-sm text-slate-500 dark:text-[#CDBFB6]">
                                Topic:{" "}
                                <span className="font-medium text-slate-800 dark:text-[#F1E7DF]">
                                    {data.topic}
                                </span>
                                {" · "}
                                Level:{" "}
                                <span className="font-medium capitalize text-slate-800 dark:text-[#F1E7DF]">
                                    {data.level}
                                </span>
                            </p>
                        </div>

                        <SaveLessonButton
                            lesson={{
                                ...data,
                                id: savedLessonId ?? data.id,
                                streamedLesson,
                            }}
                            onSaved={(id) => {
                                setSavedLessonId(id);
                                setData((prev) => (prev ? { ...prev, id } : prev));
                            }}
                        />
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-[#CDBFB6]">
                            Today&apos;s focus
                        </h2>
                        <p className="mt-2 text-base text-slate-700 dark:text-[#F1E7DF]">
                            {data.lesson.today_focus}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Summary</h2>
                        <p className="mt-3 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                            {data.lesson.summary}
                        </p>
                    </div>
                </section>

                {existingCurricula.length > 0 ? (
                    <ResumeCurriculumCard curricula={existingCurricula} />
                ) : null}

                <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Lesson sections</h2>

                            <div className="mt-6 space-y-6">
                                {data.lesson.sections.map((section) => (
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
                                {data.resources.map((resource) => (
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

                    <aside className="space-y-8 pr-1 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Roadmap</h2>

                            <ol className="mt-6 space-y-3">
                                {data.roadmap.map((item, index) => (
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

                        <CurriculumCtaCard
                            compact
                            isCreatingCurriculum={isCreatingCurriculum}
                            selectedDuration={selectedDuration}
                            curriculumMessage={curriculumMessage}
                            onCreateCurriculum={handleCreateCurriculum}
                        />

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Deep dive</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-[#CDBFB6]">
                                Books and advanced material to continue beyond today’s lesson.
                            </p>

                            <div className="mt-6 space-y-4">
                                {(data.deepDive ?? []).map((item) => {
                                    const content = (
                                        <>
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1E7DF]">
                                                    {item.title}
                                                </h3>
                                                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                                    {item.type}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-slate-600 dark:text-[#D5C6BC]">
                                                {item.reason}
                                            </p>

                                            {item.snippet ? (
                                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-[#B8AAA1]">
                                                    {item.snippet}
                                                </p>
                                            ) : null}

                                            {item.url ? (
                                                <p className="mt-3 text-sm text-slate-500 dark:text-[#A89B92]">
                                                    {item.url}
                                                </p>
                                            ) : (
                                                <p className="mt-3 text-sm italic text-slate-500 dark:text-[#A89B92]">
                                                    No external link available
                                                </p>
                                            )}
                                        </>
                                    );

                                    return item.url ? (
                                        <a
                                            key={`${item.title}-${item.url}`}
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-300 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B]"
                                        >
                                            {content}
                                        </a>
                                    ) : (
                                        <div
                                            key={item.title}
                                            className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-[#4C4541] dark:bg-[#2F2A28]"
                                        >
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Next step</h2>
                            <p className="mt-4 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                {data.lesson.next_step}
                            </p>
                        </div>
                    </aside>
                </section>

                <StreamingLesson
                    key={data.id ?? `${data.topic}-${data.level}`}
                    topic={data.topic}
                    level={data.level}
                    initialContent={streamedLesson}
                    onContentChange={setStreamedLesson}
                />

                <CurriculumCtaCard
                    isCreatingCurriculum={isCreatingCurriculum}
                    selectedDuration={selectedDuration}
                    curriculumMessage={curriculumMessage}
                    onCreateCurriculum={handleCreateCurriculum}
                />
            </div>
        </main>
    );
}