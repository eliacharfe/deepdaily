
// apps/web/lib/user-progress-api.ts

import { config } from "@/lib/config";

export async function getUserProgress(token: string) {
    const res = await fetch(`${config.apiBaseUrl}/user-progress`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error("Failed to load user progress");
    }

    return res.json() as Promise<{ total_xp: number }>;
}

export async function addUserXp(
    token: string,
    amount: number,
    reason?: string
) {
    const res = await fetch(`${config.apiBaseUrl}/user-progress/xp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            amount,
            reason,
        }),
    });

    if (!res.ok) {
        throw new Error("Failed to update XP");
    }

    return res.json() as Promise<{ total_xp: number }>;
}