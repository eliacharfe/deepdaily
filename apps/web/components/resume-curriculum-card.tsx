
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
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                Continue learning
            </p>

            <h2 className="mt-3 text-2xl font-semibold">Resume your curriculum</h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-[#CDBFB6]">
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
                            className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-slate-100 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B] dark:hover:bg-[#383230]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1E7DF]">
                                            {curriculum.durationDays}-Day{" "}
                                            {curriculum.durationDays === 7 ? "Sprint" : "Deep Dive"}
                                        </h3>

                                        <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                            Day {curriculum.currentDay}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#D5C6BC]">
                                        {completed}/{total} completed · {progressPercent}% done
                                    </p>
                                </div>

                                <span className="text-slate-400 dark:text-[#A89B92]">→</span>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#3A3533]">
                                <div
                                    className="h-full rounded-full bg-slate-900 dark:bg-[#F1E7DF]"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}