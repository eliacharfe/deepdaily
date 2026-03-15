// apps/web/components/save-lesson-button.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import type { LessonData } from "@/types/lesson";
import { saveLesson, updateLesson } from "@/lib/lessons-api";
import { toast } from "sonner";

type Props = {
    lesson: LessonData;
    onSaved: (id: string) => void;
};

export default function SaveLessonButton({ lesson, onSaved }: Props) {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    const isUpdate = Boolean(lesson.id);

    async function handleSave() {
        if (!user || saving) return;

        try {
            setSaving(true);

            const token = await user.getIdToken();

            const result = lesson.id
                ? await updateLesson(lesson.id, lesson, token)
                : await saveLesson(lesson, token);

            onSaved(result.id);
            window.dispatchEvent(new Event("lessons:refresh"));

            toast.success(lesson.id ? "Lesson updated successfully" : "Lesson saved successfully");
        } catch (err) {
            console.error(err);
            toast.error(lesson.id ? "Failed to update lesson" : "Failed to save lesson");
        } finally {
            setSaving(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-[#F1E7DF] dark:text-[#2D2B2B]"
        >
            {saving ? (isUpdate ? "Updating..." : "Saving...") : isUpdate ? "Update lesson" : "Save lesson"}
        </button>
    );
}