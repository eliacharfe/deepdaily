//apps/web/types/lesson.ts

import type { TopicLevel } from "@/types/topic";

export type LessonSection = {
    title: string;
    content: string;
};

export type LessonContent = {
    title: string;
    today_focus: string;
    summary: string;
    sections: LessonSection[];
    next_step: string;
};

export type LessonResource = {
    title: string;
    url: string;
    type: string;
    reason: string;
    snippet?: string | null;
};

export type LessonDeepDiveItem = {
    title: string;
    url?: string | null;
    type: "book" | "guide" | "documentation" | "course" | "article";
    reason: string;
    snippet?: string | null;
};

export type LessonData = {
    id?: string;
    topic: string;
    level: TopicLevel;
    roadmap: string[];
    lesson: LessonContent;
    resources: LessonResource[];
    deepDive?: LessonDeepDiveItem[];
};

export type SavedLesson = LessonData & {
    id: string;
};

export type LessonPreview = {
    id: string;
    topic: string;
    level: TopicLevel;
    title: string;
};