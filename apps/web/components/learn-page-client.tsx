// //apps/web/components/learn-page-client.tsx

"use client";

import { useEffect, useState } from "react";
import StreamingLesson from "@/components/streaming-lesson";
import AuthButton from "@/components/auth/auth-button";
import SaveLessonButton from "@/components/save-lesson-button";
import LoginRequiredModal from "@/components/auth/login-required-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { config } from "@/lib/config";
import type { TopicLevel } from "@/types/topic";
import type { SavedLesson } from "@/types/lesson";


type Props = {
    topic: string;
    level: TopicLevel;
};

export default function LearnPageClient({ topic, level }: Props) {
    const { user, loading: authLoading } = useAuth();

    const [data, setData] = useState<SavedLesson | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (authLoading) return;

            if (!user) {
                setShowLoginModal(true);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const token = await user.getIdToken();

                const res = await fetch(`${config.apiBaseUrl}/lessons/generate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ topic, level }),
                });

                const contentType = res.headers.get("content-type") || "";

                if (!res.ok) {
                    if (contentType.includes("application/json")) {
                        const errData = await res.json();
                        throw new Error(errData.detail || "Failed to generate lesson");
                    }
                    throw new Error(`Failed to generate lesson (${res.status})`);
                }

                const result = (await res.json()) as SavedLesson;

                if (!cancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to generate lesson");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [topic, level, user, authLoading]);

    if (loading) {
        return (
            <main className="min-h-screen pt-20 px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40">
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">Generating your lesson...</h1>
                    <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                        Please wait while DeepDaily prepares your learning path.
                    </p>

                    <div className="mt-8 flex justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
                    </div>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <>
                <main className="min-h-screen px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                    <div className="fixed right-20 top-5 z-40">
                        <AuthButton />
                    </div>

                    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                        <h1 className="text-2xl font-semibold">Sign in required</h1>
                        <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                            Please sign in to generate and save lessons.
                        </p>
                    </div>
                </main>

                <LoginRequiredModal
                    open={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                />
            </>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-screen px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
                <div className="fixed right-20 top-5 z-40">
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">Could not generate lesson</h1>
                    <p className="mt-3 text-red-600 dark:text-red-400">
                        {error || "Unknown error"}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-20 px-6 py-12 text-slate-900 dark:text-[#F1E7DF]">
            <div className="fixed right-20 top-5 z-40">
                <AuthButton />
            </div>

            <div className="mx-auto max-w-5xl space-y-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
                                DeepDaily lesson
                            </p>

                            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                {data.lesson.title}
                            </h1>

                            <p className="mt-4 text-sm text-slate-500 dark:text-[#CDBFB6]">
                                Topic: <span className="font-medium text-slate-800 dark:text-[#F1E7DF]">{data.topic}</span>
                                {" · "}
                                Level: <span className="font-medium capitalize text-slate-800 dark:text-[#F1E7DF]">{data.level}</span>
                            </p>
                        </div>

                        <SaveLessonButton lessonId={data.id} />
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-[#CDBFB6]">
                            Today&apos;s focus
                        </h2>
                        <p className="mt-2 text-base text-slate-700 dark:text-[#F1E7DF]">
                            {data.lesson.today_focus}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Summary</h2>
                        <p className="mt-3 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                            {data.lesson.summary}
                        </p>
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Lesson sections</h2>

                            <div className="mt-6 space-y-6">
                                {data.lesson.sections.map((section) => (
                                    <article
                                        key={section.title}
                                        className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-[#4C4541] dark:bg-[#2F2A28]"
                                    >
                                        <h3 className="text-lg font-semibold">{section.title}</h3>
                                        <p className="mt-2 leading-7 text-slate-700 dark:text-[#D5C6BC]">
                                            {section.content}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Resources</h2>

                            <div className="mt-6 space-y-4">
                                {data.resources.map((resource) => (
                                    <a
                                        key={`${resource.title}-${resource.url}`}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-300 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B]"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1E7DF]">
                                                {resource.title}
                                            </h3>
                                            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
                                                {resource.type}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-slate-600 dark:text-[#D5C6BC]">{resource.reason}</p>

                                        {resource.snippet ? (
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-[#B8AAA1]">
                                                {resource.snippet}
                                            </p>
                                        ) : null}

                                        <p className="mt-3 text-sm text-slate-500 dark:text-[#A89B92]">{resource.url}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-8">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Roadmap</h2>

                            <ol className="mt-6 space-y-3">
                                {data.roadmap.map((item, index) => (
                                    <li
                                        key={`${index}-${item}`}
                                        className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-[#2F2A28]"
                                    >
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white dark:bg-[#F1E7DF] dark:text-[#2D2B2B]">
                                            {index + 1}
                                        </span>
                                        <span className="leading-6 text-slate-700 dark:text-[#D5C6BC]">{item}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                            <h2 className="text-2xl font-semibold">Next step</h2>
                            <p className="mt-4 leading-7 text-slate-700 dark:text-[#D5C6BC]">
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

// "use client";

// import { useEffect, useState } from "react";
// import StreamingLesson from "@/components/streaming-lesson";
// import { generateTopic } from "@/lib/api";
// import type { TopicGenerateResponse, TopicLevel } from "@/types/topic";
// import AuthButton from "@/components/auth/auth-button";

// type Props = {
//     topic: string;
//     level: TopicLevel;
// };

// export default function LearnPageClient({ topic, level }: Props) {
//     const [data, setData] = useState<TopicGenerateResponse | null>(null);
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         let cancelled = false;

//         async function load() {
//             try {
//                 setLoading(true);
//                 setError("");

//                 const result = await generateTopic({ topic, level });

//                 if (!cancelled) {
//                     setData(result);
//                 }
//             } catch (err) {
//                 if (!cancelled) {
//                     setError(err instanceof Error ? err.message : "Failed to generate topic");
//                 }
//             } finally {
//                 if (!cancelled) {
//                     setLoading(false);
//                 }
//             }
//         }

//         load();

//         return () => {
//             cancelled = true;
//         };
//     }, [topic, level]);

//     if (loading) {
//         return (
//             <main className="min-h-screen bg-slate-50 pt-20 px-6 py-12 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
//                 <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
//                     <h1 className="text-2xl font-semibold">Generating your lesson...</h1>
//                     <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
//                         Please wait while DeepDaily prepares your learning path.
//                     </p>

//                     <div className="mt-8 flex justify-center">
//                         <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-[#5A524D] dark:border-t-[#F1E7DF]" />
//                     </div>
//                 </div>
//             </main>
//         );
//     }

//     if (error || !data) {
//         return (
//             <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
//                 <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-500/40 dark:bg-[#3A3533]">
//                     <h1 className="text-2xl font-semibold">Could not generate lesson</h1>
//                     <p className="mt-3 text-red-600 dark:text-red-400">
//                         {error || "Unknown error"}
//                     </p>
//                 </div>
//             </main>
//         );
//     }

//     return (
//         <main className="min-h-screen bg-slate-50 pt-20 px-6 py-12 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
//             <div className="fixed right-20 top-5 z-40">
//                 <AuthButton />
//             </div>
//             <div className="mx-auto max-w-5xl space-y-8">
//                 <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
//                     <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-[#CDBFB6]">
//                         DeepDaily lesson
//                     </p>

//                     <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
//                         {data.lesson.title}
//                     </h1>

//                     <p className="mt-4 text-sm text-slate-500 dark:text-[#CDBFB6]">
//                         Topic: <span className="font-medium text-slate-800 dark:text-[#F1E7DF]">{data.topic}</span>
//                         {" · "}
//                         Level: <span className="font-medium capitalize text-slate-800 dark:text-[#F1E7DF]">{data.level}</span>
//                     </p>

//                     <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-[#2F2A28]">
//                         <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-[#CDBFB6]">
//                             Today&apos;s focus
//                         </h2>
//                         <p className="mt-2 text-base text-slate-700 dark:text-[#F1E7DF]">
//                             {data.lesson.today_focus}
//                         </p>
//                     </div>

//                     <div className="mt-6">
//                         <h2 className="text-xl font-semibold">Summary</h2>
//                         <p className="mt-3 leading-7 text-slate-700 dark:text-[#D5C6BC]">
//                             {data.lesson.summary}
//                         </p>
//                     </div>
//                 </section>

//                 <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
//                     <div className="space-y-8">
//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
//                             <h2 className="text-2xl font-semibold">Lesson sections</h2>

//                             <div className="mt-6 space-y-6">
//                                 {data.lesson.sections.map((section) => (
//                                     <article
//                                         key={section.title}
//                                         className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-[#4C4541] dark:bg-[#2F2A28]"
//                                     >
//                                         <h3 className="text-lg font-semibold">{section.title}</h3>
//                                         <p className="mt-2 leading-7 text-slate-700 dark:text-[#D5C6BC]">
//                                             {section.content}
//                                         </p>
//                                     </article>
//                                 ))}
//                             </div>
//                         </div>

//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
//                             <h2 className="text-2xl font-semibold">Resources</h2>

//                             <div className="mt-6 space-y-4">
//                                 {data.resources.map((resource) => (
//                                     <a
//                                         key={`${resource.title}-${resource.url}`}
//                                         href={resource.url}
//                                         target="_blank"
//                                         rel="noreferrer"
//                                         className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-300 dark:border-[#4C4541] dark:bg-[#2F2A28] dark:hover:border-[#6A615B]"
//                                     >
//                                         <div className="flex items-center justify-between gap-4">
//                                             <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1E7DF]">
//                                                 {resource.title}
//                                             </h3>
//                                             <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-[#5A524D] dark:text-[#D5C6BC]">
//                                                 {resource.type}
//                                             </span>
//                                         </div>

//                                         <p className="mt-2 text-slate-600 dark:text-[#D5C6BC]">{resource.reason}</p>

//                                         {resource.snippet ? (
//                                             <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-[#B8AAA1]">
//                                                 {resource.snippet}
//                                             </p>
//                                         ) : null}

//                                         <p className="mt-3 text-sm text-slate-500 dark:text-[#A89B92]">{resource.url}</p>
//                                     </a>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>

//                     <aside className="space-y-8">
//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
//                             <h2 className="text-2xl font-semibold">Roadmap</h2>

//                             <ol className="mt-6 space-y-3">
//                                 {data.roadmap.map((item, index) => (
//                                     <li
//                                         key={`${index}-${item}`}
//                                         className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-[#2F2A28]"
//                                     >
//                                         <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white dark:bg-[#F1E7DF] dark:text-[#2D2B2B]">
//                                             {index + 1}
//                                         </span>
//                                         <span className="leading-6 text-slate-700 dark:text-[#D5C6BC]">{item}</span>
//                                     </li>
//                                 ))}
//                             </ol>
//                         </div>

//                         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
//                             <h2 className="text-2xl font-semibold">Next step</h2>
//                             <p className="mt-4 leading-7 text-slate-700 dark:text-[#D5C6BC]">
//                                 {data.lesson.next_step}
//                             </p>
//                         </div>
//                     </aside>
//                 </section>

//                 <StreamingLesson topic={data.topic} level={data.level} />
//             </div>
//         </main>
//     );
// }