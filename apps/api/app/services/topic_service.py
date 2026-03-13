#apps/api/app/services/topic_service.py

from app.schemas.topic_schema import TopicResponse


async def generate_topic(topic: str, level: str) -> TopicResponse:

    return TopicResponse(
        topic=topic,
        level=level,
        roadmap=[
            "Introduction to the topic",
            "Core concepts",
            "Practical applications",
            "Common mistakes",
            "Advanced ideas",
        ],
        lesson={
            "title": f"Introduction to {topic}",
            "today_focus": "Understand the basic idea and why it matters",
            "summary": f"{topic} is an important concept worth understanding deeply.",
            "sections": [
                {
                    "title": "Core Idea",
                    "content": "This section explains the core idea behind the topic.",
                },
                {
                    "title": "Why it Matters",
                    "content": "Understanding this concept helps build deeper knowledge.",
                },
                {
                    "title": "Example",
                    "content": "Here we show a simple practical example.",
                },
            ],
            "next_step": "Tomorrow we will explore the next concept.",
        },
        resources=[
            {
                "title": "Beginner article",
                "url": "https://example.com",
                "type": "article",
                "reason": "Clear beginner explanation",
            },
            {
                "title": "Intro video",
                "url": "https://youtube.com",
                "type": "video",
                "reason": "Visual explanation",
            },
        ],
    )