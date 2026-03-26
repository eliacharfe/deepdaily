// apps/web/lib/surprise-topic.ts

import { config } from "@/lib/config";
import type { TopicLevel } from "@/types/topic";

export async function getSurpriseTopics(
    level: TopicLevel,
    excludeTopics: string[] = [],
    count = 4
): Promise<string[]> {
    const res = await fetch(`${config.apiBaseUrl}/surprise-topic`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            level,
            exclude_topics: excludeTopics,
            count,
        }),
        cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to get surprise topics");
        }

        throw new Error("Failed to get surprise topics");
    }

    const data = await res.json();

    if (!Array.isArray(data?.topics)) {
        throw new Error("Invalid surprise topics response");
    }

    return data.topics.filter((topic: unknown): topic is string => typeof topic === "string");
}