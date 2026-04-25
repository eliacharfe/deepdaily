
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

export async function generateCurriculumDayWithProgress(
    curriculumId: string,
    dayNumber: number,
    token: string,
    handlers: {
        onStatus?: (message: string) => void;
    } = {}
): Promise<Curriculum> {
    const res = await fetch(`${config.apiBaseUrl}/curricula/${curriculumId}/generate-day`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
        },
        body: JSON.stringify({ dayNumber }),
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to generate day");
        }
        throw new Error("Failed to generate day");
    }

    if (!res.body) {
        throw new Error("No response body returned from day generation");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResult: Curriculum | null = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventChunk of events) {
            const lines = eventChunk.split("\n");
            const dataLine = lines.find((line) => line.startsWith("data: "));
            if (!dataLine) continue;

            const raw = dataLine.replace(/^data:\s*/, "");

            try {
                const event = JSON.parse(raw) as
                    | { type: "status"; message: string }
                    | { type: "done"; data: Curriculum }
                    | { type: "error"; message: string };

                if (event.type === "status") {
                    handlers.onStatus?.(event.message);
                    continue;
                }

                if (event.type === "done") {
                    finalResult = event.data;
                    continue;
                }

                if (event.type === "error") {
                    throw new Error(event.message || "Failed to generate day");
                }
            } catch (parseError) {
                console.error("Failed to parse curriculum day stream event:", parseError, raw);
            }
        }
    }

    if (!finalResult) {
        throw new Error("Day generation ended without a final result");
    }

    return finalResult;
}

export async function getCurricula(token: string): Promise<Curriculum[]> {
    const res = await fetch(`${config.apiBaseUrl}/curricula`, {
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


export async function retryCurriculumDayResources(
    curriculumId: string,
    dayNumber: number,
    token: string
): Promise<Curriculum> {
    const res = await fetch(
        `${config.apiBaseUrl}/curricula/${curriculumId}/days/${dayNumber}/retry-resources`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to retry resources");
        }
        throw new Error("Failed to retry resources");
    }

    return res.json();
}

export async function regenerateCurriculumDay(
    curriculumId: string,
    dayNumber: number,
    token: string
): Promise<Curriculum> {
    const res = await fetch(
        `${config.apiBaseUrl}/curricula/${curriculumId}/days/${dayNumber}/regenerate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to regenerate day");
        }
        throw new Error("Failed to regenerate day");
    }

    return res.json();
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

export type SummarizeResourceRequest = {
    curriculumId: string;
    dayNumber: number;
    resource: {
        title: string;
        type?: string | null;
        url?: string | null;
        snippet?: string | null;
        reason?: string | null;
    };
};

export type SummarizeResourceResponse = {
    summary: string;
};

export async function summarizeCurriculumResource(
    payload: SummarizeResourceRequest,
    token: string
): Promise<SummarizeResourceResponse> {
    const response = await fetch(`${API_BASE_URL}/curricula/resources/summarize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let message = "Failed to summarize resource";

        try {
            const errorData = await response.json();
            if (typeof errorData?.detail === "string") {
                message = errorData.detail;
            }
        } catch {
            // ignore json parse errors
        }

        throw new Error(message);
    }

    return response.json();
}

export async function streamCurriculumResourceSummary(
    payload: SummarizeResourceRequest,
    token: string,
    handlers: {
        onStatus?: (message: string) => void;
        onChunk?: (chunk: string) => void;
    } = {}
): Promise<SummarizeResourceResponse> {
    const response = await fetch(`${config.apiBaseUrl}/curricula/resources/summarize/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
        if (contentType.includes("application/json")) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to summarize resource");
        }
        throw new Error("Failed to summarize resource");
    }

    if (!response.body) {
        throw new Error("No response body returned from resource summary stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalSummary = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventChunk of events) {
            const lines = eventChunk.split("\n");
            const dataLine = lines.find((line) => line.startsWith("data: "));
            if (!dataLine) continue;

            const raw = dataLine.replace(/^data:\s*/, "");

            try {
                const event = JSON.parse(raw) as
                    | { type: "status"; message: string }
                    | { type: "chunk"; content: string }
                    | { type: "done"; summary?: string }
                    | { type: "error"; message: string };

                if (event.type === "status") {
                    handlers.onStatus?.(event.message);
                    continue;
                }

                if (event.type === "chunk") {
                    finalSummary += event.content;
                    handlers.onChunk?.(event.content);
                    continue;
                }

                if (event.type === "done") {
                    if (typeof event.summary === "string" && event.summary.trim()) {
                        finalSummary = event.summary;
                    }
                    continue;
                }

                if (event.type === "error") {
                    throw new Error(event.message || "Failed to summarize resource");
                }
            } catch (parseError) {
                console.error("Failed to parse resource summary stream event:", parseError, raw);
            }
        }
    }

    if (!finalSummary.trim()) {
        throw new Error("Summary stream ended without a final result");
    }

    return { summary: finalSummary };
}

export async function markCurriculumDayItemRead(
    curriculumId: string,
    dayNumber: number,
    itemKey: string,
    token: string
): Promise<Curriculum> {
    const res = await fetch(
        `${config.apiBaseUrl}/curricula/${curriculumId}/days/${dayNumber}/read-item`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                itemKey,
            }),
        }
    );

    if (!res.ok) {
        throw new Error("Failed to mark item as read");
    }

    return res.json();
}