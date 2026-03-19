// apps/web/components/learn-page-client.tsx

"use client";

import { useEffect, useState } from "react";
import StreamingLesson from "@/components/streaming-lesson";
// import AuthButton from "@/components/auth/auth-button";
import SaveLessonButton from "@/components/save-lesson-button";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { config } from "@/lib/config";
import { getSavedLessonById, saveLesson } from "@/lib/lessons-api";
import type { TopicLevel } from "@/types/topic";
import type { LessonData, SavedLesson } from "@/types/lesson";
// import HomeButton from "@/components/home-button";
import CurriculumCtaCard from "@/components/curriculum-cta-card";
import { useRouter } from "next/navigation";
import { createCurriculum, getCurriculaByLesson } from "@/lib/curricula-api";
import ResumeCurriculumCard from "@/components/resume-curriculum-card";
import type { Curriculum } from "@/types/curriculum";
import PageShell from "@/components/page-shell";
import MarkdownContent from "@/components/markdown-content";

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

    const [currentGenerationMessage, setCurrentGenerationMessage] = useState("");

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
                setCurrentGenerationMessage("");

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
                        Accept: "text/event-stream",
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

                if (!res.body) {
                    throw new Error("No response body returned from lesson generation");
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let finalResult: LessonData | null = null;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    const events = buffer.split("\n\n");
                    buffer = events.pop() || "";

                    for (const eventChunk of events) {
                        const lines = eventChunk.split("\n");
                        const dataLine = lines.find((line) => line.startsWith("data: "));
                        if (!dataLine) continue;

                        const raw = dataLine.replace(/^data:\s*/, "");

                        try {
                            const event = JSON.parse(raw) as
                                | { type: "status"; message: string }
                                | { type: "done"; data: LessonData }
                                | { type: "error"; message: string };

                            if (event.type === "status") {
                                if (!cancelled) {
                                    setCurrentGenerationMessage(event.message);
                                }
                                continue;
                            }

                            if (event.type === "done") {
                                finalResult = event.data;
                                continue;
                            }

                            if (event.type === "error") {
                                throw new Error(event.message || "Failed to generate lesson");
                            }
                        } catch (parseError) {
                            console.error(
                                "Failed to parse lesson stream event:",
                                parseError,
                                raw
                            );
                        }
                    }
                }

                if (!finalResult) {
                    throw new Error("Lesson generation ended without a final result");
                }

                if (!cancelled) {
                    setData(finalResult);
                    setStreamedLesson(finalResult.streamedLesson ?? "");

                    if (finalResult.id) {
                        const curricula = await getCurriculaByLesson(finalResult.id, token);
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
            <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        DeepDaily
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold">
                        {isSavedLessonMode
                            ? "Loading saved lesson..."
                            : "Generating your lesson..."}
                    </h1>

                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                        {isSavedLessonMode
                            ? "Please wait while DeepDaily loads your saved lesson."
                            : "Please wait while DeepDaily prepares your learning path."}
                    </p>

                    <div className="mt-8 flex justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                    </div>

                    {!isSavedLessonMode && currentGenerationMessage ? (
                        <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-900/30 dark:bg-teal-950/10">
                            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                Live progress
                            </p>

                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/60 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                                <span>{currentGenerationMessage}</span>
                            </div>
                        </div>
                    ) : null}
                </div>
            </PageShell>
        );
    }

    if (!user) {
        return (
            <>
                <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

                    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                            DeepDaily
                        </p>

                        <h1 className="mt-3 text-2xl font-semibold">Sign in required</h1>
                        <p className="mt-3 text-slate-600 dark:text-slate-300">
                            Please sign in to generate and view lessons.
                        </p>
                    </div>
                </PageShell>

                <LoginRequiredModal
                    open={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                />
            </>
        );
    }

    if (error || !data) {
        return (
            <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#111827]">
                    <h1 className="text-2xl font-semibold">
                        {isSavedLessonMode
                            ? "Could not load saved lesson"
                            : "Could not generate lesson"}
                    </h1>
                    <p className="mt-3 text-red-600 dark:text-red-400">
                        {error || "Unknown error"}
                    </p>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">
            <div className="mx-auto max-w-6xl space-y-8">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                    <div className="border-b border-teal-100 bg-linear-to-r from-teal-50 via-white to-cyan-50 p-8 dark:border-teal-900/30 dark:from-teal-950/30 dark:via-[#111827] dark:to-cyan-950/20">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                                    DeepDaily lesson
                                </p>

                                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                    {data.lesson.title}
                                </h1>

                                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                    Topic:{" "}
                                    <span className="font-medium text-slate-800 dark:text-slate-100">
                                        {data.topic}
                                    </span>
                                    {" · "}
                                    Level:{" "}
                                    <span className="font-medium capitalize text-slate-800 dark:text-slate-100">
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
                    </div>

                    <div className="p-8">
                        <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5 dark:border-teal-900/30 dark:bg-teal-950/10">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                Today&apos;s focus
                            </h2>
                            <p className="mt-2 text-base text-slate-900 dark:text-slate-100">
                                {data.lesson.today_focus}
                            </p>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Summary
                            </h2>
                            <div className="mt-3">
                                <MarkdownContent
                                    content={data.lesson.summary}
                                    className="text-slate-700 dark:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {existingCurricula.length > 0 ? (
                    <ResumeCurriculumCard curricula={existingCurricula} />
                ) : null}

                <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Lesson sections
                            </h2>

                            <div className="mt-6 space-y-6">
                                {data.lesson.sections.map((section) => (
                                    <article
                                        key={section.title}
                                        className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10"
                                    >
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {section.title}
                                        </h3>
                                        <div className="mt-2">
                                            <MarkdownContent
                                                content={section.content}
                                                className="text-slate-700 dark:text-slate-300"
                                            />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Resources
                            </h2>

                            <div className="mt-6 space-y-4">
                                {data.resources.map((resource) => (
                                    <a
                                        key={`${resource.title}-${resource.url}`}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {resource.title}
                                            </h3>
                                            <span
                                                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                                                style={{
                                                    borderColor: "var(--accent-border)",
                                                    background: "var(--accent-soft)",
                                                    color: "var(--accent)",
                                                }}
                                            >
                                                {resource.type}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                                            {resource.reason}
                                        </p>

                                        {resource.snippet ? (
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                {resource.snippet}
                                            </p>
                                        ) : null}

                                        <p className="mt-3 break-all text-sm text-slate-500 dark:text-slate-400">
                                            {resource.url}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-8 pr-1 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Roadmap
                            </h2>

                            <ol className="mt-6 space-y-3">
                                {data.roadmap.map((item, index) => (
                                    <li
                                        key={`${index}-${item}`}
                                        className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60"
                                    >
                                        <span
                                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                                            style={{
                                                background: "var(--accent)",
                                                color: "white",
                                            }}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="leading-6 text-slate-700 dark:text-slate-300">
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

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Deep dive
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                Books and advanced material to continue beyond today’s lesson.
                            </p>

                            <div className="mt-6 space-y-4">
                                {(data.deepDive ?? []).map((item) => {
                                    const content = (
                                        <>
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {item.title}
                                                </h3>
                                                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                                    {item.type}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-slate-600 dark:text-slate-300">
                                                {item.reason}
                                            </p>

                                            {item.snippet ? (
                                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                    {item.snippet}
                                                </p>
                                            ) : null}

                                            {item.url ? (
                                                <p className="mt-3 break-all text-sm text-slate-500 dark:text-slate-400">
                                                    {item.url}
                                                </p>
                                            ) : (
                                                <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
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
                                            className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900"
                                        >
                                            {content}
                                        </a>
                                    ) : (
                                        <div
                                            key={item.title}
                                            className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60"
                                        >
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Next step
                            </h2>
                            <div className="mt-4">
                                <MarkdownContent
                                    content={data.lesson.next_step}
                                    className="text-slate-700 dark:text-slate-300"
                                />
                            </div>
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
        </PageShell>
    );
}