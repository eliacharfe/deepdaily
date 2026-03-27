// apps/web/components/continue-learning-card.tsx

"use client";

import Link from "next/link";
import type { Curriculum } from "@/types/curriculum";
import { getNextDayNumber } from "@/lib/primary-curriculum";

type Props = {
    curriculum: Curriculum;
};

export default function ContinueLearningCard({ curriculum }: Props) {
    const nextDay = getNextDayNumber(curriculum);
    const progress = Math.round(
        (curriculum.completedDays.length / curriculum.durationDays) * 100
    );

    return (
        <div className="dd-surface dd-surface-top-line mt-5 rounded-3xl border p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                Continue learning
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                {curriculum.title}
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Day {nextDay} of {curriculum.durationDays}
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {progress}% completed
            </p>

            <div className="mt-5">
                <Link
                    href={`/curriculum/${curriculum.id}`}
                    className="inline-flex rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
                    style={{
                        background: "linear-gradient(135deg, #19c2b3 0%, #0f8f86 100%)",
                        boxShadow: "0 10px 24px rgba(20, 184, 166, 0.22)",
                    }}
                >
                    Continue Day {nextDay}
                </Link>
            </div>
        </div >
    );
}