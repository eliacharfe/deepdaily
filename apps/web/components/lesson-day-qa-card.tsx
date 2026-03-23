
// apps/web/components/lesson-day-qa-card.tsx

"use client";

import { useState } from "react";
import MarkdownContent from "@/components/markdown-content";

type LessonDayQaCardProps = {
    dayTitle: string;
    dayObjective?: string;
    disabled?: boolean;
    answer: string;
    onAsk: (question: string) => Promise<void>;
};

const QUICK_ACTIONS = [
    "Explain this simply",
    "Give me a real-world example",
    "Test me with 3 questions",
];

export default function LessonDayQaCard({
    dayTitle,
    dayObjective,
    disabled = false,
    answer,
    onAsk,
}: LessonDayQaCardProps) {
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(customQuestion?: string) {
        const finalQuestion = (customQuestion ?? question).trim();
        if (!finalQuestion || loading || disabled) return;

        try {
            setLoading(true);
            setError("");
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

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#334155] dark:bg-[#111827]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                AI Tutor
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                Ask about this lesson
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Ask a focused question about today’s lesson and get a guided explanation.
            </p>

            <div dir="auto" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
                <p dir="auto" className="font-semibold text-slate-900 dark:text-white">{dayTitle}</p>
                {dayObjective ? (
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{dayObjective}</p>
                ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
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

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!question.trim() || loading || disabled}
                    className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500"
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
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Answer
                    </p>

                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <MarkdownContent content={answer || "Thinking..."} />
                    </div>
                </div>
            ) : null}
        </section>
    );
}