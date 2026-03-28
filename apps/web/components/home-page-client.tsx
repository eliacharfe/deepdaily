
// apps/web/components/home-page-client.tsx

"use client";

import { useEffect, useState } from "react";
import TopicGeneratorForm from "@/components/topic-generator-form";
import ContinueLearningCard from "@/components/continue-learning-card";
import { useAuth } from "@/components/providers/auth-provider";
import { getCurricula } from "@/lib/curricula-api";
import {
    pickPrimaryCurriculum,
    isCurriculumCompleted,
    getNextDayNumber,
} from "@/lib/primary-curriculum";
import type { Curriculum } from "@/types/curriculum";
import Link from "next/link";

export default function HomePageClient() {
    const { user, loading } = useAuth();

    const [curricula, setCurricula] = useState<Curriculum[]>([]);
    const [isLoadingCurricula, setIsLoadingCurricula] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadCurricula() {
            if (!user) {
                setCurricula([]);
                return;
            }

            try {
                setIsLoadingCurricula(true);

                const token = await user.getIdToken();
                const data = await getCurricula(token);

                if (!cancelled) {
                    setCurricula(data);
                }
            } catch (error) {
                console.error("Failed to load curricula:", error);

                if (!cancelled) {
                    setCurricula([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingCurricula(false);
                }
            }
        }

        if (!loading) {
            loadCurricula();
        }

        return () => {
            cancelled = true;
        };
    }, [user, loading]);

    function groupCurriculaByLesson(curricula: Curriculum[]): Curriculum[][] {
        const groups = new Map<string, Curriculum[]>();

        for (const curriculum of curricula) {
            const key = curriculum.lessonId;

            if (!groups.has(key)) {
                groups.set(key, []);
            }

            groups.get(key)!.push(curriculum);
        }

        return Array.from(groups.values()).map((group) =>
            [...group].sort((a, b) => a.durationDays - b.durationDays)
        );
    }

    const primaryCurriculum = pickPrimaryCurriculum(curricula);
    const hasAnyCurricula = curricula.length > 0;
    const hasActiveCurricula = curricula.some(
        (curriculum) => !isCurriculumCompleted(curriculum)
    );
    const otherActiveCurricula = [...curricula]
        .filter(
            (curriculum) =>
                !isCurriculumCompleted(curriculum) &&
                curriculum.id !== primaryCurriculum?.id
        )
        .sort((a, b) => {
            if (b.lastOpenedDay !== a.lastOpenedDay) {
                return b.lastOpenedDay - a.lastOpenedDay;
            }

            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

    const groupedOtherCurricula = groupCurriculaByLesson(otherActiveCurricula);

    return (
        <>

            {!loading && user && !isLoadingCurricula && !hasAnyCurricula ? (
                <div className="mb-6 mt-6 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        Start learning
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                        Start your first learning path
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Pick any topic and DeepDaily will turn it into a structured day-by-day plan you can actually follow.
                    </p>
                </div>
            ) : null}

            {!loading && user && !isLoadingCurricula && hasAnyCurricula && !hasActiveCurricula ? (
                <div className="mb-6 mt-6 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        Great progress
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                        Ready for a new topic?
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        You finished your active learning plans. Generate a new topic and keep the momentum going.
                    </p>
                </div>
            ) : null}

            <TopicGeneratorForm />

            {primaryCurriculum ? (
                <div className="w-full max-w-3xl">
                    <ContinueLearningCard curriculum={primaryCurriculum} />
                </div>
            ) : null}

            {!loading && user && !isLoadingCurricula && otherActiveCurricula.length > 0 ? (
                <div className="dd-surface dd-surface-top-line mt-5 w-full max-w-3xl rounded-3xl border p-6 shadow-sm">
                    <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        Other learning paths
                    </p>

                    <div className="space-y-4">
                        {groupedOtherCurricula.map((group) => {
                            function capitalizeFirst(str: string) {
                                return str.charAt(0).toUpperCase() + str.slice(1);
                            }

                            const groupTitle = capitalizeFirst(group[0]?.topic ?? "Learning topic");

                            return (
                                <div
                                    key={group[0].lessonId}
                                    className="dd-surface-soft rounded-2xl border px-4 py-4"
                                >
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {groupTitle}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {group.length} active plan{group.length > 1 ? "s" : ""}
                                        </p>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {group.map((curriculum) => {
                                            const nextDay = getNextDayNumber(curriculum);
                                            const progress = Math.round(
                                                (curriculum.completedDays.length / curriculum.durationDays) * 100
                                            );

                                            return (
                                                <div
                                                    key={curriculum.id}
                                                    className="dd-surface-soft flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition hover:border-teal-500/20"
                                                >
                                                    <div className="min-w-0 flex-1 text-left">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="dd-surface rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                                {curriculum.durationDays}-day plan
                                                            </span>
                                                        </div>

                                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                            Continue with Day {nextDay} of {curriculum.durationDays}
                                                        </p>

                                                        <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                                            <div
                                                                className="h-full rounded-full bg-teal-500 transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>

                                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                            {progress}% completed
                                                        </p>
                                                    </div>

                                                    <Link
                                                        href={`/curriculum/${curriculum.id}`}
                                                        className="shrink-0 rounded-xl border border-teal-500/30 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
                                                    >
                                                        Continue
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            ) : null}
        </>
    );
}