// apps/web/lib/surprise-topic.ts

import { config } from "@/lib/config";
import type { TopicLevel } from "@/types/topic";

export async function getSurpriseTopic(
    level: TopicLevel,
    excludeTopics: string[] = []
): Promise<string> {
    const res = await fetch(`${config.apiBaseUrl}/surprise-topic`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            level,
            exclude_topics: excludeTopics,
        }),
        cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to get surprise topic");
        }

        throw new Error("Failed to get surprise topic");
    }

    const data = await res.json();

    if (!data?.topic || typeof data.topic !== "string") {
        throw new Error("Invalid surprise topic response");
    }

    return data.topic;
}