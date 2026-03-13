//apps/web/app/learn/page.tsx

import { generateTopic } from "@/lib/api";
import type { TopicLevel } from "@/types/topic";
import StreamingLesson from "@/components/streaming-lesson";
import AuthButton from "@/components/auth/auth-button";

type LearnPageProps = {
    searchParams: Promise<{
        topic?: string;
        level?: string;
    }>;
};

export default async function LearnPage({ searchParams }: LearnPageProps) {
    const params = await searchParams;

    const topic = params.topic?.trim() || "";
    const level = (params.level || "beginner") as TopicLevel;

    if (!topic) {
        return (
            <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900 transition-colors dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                        No topic provided
                    </h1>
                    <p className="mt-3 text-slate-600 dark:text-[#D5C6BC]">
                        Go back and enter a topic to generate your first lesson.
                    </p>
                </div>
            </main>
        );
    }

    const data = await generateTopic({ topic, level });

    return (
        <main className="min-h-screen bg-slate-50 pt-20 px-6 py-12 text-slate-900 transition-colors dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">

            <div className="fixed right-20 top-5 z-40">
                <AuthButton />
            </div>


            <div className="mx-auto max-w-5xl space-y-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#B9AAA0]">
                        DeepDaily lesson
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-[#FFF7F1]">
                        {data.lesson.title}
                    </h1>

                    <p className="mt-4 text-sm text-slate-500 dark:text-[#B9AAA0]">
                        Topic:{" "}
                        <span className="font-medium text-slate-800 dark:text-[#F1E7DF]">
                            {data.topic}
                        </span>
                        {" · "}
                        Level:{" "}
                        <span className="font-medium capitalize text-slate-800 dark:text-[#F1E7DF]">
                            {data.level}
                        </span>
                    </p>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-[#B9AAA0]">
                            Today&apos;s focus
                        </h2>
                        <p className="mt-2 text-base text-slate-700 dark:text-[#DCCFC6]">
                            {data.lesson.today_focus}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                            Summary
                        </h2>
                        <p className="mt-3 leading-7 text-slate-700 dark:text-[#DCCFC6]">
                            {data.lesson.summary}
                        </p>
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                                Lesson sections
                            </h2>

                            <div className="mt-6 space-y-6">
                                {data.lesson.sections.map((section) => (
                                    <article
                                        key={section.title}
                                        className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-[#4A4441] dark:bg-[#2F2A28]"
                                    >
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F7EEE8]">
                                            {section.title}
                                        </h3>
                                        <p className="mt-2 leading-7 text-slate-700 dark:text-[#DCCFC6]">
                                            {section.content}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                                Resources
                            </h2>

                            <div className="mt-6 space-y-4">
                                {data.resources.map((resource) => (
                                    <a
                                        key={`${resource.title}-${resource.url}`}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-300 dark:border-[#4A4441] dark:bg-[#2F2A28] dark:hover:border-[#6A615C]"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F7EEE8]">
                                                {resource.title}
                                            </h3>
                                            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-[#6A615C] dark:text-[#D5C6BC]">
                                                {resource.type}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-slate-600 dark:text-[#D5C6BC]">
                                            {resource.reason}
                                        </p>

                                        {resource.snippet ? (
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-[#B9AAA0]">
                                                {resource.snippet}
                                            </p>
                                        ) : null}

                                        <p className="mt-3 break-all text-sm text-slate-500 dark:text-[#B9AAA0]">
                                            {resource.url}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                                Roadmap
                            </h2>

                            <ol className="mt-6 space-y-3">
                                {data.roadmap.map((item, index) => (
                                    <li
                                        key={`${index}-${item}`}
                                        className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-[#2F2A28]"
                                    >
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white dark:bg-[#F1E7DF] dark:text-[#2D2B2B]">
                                            {index + 1}
                                        </span>
                                        <span className="leading-6 text-slate-700 dark:text-[#DCCFC6]">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#FFF7F1]">
                                Next step
                            </h2>
                            <p className="mt-4 leading-7 text-slate-700 dark:text-[#DCCFC6]">
                                {data.lesson.next_step}
                            </p>
                        </div>
                    </aside>
                </section>

                <StreamingLesson topic={data.topic} level={data.level} />
            </div>
        </main>
    );
}