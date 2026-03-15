#apps/api/app/services/topic_service.py

from app.schemas.topic_schema import TopicResponse
from app.services.agents.resource_discovery_agent import ResourceDiscoveryAgent
from app.services.llm.client import generate_lesson_content, generate_roadmap_steps
from app.services.llm.prompts import build_lesson_prompt, build_roadmap_prompt


async def generate_topic(topic: str, level: str) -> TopicResponse:
    try:
        roadmap_prompt = build_roadmap_prompt(topic=topic, level=level)
        roadmap = await generate_roadmap_steps(
            topic=topic,
            level=level,
            prompt=roadmap_prompt,
        )
    except Exception:
        roadmap = [
            "Introduction to the topic",
            "Core concepts",
            "Practical applications",
            "Common mistakes",
            "Advanced ideas",
            "Further exploration",
        ]

    try:
        lesson_prompt = build_lesson_prompt(
            topic=topic,
            level=level,
            roadmap=roadmap,
        )
        lesson = await generate_lesson_content(prompt=lesson_prompt, level=level)
    except Exception:
        lesson = {
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
            "deepDive": [],
        }

    lesson_content = {
        "title": lesson["title"],
        "today_focus": lesson["today_focus"],
        "summary": lesson["summary"],
        "sections": lesson["sections"],
        "next_step": lesson["next_step"],
    }

    llm_deep_dive = lesson.get("deepDive", []) or []

    resource_agent = ResourceDiscoveryAgent()

    try:
        resources = await resource_agent.discover_resources(topic=topic, level=level)
    except Exception as e:
        print("RESOURCES ERROR:", e)
        resources = [
            {
                "title": "Beginner article",
                "url": "https://example.com",
                "type": "article",
                "reason": "Clear beginner explanation",
            }
        ]

    try:
        deep_dive = await resource_agent.discover_deep_dive(topic=topic, level=level)
        print("DEEP DIVE RESULT:", deep_dive, type(deep_dive))
        deep_dive = deep_dive or []
    except Exception as e:
        print("DEEP DIVE ERROR:", e)
        deep_dive = []

    final_deep_dive = deep_dive or llm_deep_dive

    return TopicResponse(
        topic=topic,
        level=level,
        roadmap=roadmap,
        lesson=lesson_content,
        resources=resources,
        deepDive=final_deep_dive,
    )
