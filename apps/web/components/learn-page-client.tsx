// apps/web/components/learn-page-client.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import StreamingLesson from "@/components/streaming-lesson";
import SaveLessonButton from "@/components/save-lesson-button";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { config } from "@/lib/config";
import { getSavedLessonById, saveLesson, updateLesson } from "@/lib/lessons-api";
import type { TopicLevel } from "@/types/topic";
import type { LessonData, SavedLesson } from "@/types/lesson";
import CurriculumCtaCard from "@/components/curriculum-cta-card";
import { useRouter } from "next/navigation";
import {
    createCurriculum,
    getCurriculaByLesson,
    streamCurriculumResourceSummary,
} from "@/lib/curricula-api";
import ResumeCurriculumCard from "@/components/resume-curriculum-card";
import type { Curriculum } from "@/types/curriculum";
import PageShell from "@/components/page-shell";
import MarkdownContent from "@/components/markdown-content";
import SectionAudioButton from "@/components/section-audio-button";

type ResourceSummaryState = {
    summary?: string;
    isLoading: boolean;
    isComplete?: boolean;
    statusMessage?: string;
    error?: string;
};

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

function getYouTubeVideoId(url?: string | null): string | null {
    if (!url) return null;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace("www.", "");

        if (host === "youtu.be") {
            return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
        }

        if (host === "youtube.com" || host === "m.youtube.com") {
            if (parsed.pathname === "/watch") {
                return parsed.searchParams.get("v");
            }

            if (parsed.pathname.startsWith("/embed/")) {
                return parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? null;
            }

            if (parsed.pathname.startsWith("/shorts/")) {
                return parsed.pathname.split("/shorts/")[1]?.split("/")[0] ?? null;
            }
        }

        return null;
    } catch {
        return null;
    }
}

function getYouTubeThumbnail(url?: string | null): string | null {
    const id = getYouTubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function getYouTubeEmbedUrl(url?: string | null): string | null {
    const id = getYouTubeVideoId(url);
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}

type ResourceCardProps = {
    title: string;
    type: string;
    reason: string;
    snippet?: string | null;
    url?: string | null;
    summary?: string;
    summaryError?: string;
    isSummarizing?: boolean;
    isSummaryComplete?: boolean;
    summaryStatusMessage?: string;
    onSummarize?: () => void;
    audioTitle?: string;
};

function ResourceCard({
    title,
    type,
    reason,
    snippet,
    url,
    summary,
    summaryError,
    isSummarizing,
    isSummaryComplete,
    summaryStatusMessage,
    onSummarize,
    audioTitle,
}: ResourceCardProps) {
    const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
    const youtubeThumbnail = getYouTubeThumbnail(url);
    const isYouTube = Boolean(youtubeEmbedUrl);

    const normalizedType = type.trim().toLowerCase();
    const canSummarize =
        !isYouTube &&
        Boolean(url) &&
        (normalizedType.includes("article") ||
            normalizedType.includes("blog") ||
            normalizedType.includes("guide") ||
            normalizedType.includes("documentation") ||
            normalizedType.includes("web"));

    return (
        <div className="dd-surface-soft rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm dark:hover:border-teal-500/20 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <h3
                    dir="auto"
                    className="text-base font-semibold leading-tight text-slate-900 dark:text-white sm:text-lg"
                >
                    {title}
                </h3>

                <span
                    dir="auto"
                    className="w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide sm:text-xs"
                    style={{
                        borderColor: "var(--accent-border)",
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                    }}
                >
                    {type}
                </span>
            </div>

            <p className="mt-2 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                {reason}
            </p>

            {snippet ? (
                <p
                    dir="auto"
                    className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base"
                >
                    {snippet}
                </p>
            ) : null}

            {canSummarize ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onSummarize}
                        disabled={isSummarizing}
                        className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300 dark:hover:bg-teal-950/30"
                    >
                        {isSummarizing ? "Summarizing..." : "Summarize"}
                    </button>
                </div>
            ) : null}

            {summary ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-teal-200/70 bg-teal-50/50 px-4 py-3 dark:border-teal-900/30 dark:bg-teal-950/10">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                            Summary
                        </p>

                        {isSummarizing ? (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {summaryStatusMessage || "Summarizing..."}
                            </span>
                        ) : null}
                    </div>

                    <MarkdownContent
                        content={summary}
                        className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 [&_p]:my-0"
                    />

                    {isSummaryComplete ? (
                        <SectionAudioButton
                            title={audioTitle || `${title} summary`}
                            content={summary}
                        />
                    ) : null}
                </div>
            ) : null}

            {summaryError ? (
                <div className="mt-4 rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:text-red-400">
                    {summaryError}
                </div>
            ) : null}

            {isYouTube && youtubeEmbedUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-white/10">
                    <div className="aspect-video w-full">
                        <iframe
                            className="h-full w-full"
                            src={youtubeEmbedUrl}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                </div>
            ) : url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-xs font-medium text-teal-700 underline underline-offset-2 dark:text-teal-300 sm:text-sm"
                >
                    Open resource
                </a>
            ) : (
                <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
                    No external link available
                </p>
            )}

            {url ? (
                <p
                    dir="auto"
                    className="mt-3 break-all text-[10px] text-slate-500 opacity-60 dark:text-slate-400 sm:text-sm"
                >
                    {url}
                </p>
            ) : null}
        </div>
    );
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

    const isAutoSavingStreamRef = useRef(false);
    const lastAutoSavedStreamRef = useRef("");

    const curriculumRef = useRef<HTMLDivElement | null>(null);
    const resumeCurriculumRef = useRef<HTMLDivElement | null>(null);

    const has7DayCurriculum = existingCurricula.some(
        (curriculum) => curriculum.durationDays === 7
    );

    const has30DayCurriculum = existingCurricula.some(
        (curriculum) => curriculum.durationDays === 30
    );

    const [resourceSummaries, setResourceSummaries] = useState<
        Record<string, ResourceSummaryState>
    >({});


    const router = useRouter();

    useEffect(() => {
        if (data?.streamedLesson) {
            lastAutoSavedStreamRef.current = data.streamedLesson;
        }
    }, [data?.id]);

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

                        const curricula = await getCurriculaByLesson(
                            savedLesson.id,
                            token
                        );
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
                        const dataLine = lines.find((line) =>
                            line.startsWith("data: ")
                        );
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
                                throw new Error(
                                    event.message || "Failed to generate lesson"
                                );
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
                        const curricula = await getCurriculaByLesson(
                            finalResult.id,
                            token
                        );
                        setExistingCurricula(curricula);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load lesson"
                    );
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

    async function handleSummarizeResource(
        resourceKey: string,
        resource: {
            title: string;
            type?: string | null;
            url?: string | null;
            snippet?: string | null;
            reason?: string | null;
        }
    ) {
        if (!user || !data) return;

        setResourceSummaries((prev) => ({
            ...prev,
            [resourceKey]: {
                summary: "",
                isLoading: true,
                isComplete: false,
                statusMessage: "Starting...",
                error: undefined,
            },
        }));

        try {
            const token = await user.getIdToken();

            const lessonScopedId = savedLessonId ?? data.id;
            if (!lessonScopedId) {
                throw new Error("Lesson must be saved before summarizing resources.");
            }

            const result = await streamCurriculumResourceSummary(
                {
                    curriculumId: lessonScopedId,
                    dayNumber: 1,
                    resource: {
                        title: resource.title,
                        type: resource.type,
                        url: resource.url,
                        snippet: resource.snippet,
                        reason: resource.reason,
                    },
                },
                token,
                {
                    onStatus: (message) => {
                        setResourceSummaries((prev) => ({
                            ...prev,
                            [resourceKey]: {
                                ...prev[resourceKey],
                                statusMessage: message,
                            },
                        }));
                    },
                    onChunk: (chunk) => {
                        setResourceSummaries((prev) => ({
                            ...prev,
                            [resourceKey]: {
                                ...prev[resourceKey],
                                summary: (prev[resourceKey]?.summary || "") + chunk,
                            },
                        }));
                    },
                }
            );

            setResourceSummaries((prev) => ({
                ...prev,
                [resourceKey]: {
                    summary: result.summary,
                    isLoading: false,
                    isComplete: true,
                    statusMessage: undefined,
                    error: undefined,
                },
            }));
        } catch (err) {
            setResourceSummaries((prev) => ({
                ...prev,
                [resourceKey]: {
                    ...prev[resourceKey],
                    isLoading: false,
                    isComplete: false,
                    statusMessage: undefined,
                    error:
                        err instanceof Error
                            ? err.message
                            : "Failed to summarize this resource.",
                },
            }));
        }
    }

    async function autoSaveStreamedLesson(finalStreamedLesson: string) {
        console.log("[autoSave] called", {
            hasUser: Boolean(user),
            hasData: Boolean(data),
            savedLessonId,
            currentDataId: data?.id,
            length: finalStreamedLesson.length,
            preview: finalStreamedLesson.slice(0, 120),
        });

        if (!user || !data) {
            console.log("[autoSave] skipped: missing user or data");
            return;
        }

        if (!finalStreamedLesson.trim()) {
            console.log("[autoSave] skipped: empty content");
            return;
        }

        if (isAutoSavingStreamRef.current) {
            console.log("[autoSave] skipped: already saving");
            return;
        }

        if (lastAutoSavedStreamRef.current === finalStreamedLesson) {
            console.log("[autoSave] skipped: same content already saved");
            return;
        }

        try {
            isAutoSavingStreamRef.current = true;

            const token = await user.getIdToken();

            const lessonToSave = {
                ...data,
                id: savedLessonId ?? data.id,
                streamedLesson: finalStreamedLesson,
            };

            const isUpdate = Boolean(lessonToSave.id);

            console.log("[autoSave] request", {
                mode: isUpdate ? "update" : "save",
                id: lessonToSave.id,
                topic: lessonToSave.topic,
                level: lessonToSave.level,
                streamedLessonLength: lessonToSave.streamedLesson?.length ?? 0,
            });

            const result = isUpdate
                ? await updateLesson(lessonToSave.id as string, lessonToSave, token)
                : await saveLesson(lessonToSave, token);

            console.log("[autoSave] success", {
                mode: isUpdate ? "update" : "save",
                returnedId: result.id,
            });

            lastAutoSavedStreamRef.current = finalStreamedLesson;
            setSavedLessonId(result.id);
            setStreamedLesson(finalStreamedLesson);
            setData((prev) =>
                prev
                    ? {
                        ...prev,
                        id: result.id,
                        streamedLesson: finalStreamedLesson,
                    }
                    : prev
            );

            window.dispatchEvent(new Event("lessons:refresh"));

            console.log("[autoSave] local state updated", {
                savedLessonId: result.id,
                streamedLessonLength: finalStreamedLesson.length,
            });
        } catch (error) {
            console.error("[autoSave] failed", error);
        } finally {
            isAutoSavingStreamRef.current = false;
        }
    }

    function scrollToNextStep() {
        const targetRef =
            existingCurricula.length > 0 ? resumeCurriculumRef : curriculumRef;

        targetRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    if (loading) {
        return (
            <PageShell className="px-6 py-12 pt-20">
                <div className="dd-surface dd-surface-top-line mx-auto max-w-3xl rounded-3xl border p-8 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        DeepDaily
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold">
                        {isSavedLessonMode
                            ? "Loading saved lesson..."
                            : "Designing your learning path…"}
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
                        <div className="dd-surface-soft mt-8 rounded-2xl border p-4">
                            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                Live progress
                            </p>

                            <div className="dd-surface mt-3 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
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
                <PageShell className="px-6 py-12 pt-20">
                    <div className="dd-surface dd-surface-top-line mx-auto max-w-3xl rounded-3xl border p-8 shadow-sm">
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
            <PageShell className="px-6 py-12 pt-20">
                <div className="dd-surface mx-auto max-w-3xl rounded-3xl border border-red-200 p-8 shadow-sm dark:border-red-900/40">
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
        <>
            <PageShell className="px-4 py-8 pt-8 sm:px-6 sm:py-12 sm:pt-16">
                <div className="mx-auto max-w-6xl space-y-6 pt-4 sm:space-y-8 sm:pt-6 lg:pt-10">
                    <section
                        dir="auto"
                        className="dd-surface dd-surface-top-line overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl"
                    >
                        <div className="border-b border-slate-200 p-5 dark:border-white/10 sm:p-8">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-2">
                                    <p
                                        dir="auto"
                                        className="text-start text-[10px] font-medium uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300 sm:text-sm"
                                    >
                                        DeepDaily lesson
                                    </p>

                                    <h1
                                        dir="auto"
                                        className="text-start text-2xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                                    >
                                        {data.lesson.title}
                                    </h1>

                                    <div
                                        dir="auto"
                                        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm"
                                    >
                                        <p dir="auto" className="text-start">
                                            Topic:{" "}
                                            <span className="font-medium text-slate-800 dark:text-slate-100">
                                                {data.topic}
                                            </span>
                                        </p>

                                        <span className="hidden text-slate-300 sm:inline">|</span>

                                        <p dir="auto" className="text-start">
                                            Level:{" "}
                                            <span className="font-medium capitalize text-slate-800 dark:text-slate-100">
                                                {data.level}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 self-start sm:block">
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
                        </div>

                        <div className="p-5 sm:p-8">
                            <div
                                dir="auto"
                                className="dd-surface-soft rounded-xl border p-4 sm:p-5"
                            >
                                <h2
                                    dir="auto"
                                    className="text-start text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300 sm:text-xs"
                                >
                                    Today&apos;s focus
                                </h2>

                                <div className="dd-surface-soft mt-6 rounded-xl border p-4 sm:p-5">
                                    <h2 className="text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300 sm:text-xs">
                                        Start here
                                    </h2>

                                    <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 sm:text-base">
                                        <li>1. Read today’s focus</li>
                                        <li>2. Go through the lesson sections</li>
                                        <li>3. Explore 1–2 resources</li>
                                    </ul>

                                    <button
                                        onClick={scrollToNextStep}
                                        className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #19c2b3 0%, #0f8f86 100%)",
                                        }}
                                    >
                                        {existingCurricula.length > 0
                                            ? "Continue your curriculum"
                                            : "Start today’s lesson"}
                                    </button>
                                </div>

                                <p
                                    dir="auto"
                                    className="mt-4 text-start text-base text-slate-900 dark:text-slate-100 sm:text-lg"
                                >
                                    {data.lesson.today_focus}
                                </p>
                            </div>

                            <div className="mt-8">
                                <h2
                                    dir="auto"
                                    className="text-start text-lg font-semibold text-slate-900 dark:text-white sm:text-xl"
                                >
                                    Summary
                                </h2>

                                <div className="prose prose-base mt-3 max-w-none dark:prose-invert sm:prose-lg">
                                    <MarkdownContent
                                        content={data.lesson.summary}
                                        className="text-base text-slate-700 dark:text-slate-300 sm:text-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {existingCurricula.length > 0 && (
                        <div className="px-1 sm:px-0">
                            <ResumeCurriculumCard
                                curricula={existingCurricula}
                                containerRef={resumeCurriculumRef}
                            />
                        </div>
                    )}

                    <section className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
                        <div className="space-y-6 sm:space-y-8">
                            <div className="dd-surface dd-surface-top-line rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-8">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                                    Lesson sections
                                </h2>

                                <div className="mt-6 space-y-4 sm:space-y-6">
                                    {data.lesson.sections.map((section) => (
                                        <article
                                            key={section.title}
                                            className="dd-surface-soft rounded-xl border p-4 transition hover:border-teal-200 dark:hover:border-teal-500/20 sm:p-5"
                                        >
                                            <h3
                                                dir="auto"
                                                className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg"
                                            >
                                                {section.title}
                                            </h3>

                                            <div className="prose prose-base mt-2 max-w-none dark:prose-invert sm:prose-lg">
                                                <MarkdownContent
                                                    content={section.content}
                                                    className="text-slate-700 dark:text-slate-300"
                                                />
                                            </div>

                                            <SectionAudioButton
                                                title={section.title}
                                                content={section.content}
                                            />
                                        </article>
                                    ))}
                                </div>
                            </div>

                            <div className="dd-surface dd-surface-top-line rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-8">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                                    Resources
                                </h2>
                                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                                    Curated links to reinforce today&apos;s lesson.
                                </p>

                                <div className="mt-6 space-y-4">
                                    {data.resources.map((resource, index) => {
                                        const resourceKey = `resources-${index}-${resource.title}-${resource.url ?? "no-url"}`;
                                        const summaryState = resourceSummaries[resourceKey];

                                        return (
                                            <ResourceCard
                                                key={resourceKey}
                                                {...resource}
                                                audioTitle={`${resource.title} summary`}
                                                summary={summaryState?.summary}
                                                summaryError={summaryState?.error}
                                                isSummarizing={summaryState?.isLoading}
                                                isSummaryComplete={summaryState?.isComplete}
                                                summaryStatusMessage={summaryState?.statusMessage}
                                                onSummarize={() =>
                                                    handleSummarizeResource(resourceKey, {
                                                        title: resource.title,
                                                        type: resource.type,
                                                        url: resource.url,
                                                        snippet: resource.snippet,
                                                        reason: resource.reason,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <aside className="space-y-6 sm:space-y-8">
                            <div className="dd-surface dd-surface-top-line rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-8">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                                    Roadmap
                                </h2>

                                <ol className="mt-6 space-y-3 sm:space-y-4">
                                    {data.roadmap.map((item, index) => (
                                        <li
                                            key={`${item}-${index}`}
                                            className="dd-surface-soft flex items-start gap-3 rounded-xl border px-4 py-3 sm:px-5 sm:py-4"
                                        >
                                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 sm:h-7 sm:w-7 sm:text-sm">
                                                {index + 1}
                                            </span>

                                            <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="dd-surface dd-surface-top-line rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-8">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                                    Deep dive
                                </h2>
                                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                                    Books and advanced material to continue beyond today&apos;s
                                    lesson.
                                </p>

                                <div className="mt-6 space-y-4">
                                    {(data.deepDive ?? []).map((item, index) => {
                                        const resourceKey = `deepdive-${index}-${item.title}-${item.url ?? item.type ?? "no-url"}`;
                                        const summaryState = resourceSummaries[resourceKey];

                                        return (
                                            <ResourceCard
                                                key={resourceKey}
                                                {...item}
                                                audioTitle={`${item.title} summary`}
                                                summary={summaryState?.summary}
                                                summaryError={summaryState?.error}
                                                isSummarizing={summaryState?.isLoading}
                                                isSummaryComplete={summaryState?.isComplete}
                                                summaryStatusMessage={summaryState?.statusMessage}
                                                onSummarize={() =>
                                                    handleSummarizeResource(resourceKey, {
                                                        title: item.title,
                                                        type: item.type,
                                                        url: item.url,
                                                        snippet: item.snippet,
                                                        reason: item.reason,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="hidden px-0 lg:block">
                                <CurriculumCtaCard
                                    compact
                                    curricula={existingCurricula}
                                    has7DayCurriculum={has7DayCurriculum}
                                    has30DayCurriculum={has30DayCurriculum}
                                    isCreatingCurriculum={isCreatingCurriculum}
                                    selectedDuration={selectedDuration}
                                    curriculumMessage={curriculumMessage}
                                    onCreateCurriculum={handleCreateCurriculum}
                                />
                            </div>

                            <div className="dd-surface dd-surface-top-line rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-8">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                                    Next step
                                </h2>
                                <div className="prose prose-sm mt-4 dark:prose-invert">
                                    <MarkdownContent
                                        content={data.lesson.next_step}
                                        className="text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                            </div>
                        </aside>
                    </section>

                    <div className="overflow-hidden rounded-2xl">
                        <StreamingLesson
                            key={data.id ?? `${data.topic}-${data.level}`}
                            topic={data.topic}
                            level={data.level}
                            initialContent={streamedLesson}
                            onContentChange={setStreamedLesson}
                            onComplete={async (finalContent) => {
                                console.log("[StreamingLesson -> parent] onComplete fired", {
                                    length: finalContent.length,
                                    preview: finalContent.slice(0, 120),
                                });

                                setStreamedLesson(finalContent);
                                await autoSaveStreamedLesson(finalContent);

                                console.log("[StreamingLesson -> parent] onComplete finished");
                            }}
                        />
                    </div>

                    <CurriculumCtaCard
                        compact
                        curricula={existingCurricula}
                        has7DayCurriculum={has7DayCurriculum}
                        has30DayCurriculum={has30DayCurriculum}
                        containerRef={curriculumRef}
                        isCreatingCurriculum={isCreatingCurriculum}
                        selectedDuration={selectedDuration}
                        curriculumMessage={curriculumMessage}
                        onCreateCurriculum={handleCreateCurriculum}
                    />
                </div>
            </PageShell>

            <LoginRequiredModal
                open={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
        </>
    );
}

// "use client";

// import { useEffect, useRef, useState } from "react";
// import StreamingLesson from "@/components/streaming-lesson";
// import SaveLessonButton from "@/components/save-lesson-button";
// import LoginRequiredModal from "@/components/auth/login-required-modal";
// import { useAuth } from "@/components/providers/auth-provider";
// import { config } from "@/lib/config";
// import { getSavedLessonById, saveLesson, updateLesson } from "@/lib/lessons-api";
// import type { TopicLevel } from "@/types/topic";
// import type { LessonData, SavedLesson } from "@/types/lesson";
// import CurriculumCtaCard from "@/components/curriculum-cta-card";
// import { useRouter } from "next/navigation";
// import { createCurriculum, getCurriculaByLesson } from "@/lib/curricula-api";
// import ResumeCurriculumCard from "@/components/resume-curriculum-card";
// import type { Curriculum } from "@/types/curriculum";
// import PageShell from "@/components/page-shell";
// import MarkdownContent from "@/components/markdown-content";

// type Props =
//     | {
//         topic: string;
//         level: TopicLevel;
//         lessonId?: never;
//     }
//     | {
//         lessonId: string;
//         topic?: never;
//         level?: never;
//     };

// function normalizeSavedLesson(savedLesson: SavedLesson): LessonData {
//     return {
//         id: savedLesson.id,
//         topic: savedLesson.topic,
//         level: savedLesson.level,
//         roadmap: savedLesson.roadmap,
//         lesson: savedLesson.lesson,
//         resources: savedLesson.resources,
//         deepDive: savedLesson.deepDive ?? [],
//         streamedLesson: savedLesson.streamedLesson ?? "",
//     };
// }

// function getYouTubeVideoId(url?: string | null): string | null {
//     if (!url) return null;

//     try {
//         const parsed = new URL(url);
//         const host = parsed.hostname.replace("www.", "");

//         if (host === "youtu.be") {
//             return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
//         }

//         if (host === "youtube.com" || host === "m.youtube.com") {
//             if (parsed.pathname === "/watch") {
//                 return parsed.searchParams.get("v");
//             }

//             if (parsed.pathname.startsWith("/embed/")) {
//                 return parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? null;
//             }

//             if (parsed.pathname.startsWith("/shorts/")) {
//                 return parsed.pathname.split("/shorts/")[1]?.split("/")[0] ?? null;
//             }
//         }

//         return null;
//     } catch {
//         return null;
//     }
// }

// function getYouTubeThumbnail(url?: string | null): string | null {
//     const id = getYouTubeVideoId(url);
//     return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
// }

// function getYouTubeEmbedUrl(url?: string | null): string | null {
//     const id = getYouTubeVideoId(url);
//     return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
// }

// type ResourceCardProps = {
//     title: string;
//     type: string;
//     reason: string;
//     snippet?: string | null;
//     url?: string | null;
// };

// function ResourceCard({
//     title,
//     type,
//     reason,
//     snippet,
//     url,
// }: ResourceCardProps) {
//     const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
//     const youtubeThumbnail = getYouTubeThumbnail(url);
//     const isYouTube = Boolean(youtubeEmbedUrl);

//     return (
//         <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900">

//             <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
//                 <h3 dir="auto" className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight">
//                     {title}
//                 </h3>

//                 <span
//                     dir="auto"
//                     className="w-fit rounded-full border px-2.5 py-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide"
//                     style={{
//                         borderColor: "var(--accent-border)",
//                         background: "var(--accent-soft)",
//                         color: "var(--accent)",
//                     }}
//                 >
//                     {type}
//                 </span>
//             </div>

//             <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-300">{reason}</p>

//             {snippet ? (
//                 <p dir="auto" className="mt-3 line-clamp-3 text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400">
//                     {snippet}
//                 </p>
//             ) : null}

//             {isYouTube && youtubeEmbedUrl ? (
//                 <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
//                     <div className="aspect-video w-full">
//                         <iframe
//                             className="h-full w-full"
//                             src={youtubeEmbedUrl}
//                             title={title}
//                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//                             allowFullScreen
//                         />
//                     </div>
//                 </div>
//             ) : url ? (
//                 <a
//                     href={url}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="mt-4 inline-flex text-xs sm:text-sm font-medium text-teal-700 underline underline-offset-2 dark:text-teal-300"
//                 >
//                     Open resource
//                 </a>
//             ) : (
//                 <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
//                     No external link available
//                 </p>
//             )}

//             {url ? (
//                 <p dir="auto" className="mt-3 break-all text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 opacity-60">
//                     {url}
//                 </p>
//             ) : null}
//         </div>
//     );
// }

// export default function LearnPageClient(props: Props) {
//     const { user, loading: authLoading } = useAuth();

//     const isSavedLessonMode = "lessonId" in props;
//     const lessonId = "lessonId" in props ? props.lessonId : undefined;
//     const topic = "topic" in props ? props.topic : undefined;
//     const level = "level" in props ? props.level : undefined;

//     const [streamedLesson, setStreamedLesson] = useState("");
//     const [data, setData] = useState<LessonData | null>(null);
//     const [savedLessonId, setSavedLessonId] = useState<string | null>(
//         lessonId ?? null
//     );

//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(true);
//     const [showLoginModal, setShowLoginModal] = useState(false);

//     const [isCreatingCurriculum, setIsCreatingCurriculum] = useState(false);
//     const [selectedDuration, setSelectedDuration] = useState<7 | 30 | null>(null);
//     const [curriculumMessage, setCurriculumMessage] = useState("");
//     const [existingCurricula, setExistingCurricula] = useState<Curriculum[]>([]);

//     const [currentGenerationMessage, setCurrentGenerationMessage] = useState("");

//     const isAutoSavingStreamRef = useRef(false);
//     const lastAutoSavedStreamRef = useRef("");

//     const curriculumRef = useRef<HTMLDivElement | null>(null);
//     const resumeCurriculumRef = useRef<HTMLDivElement | null>(null);

//     const has7DayCurriculum = existingCurricula.some(
//         (curriculum) => curriculum.durationDays === 7
//     );

//     const has30DayCurriculum = existingCurricula.some(
//         (curriculum) => curriculum.durationDays === 30
//     );

//     const router = useRouter();

//     useEffect(() => {
//         if (data?.streamedLesson) {
//             lastAutoSavedStreamRef.current = data.streamedLesson;
//         }
//     }, [data?.id]);

//     useEffect(() => {
//         let cancelled = false;

//         async function load() {
//             if (authLoading) return;

//             if (!user) {
//                 setShowLoginModal(true);
//                 setLoading(false);
//                 return;
//             }

//             try {
//                 setLoading(true);
//                 setError("");
//                 setCurrentGenerationMessage("");

//                 const token = await user.getIdToken();

//                 if (isSavedLessonMode && lessonId) {
//                     const savedLesson = await getSavedLessonById(lessonId, token);

//                     if (!cancelled) {
//                         const normalized = normalizeSavedLesson(savedLesson);
//                         setData(normalized);
//                         setStreamedLesson(normalized.streamedLesson ?? "");
//                         setSavedLessonId(savedLesson.id);

//                         const curricula = await getCurriculaByLesson(
//                             savedLesson.id,
//                             token
//                         );
//                         setExistingCurricula(curricula);
//                     }

//                     return;
//                 }

//                 const res = await fetch(`${config.apiBaseUrl}/lessons/generate`, {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Bearer ${token}`,
//                         Accept: "text/event-stream",
//                     },
//                     body: JSON.stringify({ topic, level }),
//                 });

//                 const contentType = res.headers.get("content-type") || "";

//                 if (!res.ok) {
//                     if (contentType.includes("application/json")) {
//                         const errData = await res.json();
//                         throw new Error(errData.detail || "Failed to generate lesson");
//                     }
//                     throw new Error(`Failed to generate lesson (${res.status})`);
//                 }

//                 if (!res.body) {
//                     throw new Error("No response body returned from lesson generation");
//                 }

//                 const reader = res.body.getReader();
//                 const decoder = new TextDecoder();
//                 let buffer = "";
//                 let finalResult: LessonData | null = null;

//                 while (true) {
//                     const { done, value } = await reader.read();
//                     if (done) break;

//                     buffer += decoder.decode(value, { stream: true });

//                     const events = buffer.split("\n\n");
//                     buffer = events.pop() || "";

//                     for (const eventChunk of events) {
//                         const lines = eventChunk.split("\n");
//                         const dataLine = lines.find((line) =>
//                             line.startsWith("data: ")
//                         );
//                         if (!dataLine) continue;

//                         const raw = dataLine.replace(/^data:\s*/, "");

//                         try {
//                             const event = JSON.parse(raw) as
//                                 | { type: "status"; message: string }
//                                 | { type: "done"; data: LessonData }
//                                 | { type: "error"; message: string };

//                             if (event.type === "status") {
//                                 if (!cancelled) {
//                                     setCurrentGenerationMessage(event.message);
//                                 }
//                                 continue;
//                             }

//                             if (event.type === "done") {
//                                 finalResult = event.data;
//                                 continue;
//                             }

//                             if (event.type === "error") {
//                                 throw new Error(
//                                     event.message || "Failed to generate lesson"
//                                 );
//                             }
//                         } catch (parseError) {
//                             console.error(
//                                 "Failed to parse lesson stream event:",
//                                 parseError,
//                                 raw
//                             );
//                         }
//                     }
//                 }

//                 if (!finalResult) {
//                     throw new Error("Lesson generation ended without a final result");
//                 }

//                 if (!cancelled) {
//                     setData(finalResult);
//                     setStreamedLesson(finalResult.streamedLesson ?? "");

//                     if (finalResult.id) {
//                         const curricula = await getCurriculaByLesson(
//                             finalResult.id,
//                             token
//                         );
//                         setExistingCurricula(curricula);
//                     }
//                 }
//             } catch (err) {
//                 if (!cancelled) {
//                     setError(
//                         err instanceof Error ? err.message : "Failed to load lesson"
//                     );
//                 }
//             } finally {
//                 if (!cancelled) {
//                     setLoading(false);
//                 }
//             }
//         }

//         load();

//         return () => {
//             cancelled = true;
//         };
//     }, [authLoading, user, isSavedLessonMode, lessonId, topic, level]);

//     async function handleCreateCurriculum(durationDays: 7 | 30) {
//         if (!user || !data || isCreatingCurriculum) return;

//         try {
//             setCurriculumMessage("");
//             setIsCreatingCurriculum(true);
//             setSelectedDuration(durationDays);

//             const token = await user.getIdToken();

//             let effectiveLessonId = savedLessonId ?? data.id;

//             if (!effectiveLessonId) {
//                 setCurriculumMessage("Saving lesson before creating your curriculum...");

//                 const savedLesson = await saveLesson(
//                     {
//                         ...data,
//                         streamedLesson,
//                     },
//                     token
//                 );

//                 effectiveLessonId = savedLesson.id;
//                 setSavedLessonId(savedLesson.id);
//                 setData((prev) => (prev ? { ...prev, id: savedLesson.id } : prev));
//             }

//             setCurriculumMessage(`Creating your ${durationDays}-day curriculum...`);

//             const curriculum = await createCurriculum(token, {
//                 lessonId: effectiveLessonId,
//                 durationDays,
//             });

//             router.push(`/curriculum/${curriculum.id}`);
//         } catch (err) {
//             setCurriculumMessage(
//                 err instanceof Error ? err.message : "Failed to create curriculum"
//             );
//         } finally {
//             setIsCreatingCurriculum(false);
//         }
//     }

//     async function autoSaveStreamedLesson(finalStreamedLesson: string) {
//         console.log("[autoSave] called", {
//             hasUser: Boolean(user),
//             hasData: Boolean(data),
//             savedLessonId,
//             currentDataId: data?.id,
//             length: finalStreamedLesson.length,
//             preview: finalStreamedLesson.slice(0, 120),
//         });

//         if (!user || !data) {
//             console.log("[autoSave] skipped: missing user or data");
//             return;
//         }

//         if (!finalStreamedLesson.trim()) {
//             console.log("[autoSave] skipped: empty content");
//             return;
//         }

//         if (isAutoSavingStreamRef.current) {
//             console.log("[autoSave] skipped: already saving");
//             return;
//         }

//         if (lastAutoSavedStreamRef.current === finalStreamedLesson) {
//             console.log("[autoSave] skipped: same content already saved");
//             return;
//         }

//         try {
//             isAutoSavingStreamRef.current = true;

//             const token = await user.getIdToken();

//             const lessonToSave = {
//                 ...data,
//                 id: savedLessonId ?? data.id,
//                 streamedLesson: finalStreamedLesson,
//             };

//             const isUpdate = Boolean(lessonToSave.id);

//             console.log("[autoSave] request", {
//                 mode: isUpdate ? "update" : "save",
//                 id: lessonToSave.id,
//                 topic: lessonToSave.topic,
//                 level: lessonToSave.level,
//                 streamedLessonLength: lessonToSave.streamedLesson?.length ?? 0,
//             });

//             const result = isUpdate
//                 ? await updateLesson(lessonToSave.id as string, lessonToSave, token)
//                 : await saveLesson(lessonToSave, token);

//             console.log("[autoSave] success", {
//                 mode: isUpdate ? "update" : "save",
//                 returnedId: result.id,
//             });

//             lastAutoSavedStreamRef.current = finalStreamedLesson;
//             setSavedLessonId(result.id);
//             setStreamedLesson(finalStreamedLesson);
//             setData((prev) =>
//                 prev
//                     ? {
//                         ...prev,
//                         id: result.id,
//                         streamedLesson: finalStreamedLesson,
//                     }
//                     : prev
//             );

//             window.dispatchEvent(new Event("lessons:refresh"));

//             console.log("[autoSave] local state updated", {
//                 savedLessonId: result.id,
//                 streamedLessonLength: finalStreamedLesson.length,
//             });
//         } catch (error) {
//             console.error("[autoSave] failed", error);
//         } finally {
//             isAutoSavingStreamRef.current = false;
//         }
//     }


//     function scrollToNextStep() {
//         const targetRef =
//             existingCurricula.length > 0 ? resumeCurriculumRef : curriculumRef;

//         targetRef.current?.scrollIntoView({
//             behavior: "smooth",
//             block: "start",
//         });
//     }

//     if (loading) {
//         return (
//             <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

//                 <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                     <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
//                         DeepDaily
//                     </p>

//                     <h1 className="mt-3 text-2xl font-semibold">
//                         {isSavedLessonMode
//                             ? "Loading saved lesson..."
//                             : "Designing your learning path…"}
//                     </h1>

//                     <p className="mt-3 text-slate-600 dark:text-slate-300">
//                         {isSavedLessonMode
//                             ? "Please wait while DeepDaily loads your saved lesson."
//                             : "Please wait while DeepDaily prepares your learning path."}
//                     </p>

//                     <div className="mt-8 flex justify-center">
//                         <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
//                     </div>

//                     {!isSavedLessonMode && currentGenerationMessage ? (
//                         <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-900/30 dark:bg-teal-950/10">
//                             <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
//                                 Live progress
//                             </p>

//                             <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/60 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
//                                 <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
//                                 <span>{currentGenerationMessage}</span>
//                             </div>
//                         </div>
//                     ) : null}
//                 </div>
//             </PageShell>
//         );
//     }

//     if (!user) {
//         return (
//             <>
//                 <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

//                     <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                         <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
//                             DeepDaily
//                         </p>

//                         <h1 className="mt-3 text-2xl font-semibold">Sign in required</h1>
//                         <p className="mt-3 text-slate-600 dark:text-slate-300">
//                             Please sign in to generate and view lessons.
//                         </p>
//                     </div>
//                 </PageShell>

//                 <LoginRequiredModal
//                     open={showLoginModal}
//                     onClose={() => setShowLoginModal(false)}
//                 />
//             </>
//         );
//     }

//     if (error || !data) {
//         return (
//             <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

//                 <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#111827]">
//                     <h1 className="text-2xl font-semibold">
//                         {isSavedLessonMode
//                             ? "Could not load saved lesson"
//                             : "Could not generate lesson"}
//                     </h1>
//                     <p className="mt-3 text-red-600 dark:text-red-400">
//                         {error || "Unknown error"}
//                     </p>
//                 </div>
//             </PageShell>
//         );
//     }

//     return (
//         <>
//             <PageShell className="px-4 py-8 pt-8  sm:px-6 sm:py-12 sm:pt-16 dark:bg-[#1F2428] dark:text-[#ECFDF5]">
//                 <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-10">
//                     {/* Main Lesson Header Card */}
//                     <section
//                         dir="auto"
//                         className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#334155] dark:bg-[#111827]"
//                     >
//                         <div className="border-b border-slate-200 p-5 sm:p-8 dark:border-[#334155]">
//                             <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
//                                 <div className="space-y-2 min-w-0">
//                                     <p
//                                         dir="auto"
//                                         className="text-[10px] sm:text-sm font-medium uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300 text-start"
//                                     >
//                                         DeepDaily lesson
//                                     </p>

//                                     <h1
//                                         dir="auto"
//                                         className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-tight text-start"
//                                     >
//                                         {data.lesson.title}
//                                     </h1>

//                                     <div
//                                         dir="auto"
//                                         className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
//                                     >
//                                         <p dir="auto" className="text-start">
//                                             Topic:{" "}
//                                             <span className="font-medium text-slate-800 dark:text-slate-100">
//                                                 {data.topic}
//                                             </span>
//                                         </p>

//                                         <span className="hidden sm:inline text-slate-300">|</span>

//                                         <p dir="auto" className="text-start">
//                                             Level:{" "}
//                                             <span className="font-medium capitalize text-slate-800 dark:text-slate-100">
//                                                 {data.level}
//                                             </span>
//                                         </p>
//                                     </div>
//                                 </div>

//                                 <div className="flex sm:block shrink-0 self-start">
//                                     <SaveLessonButton
//                                         lesson={{
//                                             ...data,
//                                             id: savedLessonId ?? data.id,
//                                             streamedLesson,
//                                         }}
//                                         onSaved={(id) => {
//                                             setSavedLessonId(id);
//                                             setData((prev) => (prev ? { ...prev, id } : prev));
//                                         }}
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="p-5 sm:p-8">
//                             <div
//                                 dir="auto"
//                                 className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 sm:p-5 dark:border-teal-900/30 dark:bg-teal-950/10"
//                             >
//                                 <h2
//                                     dir="auto"
//                                     className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300 text-start"
//                                 >
//                                     Today&apos;s focus
//                                 </h2>

//                                 <div
//                                     className="mt-6 rounded-xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5 dark:border-teal-900/30 dark:bg-teal-950/10"
//                                 >
//                                     <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
//                                         Start here
//                                     </h2>

//                                     <ul className="mt-3 space-y-2 text-sm sm:text-base text-slate-700 dark:text-slate-300">
//                                         <li>1. Read today’s focus</li>
//                                         <li>2. Go through the lesson sections</li>
//                                         <li>3. Explore 1–2 resources</li>
//                                     </ul>


//                                     <button
//                                         onClick={scrollToNextStep}
//                                         className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
//                                         style={{
//                                             background: "linear-gradient(135deg, #19c2b3 0%, #0f8f86 100%)",
//                                         }}
//                                     >
//                                         {existingCurricula.length > 0
//                                             ? "Continue your curriculum"
//                                             : "Start today’s lesson"}
//                                     </button>

//                                 </div>

//                                 <p
//                                     dir="auto"
//                                     className="mt-2 text-base sm:text-lg text-slate-900 dark:text-slate-100 text-start"
//                                 >
//                                     {data.lesson.today_focus}
//                                 </p>
//                             </div>

//                             <div className="mt-8">
//                                 <h2
//                                     dir="auto"
//                                     className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white text-start"
//                                 >
//                                     Summary
//                                 </h2>

//                                 <div className="mt-3 prose prose-base sm:prose-lg dark:prose-invert max-w-none">
//                                     <MarkdownContent
//                                         content={data.lesson.summary}
//                                         className="text-base sm:text-lg text-slate-700 dark:text-slate-300"
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </section>

//                     {existingCurricula.length > 0 && (
//                         <div className="px-1 sm:px-0">
//                             <ResumeCurriculumCard
//                                 curricula={existingCurricula}
//                                 containerRef={resumeCurriculumRef}
//                             />
//                         </div>
//                     )}

//                     {/* Main Layout Grid - Stacks on mobile, 2-column on desktop */}
//                     <section className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
//                         <div className="space-y-6 sm:space-y-8">
//                             {/* Lesson Sections */}
//                             <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                                 <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
//                                     Lesson sections
//                                 </h2>

//                                 <div className="mt-6 space-y-4 sm:space-y-6">
//                                     {data.lesson.sections.map((section) => (
//                                         <article
//                                             key={section.title}
//                                             className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition hover:border-teal-200 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10"
//                                         >
//                                             <h3 dir="auto" className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
//                                                 {section.title}
//                                             </h3>
//                                             <div className="mt-2 prose prose-base sm:prose-lg dark:prose-invert max-w-none">
//                                                 <MarkdownContent
//                                                     content={section.content}
//                                                     className="text-slate-700 dark:text-slate-300"
//                                                 />
//                                             </div>
//                                         </article>
//                                     ))}
//                                 </div>
//                             </div>

//                             {/* Resources Section */}
//                             <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                                 <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
//                                     Resources
//                                 </h2>
//                                 <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
//                                     Curated links to reinforce today&apos;s lesson.
//                                 </p>

//                                 <div className="mt-6 space-y-4">
//                                     {data.resources.map((resource) => (
//                                         <ResourceCard
//                                             key={`${resource.title}-${resource.url}`}
//                                             {...resource}
//                                         />
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Sidebar Column */}
//                         <aside className="space-y-6 sm:space-y-8">
//                             <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                                 <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
//                                     Roadmap
//                                 </h2>

//                                 <ol className="mt-6 space-y-3 sm:space-y-4">
//                                     {data.roadmap.map((item, index) => (
//                                         <li
//                                             key={`${item}-${index}`}
//                                             className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 dark:border-slate-700 dark:bg-slate-900/60"
//                                         >
//                                             <span className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs sm:text-sm font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
//                                                 {index + 1}
//                                             </span>

//                                             <span className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
//                                                 {item}
//                                             </span>
//                                         </li>
//                                     ))}
//                                 </ol>
//                             </div>



//                             <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                                 <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
//                                     Deep dive
//                                 </h2>
//                                 <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
//                                     Books and advanced material to continue beyond today&apos;s
//                                     lesson.
//                                 </p>

//                                 <div className="mt-6 space-y-4">
//                                     {(data.deepDive ?? []).map((item) => (
//                                         <ResourceCard
//                                             key={`${item.title}-${item.url ?? item.type}`}
//                                             {...item}
//                                         />
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="hidden lg:block px-0">
//                                 <CurriculumCtaCard
//                                     compact
//                                     curricula={existingCurricula}
//                                     has7DayCurriculum={has7DayCurriculum}
//                                     has30DayCurriculum={has30DayCurriculum}
//                                     isCreatingCurriculum={isCreatingCurriculum}
//                                     selectedDuration={selectedDuration}
//                                     curriculumMessage={curriculumMessage}
//                                     onCreateCurriculum={handleCreateCurriculum}
//                                 />
//                             </div>

//                             <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                                 <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
//                                     Next step
//                                 </h2>
//                                 <div className="mt-4 prose prose-sm dark:prose-invert">
//                                     <MarkdownContent
//                                         content={data.lesson.next_step}
//                                         className="text-slate-700 dark:text-slate-300"
//                                     />
//                                 </div>
//                             </div>
//                         </aside>
//                     </section>

//                     <div className="rounded-2xl overflow-hidden">
//                         <StreamingLesson
//                             key={data.id ?? `${data.topic}-${data.level}`}
//                             topic={data.topic}
//                             level={data.level}
//                             initialContent={streamedLesson}
//                             onContentChange={setStreamedLesson}
//                             onComplete={async (finalContent) => {
//                                 console.log("[StreamingLesson -> parent] onComplete fired", {
//                                     length: finalContent.length,
//                                     preview: finalContent.slice(0, 120),
//                                 });

//                                 setStreamedLesson(finalContent);
//                                 await autoSaveStreamedLesson(finalContent);

//                                 console.log("[StreamingLesson -> parent] onComplete finished");
//                             }}
//                         />
//                     </div>

//                     <CurriculumCtaCard
//                         compact
//                         curricula={existingCurricula}
//                         has7DayCurriculum={has7DayCurriculum}
//                         has30DayCurriculum={has30DayCurriculum}
//                         containerRef={curriculumRef}
//                         isCreatingCurriculum={isCreatingCurriculum}
//                         selectedDuration={selectedDuration}
//                         curriculumMessage={curriculumMessage}
//                         onCreateCurriculum={handleCreateCurriculum}
//                     />
//                 </div>
//             </PageShell>

//             <LoginRequiredModal
//                 open={showLoginModal}
//                 onClose={() => setShowLoginModal(false)}
//             />
//         </>
//     );
// }
