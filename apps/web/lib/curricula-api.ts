
// apps/web/lib/curricula-api.ts

import { config } from "@/lib/config";
import type { Curriculum } from "@/types/curriculum";

export async function createCurriculum(
    token: string,
    payload: { lessonId: string; durationDays: 7 | 30 }
): Promise<Curriculum> {
    const res = await fetch(`${config.apiBaseUrl}/curricula`, {
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
            const err = await res.json();
            throw new Error(err.detail || "Failed to create curriculum");
        }
        throw new Error("Failed to create curriculum");
    }

    return res.json();
}

export async function getCurriculum(
    curriculumId: string,
    token: string
): Promise<Curriculum> {
    const res = await fetch(`${config.apiBaseUrl}/curricula/${curriculumId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to load curriculum");
        }
        throw new Error("Failed to load curriculum");
    }

    return res.json();
}

export async function completeCurriculumDay(
    curriculumId: string,
    dayNumber: number,
    token: string
): Promise<Curriculum> {
    const res = await fetch(`${config.apiBaseUrl}/curricula/${curriculumId}/complete-day`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dayNumber }),
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to complete day");
        }
        throw new Error("Failed to complete day");
    }

    return res.json();
}

export async function updateCurriculumLastOpenedDay(
    curriculumId: string,
    dayNumber: number,
    token: string
): Promise<Curriculum> {
    const res = await fetch(`${config.apiBaseUrl}/curricula/${curriculumId}/last-opened-day`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dayNumber }),
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to update last opened day");
        }
        throw new Error("Failed to update last opened day");
    }

    return res.json();
}

export async function getCurriculaByLesson(
    lessonId: string,
    token: string
): Promise<Curriculum[]> {
    const res = await fetch(`${config.apiBaseUrl}/curricula/by-lesson/${lessonId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to load curricula");
        }
        throw new Error("Failed to load curricula");
    }

    return res.json();
}