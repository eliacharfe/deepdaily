
// apps/web/lib/progress-xp.ts

export type ProgressAction =
    | "lesson_saved"
    | "summary_ready"
    | "day_complete"
    | "resource_read";

export function getProgressXp(action: ProgressAction) {
    const xpMap: Record<ProgressAction, number> = {
        lesson_saved: 10,
        summary_ready: 15,
        resource_read: 10,
        day_complete: 50,
    };

    return xpMap[action];
}