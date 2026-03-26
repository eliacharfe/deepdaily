
// apps/web/components/sidebar-in-progress-card.tsx

"use client";

import Link from "next/link";
import type { Curriculum } from "@/types/curriculum";
import { getNextDayNumber } from "@/lib/primary-curriculum";

type Props = {
    curriculum: Curriculum;
};

export default function SidebarInProgressCard({ curriculum }: Props) {
    const nextDay = getNextDayNumber(curriculum);
    const progress = Math.round(
        (curriculum.completedDays.length / curriculum.durationDays) * 100
    );

    return (
        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                In progress
            </p>

            <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
                {curriculum.title}
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Day {nextDay} of {curriculum.durationDays}
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {progress}% completed
            </p>

            <Link
                href={`/curriculum/${curriculum.id}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-teal-500/30 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
            >
                Continue Day {nextDay}
            </Link>
        </div>
    );
}