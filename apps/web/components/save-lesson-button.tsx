// apps/web/components/save-lesson-button.tsx

"use client";

import { useRouter } from "next/navigation";

type Props = {
    lessonId: string;
};

export default function SaveLessonButton({ lessonId }: Props) {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => router.push(`/lessons/${lessonId}`)}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-[#F1E7DF] dark:text-[#2D2B2B]"
        >
            Open saved lesson
        </button>
    );
}