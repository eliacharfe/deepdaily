
// apps/web/lib/progress-messages.ts

export function getRandomProgressMessage(type:
    | "lesson_saved"
    | "summary_ready"
    | "day_complete"
    | "resource_read"
) {
    const messages = {
        lesson_saved: [
            {
                title: "Lesson saved ✓",
                message: "Your progress is secured. Keep going.",
            },
            {
                title: "Progress saved 📘",
                message: "You’re building real knowledge step by step.",
            },
            {
                title: "Saved successfully ✨",
                message: "Consistency compounds faster than intensity.",
            },
        ],

        summary_ready: [
            {
                title: "Summary ready ✨",
                message: "Quick knowledge unlocked.",
            },
            {
                title: "Resource simplified 📚",
                message: "Learning just got easier.",
            },
            {
                title: "New insight added 🧠",
                message: "You’re stacking understanding.",
            },
        ],

        day_complete: [
            {
                title: "Day completed 🎉",
                message: "Momentum matters. Keep moving.",
            },
            {
                title: "Another day down 🔥",
                message: "Consistency beats motivation.",
            },
            {
                title: "Progress unlocked 🚀",
                message: "You’re building mastery.",
            },
        ],

        resource_read: [
            {
                title: "Marked as read ✓",
                message: "Another step forward.",
            },
            {
                title: "Resource completed 📖",
                message: "Small wins create big results.",
            },
            {
                title: "Knowledge gained 🧠",
                message: "Keep the momentum alive.",
            },
        ],
    };

    const pool = messages[type];
    return pool[Math.floor(Math.random() * pool.length)];
}