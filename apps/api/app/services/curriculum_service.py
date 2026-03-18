
# apps/api/app/services/curriculum_service.py

import json
import logging
from typing import Any
from collections.abc import Awaitable, Callable

from app.services.llm.client import generate_json_response
from app.services.agents.resource_discovery_agent import ResourceDiscoveryAgent

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
    feedback: list[str] | None = None,
) -> str:
    feedback_section = ""
    if feedback:
        feedback_section = f"""
Feedback from a quality evaluator (MUST FIX):
{json.dumps(feedback, ensure_ascii=False)}
"""

    return f"""
You are a high-quality curriculum lesson writer for DeepDaily.

Write ONE full learning day that is:
- Deep (not shallow)
- Structured
- Practical
- Engaging

Topic: {topic}
Level: {level}
Curriculum length: {duration_days} days

Current day outline:
{json.dumps(day_outline, ensure_ascii=False)}

Previously generated days:
{json.dumps(previous_days, ensure_ascii=False)}

{feedback_section}

Requirements:
- The lesson must feel like a real structured study session
- Avoid generic explanations
- Add concrete explanations, not vague text
- Include at least 3–5 sections
- Each section must:
  - teach something specific
  - include explanation + insight
- The summary should reinforce understanding (not repeat title)
- The exercise MUST be practical and actionable
- Build on previous days naturally
- Do not repeat earlier concepts unless extending them

Markdown formatting rules:
- Use markdown formatting where useful
- Use bullet points for lists
- Use numbered steps for exercises when relevant
- Use short subheadings where they improve clarity
- Use code fences for code examples when relevant
- Keep markdown clean and readable, not excessive
- Do not wrap the entire response in markdown fences
- Return valid JSON only; markdown should appear only inside string fields like "summary", section "content", and "exercise"

Depth rules:
- Beginner → clear + intuitive + examples
- Intermediate → more detailed + reasoning
- Advanced → deeper insights + nuance

Resources:
- Only include real URLs if confident
- Otherwise return empty list

Return only valid JSON.

Format:
{{
  "dayNumber": 1,
  "title": "string",
  "objective": "string",
  "summary": "string",
  "sections": [
    {{
      "title": "string",
      "content": "detailed explanation"
    }}
  ],
  "exercise": "practical task",
  "resources": [],
  "isGenerated": true
}}
"""

def _day_evaluator_prompt(
    topic: str,
    level: str,
    duration_days: int,
    day_outline: dict[str, Any],
    previous_days: list[dict[str, Any]],
    generated_day: dict[str, Any],
) -> str:
    return f"""
You are a strict curriculum quality evaluator for DeepDaily.

Evaluate whether this generated curriculum day is good enough to show to the user.

Topic: {topic}
Level: {level}
Curriculum length: {duration_days} days

Planned day outline:
{json.dumps(day_outline, ensure_ascii=False)}

Previously generated days:
{json.dumps(previous_days, ensure_ascii=False)}

Generated day to evaluate:
{json.dumps(generated_day, ensure_ascii=False)}

Evaluation criteria:
- The lesson should be clear and educational
- The lesson should not feel shallow or generic
- The content should be appropriate for the user's level
- The lesson should progress naturally from previous days
- Sections should be meaningful, specific, and not repetitive
- The summary should be useful
- The exercise should be practical and relevant
- A good lesson should usually have at least 3 strong sections
- Reject lessons that feel vague, too short, repetitive, or underdeveloped

Return only valid JSON.
Do not wrap JSON in markdown fences.
Do not add explanations.

Use this exact format:
{{
  "approved": true,
  "score": 8,
  "feedback": [
    "string"
  ],
  "issues": [
    "string"
  ]
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

async def evaluate_curriculum_day(
    *,
    topic: str,
    level: str,
    duration_days: int,
    day_outline: dict[str, Any],
    previous_days: list[dict[str, Any]],
    generated_day: dict[str, Any],
) -> dict[str, Any]:
    logger.info(
        "Evaluating curriculum day %s/%s for topic=%s",
        day_outline.get("dayNumber"),
        duration_days,
        topic,
    )

    try:
        result = await generate_json_response(
            prompt=_day_evaluator_prompt(
                topic=topic,
                level=level,
                duration_days=duration_days,
                day_outline=day_outline,
                previous_days=previous_days,
                generated_day=generated_day,
            ),
            level=level,
        )
    except Exception:
        logger.exception(
            "Evaluator failed for day=%s topic=%s, defaulting to reject",
            day_outline.get("dayNumber"),
            topic,
        )
        return {
            "approved": False,
            "score": 0,
            "feedback": [],
            "issues": ["Evaluator failed"],
        }

    approved = bool(result.get("approved", False))
    score = result.get("score", 0)
    feedback = result.get("feedback", [])
    issues = result.get("issues", [])

    if not isinstance(score, int):
        try:
            score = int(score)
        except Exception:
            score = 0

    if not isinstance(feedback, list):
        feedback = []

    if not isinstance(issues, list):
        issues = []

    return {
        "approved": approved,
        "score": score,
        "feedback": feedback,
        "issues": issues,
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

    generated_day = {
        "dayNumber": result.get("dayNumber", day_outline["dayNumber"]),
        "title": result.get("title", day_outline["title"]),
        "objective": result.get("objective", day_outline["objective"]),
        "summary": result.get("summary", ""),
        "sections": result.get("sections", []),
        "exercise": result.get("exercise", ""),
        "resources": result.get("resources", []),
        "isGenerated": True,
    }

    await progress("Evaluating lesson quality...")

    evaluation = await evaluate_curriculum_day(
        topic=topic,
        level=level,
        duration_days=duration_days,
        day_outline=day_outline,
        previous_days=previous_days,
        generated_day=generated_day,
    )

    section_count = len(generated_day.get("sections", []))
    summary_length = len((generated_day.get("summary") or "").strip())
    exercise_length = len((generated_day.get("exercise") or "").strip())

    passed_manual_checks = (
        section_count >= 3
        and summary_length >= 120
        and exercise_length >= 20
    )

    approved = evaluation.get("approved", False)
    score = evaluation.get("score", 0)

    # -------------------------
    # REVISION STEP (NEW)
    # -------------------------
    if not approved or score < 6 or not passed_manual_checks:
        await progress("Improving the lesson based on feedback...")

        feedback = evaluation.get("issues", []) or evaluation.get("feedback", [])

        try:
            revised_result = await generate_json_response(
                prompt=_day_writer_prompt(
                    topic=topic,
                    level=level,
                    duration_days=duration_days,
                    day_outline=day_outline,
                    previous_days=previous_days,
                    feedback=feedback,
                ),
                level=level,
            )

            revised_day = {
                "dayNumber": revised_result.get("dayNumber", day_outline["dayNumber"]),
                "title": revised_result.get("title", day_outline["title"]),
                "objective": revised_result.get("objective", day_outline["objective"]),
                "summary": revised_result.get("summary", ""),
                "sections": revised_result.get("sections", []),
                "exercise": revised_result.get("exercise", ""),
                "resources": revised_result.get("resources", []),
                "isGenerated": True,
            }

            await progress("Re-evaluating improved lesson...")

            second_eval = await evaluate_curriculum_day(
                topic=topic,
                level=level,
                duration_days=duration_days,
                day_outline=day_outline,
                previous_days=previous_days,
                generated_day=revised_day,
            )

            if second_eval.get("approved") and second_eval.get("score", 0) >= 6:
                await progress("Finalizing improved lesson...")
                return revised_day

        except Exception:
            logger.exception("Revision step failed")

        logger.warning(
            "Lesson rejected after revision, using fallback day=%s topic=%s",
            day_outline.get("dayNumber"),
            topic,
        )

        await progress("Using fallback lesson...")
        return build_mock_generated_day(
            topic=topic,
            day_number=day_outline["dayNumber"],
            title=day_outline["title"],
            objective=day_outline["objective"],
        )

    await progress("Finding helpful resources for this day...")

    resource_agent = ResourceDiscoveryAgent()

    try:
        daily_resources = await resource_agent.discover_day_resources(
            topic=topic,
            level=level,
            day_title=generated_day["title"],
            day_objective=generated_day["objective"],
            day_summary=generated_day["summary"],
            sections=generated_day["sections"],
        )
    except Exception:
        logger.exception(
            "Daily resource discovery failed for day=%s topic=%s",
            day_outline.get("dayNumber"),
            topic,
        )
        daily_resources = []

    generated_day["resources"] = daily_resources or []

    await progress("Finalizing this study day...")

    return generated_day