// apps/web/components/curriculum-cta-card.tsx

import type { Curriculum } from "@/types/curriculum";
import { useRouter } from "next/navigation";

type Props = {
    isCreatingCurriculum: boolean;
    selectedDuration: 7 | 30 | null;
    curriculumMessage: string;
    onCreateCurriculum: (durationDays: 7 | 30) => void;
    compact?: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    curricula?: Curriculum[];
    has7DayCurriculum?: boolean;
    has30DayCurriculum?: boolean;
};

export default function CurriculumCtaCard({
    isCreatingCurriculum,
    selectedDuration,
    curriculumMessage,
    onCreateCurriculum,
    compact = false,
    containerRef,
    curricula = [],
    has7DayCurriculum = false,
    has30DayCurriculum = false,
}: Props) {
    const hasAnyCurriculum = curricula.length > 0;

    const router = useRouter();

    const existingCurriculum = curricula?.[0]; // or smarter selection if needed

    return (
        <div
            ref={containerRef}
            className="dd-surface dd-surface-top-line rounded-3xl border p-8 shadow-sm"
        >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                Structured learning
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
                {hasAnyCurriculum
                    ? "Your active curriculum"
                    : compact
                        ? "Build a curriculum"
                        : "Turn this into a daily curriculum"}
            </h2>

            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                {hasAnyCurriculum
                    ? "You already started a structured plan for this lesson. Continue your progress day by day."
                    : compact
                        ? "Turn this lesson into a guided daily plan and track your progress one day at a time."
                        : "Choose a guided plan and progress day by day with a structured path built from this lesson."}
            </p>

            {/* EXISTING CURRICULA */}
            {hasAnyCurriculum ? (
                <div className="mt-6 space-y-4">
                    {curricula.map((curriculum) => {
                        const completed = curriculum.completedDays.length;
                        const total = curriculum.durationDays;
                        const progressPercent =
                            total > 0 ? Math.round((completed / total) * 100) : 0;

                        return (
                            <div
                                key={curriculum.id}
                                onClick={() => router.push(`/curriculum/${curriculum.id}`)}
                                className="dd-surface-soft cursor-pointer rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm dark:hover:border-teal-500/20"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {curriculum.durationDays}-Day{" "}
                                                {curriculum.durationDays === 7
                                                    ? "Sprint"
                                                    : "Deep Dive"}
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

                                        <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                                            {completed}/{total} completed ·{" "}
                                            {progressPercent}% done
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <span className="text-teal-600 transition group-hover:translate-x-0.5 dark:text-teal-300">
                                        →
                                    </span>
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800/80">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${progressPercent}%`,
                                            background: "var(--accent)",
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {/* CREATE OPTIONS */}
            {!has7DayCurriculum || !has30DayCurriculum ? (
                <div className="mt-6 space-y-4">
                    {!has7DayCurriculum && (
                        <button
                            type="button"
                            onClick={() => onCreateCurriculum(7)}
                            disabled={isCreatingCurriculum}
                            className="dd-surface-soft group w-full rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70 dark:hover:border-teal-500/20"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            7-Day Sprint
                                        </h3>

                                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
                                            Fast track
                                        </span>
                                    </div>

                                    <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                                        A focused one-week plan to build solid understanding quickly.
                                    </p>

                                    {isCreatingCurriculum &&
                                        selectedDuration === 7 && (
                                            <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                                                Creating your 7-day plan...
                                            </div>
                                        )}
                                </div>

                                <span className="text-teal-600 transition group-hover:translate-x-0.5 dark:text-teal-300">
                                    →
                                </span>
                            </div>
                        </button>
                    )}

                    {!has30DayCurriculum && (
                        <button
                            type="button"
                            onClick={() => onCreateCurriculum(30)}
                            disabled={isCreatingCurriculum}
                            className="dd-surface-soft group w-full rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70 dark:hover:border-teal-500/20"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            30-Day Deep Dive
                                        </h3>

                                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:border-cyan-900/30 dark:bg-cyan-950/20 dark:text-cyan-300">
                                            Mastery
                                        </span>
                                    </div>

                                    <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                                        A deeper curriculum with daily progression, reinforcement, and long-term retention.
                                    </p>

                                    {isCreatingCurriculum &&
                                        selectedDuration === 30 && (
                                            <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                                                Creating your 30-day plan...
                                            </div>
                                        )}
                                </div>

                                <span className="text-teal-600 transition group-hover:translate-x-0.5 dark:text-teal-300">
                                    →
                                </span>
                            </div>
                        </button>
                    )}
                </div>
            ) : null}

            {/* MESSAGE */}
            {curriculumMessage ? (
                <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-sm leading-6 text-slate-700 dark:border-teal-900/30 dark:bg-teal-950/10 dark:text-slate-300">
                    {curriculumMessage}
                </div>
            ) : hasAnyCurriculum ? (
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Continue your current plan, or create the other format if you want a different pace.
                </p>
            ) : (
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Coming next: daily lessons, progress tracking, and day-by-day completion.
                </p>
            )}
        </div>
    );
}