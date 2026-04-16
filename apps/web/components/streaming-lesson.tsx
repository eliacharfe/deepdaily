// apps/web/components/streaming-lesson.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { streamLesson } from "@/lib/stream-lesson";
import MarkdownContent from "@/components/markdown-content";
import SectionAudioButton from "@/components/section-audio-button";

type Props = {
    topic: string;
    level: string;
    initialContent?: string;
    onContentChange?: (content: string) => void;
    onComplete?: (content: string) => void | Promise<void>;
};

type Status = "idle" | "loading" | "done" | "error";

type LessonSegment = {
    id: string;
    title: string;
    content: string;
};

function normalizeStreamingMarkdown(text: string): string {
    if (!text) return text;

    let normalized = text;

    const tripleBacktickCount = (normalized.match(/```/g) || []).length;
    if (tripleBacktickCount % 2 !== 0) {
        normalized += "\n```";
    }

    const withoutTriple = normalized.replace(/```[\s\S]*?```/g, "");
    const singleBacktickCount = (withoutTriple.match(/`/g) || []).length;
    if (singleBacktickCount % 2 !== 0) {
        normalized += "`";
    }

    return normalized;
}

export default function StreamingLesson({
    topic,
    level,
    initialContent = "",
    onContentChange,
    onComplete,
}: Props) {
    const [content, setContent] = useState(initialContent);
    const [segments, setSegments] = useState<LessonSegment[]>(
        initialContent
            ? [
                {
                    id: "initial",
                    title: "Main lesson",
                    content: initialContent,
                },
            ]
            : []
    );
    const [status, setStatus] = useState<Status>(
        initialContent ? "done" : "idle"
    );
    const [error, setError] = useState("");
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const sectionRef = useRef<HTMLElement | null>(null);
    const streamAreaRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef(initialContent);

    useEffect(() => {
        onContentChange?.(content);
    }, [content, onContentChange]);

    useEffect(() => {
        if (!initialContent) return;

        contentRef.current = initialContent;
        setContent(initialContent);
        setSegments([
            {
                id: "initial",
                title: "Main lesson",
                content: initialContent,
            },
        ]);
        setStatus("done");
    }, [topic, level]);

    function scrollToBottom(behavior: ScrollBehavior = "smooth") {
        if (!scrollContainerRef.current) return;

        scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior,
        });
    }

    function isNearBottom() {
        const el = scrollContainerRef.current;
        if (!el) return true;

        const threshold = 80;
        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    }

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const onScroll = () => {
            setShouldAutoScroll(isNearBottom());
        };

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!content || !shouldAutoScroll) return;
        scrollToBottom("smooth");
    }, [content, shouldAutoScroll]);

    async function handleGenerate() {
        console.log("[StreamingLesson] handleGenerate start", { topic, level });

        setError("");
        setStatus("loading");
        setShouldAutoScroll(true);

        contentRef.current = "";
        setContent("");
        setSegments([]);

        let currentSegment = "";

        try {
            await streamLesson(
                { topic, level },
                {
                    onChunk: (chunk) => {
                        currentSegment += chunk;
                        contentRef.current += chunk;
                        setContent(contentRef.current);
                    },
                    onDone: async () => {
                        console.log("[StreamingLesson] generate onDone", {
                            finalLength: contentRef.current.length,
                            preview: contentRef.current.slice(0, 120),
                        });

                        setSegments([
                            {
                                id: `segment-${Date.now()}`,
                                title: "Main lesson",
                                content: currentSegment.trim(),
                            },
                        ]);

                        setStatus("done");
                        await onComplete?.(contentRef.current);

                        console.log("[StreamingLesson] generate onComplete resolved");
                    },
                    onError: (message) => {
                        console.error("[StreamingLesson] generate onError", message);
                        setError(message);
                        setStatus("error");
                    },
                }
            );
        } catch (err) {
            console.error("[StreamingLesson] handleGenerate catch", err);
            setError(err instanceof Error ? err.message : "Unknown error");
            setStatus("error");
        }
    }

    async function handleGoDeeper() {
        console.log("[StreamingLesson] handleGoDeeper start", {
            currentLength: contentRef.current.length,
            segmentCount: segments.length,
        });

        setError("");
        setStatus("loading");
        setShouldAutoScroll(true);

        const deeperIndex =
            segments.filter((segment) => segment.title.startsWith("Deep dive")).length + 1;

        const prefix = `\n\n---\n\n## Deep dive ${deeperIndex}\n\n`;
        contentRef.current += prefix;
        setContent(contentRef.current);

        let currentSegment = "";

        try {
            await streamLesson(
                {
                    topic,
                    level,
                    followUpPrompt:
                        "Continue this lesson by going deeper. Add practical examples, code examples where relevant, clearer breakdowns, and one short exercise at the end. Do not restart from the beginning.",
                },
                {
                    onChunk: (chunk) => {
                        currentSegment += chunk;
                        contentRef.current += chunk;
                        setContent(contentRef.current);
                    },
                    onDone: async () => {
                        console.log("[StreamingLesson] goDeeper onDone", {
                            finalLength: contentRef.current.length,
                            preview: contentRef.current.slice(0, 120),
                        });

                        setSegments((prev) => [
                            ...prev,
                            {
                                id: `segment-${Date.now()}`,
                                title: `Deep dive ${deeperIndex}`,
                                content: currentSegment.trim(),
                            },
                        ]);

                        setStatus("done");
                        await onComplete?.(contentRef.current);

                        console.log("[StreamingLesson] goDeeper onComplete resolved");
                    },
                    onError: (message) => {
                        console.error("[StreamingLesson] goDeeper onError", message);
                        setError(message);
                        setStatus("error");
                    },
                }
            );
        } catch (err) {
            console.error("[StreamingLesson] handleGoDeeper catch", err);
            setError(err instanceof Error ? err.message : "Unknown error");
            setStatus("error");
        }
    }

    const renderedContent =
        status === "loading" ? normalizeStreamingMarkdown(content) : content;

    return (
        <section
            ref={sectionRef}
            className="dd-surface dd-surface-top-line scroll-mt-32 rounded-3xl border p-8 shadow-sm"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                        Live AI lesson
                    </h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                        Generate a streamed markdown lesson for this topic.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                        background: "linear-gradient(135deg, #19c2b3 0%, #0f8f86 100%)",
                        boxShadow: "0 10px 24px rgba(20, 184, 166, 0.22)",
                    }}
                >
                    {status === "loading"
                        ? "Generating..."
                        : content
                            ? "Regenerate stream"
                            : "Stream lesson"}
                </button>
            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                </div>
            )}

            {!content && status === "idle" && (
                <div className="dd-surface-soft mt-8 rounded-2xl border border-dashed px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No streamed lesson yet.
                </div>
            )}

            {content && (
                <div ref={streamAreaRef} className="mt-8">
                    <div
                        ref={scrollContainerRef}
                        className="dd-surface-soft max-h-[70vh] overflow-y-auto rounded-2xl border p-5 pr-3"
                    >
                        <MarkdownContent content={renderedContent} />

                        {status === "loading" && (
                            <div className="mt-6 flex justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
                            </div>
                        )}

                        {status === "done" && content && (
                            <div className="mt-6 space-y-4">
                                {segments.length > 0 ? (
                                    <div className="space-y-3">
                                        {segments.map((segment) => (
                                            <div
                                                key={segment.id}
                                                className="dd-surface rounded-2xl border px-4 py-3"
                                            >
                                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                                                    {segment.title}
                                                </p>

                                                <SectionAudioButton
                                                    title={`${topic} - ${segment.title}`}
                                                    content={segment.content}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleGoDeeper}
                                        className="dd-surface-soft rounded-2xl border px-5 py-3 text-sm font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm dark:text-slate-100 dark:hover:border-teal-500/20"
                                    >
                                        Go deeper with examples
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
