// apps/web/lib/lessons-api.ts

import { config } from "@/lib/config";
import type { SavedLesson, LessonPreview } from "@/types/lesson";

async function parseJson<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const data = await res.json();
            throw new Error(data.detail || "Request failed");
        }

        throw new Error(`Request failed with status ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export async function getSavedLessons(token: string): Promise<LessonPreview[]> {
    const res = await fetch(`${config.apiBaseUrl}/lessons`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    const data = await parseJson<SavedLesson[]>(res);

    return data.map((lesson) => ({
        id: lesson.id,
        topic: lesson.topic,
        level: lesson.level,
        title: lesson.lesson.title,
    }));
}

export async function getSavedLessonById(
    lessonId: string,
    token: string
): Promise<SavedLesson> {
    const res = await fetch(`${config.apiBaseUrl}/lessons/${lessonId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    return parseJson<SavedLesson>(res);
}

export async function deleteLesson(lessonId: string, token: string) {
    const response = await fetch(`${config.apiBaseUrl}/lessons/${lessonId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || "Failed to delete lesson");
    }

    return response.json();
}