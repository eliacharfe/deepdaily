// apps/web/types/curriculum.ts

import type { TopicLevel } from "@/types/topic";

export type CurriculumDayResource = {
    title: string;
    url: string;
    type: string;
};

export type CurriculumSection = {
    title: string;
    content: string;
};

export type CurriculumDay = {
    dayNumber: number;
    title: string;
    objective: string;

    summary: string;
    sections: CurriculumSection[];
    exercise?: string;
    resources: CurriculumDayResource[];

    // IMPORTANT — tells UI if the day needs generation
    isGenerated: boolean;
};

export type Curriculum = {
    id: string;
    lessonId: string;
    topic: string;
    level: TopicLevel;

    durationDays: 7 | 30;

    title: string;
    overview: string;

    currentDay: number;
    lastOpenedDay: number;
    completedDays: number[];

    days: CurriculumDay[];

    createdAt: string;
    updatedAt: string;
};