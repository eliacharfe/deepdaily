//apps/web/components/topic-generator-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TopicLevel } from "@/types/topic";

export default function TopicGeneratorForm() {
    const router = useRouter();

    const [topic, setTopic] = useState("");
    const [level, setLevel] = useState<TopicLevel>("beginner");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmedTopic = topic.trim();
        if (!trimmedTopic) return;

        try {
            setIsSubmitting(true);

            const params = new URLSearchParams({
                topic: trimmedTopic,
                level
            });

            router.push(`/learn?${params.toString()}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-[#4C4541] dark:bg-[#3A3533]"
        >
            <div className="flex flex-col gap-4">
                <div>
                    <label
                        htmlFor="topic"
                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-[#D5C6BC]"
                    >
                        What do you want to learn?
                    </label>

                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. RAG systems, investing, Swift concurrency"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 dark:border-[#5A524D] dark:bg-[#2F2A28] dark:text-[#F1E7DF] dark:placeholder-[#A89B92] dark:focus:border-[#8A7F78]"
                    />
                </div>

                <div>
                    <label
                        htmlFor="level"
                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-[#D5C6BC]"
                    >
                        Level
                    </label>

                    <select
                        id="level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value as TopicLevel)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 dark:border-[#5A524D] dark:bg-[#2F2A28] dark:text-[#F1E7DF] dark:focus:border-[#8A7F78]"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !topic.trim()}
                    className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F1E7DF] dark:text-[#2D2B2B]"
                >
                    {isSubmitting ? "Preparing..." : "Generate lesson"}
                </button>
            </div>
        </form>
    );
}