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
        "Learn negotiation basics",
        "Understand emotional intelligence",
        "Learn time management basics",
    ],
    "intermediate": [
        "Build a REST API with Node.js",
        "Improve your storytelling skills",
        "Understand UI UX fundamentals",
        "Create a personal investment plan",
        "Learn Git team workflows",
        "Improve product thinking",
        "Learn intermediate SQL",
        "Develop leadership skills",
    ],
    "advanced": [
        "Design scalable backend architecture",
        "Master system design fundamentals",
        "Build a production ready SaaS MVP",
        "Improve software performance optimization",
        "Design a personal knowledge system",
        "Master advanced negotiation",
        "Develop growth strategy systems",
        "Design high leverage workflows",
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


def build_prompt(level: str, count: int, exclude_topics: list[str]) -> str:
    categories_text = ", ".join(CATEGORIES)
    excluded_text = "\n".join(f"- {topic}" for topic in exclude_topics[:40]) or "- None"

    return f"""
You are generating surprise learning topics for DeepDaily, a product that turns topics into structured day-by-day learning plans.

Generate exactly {count} topic suggestions.

Requirements:
- learner level: {level}
- choose from a diverse mix of categories such as: {categories_text}
- practical and interesting
- specific enough for a structured 7-day or 30-day curriculum
- not too broad
- not too academic
- not overly niche
- useful, motivating, and realistic
- each topic should be short, ideally 2 to 6 words
- do not use quotes
- do not add explanations

Avoid repeating or closely matching any of these topics:
{excluded_text}

Return valid JSON only in this exact format:
{{
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4"
  ]
}}
""".strip()


def pick_fallback_topics(level: str, exclude_topics: list[str], count: int) -> list[str]:
    available = [
        topic
        for topic in FALLBACK_TOPICS[level]
        if not is_too_similar(topic, exclude_topics)
    ]

    if len(available) >= count:
        return random.sample(available, count)

    if available:
        return available

    return FALLBACK_TOPICS[level][:count]


async def get_surprise_topics(
    level: str | None,
    exclude_topics: list[str] | None = None,
    count: int = 4,
) -> list[str]:
    normalized_level = normalize_level(level)
    excluded = [topic for topic in (exclude_topics or []) if topic.strip()]
    count = max(1, min(count, 8))

    if not settings.openai_api_key:
        return pick_fallback_topics(normalized_level, excluded, count)

    try:
        prompt = build_prompt(
            level=normalized_level,
            count=count,
            exclude_topics=excluded,
        )

        response = await client.responses.create(
            model="gpt-5-nano",
            input=prompt,
        )

        text = response.output_text.strip()

        import json
        parsed = json.loads(text)
        raw_topics = parsed.get("topics", [])

        if not isinstance(raw_topics, list):
            raise ValueError("Invalid topics payload")

        cleaned_topics: list[str] = []
        seen_normalized: set[str] = set()

        for raw_topic in raw_topics:
            if not isinstance(raw_topic, str):
                continue

            topic = raw_topic.strip().strip('"').strip("'")
            topic = " ".join(topic.split())

            if not topic:
                continue

            normalized = normalize_topic(topic)
            if not normalized:
                continue

            if normalized in seen_normalized:
                continue

            if is_too_similar(topic, excluded):
                continue

            seen_normalized.add(normalized)
            cleaned_topics.append(topic)

            if len(cleaned_topics) == count:
                break

        if cleaned_topics:
            return cleaned_topics

    except Exception:
        pass

    return pick_fallback_topics(normalized_level, excluded, count)