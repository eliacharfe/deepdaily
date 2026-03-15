// apps/web/components/save-lesson-button.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { config } from "@/lib/config";
import type { LessonData } from "@/types/lesson";
import { toast } from "sonner";

type Props = {
    lesson: LessonData;
    onSaved: (id: string) => void;
};

export default function SaveLessonButton({ lesson, onSaved }: Props) {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!user || saving) return;

        try {
            setSaving(true);

            const token = await user.getIdToken();

            const payload = {
                topic: lesson.topic,
                level: lesson.level,
                roadmap: lesson.roadmap,
                lesson: lesson.lesson,
                resources: lesson.resources,
                deepDive: lesson.deepDive ?? [],
                streamedLesson: lesson.streamedLesson ?? null,
            };

            console.log("SAVING LESSON PAYLOAD", payload);

            const res = await fetch(`${config.apiBaseUrl}/lessons/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const contentType = res.headers.get("content-type") || "";

            if (!res.ok) {
                if (contentType.includes("application/json")) {
                    const errData = await res.json();
                    throw new Error(errData.detail || "Failed to save lesson");
                }
                throw new Error(`Failed to save lesson (${res.status})`);
            }

            const data = await res.json();
            console.log("SAVE RESPONSE", data);

            onSaved(data.id);
            window.dispatchEvent(new Event("lessons:refresh"));

            toast.success("Lesson saved successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save lesson");
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
            {saving ? "Saving..." : "Save lesson"}
        </button>
    );
}