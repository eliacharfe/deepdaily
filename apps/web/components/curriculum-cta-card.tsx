// apps/web/components/curriculum-cta-card.tsx

type Props = {
    isCreatingCurriculum: boolean;
    selectedDuration: 7 | 30 | null;
    curriculumMessage: string;
    onCreateCurriculum: (durationDays: 7 | 30) => void;
    compact?: boolean;
};

export default function CurriculumCtaCard({
    isCreatingCurriculum,
    selectedDuration,
    curriculumMessage,
    onCreateCurriculum,
    compact = false,
}: Props) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                Structured learning
            </p>

            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                {compact ? "Build a curriculum" : "Turn this into a daily curriculum"}
            </h2>

            <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                {compact
                    ? "Turn this lesson into a guided daily plan and track your progress one day at a time."
                    : "Choose a guided plan and progress day by day with a structured path built from this lesson."}
            </p>

            <div className="mt-6 space-y-4">
                <button
                    type="button"
                    onClick={() => onCreateCurriculum(7)}
                    disabled={isCreatingCurriculum}
                    className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10"
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

                            <p className="mt-2 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                                A focused one-week plan to build solid understanding quickly.
                            </p>

                            {isCreatingCurriculum && selectedDuration === 7 ? (
                                <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                                    Creating your 7-day plan...
                                </div>
                            ) : null}
                        </div>

                        <span className="text-teal-600 transition group-hover:translate-x-0.5 dark:text-teal-300">
                            →
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onCreateCurriculum(30)}
                    disabled={isCreatingCurriculum}
                    className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/10"
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

                            <p className="mt-2 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                                A deeper curriculum with daily progression, reinforcement, and long-term retention.
                            </p>

                            {isCreatingCurriculum && selectedDuration === 30 ? (
                                <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-300" />
                                    Creating your 30-day plan...
                                </div>
                            ) : null}
                        </div>

                        <span className="text-teal-600 transition group-hover:translate-x-0.5 dark:text-teal-300">
                            →
                        </span>
                    </div>
                </button>
            </div>

            {curriculumMessage ? (
                <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-sm leading-6 text-slate-700 dark:border-teal-900/30 dark:bg-teal-950/10 dark:text-slate-300">
                    {curriculumMessage}
                </div>
            ) : (
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Coming next: daily lessons, progress tracking, and day-by-day completion.
                </p>
            )}
        </div>
    );
}