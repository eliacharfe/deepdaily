// apps/web/components/lesson-view.tsx

import type { LessonSection } from "@/types/lesson";

type Props = {
    title: string;
    topic: string;
    level: string;
    sections: LessonSection[];
    actionSlot?: React.ReactNode;
};

export default function LessonView({
    title,
    topic,
    level,
    sections,
    actionSlot,
}: Props) {
    return (
        <main className="min-h-screen px-6 py-10 lg:px-10">
            <div className="mx-auto max-w-4xl">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-[#B9AAA0]">
                                {level}
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                                {title}
                            </h1>
                            <p className="mt-3 text-base text-slate-600 dark:text-[#CDBFB6]">
                                Topic: {topic}
                            </p>
                        </div>

                        {actionSlot ? <div className="shrink-0">{actionSlot}</div> : null}
                    </div>

                    <div className="mt-8 space-y-6">
                        {sections.map((section, index) => (
                            <section
                                key={`${section.title}-${index}`}
                                className="rounded-2xl border border-slate-200 p-5 dark:border-[#4C4541]"
                            >
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                                    {section.title}
                                </h2>
                                <p className="mt-3 whitespace-pre-line leading-7 text-slate-700 dark:text-[#D8C9BF]">
                                    {section.content}
                                </p>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}