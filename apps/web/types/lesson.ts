//apps/web/types/lesson.ts

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

export type LessonData = {
    topic: string;
    level: string;
    roadmap: string[];
    lesson: LessonContent;
    resources: LessonResource[];
};

export type SavedLesson = LessonData & {
    id: string;
};

export type LessonPreview = {
    id: string;
    topic: string;
    level: string;
    title: string;
};

// export type LessonSection = {
//     title: string;
//     content: string;
// };

// export type LessonContent = {
//     title: string;
//     today_focus: string;
//     summary: string;
//     sections: LessonSection[];
//     next_step: string;
// };

// export type LessonResource = {
//     title: string;
//     url: string;
//     type: string;
//     reason: string;
//     snippet?: string | null;
// };

// export type SavedLesson = {
//     id: string;
//     topic: string;
//     level: string;
//     roadmap: string[];
//     lesson: LessonContent;
//     resources: LessonResource[];
// };

// export type LessonPreview = {
//     id: string;
//     topic: string;
//     level: string;
//     title: string;
// };