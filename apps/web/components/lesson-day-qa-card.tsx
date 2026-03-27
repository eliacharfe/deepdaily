
// apps/web/components/lesson-day-qa-card.tsx

"use client";

import { useEffect, useState } from "react";
import MarkdownContent from "@/components/markdown-content";

type LessonDayQaCardProps = {
    dayTitle: string;
    dayObjective?: string;
    disabled?: boolean;
    answer: string;
    quickActions?: string[];
    recentQuestions?: string[];
    onAsk: (question: string) => Promise<void>;
};

const DEFAULT_QUICK_ACTIONS = [
    "Explain this like I'm a beginner",
    "Give me a practical example",
    "What are the key takeaways?",
    "Test me with 3 questions",
];

export default function LessonDayQaCard({
    dayTitle,
    dayObjective,
    disabled = false,
    answer,
    quickActions = DEFAULT_QUICK_ACTIONS,
    recentQuestions = [],
    onAsk,
}: LessonDayQaCardProps) {
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const timeout = window.setTimeout(() => {
            setCopied(false);
        }, 1500);

        return () => window.clearTimeout(timeout);
    }, [copied]);

    async function handleSubmit(customQuestion?: string) {
        const finalQuestion = (customQuestion ?? question).trim();
        if (!finalQuestion || loading || disabled) return;

        try {
            setLoading(true);
            setError("");
            setCopied(false);

            await onAsk(finalQuestion);

            if (!customQuestion) {
                setQuestion("");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get answer");
        } finally {
            setLoading(false);
        }
    }

    async function handleCopyAnswer() {
        if (!answer.trim()) return;

        try {
            await navigator.clipboard.writeText(answer);
            setCopied(true);
        } catch {
            setError("Could not copy the answer");
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#334155] dark:bg-[#111827]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                AI Coach
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                Stuck or curious?
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Get a clear explanation, examples, or test your understanding.
            </p>

            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                Based on today’s lesson content
            </p>

            <div
                dir="auto"
                className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/60"
            >
                <p
                    dir="auto"
                    className="font-semibold text-slate-900 dark:text-white"
                >
                    {dayTitle}
                </p>

                {dayObjective ? (
                    <p
                        dir="auto"
                        className="mt-1 text-slate-600 dark:text-slate-300"
                    >
                        {dayObjective}
                    </p>
                ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                    <button
                        key={action}
                        type="button"
                        onClick={() => handleSubmit(action)}
                        disabled={loading || disabled}
                        className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-50 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300"
                    >
                        {action}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask anything about today’s lesson..."
                    rows={4}
                    disabled={loading || disabled}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    Ask a focused question for the best answer
                </p>

                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!question.trim() || loading || disabled}
                    className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-900"
                >
                    {loading ? "Thinking..." : "Ask AI"}
                </button>
            </div>

            {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                    {error}
                </div>
            ) : null}

            {(loading || answer) ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Answer
                        </p>

                        {answer ? (
                            <button
                                type="button"
                                onClick={handleCopyAnswer}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:text-teal-300"
                            >
                                {copied ? "Copied" : "Copy"}
                            </button>
                        ) : null}
                    </div>

                    {loading && !answer ? (
                        <p className="animate-pulse text-sm text-slate-500 dark:text-slate-400">
                            Thinking through your question...
                        </p>
                    ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <MarkdownContent content={answer} />
                        </div>
                    )}

                    {recentQuestions.length > 0 ? (
                        <div className="mt-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                You asked earlier
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {recentQuestions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => handleSubmit(item)}
                                        disabled={loading || disabled}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:text-teal-300"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {answer && !loading ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    handleSubmit("Go deeper on the most important idea here.")
                                }
                                disabled={loading || disabled}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:text-teal-300"
                            >
                                Go deeper
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleSubmit("Give me a concrete real-world example.")
                                }
                                disabled={loading || disabled}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:text-teal-300"
                            >
                                Give an example
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleSubmit("Test me with 3 short questions.")
                                }
                                disabled={loading || disabled}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:text-teal-300"
                            >
                                Quiz me
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleSubmit("Summarize this answer in 3 short bullet points.")
                                }
                                disabled={loading || disabled}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:text-teal-300"
                            >
                                Summarize this
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}