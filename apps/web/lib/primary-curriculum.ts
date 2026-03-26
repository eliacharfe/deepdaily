
// apps/web/lib/primary-curriculum.ts

import type { Curriculum } from "@/types/curriculum";

export function getNextDayNumber(curriculum: Curriculum): number {
    const completed = new Set(curriculum.completedDays);
    const totalDays = curriculum.durationDays;

    for (let day = 1; day <= totalDays; day += 1) {
        if (!completed.has(day)) return day;
    }

    return totalDays;
}

export function isCurriculumCompleted(curriculum: Curriculum): boolean {
    return curriculum.completedDays.length >= curriculum.durationDays;
}

export function pickPrimaryCurriculum(curricula: Curriculum[]): Curriculum | null {
    const active = curricula.filter((curriculum) => !isCurriculumCompleted(curriculum));

    if (active.length === 0) return null;

    return [...active].sort((a, b) => {
        if (b.lastOpenedDay !== a.lastOpenedDay) {
            return b.lastOpenedDay - a.lastOpenedDay;
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })[0];
}
