
// apps/web/lib/progress-level.ts

export function getProgressLevel(totalXp: number) {
    if (totalXp >= 1000) return 5;
    if (totalXp >= 500) return 4;
    if (totalXp >= 250) return 3;
    if (totalXp >= 100) return 2;
    return 1;
}