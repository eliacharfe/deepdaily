
// apps/web/components/curriculum-page-client.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { useAuth } from "@/components/providers/auth-provider";
import {
    completeCurriculumDay,
    getCurriculum,
    updateCurriculumLastOpenedDay,
} from "@/lib/curricula-api";
import type { Curriculum } from "@/types/curriculum";
import BackButton from "@/components/back-button";
import { generateCurriculumDayWithProgress } from "@/lib/curricula-api";
import MarkdownContent from "@/components/markdown-content";
import PageShell from "@/components/page-shell";

type Props = {
    curriculumId: string;
};

export default function CurriculumPageClient({ curriculumId }: Props) {
    const { user, loading: authLoading } = useAuth();

    const [isGeneratingDay, setIsGeneratingDay] = useState(false);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [isCompletingDay, setIsCompletingDay] = useState(false);
    const [isUpdatingOpenedDay, setIsUpdatingOpenedDay] = useState(false);

    const [currentDayGenerationMessage, setCurrentDayGenerationMessage] = useState("");

    useEffect(() => {
        if (!curriculum) return;
        void ensureDayGenerated(selectedDayNumber);
    }, [curriculum?.id, selectedDayNumber]);

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

                const token = await user.getIdToken();
                const data = await getCurriculum(curriculumId, token);

                if (!cancelled) {
                    const initialDay = data.lastOpenedDay || data.currentDay || 1;
                    setCurriculum(data);
                    setSelectedDayNumber(initialDay);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load curriculum"
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
    }, [authLoading, user, curriculumId]);

    const selectedDay = useMemo(() => {
        return curriculum?.days.find((day) => day.dayNumber === selectedDayNumber) ?? null;
    }, [curriculum, selectedDayNumber]);

    async function handleSelectDay(dayNumber: number) {
        if (!user || !curriculum || isUpdatingOpenedDay) return;

        setSelectedDayNumber(dayNumber);

        try {
            setIsUpdatingOpenedDay(true);
            setError("");

            const token = await user.getIdToken();
            const updated = await updateCurriculumLastOpenedDay(
                curriculum.id,
                dayNumber,
                token
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update selected day"
            );
        } finally {
            setIsUpdatingOpenedDay(false);
        }
    }

    async function handleCompleteDay() {
        if (!user || !curriculum || !selectedDay || isCompletingDay) return;

        try {
            setIsCompletingDay(true);
            setError("");

            const token = await user.getIdToken();
            const updated = await completeCurriculumDay(
                curriculum.id,
                selectedDay.dayNumber,
                token
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
            setSelectedDayNumber(updated.currentDay);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to complete day"
            );
        } finally {
            setIsCompletingDay(false);
        }
    }

    async function ensureDayGenerated(dayNumber: number) {
        if (!user || !curriculum || isGeneratingDay) return;

        const day = curriculum.days.find((item) => item.dayNumber === dayNumber);
        if (!day || day.isGenerated) return;

        try {
            setIsGeneratingDay(true);
            setError("");
            setCurrentDayGenerationMessage("");

            const token = await user.getIdToken();

            const updated = await generateCurriculumDayWithProgress(
                curriculum.id,
                dayNumber,
                token,
                {
                    onStatus: (message) => {
                        setCurrentDayGenerationMessage(message);
                    },
                }
            );

            setCurriculum((prev) => mergeCurriculumState(prev, updated));
            setCurrentDayGenerationMessage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate day");
        } finally {
            setIsGeneratingDay(false);
        }
    }

    function mergeCurriculumState(
        prev: Curriculum | null,
        next: Curriculum
    ): Curriculum {
        if (!prev) return next;

        const mergedCompletedDays = Array.from(
            new Set([...(prev.completedDays ?? []), ...(next.completedDays ?? [])])
        ).sort((a, b) => a - b);

        return {
            ...prev,
            ...next,
            completedDays: mergedCompletedDays,
            currentDay: Math.max(prev.currentDay ?? 1, next.currentDay ?? 1),
            lastOpenedDay: next.lastOpenedDay ?? prev.lastOpenedDay,
            days: next.days,
        };
    }

    if (loading) {
        return (
            <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        DeepDaily
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold">Loading curriculum...</h1>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                        Please wait while DeepDaily loads your study plan.
                    </p>

                    <div className="mt-8 flex justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                    </div>
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
                            Please sign in to view your curriculum.
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

    if (error && !curriculum) {
        return (
            <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#111827]">
                    <h1 className="text-2xl font-semibold">Could not load curriculum</h1>
                    <p className="mt-3 text-red-600 dark:text-red-400">
                        {error || "Unknown error"}
                    </p>
                </div>
            </PageShell>
        );
    }

    if (!curriculum || !selectedDay) {
        return (
            <PageShell className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]">

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#111827]">
                    <h1 className="text-2xl font-semibold">Curriculum not available</h1>
                </div>
            </PageShell>
        );
    }

    const progressPercent =
        curriculum.durationDays > 0
            ? Math.round(
                (curriculum.completedDays.length / curriculum.durationDays) * 100
            )
            : 0;

    return (
        <PageShell
            showBack
            backLessonId={curriculum.lessonId}
            className="px-6 py-12 pt-20 dark:bg-[#1F2428] dark:text-[#ECFDF5]"
        >
            <div className="mx-auto max-w-6xl space-y-8">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                    <div className="border-b border-teal-100 bg-linear-to-r from-teal-50 via-white to-cyan-50 p-8 dark:border-teal-900/30 dark:from-teal-950/30 dark:via-[#111827] dark:to-cyan-950/20">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                            Structured learning
                        </p>

                        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                    {curriculum.title}
                                </h1>

                                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                    Topic:{" "}
                                    <span className="font-medium text-slate-800 dark:text-slate-100">
                                        {curriculum.topic}
                                    </span>
                                    {" · "}
                                    Level:{" "}
                                    <span className="font-medium capitalize text-slate-800 dark:text-slate-100">
                                        {curriculum.level}
                                    </span>
                                    {" · "}
                                    Plan:{" "}
                                    <span className="font-medium text-slate-800 dark:text-slate-100">
                                        {curriculum.durationDays} days
                                    </span>
                                </p>

                                <p className="mt-4 max-w-2xl leading-7 text-slate-700 dark:text-slate-300">
                                    {curriculum.overview}
                                </p>
                            </div>

                            <div className="min-w-[220px] rounded-2xl border border-teal-100 bg-white/80 p-5 backdrop-blur dark:border-teal-900/30 dark:bg-teal-950/10">
                                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                    Progress
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                    {curriculum.completedDays.length}/{curriculum.durationDays}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Day {curriculum.currentDay} is your current step
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-6">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                                className="h-full rounded-full bg-teal-600 transition-all dark:bg-teal-400"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {progressPercent}% complete
                        </p>
                    </div>
                </section>

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-sm dark:border-red-900/40 dark:bg-[#111827] dark:text-red-400">
                        {error}
                    </div>
                ) : null}

                <section className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="pr-1 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-2xl font-semibold">Days</h2>
                                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
                                    {curriculum.durationDays} total
                                </span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {curriculum.days.map((day) => {
                                    const isCompleted = curriculum.completedDays.includes(
                                        day.dayNumber
                                    );
                                    const isCurrent = curriculum.currentDay === day.dayNumber;
                                    const isSelected = selectedDayNumber === day.dayNumber;
                                    const isGenerated = day.isGenerated;

                                    return (
                                        <button
                                            key={day.dayNumber}
                                            type="button"
                                            onClick={() => handleSelectDay(day.dayNumber)}
                                            className={[
                                                "w-full rounded-2xl border p-4 text-left transition",
                                                isSelected
                                                    ? "border-teal-300 bg-teal-50 shadow-sm dark:border-teal-500/40 dark:bg-teal-950/20"
                                                    : "border-slate-200 bg-slate-50 hover:border-teal-200 hover:bg-teal-50/60 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        Day {day.dayNumber}
                                                    </p>
                                                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                        {day.title}
                                                    </p>
                                                </div>

                                                <div className="shrink-0">
                                                    {isCompleted ? (
                                                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
                                                            Done
                                                        </span>
                                                    ) : !isGenerated ? (
                                                        <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                            Ready
                                                        </span>
                                                    ) : isCurrent ? (
                                                        <span className="rounded-full bg-teal-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-teal-400 dark:text-slate-900">
                                                            Current
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-8">
                        {!selectedDay.isGenerated || isGeneratingDay ? (
                            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                                    Day {selectedDay.dayNumber}
                                </p>

                                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                    Preparing this lesson...
                                </h2>

                                <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">
                                    DeepDaily is generating the content for this day.
                                </p>

                                <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-900/30 dark:bg-teal-950/10">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                        Live progress
                                    </p>

                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/60 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                                        <span>
                                            {currentDayGenerationMessage ||
                                                `Generating day ${selectedDay.dayNumber}...`}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            <>
                                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                                        Day {selectedDay.dayNumber}
                                    </p>

                                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                        {selectedDay.title}
                                    </h2>

                                    <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Objective
                                    </p>

                                    <p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">
                                        {selectedDay.objective}
                                    </p>

                                    <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/60 p-5 dark:border-teal-900/30 dark:bg-teal-950/10">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                                            Summary
                                        </h3>

                                        <div className="mt-2">
                                            <MarkdownContent
                                                content={selectedDay.summary}
                                                className="text-slate-700 dark:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                        Lesson sections
                                    </h2>

                                    <div className="mt-6 space-y-6">
                                        {selectedDay.sections.map((section) => (
                                            <article
                                                key={section.title}
                                                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10"
                                            >
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {section.title}
                                                </h3>

                                                <div className="mt-2">
                                                    <MarkdownContent
                                                        content={section.content}
                                                        className="text-slate-700 dark:text-slate-300"
                                                    />
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>

                                {selectedDay.resources?.length ? (
                                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                            Resources
                                        </h2>

                                        <div className="mt-6 space-y-4">
                                            {selectedDay.resources.map((resource) => (
                                                <a
                                                    key={`${resource.title}-${resource.url}`}
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                            {resource.title}
                                                        </h3>

                                                        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
                                                            {resource.type}
                                                        </span>
                                                    </div>

                                                    {resource.reason ? (
                                                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                                                            {resource.reason}
                                                        </p>
                                                    ) : null}

                                                    {resource.snippet ? (
                                                        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                            {resource.snippet}
                                                        </p>
                                                    ) : null}

                                                    <p className="mt-3 break-all text-sm text-slate-500 dark:text-slate-400">
                                                        {resource.url}
                                                    </p>
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                ) : null}

                                {selectedDay.exercise ? (
                                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                            Practice
                                        </h2>

                                        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60">
                                            <MarkdownContent
                                                content={selectedDay.exercise}
                                                className="text-slate-700 dark:text-slate-300"
                                            />
                                        </div>
                                    </section>
                                ) : null}

                                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                                Actions
                                            </h2>

                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                Mark this day complete when you finish studying it.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleCompleteDay}
                                            disabled={
                                                isCompletingDay ||
                                                curriculum.completedDays.includes(selectedDay.dayNumber)
                                            }
                                            className="inline-flex items-center justify-center rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-400 dark:text-slate-900 dark:hover:bg-teal-300"
                                        >
                                            {curriculum.completedDays.includes(selectedDay.dayNumber)
                                                ? "Completed"
                                                : isCompletingDay
                                                    ? "Saving..."
                                                    : "Mark day complete"}
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </PageShell>
    );
}