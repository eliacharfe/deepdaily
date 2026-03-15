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
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                Structured learning
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
                {compact ? "Build a curriculum" : "Turn this into a daily curriculum"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-[#CDBFB6]">
                {compact
                    ? "Turn this lesson into a guided daily plan and track your progress one day at a time."
                    : "Choose a guided plan and progress day by day with a structured path built from this lesson."}
            </p>

            <div className="mt-6 space-y-4">
                <button
                    type="button"
                    onClick={() => onCreateCurriculum(7)}
                    disabled={isCreatingCurriculum}
                    className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B] dark:hover:bg-[#383230]"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1E7DF]">
                                    7-Day Sprint
                                </h3>
                                <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                    Fast track
                                </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#D5C6BC]">
                                A focused one-week plan to build solid understanding quickly.
                            </p>

                            {isCreatingCurriculum && selectedDuration === 7 ? (
                                <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-[#D5C6BC]">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
                                    Creating your 7-day plan...
                                </div>
                            ) : null}
                        </div>

                        <span className="text-slate-400 transition group-hover:translate-x-0.5 dark:text-[#A89B92]">
                            →
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onCreateCurriculum(30)}
                    disabled={isCreatingCurriculum}
                    className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B] dark:hover:bg-[#383230]"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1E7DF]">
                                    30-Day Deep Dive
                                </h3>
                                <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                    Mastery
                                </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#D5C6BC]">
                                A deeper curriculum with daily progression, reinforcement, and long-term retention.
                            </p>

                            {isCreatingCurriculum && selectedDuration === 30 ? (
                                <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-[#D5C6BC]">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
                                    Creating your 30-day plan...
                                </div>
                            ) : null}
                        </div>

                        <span className="text-slate-400 transition group-hover:translate-x-0.5 dark:text-[#A89B92]">
                            →
                        </span>
                    </div>
                </button>
            </div>

            {curriculumMessage ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:text-[#D5C6BC]">
                    {curriculumMessage}
                </div>
            ) : (
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-[#A89B92]">
                    Coming next: daily lessons, progress tracking, and day-by-day completion.
                </p>
            )}
        </div>
    );
}