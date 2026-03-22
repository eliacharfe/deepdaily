// apps/web/components/resume-curriculum-card.tsx

"use client";

import Link from "next/link";
import type { Curriculum } from "@/types/curriculum";

type Props = {
    curricula: Curriculum[];
};

export default function ResumeCurriculumCard({ curricula }: Props) {
    if (curricula.length === 0) return null;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                Continue learning
            </p>

            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                Resume your curriculum
            </h2>

            <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                You already started a structured plan for this lesson. Continue where you left off.
            </p>

            <div className="mt-6 space-y-4">
                {curricula.map((curriculum) => {
                    const completed = curriculum.completedDays.length;
                    const total = curriculum.durationDays;
                    const progressPercent =
                        total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                        <Link
                            key={curriculum.id}
                            href={`/curriculum/${curriculum.id}`}
                            className="group block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {curriculum.durationDays}-Day{" "}
                                            {curriculum.durationDays === 7 ? "Sprint" : "Deep Dive"}
                                        </h3>

                                        <span
                                            className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{
                                                borderColor: "var(--accent-border)",
                                                background: "var(--accent-soft)",
                                                color: "var(--accent)",
                                            }}
                                        >
                                            Day {curriculum.currentDay}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                                        {completed}/{total} completed · {progressPercent}% done
                                    </p>
                                </div>

                                <span className="text-teal-600 transition group-hover:translate-x-0.5 dark:text-teal-300">
                                    →
                                </span>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: "var(--accent)",
                                    }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}