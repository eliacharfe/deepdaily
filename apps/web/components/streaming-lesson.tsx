//apps/web/components/streaming-lesson.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as Prism from "prismjs";
import "@/lib/prism";
import { streamLesson } from "@/lib/stream-lesson";

type Props = {
    topic: string;
    level: string;
    initialContent?: string;
    onContentChange?: (content: string) => void;
};

type Status = "idle" | "loading" | "done" | "error";

function childrenToText(children: React.ReactNode): string {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.map(childrenToText).join("");
    return "";
}

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
    const bottomRef = useRef<HTMLDivElement | null>(null);

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
        return () => {
            el.removeEventListener("scroll", onScroll);
        };
    }, []);

    useEffect(() => {
        if (!content) return;
        if (!shouldAutoScroll) return;

        scrollToBottom("smooth");
    }, [content, shouldAutoScroll]);

    useEffect(() => {
        if (status === "done" && shouldAutoScroll) {
            requestAnimationFrame(() => {
                scrollToBottom("smooth");
            });
        }
    }, [status, shouldAutoScroll]);

    async function handleGenerate() {
        scrollPageToStreamArea();

        setContent("");
        setError("");
        setStatus("loading");
        setShouldAutoScroll(true);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollToBottom("auto");
            });
        });

        try {
            await streamLesson(
                { topic, level },
                {
                    onChunk: (chunk) => {
                        setContent((prev) => {
                            const isFirstChunk = prev === "";
                            const next = prev + chunk;

                            if (isFirstChunk) {
                                setTimeout(() => {
                                    scrollPageToStreamArea();
                                }, 50);
                            }

                            return next;
                        });
                    },
                    onDone: () => {
                        setStatus("done");

                        requestAnimationFrame(() => {
                            scrollPageToStreamArea();
                            scrollToBottom("smooth");
                        });
                    },
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

        requestAnimationFrame(() => {
            scrollToBottom("smooth");
        });

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
                    onDone: () => {
                        setStatus("done");
                    },
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

    function scrollPageToStreamArea() {
        const target = streamAreaRef.current ?? sectionRef.current;
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const absoluteTop = window.pageYOffset + rect.top;
        const offset = 80;

        window.scrollTo({
            top: Math.max(0, absoluteTop - offset),
            behavior: "smooth",
        });
    }

    const renderedContent =
        status === "loading" ? normalizeStreamingMarkdown(content) : content;

    return (
        <section
            ref={sectionRef}
            className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-colors dark:border-[#4C4541] dark:bg-[#3A3533]"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                        Live AI lesson
                    </h2>
                    <p className="mt-2 text-slate-600 dark:text-[#D5C6BC]">
                        Generate a streamed markdown lesson for this topic.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={status === "loading"}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F1E7DF] dark:text-[#2D2B2B]"
                >
                    {status === "loading"
                        ? "Generating..."
                        : content
                            ? "Regenerate stream"
                            : "Stream lesson"}
                </button>
            </div>

            {error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            ) : null}

            {!content && status === "idle" ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500 dark:border-[#5A524D] dark:text-[#B9AAA0]">
                    No streamed lesson yet.
                </div>
            ) : null}

            {content ? (
                <div ref={streamAreaRef} className="mt-8">
                    <div
                        ref={scrollContainerRef}
                        className="max-h-[70vh] overflow-y-auto pr-2"
                    >
                        <div
                            className={[
                                "min-w-0 text-sm leading-relaxed text-slate-900 dark:text-[#F1E7DF]",
                                "[&_p]:my-4 [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1.5",
                                "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold",
                                "[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold",
                                "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold",
                                "[&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-[#4C4541]",
                                "[&_pre]:my-5 [&_pre]:max-w-full [&_pre]:overflow-x-auto",
                                "[&_code]:max-w-full",
                                "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto",
                                "[&_img]:max-w-full",
                                "pb-8",
                            ].join(" ")}
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ className, children, ...props }) {
                                        const lang =
                                            (className || "").match(/language-(\w+)/)?.[1] || "";
                                        const isBlock = /language-\w+/.test(className || "");

                                        if (isBlock) {
                                            const raw = childrenToText(children).replace(/\n$/, "");
                                            const grammar = Prism.languages[lang];
                                            const highlighted = grammar
                                                ? Prism.highlight(raw, grammar, lang)
                                                : raw;

                                            return (
                                                <div className="relative my-4 max-w-full min-w-0" dir="ltr">
                                                    <div className="absolute right-3 top-3">
                                                        {lang ? (
                                                            <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-gray-300">
                                                                {lang}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <pre
                                                        dir="ltr"
                                                        className="max-w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#1e1e1e] p-4 pt-10 text-sm"
                                                    >
                                                        <code
                                                            className={className}
                                                            dangerouslySetInnerHTML={{
                                                                __html: highlighted,
                                                            }}
                                                        />
                                                    </pre>
                                                </div>
                                            );
                                        }

                                        return (
                                            <code
                                                dir="ltr"
                                                className="rounded bg-[#1e1e1e] px-1.5 py-0.5 text-xs text-gray-100 border border-white/10"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {renderedContent}
                            </ReactMarkdown>

                            {status === "loading" ? (
                                <div className="mt-6 flex justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
                                </div>
                            ) : null}

                            {status === "done" && content ? (
                                <div className="mt-6 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleGoDeeper}
                                        className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-[#5A524D] dark:text-[#F1E7DF] dark:hover:bg-[#2F2A28]"
                                    >
                                        Go deeper with examples
                                    </button>
                                </div>
                            ) : null}

                            <div ref={bottomRef} className="h-6" />
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}