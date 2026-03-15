
// apps/web/components/curriculum-page-client.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import AuthButton from "@/components/auth/auth-button";
import HomeButton from "@/components/home-button";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { useAuth } from "@/components/providers/auth-provider";
import {
    completeCurriculumDay,
    getCurriculum,
    updateCurriculumLastOpenedDay,
} from "@/lib/curricula-api";
import type { Curriculum } from "@/types/curriculum";
import BackButton from "@/components/back-button";
import { generateCurriculumDay } from "@/lib/curricula-api";

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

            const token = await user.getIdToken();
            const updated = await updateCurriculumLastOpenedDay(
                curriculum.id,
                dayNumber,
                token
            );

            setCurriculum(updated);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update selected day"
            );
        } finally {
            setIsUpdatingOpenedDay(false);
        }

        await ensureDayGenerated(dayNumber);
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

            setCurriculum(updated);
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

            const token = await user.getIdToken();
            const updated = await generateCurriculumDay(curriculum.id, dayNumber, token);

            setCurriculum(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate day");
        } finally {
            setIsGeneratingDay(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 px-6 py-12 pt-20 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">

                <div className="fixed right-20 top-5 z-40 flex items-center gap-3">

                    <HomeButton />
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">Loading curriculum...</h1>
                    <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                        Please wait while DeepDaily loads your study plan.
                    </p>

                    <div className="mt-8 flex justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
                    </div>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <>
                <main className="min-h-screen bg-slate-50 px-6 py-12 pt-20 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
                    <div className="fixed right-20 top-5 z-40 flex items-center gap-3">

                        <HomeButton />
                        <AuthButton />
                    </div>

                    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                        <h1 className="text-2xl font-semibold">Sign in required</h1>
                        <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                            Please sign in to view your curriculum.
                        </p>
                    </div>
                </main>

                <LoginRequiredModal
                    open={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                />
            </>
        );
    }

    if (error && !curriculum) {
        return (
            <main className="min-h-screen bg-slate-50 px-6 py-12 pt-20 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40 flex items-center gap-3">

                    <HomeButton />
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">Could not load curriculum</h1>
                    <p className="mt-3 text-red-600 dark:text-red-400">
                        {error || "Unknown error"}
                    </p>
                </div>
            </main>
        );
    }

    if (!curriculum || !selectedDay) {
        return (
            <main className="min-h-screen px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40 flex items-center gap-3">

                    <HomeButton />
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">Curriculum not available</h1>
                </div>
            </main>
        );
    }

    const progressPercent =
        curriculum.durationDays > 0
            ? Math.round(
                (curriculum.completedDays.length / curriculum.durationDays) * 100
            )
            : 0;

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-12 pt-20 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">

            <div className="fixed right-20 top-5 z-40 flex items-center gap-3">
                <BackButton lessonId={curriculum.lessonId} />
                <HomeButton />
                <AuthButton />
            </div>

            <div className="mx-auto max-w-6xl space-y-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                        Structured learning
                    </p>

                    <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                {curriculum.title}
                            </h1>

                            <p className="mt-4 text-sm text-slate-500 dark:text-[#CDBFB6]">
                                Topic:{" "}
                                <span className="font-medium text-slate-800 dark:text-[#F1E7DF]">
                                    {curriculum.topic}
                                </span>
                                {" · "}
                                Level:{" "}
                                <span className="font-medium capitalize text-slate-800 dark:text-[#F1E7DF]">
                                    {curriculum.level}
                                </span>
                                {" · "}
                                Plan:{" "}
                                <span className="font-medium text-slate-800 dark:text-[#F1E7DF]">
                                    {curriculum.durationDays} days
                                </span>
                            </p>

                            <p className="mt-4 max-w-2xl leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                {curriculum.overview}
                            </p>
                        </div>

                        <div className="min-w-[220px] rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-[#CDBFB6]">
                                Progress
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {curriculum.completedDays.length}/{curriculum.durationDays}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-[#D5C6BC]">
                                Day {curriculum.currentDay} is your current step
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-[#2F2A28]">
                            <div
                                className="h-full rounded-full bg-slate-900 transition-all dark:bg-[#F1E7DF]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="mt-2 text-sm text-slate-500 dark:text-[#CDBFB6]">
                            {progressPercent}% complete
                        </p>
                    </div>
                </section>

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-sm dark:border-red-900/40 dark:bg-[#3A3533] dark:text-red-400">
                        {error}
                    </div>
                ) : null}

                <section className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Days</h2>



                            <div className="mt-5 space-y-3">
                                {curriculum.days.map((day) => {
                                    const isCompleted = curriculum.completedDays.includes(
                                        day.dayNumber
                                    );
                                    const isCurrent =
                                        curriculum.currentDay === day.dayNumber;
                                    const isSelected =
                                        selectedDayNumber === day.dayNumber;
                                    const isGenerated = day.isGenerated;

                                    return (
                                        <button
                                            key={day.dayNumber}
                                            type="button"
                                            onClick={() => handleSelectDay(day.dayNumber)}
                                            className={[
                                                "w-full rounded-2xl border p-4 text-left transition",
                                                isSelected
                                                    ? "border-slate-900 bg-slate-100 dark:border-[#F1E7DF] dark:bg-[#2F2A28]"
                                                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B]",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-[#F1E7DF]">
                                                        Day {day.dayNumber}
                                                    </p>
                                                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-[#D5C6BC]">
                                                        {day.title}
                                                    </p>
                                                </div>

                                                <div className="shrink-0">
                                                    {isCompleted ? (
                                                        <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                                            Done
                                                        </span>
                                                    ) : !isGenerated ? (
                                                        <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                                            Ready
                                                        </span>
                                                    ) : isCurrent ? (
                                                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white dark:bg-[#F1E7DF] dark:text-[#2D2B2B]">
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
                            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                                    Day {selectedDay.dayNumber}
                                </p>

                                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                                    Preparing this lesson...
                                </h2>

                                <p className="mt-4 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                    DeepDaily is generating the content for this day.
                                </p>

                                <div className="mt-8 flex items-center gap-3 text-sm text-slate-600 dark:text-[#D5C6BC]">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
                                    Generating day {selectedDay.dayNumber}...
                                </div>
                            </section>
                        ) : (
                            <>
                                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                                        Day {selectedDay.dayNumber}
                                    </p>

                                    <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                                        {selectedDay.title}
                                    </h2>

                                    <p className="mt-4 text-sm font-medium text-slate-600 dark:text-[#CDBFB6]">
                                        Objective
                                    </p>
                                    <p className="mt-2 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                        {selectedDay.objective}
                                    </p>

                                    <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-[#CDBFB6]">
                                            Summary
                                        </h3>
                                        <p className="mt-2 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                            {selectedDay.summary}
                                        </p>
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                                    <h2 className="text-2xl font-semibold">Lesson sections</h2>

                                    <div className="mt-6 space-y-6">
                                        {selectedDay.sections.map((section) => (
                                            <article
                                                key={section.title}
                                                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-[#4C4541] dark:bg-[#2F2A28]"
                                            >
                                                <h3 className="text-lg font-semibold">
                                                    {section.title}
                                                </h3>
                                                <p className="mt-2 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                                    {section.content}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                </section>

                                {selectedDay.exercise ? (
                                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                                        <h2 className="text-2xl font-semibold">Practice</h2>
                                        <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
                                            <p className="leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                                {selectedDay.exercise}
                                            </p>
                                        </div>
                                    </section>
                                ) : null}

                                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-2xl font-semibold">Actions</h2>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-[#CDBFB6]">
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
                                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F1E7DF] dark:text-[#2D2B2B]"
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
        </main>
    );
}