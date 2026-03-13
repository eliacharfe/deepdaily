//apps/web/lib/api.ts

import { config } from "./config";
import { auth } from "./firebase";
import type { HealthResponse } from "@/types";
import type {
    TopicGenerateRequest,
    TopicGenerateResponse
} from "@/types/topic";

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
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error("User is not authenticated");
    }

    const response = await fetch(`${config.apiBaseUrl}/topics/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`POST /topics/generate failed with status ${response.status}`);
    }

    return response.json() as Promise<TopicGenerateResponse>;
}