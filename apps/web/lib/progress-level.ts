
// apps/web/lib/progress-level.ts

export function getProgressLevel(totalXp: number) {
    if (totalXp >= 100000) return 20;
    if (totalXp >= 85000) return 19;
    if (totalXp >= 70000) return 18;
    if (totalXp >= 57500) return 17;
    if (totalXp >= 45000) return 16;
    if (totalXp >= 35000) return 15;
    if (totalXp >= 27500) return 14;
    if (totalXp >= 21000) return 13;
    if (totalXp >= 16000) return 12;
    if (totalXp >= 12000) return 11;
    if (totalXp >= 9000) return 10;
    if (totalXp >= 7000) return 9;
    if (totalXp >= 5500) return 8;
    if (totalXp >= 4000) return 7;
    if (totalXp >= 3000) return 6;
    if (totalXp >= 2000) return 5;
    if (totalXp >= 1250) return 4;
    if (totalXp >= 700) return 3;
    if (totalXp >= 300) return 2;
    return 1;
}