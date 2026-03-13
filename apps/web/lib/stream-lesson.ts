//apps/web/lib/stream-lesson.ts

import { auth } from "./firebase";
import { config } from "./config";

type StreamHandlers = {
    onChunk: (chunk: string) => void;
    onDone?: () => void;
    onError?: (message: string) => void;
};

export async function streamLesson(
    topic: string,
    level: string,
    handlers: StreamHandlers
) {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error("User is not authenticated");
    }

    const response = await fetch(`${config.apiBaseUrl}/stream/lesson`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topic, level })
    });

    if (!response.ok || !response.body) {
        throw new Error("Failed to start lesson stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
            const line = part
                .split("\n")
                .find((entry) => entry.startsWith("data: "));

            if (!line) continue;

            const jsonText = line.replace("data: ", "").trim();

            try {
                const payload = JSON.parse(jsonText);

                if (payload.type === "chunk") {
                    handlers.onChunk(payload.content);
                } else if (payload.type === "done") {
                    handlers.onDone?.();
                } else if (payload.type === "error") {
                    handlers.onError?.(payload.message || "Streaming failed");
                }
            } catch {
                handlers.onError?.("Failed to parse stream event");
            }
        }
    }
}