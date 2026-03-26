# apps/api/app/services/surprise_topic.py

import random
import re

from app.core.config import settings
from app.services.llm.client import client

CATEGORIES = [
    "technology",
    "creative skills",
    "communication",
    "personal finance",
    "health and fitness",
    "language learning",
    "productivity",
    "career skills",
    "psychology",
    "entrepreneurship",
]

FALLBACK_TOPICS: dict[str, list[str]] = {
    "beginner": [
        "Learn Python basics",
        "Understand personal budgeting",
        "Improve public speaking",
        "Learn photography basics",
        "Build better focus habits",
    ],
    "intermediate": [
        "Build a REST API with Node.js",
        "Improve your storytelling skills",
        "Understand UI UX fundamentals",
        "Create a personal investment plan",
        "Learn Git team workflows",
    ],
    "advanced": [
        "Design scalable backend architecture",
        "Master system design fundamentals",
        "Build a production ready SaaS MVP",
        "Improve software performance optimization",
        "Design a personal knowledge system",
    ],
}


def normalize_level(level: str | None) -> str:
    if level in {"beginner", "intermediate", "advanced"}:
        return level
    return "beginner"


def normalize_topic(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^\w\s]", "", value)
    value = re.sub(r"\s+", " ", value)
    return value


def is_too_similar(topic: str, excluded: list[str]) -> bool:
    normalized_topic = normalize_topic(topic)

    for item in excluded:
        normalized_item = normalize_topic(item)

        if not normalized_item:
            continue

        if normalized_topic == normalized_item:
            return True

        if normalized_topic in normalized_item or normalized_item in normalized_topic:
            return True

    return False


def build_prompt(level: str, category: str, exclude_topics: list[str]) -> str:
    excluded_text = "\n".join(f"- {topic}" for topic in exclude_topics[:30]) or "- None"

    return f"""
You are generating one surprise learning topic for DeepDaily, a product that turns topics into structured day-by-day learning plans.

Generate exactly ONE topic.

Requirements:
- learner level: {level}
- category: {category}
- practical and interesting
- specific enough for a structured 7-day or 30-day curriculum
- not too broad
- not too academic
- not overly niche
- useful, motivating, and realistic
- keep it short, ideally 2 to 6 words
- do not use quotes
- do not number it
- do not add explanation
- return only the topic text

Avoid repeating or closely matching any of these topics:
{excluded_text}

Good examples:
- Learn Python basics
- Improve public speaking
- Understand personal budgeting
- Learn photography fundamentals
- Build better focus habits
""".strip()


async def get_surprise_topic(level: str | None, exclude_topics: list[str] | None = None) -> str:
    normalized_level = normalize_level(level)
    excluded = [topic for topic in (exclude_topics or []) if topic.strip()]

    if not settings.openai_api_key:
        fallback_candidates = [
            topic
            for topic in FALLBACK_TOPICS[normalized_level]
            if not is_too_similar(topic, excluded)
        ]
        if fallback_candidates:
            return random.choice(fallback_candidates)
        return random.choice(FALLBACK_TOPICS[normalized_level])

    for _ in range(3):
        category = random.choice(CATEGORIES)
        prompt = build_prompt(
            level=normalized_level,
            category=category,
            exclude_topics=excluded,
        )

        response = await client.responses.create(
            model="gpt-5-nano",
            input=prompt,
        )

        topic = response.output_text.strip()
        topic = topic.strip().strip('"').strip("'")
        topic = " ".join(topic.split())

        if topic and not is_too_similar(topic, excluded):
            return topic

    fallback_candidates = [
        topic
        for topic in FALLBACK_TOPICS[normalized_level]
        if not is_too_similar(topic, excluded)
    ]

    if fallback_candidates:
        return random.choice(fallback_candidates)

    return random.choice(FALLBACK_TOPICS[normalized_level])