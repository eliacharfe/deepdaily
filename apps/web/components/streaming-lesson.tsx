// apps/web/components/streaming-lesson.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { streamLesson } from "@/lib/stream-lesson";
import MarkdownContent from "@/components/markdown-content";

type Props = {
    topic: string;
    level: string;
    initialContent?: string;
    onContentChange?: (content: string) => void;
};

type Status = "idle" | "loading" | "done" | "error";

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
}: Props) {
    const [content, setContent] = useState(initialContent);
    const [status, setStatus] = useState<Status>(
        initialContent ? "done" : "idle"
    );
    const [error, setError] = useState("");
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const sectionRef = useRef<HTMLElement | null>(null);
    const streamAreaRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        onContentChange?.(content);
    }, [content, onContentChange]);

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
        setContent("");
        setError("");
        setStatus("loading");
        setShouldAutoScroll(true);

        try {
            await streamLesson(
                { topic, level },
                {
                    onChunk: (chunk) => {
                        setContent((prev) => prev + chunk);
                    },
                    onDone: () => setStatus("done"),
                    onError: (message) => {
                        setError(message);
                        setStatus("error");
                    },
                }
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setStatus("error");
        }
    }

    async function handleGoDeeper() {
        setError("");
        setStatus("loading");
        setShouldAutoScroll(true);

        setContent((prev) => prev + "\n\n---\n\n## Going deeper\n\n");

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
                        setContent((prev) => prev + chunk);
                    },
                    onDone: () => setStatus("done"),
                    onError: (message) => {
                        setError(message);
                        setStatus("error");
                    },
                }
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setStatus("error");
        }
    }

    const renderedContent =
        status === "loading" ? normalizeStreamingMarkdown(content) : content;

    return (
        <section
            ref={sectionRef}
            className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900"
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
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
                >
                    {status === "loading"
                        ? "Generating..."
                        : content
                            ? "Regenerate stream"
                            : "Stream lesson"}
                </button>
            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            {!content && status === "idle" && (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No streamed lesson yet.
                </div>
            )}

            {content && (
                <div ref={streamAreaRef} className="mt-8">
                    <div
                        ref={scrollContainerRef}
                        className="max-h-[70vh] overflow-y-auto pr-2"
                    >
                        <MarkdownContent content={renderedContent} />

                        {status === "loading" && (
                            <div className="mt-6 flex justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
                            </div>
                        )}

                        {status === "done" && content && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleGoDeeper}
                                    className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                                >
                                    Go deeper with examples
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}