
// apps/web/lib/training.ts

import { config } from "@/lib/config";
import { getAuthHeaders } from "./auth-headers";

export type TrainingExerciseInput = {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps?: number;
    weightKg?: number;
    notes?: string;
};

export type RunningInput = {
    distanceKm: number;
    timeMinutes: number;
};

export type TrainingLog = {
    id: string;
    date: string;
    exercises: TrainingExerciseInput[];
    running?: RunningInput | null;
    createdAt: string;
    updatedAt: string;
};

export type TrainingLogUpsertRequest = {
    exercises: TrainingExerciseInput[];
    running?: RunningInput | null;
};

export async function getTrainingLog(date: string): Promise<TrainingLog | null> {
    const res = await fetch(`${config.apiBaseUrl}/training/logs/${date}`, {
        headers: await getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to load training log");
    }

    return res.json();
}

export async function saveTrainingLog(
    date: string,
    body: TrainingLogUpsertRequest
): Promise<TrainingLog> {
    const res = await fetch(`${config.apiBaseUrl}/training/logs/${date}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error("Failed to save training log");
    }

    return res.json();
}

export type TrainingTemplate = {
    id: string;
    name: string;
    exercises: TrainingExerciseInput[];
    createdAt: string;
    updatedAt: string;
};

export type TrainingTemplateCreateRequest = {
    name: string;
    exercises: TrainingExerciseInput[];
};

export async function getTrainingTemplates(): Promise<TrainingTemplate[]> {
    const res = await fetch(`${config.apiBaseUrl}/training/templates`, {
        headers: await getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to load training templates");
    }

    return res.json();
}

export async function createTrainingTemplate(
    body: TrainingTemplateCreateRequest
): Promise<TrainingTemplate> {
    const res = await fetch(`${config.apiBaseUrl}/training/templates`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error("Failed to create training template");
    }

    return res.json();
}

export async function deleteTrainingTemplate(id: string): Promise<void> {
    const res = await fetch(`${config.apiBaseUrl}/training/templates/${id}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to delete training template");
    }
}

export async function getTrainingLogsForMonth(
    month: string
): Promise<TrainingLog[]> {
    const res = await fetch(`${config.apiBaseUrl}/training/logs?month=${month}`, {
        headers: await getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to load monthly training logs");
    }

    return res.json();
}
