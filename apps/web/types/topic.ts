//apps/web/types/topics.ts

export type TopicLevel = "beginner" | "intermediate" | "advanced";

export type TopicGenerateRequest = {
    topic: string;
    level: TopicLevel;
};

export type LessonSection = {
    title: string;
    content: string;
};

export type LessonResource = {
    title: string;
    url: string;
    type: string;
    reason: string;
    snippet?: string | null;
};

export type TopicGenerateResponse = {
    topic: string;
    level: string;
    roadmap: string[];
    lesson: {
        title: string;
        today_focus: string;
        summary: string;
        sections: LessonSection[];
        next_step: string;
    };
    resources: LessonResource[];
};