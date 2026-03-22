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
};

function ResourceCard({
    title,
    type,
    reason,
    snippet,
    url,
}: ResourceCardProps) {
    const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
    const youtubeThumbnail = getYouTubeThumbnail(url);
    const isYouTube = Boolean(youtubeEmbedUrl);

    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                    {title}
                </h3>

                <span
                    className="w-fit rounded-full border px-2.5 py-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide"
                    style={{
                        borderColor: "var(--accent-border)",
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                    }}
                >
                    {type}
                </span>
            </div>

            <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-300">{reason}</p>

            {snippet ? (
                <p className="mt-3 line-clamp-3 text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400">
                    {snippet}
                </p>
            ) : null}

            {isYouTube && youtubeEmbedUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
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
                    className="mt-4 inline-flex text-xs sm:text-sm font-medium text-teal-700 underline underline-offset-2 dark:text-teal-300"
                >
                    Open resource
                </a>
            ) : (
                <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
                    No external link available
                </p>
            )}

            {url ? (
                <p className="mt-3 break-all text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 opacity-60">
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
        <>
            <PageShell className="px-4 py-8 pt-16 sm:px-6 sm:py-12 sm:pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">
                <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-10">
                    {/* Main Lesson Header Card */}
                    <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                        <div className="border-b border-slate-200 p-5 sm:p-8 dark:border-[#334155]">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <p className="text-[10px] sm:text-sm font-medium uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                                        DeepDaily lesson
                                    </p>

                                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-tight">
                                        {data.lesson.title}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                        <p>
                                            Topic:{" "}
                                            <span className="font-medium text-slate-800 dark:text-slate-100">
                                                {data.topic}
                                            </span>
                                        </p>
                                        <span className="hidden sm:inline text-slate-300">|</span>
                                        <p>
                                            Level:{" "}
                                            <span className="font-medium capitalize text-slate-800 dark:text-slate-100">
                                                {data.level}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex sm:block">
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
                            <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 sm:p-5 dark:border-teal-900/30 dark:bg-teal-950/10">
                                <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                    Today&apos;s focus
                                </h2>
                                <p className="mt-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                                    {data.lesson.today_focus}
                                </p>
                            </div>

                            <div className="mt-8">
                                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                                    Summary
                                </h2>
                                <div className="mt-3 prose prose-base sm:prose-lg dark:prose-invert max-w-none">
                                    <MarkdownContent
                                        content={data.lesson.summary}
                                        className="text-base sm:text-lg text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {existingCurricula.length > 0 && (
                        <div className="px-1 sm:px-0">
                            <ResumeCurriculumCard curricula={existingCurricula} />
                        </div>
                    )}

                    {/* Main Layout Grid - Stacks on mobile, 2-column on desktop */}
                    <section className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
                        <div className="space-y-6 sm:space-y-8">
                            {/* Lesson Sections */}
                            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                                    Lesson sections
                                </h2>

                                <div className="mt-6 space-y-4 sm:space-y-6">
                                    {data.lesson.sections.map((section) => (
                                        <article
                                            key={section.title}
                                            className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition hover:border-teal-200 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10"
                                        >
                                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                                                {section.title}
                                            </h3>
                                            <div className="mt-2 prose prose-base sm:prose-lg dark:prose-invert max-w-none">
                                                <MarkdownContent
                                                    content={section.content}
                                                    className="text-slate-700 dark:text-slate-300"
                                                />
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>

                            {/* Resources Section */}
                            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                                    Resources
                                </h2>
                                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                    Curated links to reinforce today&apos;s lesson.
                                </p>

                                <div className="mt-6 space-y-4">
                                    {data.resources.map((resource) => (
                                        <ResourceCard
                                            key={`${resource.title}-${resource.url}`}
                                            {...resource}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Column */}
                        <aside className="space-y-6 sm:space-y-8">
                            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                                    Roadmap
                                </h2>

                                <ol className="mt-6 space-y-3 sm:space-y-4">
                                    {data.roadmap.map((item, index) => (
                                        <li
                                            key={`${item}-${index}`}
                                            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 dark:border-slate-700 dark:bg-slate-900/60"
                                        >
                                            <span className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs sm:text-sm font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                                                {index + 1}
                                            </span>

                                            <span className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="hidden lg:block px-0">
                                <CurriculumCtaCard
                                    compact
                                    isCreatingCurriculum={isCreatingCurriculum}
                                    selectedDuration={selectedDuration}
                                    curriculumMessage={curriculumMessage}
                                    onCreateCurriculum={handleCreateCurriculum}
                                />
                            </div>

                            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                                    Deep dive
                                </h2>
                                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                    Books and advanced material to continue beyond today&apos;s
                                    lesson.
                                </p>

                                <div className="mt-6 space-y-4">
                                    {(data.deepDive ?? []).map((item) => (
                                        <ResourceCard
                                            key={`${item.title}-${item.url ?? item.type}`}
                                            {...item}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                                    Next step
                                </h2>
                                <div className="mt-4 prose prose-sm dark:prose-invert">
                                    <MarkdownContent
                                        content={data.lesson.next_step}
                                        className="text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                            </div>
                        </aside>
                    </section>

                    <div className="rounded-2xl overflow-hidden">
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

// import { useEffect, useState } from "react";
// import StreamingLesson from "@/components/streaming-lesson";
// // import AuthButton from "@/components/auth/auth-button";
// import SaveLessonButton from "@/components/save-lesson-button";
// import LoginRequiredModal from "@/components/auth/login-required-modal";
// import { useAuth } from "@/components/providers/auth-provider";
// import { config } from "@/lib/config";
// import { getSavedLessonById, saveLesson } from "@/lib/lessons-api";
// import type { TopicLevel } from "@/types/topic";
// import type { LessonData, SavedLesson } from "@/types/lesson";
// // import HomeButton from "@/components/home-button";
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

//     const router = useRouter();

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

//                         const curricula = await getCurriculaByLesson(savedLesson.id, token);
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
//                         const dataLine = lines.find((line) => line.startsWith("data: "));
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
//                                 throw new Error(event.message || "Failed to generate lesson");
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
//                         const curricula = await getCurriculaByLesson(finalResult.id, token);
//                         setExistingCurricula(curricula);
//                     }
//                 }
//             } catch (err) {
//                 if (!cancelled) {
//                     setError(err instanceof Error ? err.message : "Failed to load lesson");
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
//                             : "Generating your lesson..."}
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
//         <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">
//             <div className="mx-auto max-w-6xl space-y-8">
//                 <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                     <div className="border-b border-teal-100 bg-linear-to-r from-teal-50 via-white to-cyan-50 p-8 dark:border-teal-900/30 dark:from-teal-950/30 dark:via-[#111827] dark:to-cyan-950/20">
//                         <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//                             <div>
//                                 <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
//                                     DeepDaily lesson
//                                 </p>

//                                 <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
//                                     {data.lesson.title}
//                                 </h1>

//                                 <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
//                                     Topic:{" "}
//                                     <span className="font-medium text-slate-800 dark:text-slate-100">
//                                         {data.topic}
//                                     </span>
//                                     {" · "}
//                                     Level:{" "}
//                                     <span className="font-medium capitalize text-slate-800 dark:text-slate-100">
//                                         {data.level}
//                                     </span>
//                                 </p>
//                             </div>

//                             <SaveLessonButton
//                                 lesson={{
//                                     ...data,
//                                     id: savedLessonId ?? data.id,
//                                     streamedLesson,
//                                 }}
//                                 onSaved={(id) => {
//                                     setSavedLessonId(id);
//                                     setData((prev) => (prev ? { ...prev, id } : prev));
//                                 }}
//                             />
//                         </div>
//                     </div>

//                     <div className="p-8">
//                         <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5 dark:border-teal-900/30 dark:bg-teal-950/10">
//                             <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
//                                 Today&apos;s focus
//                             </h2>
//                             <p className="mt-2 text-base text-slate-900 dark:text-slate-100">
//                                 {data.lesson.today_focus}
//                             </p>
//                         </div>

//                         <div className="mt-6">
//                             <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
//                                 Summary
//                             </h2>
//                             <div className="mt-3">
//                                 <MarkdownContent
//                                     content={data.lesson.summary}
//                                     className="text-slate-700 dark:text-slate-300"
//                                 />
//                             </div>
//                         </div>
//                     </div>
//                 </section>

//                 {existingCurricula.length > 0 ? (
//                     <ResumeCurriculumCard curricula={existingCurricula} />
//                 ) : null}

//                 <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
//                     <div className="space-y-8">
//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                             <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
//                                 Lesson sections
//                             </h2>

//                             <div className="mt-6 space-y-6">
//                                 {data.lesson.sections.map((section) => (
//                                     <article
//                                         key={section.title}
//                                         className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10"
//                                     >
//                                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
//                                             {section.title}
//                                         </h3>
//                                         <div className="mt-2">
//                                             <MarkdownContent
//                                                 content={section.content}
//                                                 className="text-slate-700 dark:text-slate-300"
//                                             />
//                                         </div>
//                                     </article>
//                                 ))}
//                             </div>
//                         </div>

//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                             <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
//                                 Resources
//                             </h2>

//                             <div className="mt-6 space-y-4">
//                                 {data.resources.map((resource) => (
//                                     <a
//                                         key={`${resource.title}-${resource.url}`}
//                                         href={resource.url}
//                                         target="_blank"
//                                         rel="noreferrer"
//                                         className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900"
//                                     >
//                                         <div className="flex items-center justify-between gap-4">
//                                             <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
//                                                 {resource.title}
//                                             </h3>
//                                             <span
//                                                 className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
//                                                 style={{
//                                                     borderColor: "var(--accent-border)",
//                                                     background: "var(--accent-soft)",
//                                                     color: "var(--accent)",
//                                                 }}
//                                             >
//                                                 {resource.type}
//                                             </span>
//                                         </div>

//                                         <p className="mt-2 text-slate-600 dark:text-slate-300">
//                                             {resource.reason}
//                                         </p>

//                                         {resource.snippet ? (
//                                             <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
//                                                 {resource.snippet}
//                                             </p>
//                                         ) : null}

//                                         <p className="mt-3 break-all text-sm text-slate-500 dark:text-slate-400">
//                                             {resource.url}
//                                         </p>
//                                     </a>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>

//                     <aside className="space-y-8 pr-1 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                             <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
//                                 Roadmap
//                             </h2>

//                             <ol className="mt-6 space-y-3">
//                                 {data.roadmap.map((item, index) => (
//                                     <li
//                                         key={`${index}-${item}`}
//                                         className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60"
//                                     >
//                                         <span
//                                             className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
//                                             style={{
//                                                 background: "var(--accent)",
//                                                 color: "white",
//                                             }}
//                                         >
//                                             {index + 1}
//                                         </span>
//                                         <span className="leading-6 text-slate-700 dark:text-slate-300">
//                                             {item}
//                                         </span>
//                                     </li>
//                                 ))}
//                             </ol>
//                         </div>

//                         <CurriculumCtaCard
//                             compact
//                             isCreatingCurriculum={isCreatingCurriculum}
//                             selectedDuration={selectedDuration}
//                             curriculumMessage={curriculumMessage}
//                             onCreateCurriculum={handleCreateCurriculum}
//                         />

//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                             <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
//                                 Deep dive
//                             </h2>
//                             <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
//                                 Books and advanced material to continue beyond today’s lesson.
//                             </p>

//                             <div className="mt-6 space-y-4">
//                                 {(data.deepDive ?? []).map((item) => {
//                                     const content = (
//                                         <>
//                                             <div className="flex items-center justify-between gap-4">
//                                                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
//                                                     {item.title}
//                                                 </h3>
//                                                 <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
//                                                     {item.type}
//                                                 </span>
//                                             </div>

//                                             <p className="mt-2 text-slate-600 dark:text-slate-300">
//                                                 {item.reason}
//                                             </p>

//                                             {item.snippet ? (
//                                                 <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
//                                                     {item.snippet}
//                                                 </p>
//                                             ) : null}

//                                             {item.url ? (
//                                                 <p className="mt-3 break-all text-sm text-slate-500 dark:text-slate-400">
//                                                     {item.url}
//                                                 </p>
//                                             ) : (
//                                                 <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
//                                                     No external link available
//                                                 </p>
//                                             )}
//                                         </>
//                                     );

//                                     return item.url ? (
//                                         <a
//                                             key={`${item.title}-${item.url}`}
//                                             href={item.url}
//                                             target="_blank"
//                                             rel="noreferrer"
//                                             className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900"
//                                         >
//                                             {content}
//                                         </a>
//                                     ) : (
//                                         <div
//                                             key={item.title}
//                                             className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60"
//                                         >
//                                             {content}
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>

//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
//                             <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
//                                 Next step
//                             </h2>
//                             <div className="mt-4">
//                                 <MarkdownContent
//                                     content={data.lesson.next_step}
//                                     className="text-slate-700 dark:text-slate-300"
//                                 />
//                             </div>
//                         </div>
//                     </aside>
//                 </section>

//                 <StreamingLesson
//                     key={data.id ?? `${data.topic}-${data.level}`}
//                     topic={data.topic}
//                     level={data.level}
//                     initialContent={streamedLesson}
//                     onContentChange={setStreamedLesson}
//                 />

//                 <CurriculumCtaCard
//                     isCreatingCurriculum={isCreatingCurriculum}
//                     selectedDuration={selectedDuration}
//                     curriculumMessage={curriculumMessage}
//                     onCreateCurriculum={handleCreateCurriculum}
//                 />
//             </div>
//         </PageShell>
//     );
// }