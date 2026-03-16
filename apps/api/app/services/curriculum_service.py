
# apps/api/app/services/curriculum_service.py

import json
import logging
from typing import Any
from collections.abc import Awaitable, Callable

from app.services.llm.client import generate_json_response

logger = logging.getLogger(__name__)

ProgressCallback = Callable[[str], Awaitable[None]]


def _planner_prompt(
    topic: str,
    level: str,
    duration_days: int,
    lesson_summary: str,
    roadmap: list[str],
) -> str:
    return f"""
You are a curriculum planner for DeepDaily.

Create a structured {duration_days}-day learning curriculum for this topic.

Topic: {topic}
Level: {level}

Existing lesson summary:
{lesson_summary}

Existing roadmap:
{json.dumps(roadmap, ensure_ascii=False)}

Goals:
- Create a clear day-by-day progression
- Day 1 should be foundational and accessible
- Each day should build naturally on the previous one
- Avoid repetition
- Match the user's level
- For 7 days: focused, practical, concise
- For 30 days: deeper, more progressive, mastery-oriented

Return only valid JSON.
Do not wrap JSON in markdown fences.
Do not add explanations.

Use this exact format:
{{
  "title": "string",
  "overview": "string",
  "days": [
    {{
      "dayNumber": 1,
      "title": "string",
      "objective": "string"
    }}
  ]
}}
"""


def _day_writer_prompt(
    topic: str,
    level: str,
    duration_days: int,
    day_outline: dict[str, Any],
    previous_days: list[dict[str, Any]],
) -> str:
    return f"""
You are a curriculum lesson writer for DeepDaily.

Write one day of a structured curriculum.

Topic: {topic}
Level: {level}
Curriculum length: {duration_days} days

Current day outline:
{json.dumps(day_outline, ensure_ascii=False)}

Previously generated days:
{json.dumps(previous_days, ensure_ascii=False)}

Requirements:
- Write clear, educational content
- Keep progression natural from previous days
- Do not repeat earlier days unnecessarily
- Make the lesson practical and structured
- Use concise, high-signal explanations
- Only include a URL if you are confident it is real
- If uncertain, return an empty resources array
- Never fabricate links

Return only valid JSON.
Do not wrap JSON in markdown fences.
Do not add explanations.

Use this exact format:
{{
  "dayNumber": 1,
  "title": "string",
  "objective": "string",
  "summary": "string",
  "sections": [
    {{
      "title": "string",
      "content": "string"
    }},
    {{
      "title": "string",
      "content": "string"
    }}
  ],
  "exercise": "string",
  "resources": [
    {{
      "title": "string",
      "url": "string",
      "type": "article"
    }}
  ],
  "isGenerated": true
}}
"""


def build_outline_day(day_number: int, title: str, objective: str) -> dict[str, Any]:
    return {
        "dayNumber": day_number,
        "title": title,
        "objective": objective,
        "summary": "",
        "sections": [],
        "exercise": "",
        "resources": [],
        "isGenerated": False,
    }


def build_mock_generated_day(
    *,
    topic: str,
    day_number: int,
    title: str,
    objective: str,
) -> dict[str, Any]:
    return {
        "dayNumber": day_number,
        "title": title,
        "objective": objective,
        "summary": f"This is the study summary for day {day_number} on {topic}.",
        "sections": [
            {
                "title": "Main concept",
                "content": f"Core explanation for day {day_number}.",
            },
            {
                "title": "Why it matters",
                "content": f"Why this part of {topic} matters on day {day_number}.",
            },
        ],
        "exercise": f"Write 3 takeaways from day {day_number}.",
        "resources": [],
        "isGenerated": True,
    }


async def generate_curriculum_outline(
    *,
    topic: str,
    level: str,
    duration_days: int,
    lesson_summary: str,
    roadmap: list[str],
) -> dict[str, Any]:
    logger.info(
        "Generating curriculum outline for topic=%s level=%s duration=%s",
        topic,
        level,
        duration_days,
    )

    planner_result = await generate_json_response(
        prompt=_planner_prompt(
            topic=topic,
            level=level,
            duration_days=duration_days,
            lesson_summary=lesson_summary,
            roadmap=roadmap,
        ),
        level=level,
    )

    planner_days = planner_result.get("days", [])

    if not isinstance(planner_days, list) or len(planner_days) != duration_days:
        logger.warning(
            "Planner returned invalid day count. expected=%s got=%s",
            duration_days,
            len(planner_days) if isinstance(planner_days, list) else "invalid",
        )
        planner_days = [
            {
                "dayNumber": i,
                "title": f"Day {i}: {topic}",
                "objective": f"Understand the key ideas for day {i}.",
            }
            for i in range(1, duration_days + 1)
        ]

    outline_days = [
        build_outline_day(
            day_number=day.get("dayNumber", index + 1),
            title=day.get("title", f"Day {index + 1}: {topic}"),
            objective=day.get("objective", f"Understand the key ideas for day {index + 1}."),
        )
        for index, day in enumerate(planner_days)
    ]

    return {
        "title": planner_result.get(
            "title",
            f"{topic} {'7-Day Sprint' if duration_days == 7 else '30-Day Deep Dive'}",
        ),
        "overview": planner_result.get(
            "overview",
            f"A structured {duration_days}-day curriculum for {topic}.",
        ),
        "days": outline_days,
    }


async def generate_curriculum_day(
    *,
    topic: str,
    level: str,
    duration_days: int,
    day_outline: dict[str, Any],
    previous_days: list[dict[str, Any]],
    on_progress: ProgressCallback | None = None,
) -> dict[str, Any]:
    async def progress(message: str):
        if on_progress:
            await on_progress(message)

    logger.info(
        "Generating curriculum day %s/%s for topic=%s",
        day_outline.get("dayNumber"),
        duration_days,
        topic,
    )

    await progress("Understanding this study day...")
    await progress("Reviewing previous generated days...")
    await progress("Writing the lesson content...")

    try:
        result = await generate_json_response(
            prompt=_day_writer_prompt(
                topic=topic,
                level=level,
                duration_days=duration_days,
                day_outline=day_outline,
                previous_days=previous_days,
            ),
            level=level,
        )
    except Exception:
        logger.exception(
            "Day generation failed for day=%s topic=%s, using mock fallback",
            day_outline.get("dayNumber"),
            topic,
        )
        await progress("Using a fallback lesson structure...")
        return build_mock_generated_day(
            topic=topic,
            day_number=day_outline["dayNumber"],
            title=day_outline["title"],
            objective=day_outline["objective"],
        )

    await progress("Checking the lesson structure...")

    sections = result.get("sections", [])
    if not isinstance(sections, list) or len(sections) == 0:
        logger.warning(
            "Generated day invalid sections for day=%s topic=%s, using mock fallback",
            day_outline.get("dayNumber"),
            topic,
        )
        await progress("Rebuilding this day with a fallback structure...")
        return build_mock_generated_day(
            topic=topic,
            day_number=day_outline["dayNumber"],
            title=day_outline["title"],
            objective=day_outline["objective"],
        )

    await progress("Finalizing this study day...")

    return {
        "dayNumber": result.get("dayNumber", day_outline["dayNumber"]),
        "title": result.get("title", day_outline["title"]),
        "objective": result.get("objective", day_outline["objective"]),
        "summary": result.get("summary", ""),
        "sections": result.get("sections", []),
        "exercise": result.get("exercise", ""),
        "resources": result.get("resources", []),
        "isGenerated": True,
    }