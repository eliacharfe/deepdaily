//apps/web/lib/api.ts

import { config } from "./config";
import type { HealthResponse } from "@/types";
import type {
    TopicGenerateRequest,
    TopicGenerateResponse
} from "@/types/topic.ts";

export async function apiGet<T>(path: string): Promise<T> {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`GET ${path} failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
    return apiGet<HealthResponse>("/health");
}

export async function generateTopic(
    payload: TopicGenerateRequest
): Promise<TopicGenerateResponse> {
    const response = await fetch(`${config.apiBaseUrl}/topics/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`POST /topics/generate failed with status ${response.status}`);
    }

    return response.json() as Promise<TopicGenerateResponse>;
}