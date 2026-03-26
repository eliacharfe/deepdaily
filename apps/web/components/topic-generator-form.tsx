//apps/web/components/topic-generator-form.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TopicLevel } from "@/types/topic";
import { useAuth } from "@/components/providers/auth-provider";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { Sparkles } from "lucide-react";
import LevelDropdown from "@/components/ui/level-dropdown";
import { getSurpriseTopic } from "@/lib/surprise-topic";

const SUGGESTIONS = [
    "Investing",
    "Cooking",
    "Public Speaking",
    "Photography",
    "Learning Spanish",
    "Fitness",
    "Learn Chess",
    "Personal Finance",
    "Starting a Business",
    "Python Coding",
    "Learning Guitar",
];

export default function TopicGeneratorForm() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [topic, setTopic] = useState("");
    const [level, setLevel] = useState<TopicLevel>("beginner");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSurprising, setIsSurprising] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const [hasSurprise, setHasSurprise] = useState(false);

    const animatedPlaceholder = useMemo(
        () => `Try ${SUGGESTIONS[placeholderIndex]}`,
        [placeholderIndex]
    );

    function goToLesson(trimmedTopic: string, selectedLevel: TopicLevel) {
        const params = new URLSearchParams({
            topic: trimmedTopic,
            level: selectedLevel,
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

    useEffect(() => {
        if (topic.trim()) return;

        const interval = window.setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % SUGGESTIONS.length);
        }, 2200);

        return () => window.clearInterval(interval);
    }, [topic]);

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

    async function handleSurpriseMe() {
        if (loading || isSubmitting || isSurprising) return;

        try {
            setIsSurprising(true);

            const excludeTopics = [
                topic.trim(),
                ...getStoredSurpriseTopics(),
            ].filter(Boolean);

            const randomTopic = await getSurpriseTopic(level, excludeTopics);

            if (randomTopic.trim()) {
                setTopic(randomTopic.trim());
                storeSurpriseTopic(randomTopic.trim());
                setHasSurprise(true);
            }
        } catch (error) {
            console.error("Surprise topic error:", error);
        } finally {
            setIsSurprising(false);
        }
    }

    const SURPRISE_TOPICS_STORAGE_KEY = "deepdaily-surprise-topics";

    function getStoredSurpriseTopics(): string[] {
        if (typeof window === "undefined") return [];

        try {
            const raw = localStorage.getItem(SURPRISE_TOPICS_STORAGE_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
        } catch {
            return [];
        }
    }

    function storeSurpriseTopic(topic: string) {
        if (typeof window === "undefined") return;

        try {
            const current = getStoredSurpriseTopics();
            const next = [topic, ...current.filter((item) => item !== topic)].slice(0, 20);
            localStorage.setItem(SURPRISE_TOPICS_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore storage errors
        }
    }

    function applySuggestion(value: string) {
        setTopic(value);
    }

    return (
        <>
            <div className="absolute inset-0 -z-10 rounded-[40px] bg-(--accent-soft) opacity-20 blur-3xl" />

            <form onSubmit={handleSubmit} className="mt-5 w-full max-w-3xl">
                <div
                    className={`relative overflow-visible rounded-[32px] border transition-all duration-300 ${isFocused
                        ? "shadow-[0_0_0_1px_rgba(45,212,191,0.18),0_0_28px_rgba(45,212,191,0.10)]"
                        : "shadow-[0_16px_50px_rgba(0,0,0,0.28)]"
                        }`}
                    style={{
                        borderColor: isFocused
                            ? "rgba(45,212,191,0.22)"
                            : "rgba(90, 118, 132, 0.28)",
                        background:
                            "linear-gradient(180deg, rgba(8,18,27,0.88) 0%, rgba(9,20,30,0.78) 100%)",
                        backdropFilter: "blur(18px) saturate(140%)",
                        WebkitBackdropFilter: "blur(18px) saturate(140%)",
                    }}
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-teal-200/15 to-transparent" />

                    <div className="flex flex-col gap-4 p-3 sm:p-4">
                        <div
                            className="flex items-start gap-3 rounded-[24px] px-4 py-4 transition"
                            style={{
                                border: "1px solid rgba(115, 148, 165, 0.16)",
                                background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)",
                            }}
                        >
                            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-400/12 text-teal-300">
                                <Sparkles size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <label
                                    htmlFor="topic"
                                    className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400"
                                >
                                    What do you want to learn?
                                </label>

                                <input
                                    id="topic"
                                    type="text"
                                    value={topic}
                                    onChange={(e) => {
                                        setTopic(e.target.value);
                                        setHasSurprise(false);
                                    }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder={animatedPlaceholder}
                                    className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500 sm:text-lg"
                                />

                                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                                    Build a structured lesson in minutes, tailored to your level — or let DeepDaily pick a topic for you.
                                </p>
                            </div>
                        </div>


                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTIONS.slice(0, 7).map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => applySuggestion(suggestion)}
                                            className="rounded-full border px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:text-white"
                                            style={{
                                                borderColor: "rgba(45, 212, 191, 0.35)",
                                                background: "rgba(255,255,255,0.04)",
                                            }}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <LevelDropdown
                                        value={level}
                                        onChange={setLevel}
                                        disabled={isSubmitting || isSurprising || loading}
                                    />

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isSurprising || loading || !topic.trim()}
                                        className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #19c2b3 0%, #0f8f86 100%)",
                                            boxShadow:
                                                "0 10px 24px rgba(20, 184, 166, 0.22)",
                                        }}
                                    >
                                        {loading
                                            ? "Checking session..."
                                            : isSubmitting
                                                ? "Preparing..."
                                                : "Generate lesson"}
                                    </button>
                                </div>
                            </div>

                            <div
                                className="flex flex-col items-center justify-center gap-3 rounded-[22px] px-4 py-4 text-center"
                                style={{
                                    border: "1px solid rgba(115, 148, 165, 0.14)",
                                    background: "rgba(255,255,255,0.03)",
                                }}
                            >
                                <p className="text-xs font-medium text-slate-400 sm:text-sm">
                                    Not sure what to learn next?
                                </p>

                                <button
                                    type="button"
                                    onClick={handleSurpriseMe}
                                    disabled={isSubmitting || isSurprising || loading}
                                    className="rounded-2xl px-6 py-3 text-sm font-semibold text-slate-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{
                                        border: "1px solid rgba(45, 212, 191, 0.35)",
                                        background: "rgba(255,255,255,0.05)",
                                    }}
                                >
                                    {isSurprising
                                        ? "Thinking..."
                                        : hasSurprise
                                            ? "Try another"
                                            : "Surprise me"}
                                </button>
                            </div>
                        </div>
                    </div>
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
