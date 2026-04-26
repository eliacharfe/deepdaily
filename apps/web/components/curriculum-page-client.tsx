
// apps/web/components/curriculum-page-client.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { useAuth } from "@/components/providers/auth-provider";
import {
    completeCurriculumDay,
    generateCurriculumDayWithProgress,
    getCurriculum,
    regenerateCurriculumDay,
    retryCurriculumDayResources,
    streamCurriculumResourceSummary,
    updateCurriculumLastOpenedDay,
    markCurriculumDayItemRead,
} from "@/lib/curricula-api";
import type { Curriculum } from "@/types/curriculum";
import MarkdownContent from "@/components/markdown-content";
import PageShell from "@/components/page-shell";
import LessonDayQaCard from "@/components/lesson-day-qa-card";
import { streamLessonQuestion } from "@/lib/lesson-qa-api";
import SectionAudioButton from "@/components/section-audio-button";

type Props = {
    curriculumId: string;
};

type LessonQaTurn = {
    role: "user" | "assistant";
    content: string;
};

type ResourceSummaryState = {
    summary?: string;
    isLoading: boolean;
    isComplete?: boolean;
    statusMessage?: string;
    error?: string;
};

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
    reason?: string | null;
    snippet?: string | null;
    url?: string | null;
    summary?: string;
    summaryError?: string;
    isSummarizing?: boolean;
    isSummaryComplete?: boolean;
    summaryStatusMessage?: string;
    onSummarize?: () => void;
    audioTitle?: string;
    isRead?: boolean;
    isSavingRead?: boolean;
    onMarkRead?: () => void;
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
    isRead,
    isSavingRead,
    onMarkRead,
}: ResourceCardProps) {
    const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
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

    function ReadStatusAction({
        isRead,
        isSaving,
        onMarkRead,
    }: {
        isRead: boolean;
        isSaving: boolean;
        onMarkRead: () => void;
    }) {
        return (
            <div className="mt-5 flex justify-end">
                {isRead ? (
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
                        Read ✓
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={onMarkRead}
                        disabled={isSaving}
                        className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300 dark:hover:bg-teal-950/30"
                    >
                        {isSaving ? "Saving..." : "Mark as read"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className={`relative dd-surface-soft overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm dark:hover:border-teal-500/20 sm:p-5
                    ${isRead
                    ? "border-teal-400/60 bg-teal-50/40 ring-1 ring-teal-300/40 dark:border-teal-500/40 dark:bg-teal-950/20 dark:ring-teal-500/20"
                    : ""
                }`}
        >
            {isRead && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-1 rounded-l-2xl bg-teal-400" />
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                    <MarkdownContent
                        content={title}
                        className="[&_p]:my-0 [&_h1]:my-0 [&_h2]:my-0 [&_h3]:my-0 [&_h4]:my-0 wrap-break-word text-base font-semibold leading-tight text-slate-900 sm:text-lg dark:text-white"
                    />
                </div>

                <span
                    className="w-fit shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
                    style={{
                        borderColor: "var(--accent-border)",
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                    }}
                >
                    {type}
                </span>
            </div>

            {reason ? (
                <MarkdownContent
                    content={reason}
                    className="mt-2 wrap-break-word text-sm text-slate-600 sm:text-base dark:text-slate-300 [&_p]:my-0 [&_a]:break-all"
                />
            ) : null}

            {snippet ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/70 px-4 py-3 dark:border-white/10">
                    <MarkdownContent
                        content={snippet}
                        className="
                            line-clamp-6
                            text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400
                            [&_p]:my-0
                            **:max-w-full
                            **:wrap-break-word
                            [&_a]:break-all
                            [&_pre]:overflow-x-auto
                            [&_code]:wrap-break-word
                            [&_hr]:my-3
                        "
                    />
                </div>
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
                    className="mt-4 inline-flex items-center px-2 py-1 text-xs font-medium text-teal-700 underline underline-offset-2 sm:text-sm dark:text-teal-300"
                >
                    Open resource
                </a>
            ) : (
                <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
                    No external link available
                </p>
            )}

            {url ? (
                <p className="mt-3 break-all text-[10px] text-slate-500 opacity-60 sm:text-sm dark:text-slate-400">
                    {url}
                </p>
            ) : null}

            {onMarkRead ? (
                <ReadStatusAction
                    isRead={Boolean(isRead)}
                    isSaving={Boolean(isSavingRead)}
                    onMarkRead={onMarkRead}
                />
            ) : null}

        </div>
    );
}

function ReadStatusAction({
    isRead,
    isSaving,
    onMarkRead,
}: {
    isRead: boolean;
    isSaving: boolean;
    onMarkRead: () => void;
}) {
    return (
        <div className="mt-5 flex justify-end">
            {isRead ? (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
                    Read ✓
                </span>
            ) : (
                <button
                    type="button"
                    onClick={onMarkRead}
                    disabled={isSaving}
                    className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300 dark:hover:bg-teal-950/30"
                >
                    {isSaving ? "Saving..." : "Mark as read"}
                </button>
            )}
        </div>
    );
}

export default function CurriculumPageClient({ curriculumId }: Props) {
    const { user, loading: authLoading } = useAuth();

    const [isGeneratingDay, setIsGeneratingDay] = useState(false);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [isCompletingDay, setIsCompletingDay] = useState(false);
    const [isUpdatingOpenedDay, setIsUpdatingOpenedDay] = useState(false);

    const [currentDayGenerationMessage, setCurrentDayGenerationMessage] = useState("");

    const [lessonQaAnswer, setLessonQaAnswer] = useState("");
    const [lessonQaHistory, setLessonQaHistory] = useState<LessonQaTurn[]>([]);

    const [isRetryingResources, setIsRetryingResources] = useState(false);
    const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);

    const [resourceSummaries, setResourceSummaries] = useState<
        Record<string, ResourceSummaryState>
    >({});

    const [markingReadKey, setMarkingReadKey] = useState<string | null>(null);

    const scheduleScrollRef = useRef<HTMLDivElement | null>(null);
    const didScrollToCurrentDayRef = useRef(false);

    useEffect(() => {
        if (!curriculum) return;
        void ensureDayGenerated(selectedDayNumber);
    }, [curriculum?.id, selectedDayNumber]);

    useEffect(() => {
        if (!curriculum || didScrollToCurrentDayRef.current) return;

        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

        const container = scheduleScrollRef.current;
        if (!container) return;

        const currentDayButton = container.querySelector<HTMLButtonElement>(
            `[data-day-number="${curriculum.currentDay}"]`
        );

        if (!currentDayButton) return;

        didScrollToCurrentDayRef.current = true;

        setTimeout(() => {
            currentDayButton.scrollIntoView({
                behavior: "smooth",
                block: isDesktop ? "start" : "nearest",
                inline: isDesktop ? "nearest" : "center", // 👈 KEY CHANGE
            });
        }, 300);
    }, [curriculum]);

    useEffect(() => {
        setLessonQaAnswer("");
        setLessonQaHistory([]);
        setResourceSummaries({});
    }, [selectedDayNumber]);

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
                const data = await getCurriculum(curriculumId, token);

                if (!cancelled) {
                    const initialDay = data.lastOpenedDay || data.currentDay || 1;
                    setCurriculum(data);
                    setSelectedDayNumber(initialDay);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load curriculum"
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
    }, [authLoading, user, curriculumId]);

    const selectedDay = useMemo(() => {
        return curriculum?.days.find((day) => day.dayNumber === selectedDayNumber) ?? null;
    }, [curriculum, selectedDayNumber]);

    async function handleSelectDay(dayNumber: number) {
        if (!user || !curriculum || isUpdatingOpenedDay) return;

        setSelectedDayNumber(dayNumber);

        try {
            setIsUpdatingOpenedDay(true);
            setError("");

            const token = await user.getIdToken();
            const updated = await updateCurriculumLastOpenedDay(
                curriculum.id,
                dayNumber,
                token
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update selected day"
            );
        } finally {
            setIsUpdatingOpenedDay(false);
        }
    }

    const lessonQaRecentQuestions = useMemo(() => {
        const userQuestions = lessonQaHistory
            .filter((turn) => turn.role === "user")
            .map((turn) => turn.content.trim())
            .filter(Boolean);

        return Array.from(new Set(userQuestions)).slice(-3).reverse();
    }, [lessonQaHistory]);

    const lessonQaQuickActions = useMemo(() => {
        if (!selectedDay) return [];

        const firstSectionTitle = selectedDay.sections[0]?.title;
        const secondSectionTitle = selectedDay.sections[1]?.title;

        return [
            `Explain "${selectedDay.title}" like I'm a beginner`,
            firstSectionTitle
                ? `Help me understand "${firstSectionTitle}"`
                : "What are the key takeaways?",
            secondSectionTitle
                ? `Give me a practical example for "${secondSectionTitle}"`
                : "Give me a practical example",
            "Test me with 3 questions",
        ];
    }, [selectedDay]);

    async function handleCompleteDay() {
        if (!user || !curriculum || !selectedDay || isCompletingDay) return;

        try {
            setIsCompletingDay(true);
            setError("");

            const token = await user.getIdToken();
            const updated = await completeCurriculumDay(
                curriculum.id,
                selectedDay.dayNumber,
                token
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
            setSelectedDayNumber(updated.currentDay);
            window.dispatchEvent(new Event("curricula:refresh"));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to complete day"
            );
        } finally {
            setIsCompletingDay(false);
        }
    }

    async function handleMarkItemRead(itemKey: string) {
        if (!user || !curriculum || !selectedDay || markingReadKey) return;

        try {
            setMarkingReadKey(itemKey);
            setError("");

            const token = await user.getIdToken();

            const updated = await markCurriculumDayItemRead(
                curriculum.id,
                selectedDay.dayNumber,
                itemKey,
                token
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to mark item as read"
            );
        } finally {
            setMarkingReadKey(null);
        }
    }

    async function ensureDayGenerated(dayNumber: number, force = false) {
        if (!user || !curriculum || isGeneratingDay) return;

        const day = curriculum.days.find((item) => item.dayNumber === dayNumber);
        if (!day) return;

        if (day.isGenerated && !force) return;

        try {
            setIsGeneratingDay(true);
            setError("");
            setCurrentDayGenerationMessage("");

            const token = await user.getIdToken();

            const updated = await generateCurriculumDayWithProgress(
                curriculum.id,
                dayNumber,
                token,
                {
                    onStatus: (message) => {
                        setCurrentDayGenerationMessage(message);
                    },
                }
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
            setCurrentDayGenerationMessage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate day");
        } finally {
            setIsGeneratingDay(false);
        }
    }

    function mergeCurriculumState(
        prev: Curriculum | null,
        next: Curriculum
    ): Curriculum {
        if (!prev) return next;

        const mergedCompletedDays = Array.from(
            new Set([...(prev.completedDays ?? []), ...(next.completedDays ?? [])])
        ).sort((a, b) => a - b);

        return {
            ...prev,
            ...next,
            completedDays: mergedCompletedDays,
            currentDay: Math.max(prev.currentDay ?? 1, next.currentDay ?? 1),
            lastOpenedDay: next.lastOpenedDay ?? prev.lastOpenedDay,
            days: next.days,
        };
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
        if (!user || !curriculum || !selectedDay) return;

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

            const result = await streamCurriculumResourceSummary(
                {
                    curriculumId: curriculum.id,
                    dayNumber: selectedDay.dayNumber,
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

    async function handleRetryResources() {
        if (!user || !curriculum || !selectedDay || isRetryingResources) return;

        try {
            setIsRetryingResources(true);
            setError("");

            const token = await user.getIdToken();
            const updated = await retryCurriculumDayResources(
                curriculum.id,
                selectedDay.dayNumber,
                token
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to retry resources"
            );
        } finally {
            setIsRetryingResources(false);
        }
    }

    async function handleRegenerateDay() {
        if (!user || !curriculum || !selectedDay || isRegeneratingDay) return;

        try {
            setIsRegeneratingDay(true);
            setError("");
            setLessonQaAnswer("");
            setLessonQaHistory([]);

            const token = await user.getIdToken();
            const updated = await regenerateCurriculumDay(
                curriculum.id,
                selectedDay.dayNumber,
                token
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to regenerate day"
            );
        } finally {
            setIsRegeneratingDay(false);
        }
    }

    if (loading) {
        return (
            <PageShell className="px-6 py-12 pt-20">
                <div className="dd-surface dd-surface-top-line mx-auto max-w-3xl rounded-3xl border p-8 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        DeepDaily
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold">Loading curriculum...</h1>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                        Please wait while DeepDaily loads your study plan.
                    </p>

                    <div className="mt-8 flex justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                    </div>
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
                            Please sign in to view your curriculum.
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

    if (error && !curriculum) {
        return (
            <PageShell className="px-6 py-12 pt-20">
                <div className="dd-surface mx-auto max-w-3xl rounded-3xl border border-red-200 p-8 shadow-sm dark:border-red-900/40">
                    <h1 className="text-2xl font-semibold">Could not load curriculum</h1>
                    <p className="mt-3 text-red-600 dark:text-red-400">
                        {error || "Unknown error"}
                    </p>
                </div>
            </PageShell>
        );
    }

    if (!curriculum || !selectedDay) {
        return (
            <PageShell className="px-6 py-12 pt-20">
                <div className="dd-surface mx-auto max-w-3xl rounded-3xl border border-red-200 p-8 shadow-sm dark:border-red-900/40">
                    <h1 className="text-2xl font-semibold">Curriculum not available</h1>
                </div>
            </PageShell>
        );
    }

    const progressPercent =
        curriculum.durationDays > 0
            ? Math.round(
                (curriculum.completedDays.length / curriculum.durationDays) * 100
            )
            : 0;

    return (
        <PageShell
            showBack
            backLessonId={curriculum.lessonId}
            className="px-4 py-6 pt-10 sm:px-6 sm:py-12 sm:pt-20"
        >
            <div className="mx-auto max-w-6xl space-y-6 pt-2 sm:space-y-8 sm:pt-6 lg:pt-6 ">
                <section className="dd-surface dd-surface-top-line overflow-hidden rounded-3xl border shadow-sm">
                    <div className="border-b border-teal-100 bg-linear-to-r from-teal-50 via-white to-cyan-50 p-8 dark:border-teal-900/30 dark:from-teal-950/30 dark:via-transparent dark:to-cyan-950/20">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                            Structured learning
                        </p>

                        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h1
                                    dir="auto"
                                    className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
                                >
                                    {curriculum.title}
                                </h1>

                                <p
                                    dir="auto"
                                    className="mt-4 text-sm text-slate-600 dark:text-slate-300"
                                >
                                    Topic:{" "}
                                    <span
                                        dir="auto"
                                        className="font-medium text-slate-800 dark:text-slate-100"
                                    >
                                        {curriculum.topic}
                                    </span>
                                    {" · "}
                                    Level:{" "}
                                    <span
                                        dir="auto"
                                        className="font-medium capitalize text-slate-800 dark:text-slate-100"
                                    >
                                        {curriculum.level}
                                    </span>
                                    {" · "}
                                    Plan:{" "}
                                    <span
                                        dir="auto"
                                        className="font-medium text-slate-800 dark:text-slate-100"
                                    >
                                        {curriculum.durationDays} days
                                    </span>
                                </p>

                                <p
                                    dir="auto"
                                    className="mt-4 max-w-2xl leading-7 text-slate-700 dark:text-slate-300"
                                >
                                    {curriculum.overview}
                                </p>
                            </div>

                            <div className="dd-surface-soft min-w-[220px] rounded-2xl border p-5 backdrop-blur">
                                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                    Progress
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                    {curriculum.completedDays.length}/{curriculum.durationDays}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Day {curriculum.currentDay} is your current step
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-6">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                                className="h-full rounded-full bg-teal-600 transition-all dark:bg-teal-400"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {progressPercent}% complete
                        </p>
                    </div>
                </section>

                {error ? (
                    <div className="dd-surface rounded-2xl border border-red-200 p-4 text-sm text-red-600 shadow-sm dark:border-red-900/40 dark:text-red-400">
                        {error}
                    </div>
                ) : null}

                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[280px_1fr]">
                    <aside className="lg:sticky lg:top-24 lg:h-fit">
                        <div className="dd-surface dd-surface-top-line rounded-2xl border p-4 shadow-sm">
                            <h2 className="mb-4 hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 lg:block">
                                Schedule
                            </h2>

                            <div
                                ref={scheduleScrollRef}
                                className="flex scroll-pt-4 flex-row gap-3 overflow-x-auto pb-2 scrollbar-hide lg:max-h-[600px] lg:flex-col lg:gap-2 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0"
                            >
                                {curriculum.days.map((day) => {
                                    const isCompleted = curriculum.completedDays.includes(day.dayNumber);
                                    const isCurrent = curriculum.currentDay === day.dayNumber;
                                    const isSelected = selectedDayNumber === day.dayNumber;
                                    const isGenerated = day.isGenerated;

                                    return (
                                        <button
                                            key={day.dayNumber}
                                            type="button"
                                            data-day-number={day.dayNumber}
                                            onClick={() => handleSelectDay(day.dayNumber)}
                                            className={[
                                                "w-full rounded-2xl border px-4 py-3 text-left transition",
                                                isSelected
                                                    ? "border-teal-500 bg-teal-950/30 shadow-sm"
                                                    : "dd-surface-soft hover:border-teal-200 dark:hover:border-teal-500/20",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            Day {day.dayNumber}
                                                        </p>

                                                        {isCompleted ? (
                                                            <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
                                                                Done
                                                            </span>
                                                        ) : !isGenerated ? (
                                                            <span className="dd-surface rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                                Ready
                                                            </span>
                                                        ) : isCurrent ? (
                                                            <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-teal-400 dark:text-slate-900">
                                                                Current
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                        {day.title}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 space-y-6">
                        {!selectedDay.isGenerated || isGeneratingDay || isRegeneratingDay ? (
                            <div className="dd-surface dd-surface-top-line rounded-2xl border p-8 text-center shadow-sm">
                                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {isRegeneratingDay
                                        ? "Regenerating this day..."
                                        : currentDayGenerationMessage || "Unlocking day content..."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <section className="dd-surface dd-surface-top-line rounded-2xl border p-6 shadow-sm sm:p-8">
                                    <div className="mb-4 flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="dd-surface-soft rounded-full border px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                                DAY {selectedDay.dayNumber}
                                            </span>
                                            {curriculum.completedDays.includes(selectedDay.dayNumber) && (
                                                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-300">
                                                    ✓ COMPLETED
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                            {selectedDay.resources?.length === 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={handleRetryResources}
                                                    disabled={isRetryingResources || isRegeneratingDay || isGeneratingDay}
                                                    className="dd-surface-soft rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200 dark:hover:border-teal-500/20"
                                                >
                                                    {isRetryingResources ? "Retrying..." : "Retry resources"}
                                                </button>
                                            ) : null}

                                            <button
                                                type="button"
                                                onClick={handleRegenerateDay}
                                                disabled={isRegeneratingDay || isRetryingResources || isGeneratingDay}
                                                className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300 dark:hover:bg-teal-950/30"
                                            >
                                                {isRegeneratingDay ? "Regenerating..." : "Regenerate day"}
                                            </button>
                                        </div>
                                    </div>

                                    <h2
                                        dir="auto"
                                        className="text-xl font-bold text-slate-900 sm:text-3xl dark:text-white"
                                    >
                                        {selectedDay.title}
                                    </h2>

                                    <p
                                        dir="auto"
                                        className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                                    >
                                        {selectedDay.objective}
                                    </p>
                                </section>

                                <section className="space-y-4">
                                    {selectedDay.sections.map((section, i) => {
                                        const itemKey = `section:${i}`;
                                        const isRead = selectedDay.readItems?.includes(itemKey) ?? false;

                                        return (
                                            <article
                                                key={itemKey}
                                                className={`relative dd-surface-soft overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm dark:hover:border-teal-500/20 sm:p-5
                                                    ${isRead
                                                        ? "border-teal-400/60 bg-teal-50/40 ring-1 ring-teal-300/40 dark:border-teal-500/40 dark:bg-teal-950/20 dark:ring-teal-500/20"
                                                        : ""
                                                    }`}
                                            >
                                                {isRead && (
                                                    <div className="pointer-events-none absolute right-0 top-0 h-full w-1 rounded-l-2xl bg-teal-400" />
                                                )}
                                                <h3
                                                    dir="auto"
                                                    className="mb-4 text-lg font-bold text-slate-900 dark:text-white"
                                                >
                                                    {section.title}
                                                </h3>

                                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                                    <MarkdownContent content={section.content} />
                                                </div>

                                                <SectionAudioButton
                                                    title={section.title}
                                                    content={section.content}
                                                />

                                                <ReadStatusAction
                                                    isRead={isRead}
                                                    isSaving={markingReadKey === itemKey}
                                                    onMarkRead={() => handleMarkItemRead(itemKey)}
                                                />
                                            </article>
                                        );
                                    })}
                                </section>

                                {selectedDay.resources?.length ? (
                                    <section className="space-y-4">
                                        <h2 className="px-1 text-sm font-bold uppercase text-slate-400">
                                            Daily resources
                                        </h2>
                                        {selectedDay.resources.map((res, i) => {
                                            const resourceKey = `${selectedDay.dayNumber}-${i}`;
                                            const itemKey = `resource:${i}`;
                                            const isRead = selectedDay.readItems.includes(itemKey);
                                            const summaryState = resourceSummaries[resourceKey];

                                            return (
                                                <ResourceCard
                                                    key={resourceKey}
                                                    {...res}
                                                    isRead={isRead}
                                                    isSavingRead={markingReadKey === itemKey}
                                                    onMarkRead={() => handleMarkItemRead(itemKey)}
                                                    audioTitle={`${res.title} summary`}
                                                    summary={summaryState?.summary}
                                                    summaryError={summaryState?.error}
                                                    isSummarizing={summaryState?.isLoading}
                                                    isSummaryComplete={summaryState?.isComplete}
                                                    summaryStatusMessage={summaryState?.statusMessage}
                                                    onSummarize={() =>
                                                        handleSummarizeResource(resourceKey, {
                                                            title: res.title,
                                                            type: res.type,
                                                            url: res.url,
                                                            snippet: res.snippet,
                                                            reason: res.reason,
                                                        })
                                                    }
                                                />
                                            );
                                        })}
                                    </section>
                                ) : null}

                                <LessonDayQaCard
                                    dayTitle={selectedDay.title}
                                    dayObjective={selectedDay.objective}
                                    disabled={!selectedDay.isGenerated || isGeneratingDay}
                                    answer={lessonQaAnswer}
                                    quickActions={lessonQaQuickActions}
                                    recentQuestions={lessonQaRecentQuestions}
                                    onAsk={async (question) => {
                                        if (!user || !curriculum) {
                                            throw new Error("You must be signed in");
                                        }

                                        const token = await user.getIdToken();

                                        const previousHistory = lessonQaHistory.slice(-4);
                                        let streamedAnswer = "";

                                        setLessonQaAnswer("");

                                        await streamLessonQuestion({
                                            token,
                                            payload: {
                                                curriculumId: curriculum.id,
                                                dayNumber: selectedDay.dayNumber,
                                                question,
                                                level: curriculum.level,
                                                dayTitle: selectedDay.title,
                                                dayObjective: selectedDay.objective,
                                                sections: selectedDay.sections.map((section) => ({
                                                    title: section.title,
                                                    content: section.content,
                                                })),
                                                conversationHistory: previousHistory,
                                            },
                                            onChunk: (chunk) => {
                                                streamedAnswer += chunk;
                                                setLessonQaAnswer((prev) => prev + chunk);
                                            },
                                        });

                                        setLessonQaHistory((prev) => [
                                            ...prev,
                                            { role: "user", content: question },
                                            { role: "assistant", content: streamedAnswer },
                                        ]);
                                    }}
                                />

                                <section className="dd-surface dd-surface-top-line rounded-2xl border p-6 shadow-sm">
                                    <button
                                        onClick={handleCompleteDay}
                                        disabled={isCompletingDay || curriculum.completedDays.includes(selectedDay.dayNumber)}
                                        className="w-full rounded-xl bg-teal-600 py-4 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500"
                                    >
                                        {curriculum.completedDays.includes(selectedDay.dayNumber)
                                            ? "You finished this day!"
                                            : isCompletingDay
                                                ? "Saving..."
                                                : "Mark day as finished"}
                                    </button>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>

            <LoginRequiredModal
                open={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
        </PageShell>
    );
}
