//apps/web/components/topic-generator-form.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TopicLevel } from "@/types/topic";
import { useAuth } from "@/components/providers/auth-provider";
import LoginRequiredModal from "@/components/auth/login-required-modal";

export default function TopicGeneratorForm() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [topic, setTopic] = useState("");
    const [level, setLevel] = useState<TopicLevel>("beginner");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(false);

    function goToLesson(trimmedTopic: string, selectedLevel: TopicLevel) {
        const params = new URLSearchParams({
            topic: trimmedTopic,
            level: selectedLevel
        });

        router.push(`/learn?${params.toString()}`);
    }

    useEffect(() => {
        if (!loading && user && pendingSubmit) {
            const trimmedTopic = topic.trim();
            if (!trimmedTopic) return;

            setPendingSubmit(false);
            setShowLoginModal(false);
            goToLesson(trimmedTopic, level);
        }
    }, [user, loading, pendingSubmit, topic, level, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmedTopic = topic.trim();
        if (!trimmedTopic) return;

        if (loading) return;

        if (!user) {
            setPendingSubmit(true);
            setShowLoginModal(true);
            return;
        }

        try {
            setIsSubmitting(true);
            goToLesson(trimmedTopic, level);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <div className="absolute inset-0 -z-10 rounded-[36px] bg-(--accent-soft) blur-3xl opacity-40" />
            <form
                onSubmit={handleSubmit}
                className="mt-10 w-full max-w-2xl rounded-[28px] border p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] dd-surface"
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label
                            htmlFor="topic"
                            className="mb-2 block text-sm font-medium text-(--text-soft)"
                        >
                            What do you want to learn?
                        </label>

                        <input
                            id="topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. RAG systems, investing, Swift concurrency"
                            className="dd-focus w-full rounded-2xl border bg-(--surface) px-4 py-3 text-(--text) placeholder:text-slate-400 transition"
                            style={{ borderColor: "var(--border)" }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="level"
                            className="mb-2 block text-sm font-medium text-(--text-soft)"
                        >
                            Level
                        </label>

                        <select
                            id="level"
                            value={level}
                            onChange={(e) => setLevel(e.target.value as TopicLevel)}
                            className="dd-focus w-full rounded-2xl border bg-(--surface) px-4 py-3 text-(--text) transition"
                            style={{ borderColor: "var(--border)" }}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || loading || !topic.trim()}
                        className="rounded-2xl px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            background: "var(--accent)",
                            color: "white",
                        }}
                    >
                        {loading ? "Checking session..." : isSubmitting ? "Preparing..." : "Generate lesson"}
                    </button>
                </div>
            </form>

            <LoginRequiredModal
                open={showLoginModal}
                onClose={() => {
                    setShowLoginModal(false);
                    setPendingSubmit(false);
                }}
            />
        </>
    );
}
