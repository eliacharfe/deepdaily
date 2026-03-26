
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
} from "@/lib/primary-curriculum";
import type { Curriculum } from "@/types/curriculum";

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

    const primaryCurriculum = pickPrimaryCurriculum(curricula);
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

    return (
        <>
            <TopicGeneratorForm />

            {primaryCurriculum ? (
                <div className="w-full max-w-3xl">
                    <ContinueLearningCard curriculum={primaryCurriculum} />
                </div>
            ) : null}

            {!loading && user && !isLoadingCurricula && otherActiveCurricula.length > 0 ? (
                <div className="mt-5 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        Other learning paths
                    </p>

                    <div className="mt-4 space-y-3">
                        {otherActiveCurricula.map((curriculum) => {
                            const progress = Math.round(
                                (curriculum.completedDays.length / curriculum.durationDays) * 100
                            );

                            return (
                                <div
                                    key={curriculum.id}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4 dark:border-[#334155]"
                                >
                                    <div className="min-w-0 flex-1 text-left">
                                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                            {curriculum.title}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Day {curriculum.lastOpenedDay} of {curriculum.durationDays}
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

                                    <a
                                        href={`/curriculum/${curriculum.id}`}
                                        className="shrink-0 rounded-xl border border-teal-500/30 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
                                    >
                                        Open
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </>
    );
}