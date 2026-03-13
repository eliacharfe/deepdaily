//apps/web/components/streaming-lesson.tsx

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { streamLesson } from "@/lib/stream-lesson";

type Props = {
    topic: string;
    level: string;
};

export default function StreamingLesson({ topic, level }: Props) {
    const [content, setContent] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [error, setError] = useState("");

    async function handleGenerate() {
        setContent("");
        setError("");
        setStatus("loading");

        try {
            await streamLesson(topic, level, {
                onChunk: (chunk) => {
                    setContent((prev) => prev + chunk);
                },
                onDone: () => {
                    setStatus("done");
                },
                onError: (message) => {
                    setError(message);
                    setStatus("error");
                }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setStatus("error");
        }
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Live AI lesson</h2>
                    <p className="mt-2 text-slate-600">
                        Generate a streamed markdown lesson for this topic.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={status === "loading"}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {status === "loading" ? "Generating..." : "Stream lesson"}
                </button>
            </div>

            {error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="prose prose-slate mt-8 max-w-none">
                {content ? <ReactMarkdown>{content}</ReactMarkdown> : null}
            </div>

            {!content && status === "idle" ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
                    No streamed lesson yet.
                </div>
            ) : null}
        </section>
    );
}