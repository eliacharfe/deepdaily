
// apps/web/lib/lesson-qa-api.ts

import { config } from "@/lib/config";

type AskLessonQuestionPayload = {
    curriculumId: string;
    dayNumber: number;
    question: string;
    level: string;
    dayTitle: string;
    dayObjective?: string;
    sections: Array<{
        title: string;
        content: string;
    }>;
};

type StreamLessonQuestionOptions = {
    token: string;
    payload: AskLessonQuestionPayload;
    onChunk: (chunk: string) => void;
    onDone?: () => void;
};

export async function streamLessonQuestion({
    token,
    payload,
    onChunk,
    onDone,
}: StreamLessonQuestionOptions): Promise<void> {
    const res = await fetch(`${config.apiBaseUrl}/curricula/ask/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let message = `Request failed with status ${res.status}`;

        try {
            const data = await res.json();
            message = data.detail || message;
        } catch { }

        throw new Error(message);
    }

    if (!res.body) {
        throw new Error("Missing streaming response body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
            const line = event.split("\n").find((row) => row.startsWith("data: "));
            if (!line) continue;

            const raw = line.replace(/^data:\s*/, "");

            try {
                const parsed = JSON.parse(raw);

                if (parsed.type === "chunk" && parsed.content) {
                    onChunk(parsed.content);
                } else if (parsed.type === "error") {
                    throw new Error(parsed.message || "Streaming failed");
                } else if (parsed.type === "done") {
                    onDone?.();
                }
            } catch (error) {
                if (error instanceof Error) {
                    throw error;
                }
            }
        }
    }

    onDone?.();
}