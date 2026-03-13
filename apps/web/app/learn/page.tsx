//apps/web/app/learn/page.tsx

import LearnPageClient from "@/components/learn-page-client";
import type { TopicLevel } from "@/types/topic";
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
            <main className="min-h-screen bg-slate-50 pt-20 px-6 py-16 text-slate-900 dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">

                <div className="fixed right-20 top-5 z-40">
                    <AuthButton />
                </div>

                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#4C4541] dark:bg-[#3A3533]">
                    <h1 className="text-2xl font-semibold">No topic provided</h1>
                    <p className="mt-3 text-slate-600 dark:text-[#CDBFB6]">
                        Go back and enter a topic to generate your first lesson.
                    </p>
                </div>
            </main>
        );
    }

    return <LearnPageClient topic={topic} level={level} />;
}
