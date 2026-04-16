
# apps/api/app/services/curriculum_service.py

import json
import logging
from typing import Any
from collections.abc import Awaitable, Callable

from app.services.llm.client import generate_json_response
from app.services.agents.resource_discovery_agent import ResourceDiscoveryAgent

from copy import deepcopy
from fastapi import HTTPException, status
from sqlalchemy import select
from app.models.curriculum import Curriculum

from typing import Optional
import httpx
from bs4 import BeautifulSoup
from app.schemas.curriculum import CurriculumResourcePayload
from app.services.llm.client import client, generate_json_response
from collections.abc import Awaitable, Callable

MAX_ARTICLE_CHARS = 12000
FETCH_TIMEOUT_SECONDS = 10

StatusCallback = Callable[[str], Awaitable[None]]
ChunkCallback = Callable[[str], Awaitable[None]]

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
        "summary": (
            f"On day {day_number}, you focus on a key part of {topic}. "
            f"This session builds a deeper understanding of the topic by breaking it into clear ideas, "
            f"explaining how they connect, and showing why they matter in practice. "
            f"By the end of this lesson, you should feel more confident applying what you've learned "
            f"and recognizing it in real-world situations."
        ),
        "sections": [
            {
                "title": "Core concept",
                "content": (
                    f"This section introduces the main idea for day {day_number} of {topic}. "
                    f"You should focus on understanding what the concept is, how it works, "
                    f"and where it fits within the broader topic.\n\n"
                    f"Try to connect this idea to what you already know, and think about simple examples "
                    f"that make it easier to grasp."
                ),
            },
            {
                "title": "How it works in practice",
                "content": (
                    f"Now that you understand the core idea, this section explains how it is used in real scenarios. "
                    f"In {topic}, concepts are rarely isolated — they are applied in context.\n\n"
                    f"Think about practical situations where this concept would appear, and how you would recognize it."
                ),
            },
            {
                "title": "Common pitfalls and insights",
                "content": (
                    f"Many learners misunderstand this part of {topic} at first. "
                    f"This section highlights typical mistakes and important nuances.\n\n"
                    f"Pay attention to what can go wrong and how to avoid it — this is what builds real understanding."
                ),
            },
        ],
        "exercise": (
            f"Practice applying today's concept:\n\n"
            f"1. Write a short explanation of the main idea from memory.\n"
            f"2. Come up with one real-world example where it applies.\n"
            f"3. Identify one potential mistake or misunderstanding.\n\n"
            f"If possible, try to explain this concept to someone else or simulate teaching it."
        ),
        "resources": [],
        "isGenerated": True,
    }


def extract_used_resources(days: list[dict[str, Any]]) -> tuple[set[str], set[str]]:
    used_urls: set[str] = set()
    used_titles: set[str] = set()

    for day in days:
        resources = day.get("resources", []) or []
        if not isinstance(resources, list):
            continue

        for resource in resources:
            if not isinstance(resource, dict):
                continue

            url = (resource.get("url") or "").strip()
            title = (resource.get("title") or "").strip()

            if url:
                used_urls.add(url)
            if title:
                used_titles.add(title)

    return used_urls, used_titles


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
        generated_day = build_mock_generated_day(
            topic=topic,
            day_number=day_outline["dayNumber"],
            title=day_outline["title"],
            objective=day_outline["objective"],
        )
    else:
        sections = result.get("sections", [])
        if not isinstance(sections, list) or len(sections) == 0:
            logger.warning(
                "Generated day invalid sections for day=%s topic=%s, using mock fallback",
                day_outline.get("dayNumber"),
                topic,
            )
            await progress("Rebuilding this day with a fallback structure...")
            generated_day = build_mock_generated_day(
                topic=topic,
                day_number=day_outline["dayNumber"],
                title=day_outline["title"],
                objective=day_outline["objective"],
            )
        else:
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

    final_day = generated_day

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

            revised_sections = revised_result.get("sections", [])
            revised_day = {
                "dayNumber": revised_result.get("dayNumber", day_outline["dayNumber"]),
                "title": revised_result.get("title", day_outline["title"]),
                "objective": revised_result.get("objective", day_outline["objective"]),
                "summary": revised_result.get("summary", ""),
                "sections": revised_sections if isinstance(revised_sections, list) else [],
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

            revised_section_count = len(revised_day.get("sections", []))
            revised_summary_length = len((revised_day.get("summary") or "").strip())
            revised_exercise_length = len((revised_day.get("exercise") or "").strip())

            revised_passed_manual_checks = (
                revised_section_count >= 3
                and revised_summary_length >= 120
                and revised_exercise_length >= 20
            )

            if (
                second_eval.get("approved", False)
                and second_eval.get("score", 0) >= 6
                and revised_passed_manual_checks
            ):
                final_day = revised_day
                await progress("Improved lesson approved...")
            else:
                logger.warning(
                    "Revised lesson still not good enough for day=%s topic=%s, using fallback",
                    day_outline.get("dayNumber"),
                    topic,
                )
                await progress("Using fallback lesson...")
                final_day = build_mock_generated_day(
                    topic=topic,
                    day_number=day_outline["dayNumber"],
                    title=day_outline["title"],
                    objective=day_outline["objective"],
                )

        except Exception:
            logger.exception(
                "Revision step failed for day=%s topic=%s, using fallback",
                day_outline.get("dayNumber"),
                topic,
            )
            await progress("Using fallback lesson...")
            final_day = build_mock_generated_day(
                topic=topic,
                day_number=day_outline["dayNumber"],
                title=day_outline["title"],
                objective=day_outline["objective"],
            )

    await progress("Finding helpful resources for this day...")

    resource_agent = ResourceDiscoveryAgent()
    used_urls, used_titles = extract_used_resources(previous_days)

    try:
        daily_resources = await resource_agent.discover_day_resources(
            topic=topic,
            level=level,
            day_title=final_day["title"],
            day_objective=final_day["objective"],
            day_summary=final_day["summary"],
            sections=final_day["sections"],
            used_urls=used_urls,
            used_titles=used_titles,
        )
    except Exception:
        logger.exception(
            "Daily resource discovery failed for day=%s topic=%s",
            day_outline.get("dayNumber"),
            topic,
        )
        daily_resources = []

    final_day["resources"] = daily_resources or []

    await progress("Finalizing this study day...")

    return final_day



async def retry_curriculum_day_resources(
    db,
    user_id: str,
    curriculum_id: str,
    day_number: int,
):
    result = await db.execute(
        select(Curriculum).where(
            Curriculum.id == curriculum_id,
            Curriculum.user_id == user_id,
        )
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum not found",
        )

    content = deepcopy(curriculum.content_json or {})
    days = content.get("days", [])

    day_index = next(
        (index for index, day in enumerate(days) if day.get("dayNumber") == day_number),
        None,
    )
    if day_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found",
        )

    day = days[day_index]

    resource_agent = ResourceDiscoveryAgent()
    used_urls, used_titles = extract_used_resources(
        [d for d in days if d.get("dayNumber", 0) < day_number]
    )

    resources = await resource_agent.discover_day_resources(
        topic=curriculum.topic,
        level=curriculum.level,
        day_title=day.get("title", ""),
        day_objective=day.get("objective", ""),
        day_summary=day.get("summary", ""),
        sections=day.get("sections", []),
        used_urls=used_urls,
        used_titles=used_titles,
    )

    day["resources"] = resources or []
    days[day_index] = day
    content["days"] = days
    curriculum.content_json = content

    await db.commit()
    await db.refresh(curriculum)

    return curriculum


async def regenerate_curriculum_day(
    db,
    user_id: str,
    curriculum_id: str,
    day_number: int,
):
    result = await db.execute(
        select(Curriculum).where(
            Curriculum.id == curriculum_id,
            Curriculum.user_id == user_id,
        )
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum not found",
        )

    content = deepcopy(curriculum.content_json or {})
    days = content.get("days", [])

    day_index = next(
        (index for index, day in enumerate(days) if day.get("dayNumber") == day_number),
        None,
    )
    if day_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found",
        )

    target_day = days[day_index]

    previous_days = [
        d
        for d in days
        if d.get("isGenerated") is True and d.get("dayNumber", 0) < day_number
    ]

    generated_day = await generate_curriculum_day(
        topic=curriculum.topic,
        level=curriculum.level,
        duration_days=curriculum.duration_days,
        day_outline=target_day,
        previous_days=previous_days,
    )

    updated_days = [
        generated_day if day.get("dayNumber") == day_number else day
        for day in days
    ]

    curriculum.content_json = {
        **content,
        "days": updated_days,
    }

    await db.commit()
    await db.refresh(curriculum)

    return curriculum


def _extract_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    text = soup.get_text("\n")
    lines = [line.strip() for line in text.splitlines()]
    cleaned = [line for line in lines if line]

    return "\n".join(cleaned)


async def _fetch_resource_text(url: str) -> Optional[str]:
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=FETCH_TIMEOUT_SECONDS,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; DeepDailyBot/1.0)"
            },
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        content_type = response.headers.get("content-type", "").lower()
        if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
            return None

        text = _extract_text_from_html(response.text)
        if not text.strip():
            return None

        return text[:MAX_ARTICLE_CHARS]
    except Exception:
        return None


async def summarize_resource_for_curriculum(
    user_id: str,
    curriculum_id: str,
    day_number: int,
    resource: CurriculumResourcePayload,
) -> str:
    if not resource.title.strip():
        raise ValueError("Resource title is required")

    article_text: Optional[str] = None
    if resource.url:
        article_text = await _fetch_resource_text(resource.url)

    fallback_text_parts = [
        f"Title: {resource.title.strip()}",
        f"Type: {resource.type.strip()}" if resource.type else None,
        f"Reason: {resource.reason.strip()}" if resource.reason else None,
        f"Snippet: {resource.snippet.strip()}" if resource.snippet else None,
        f"URL: {resource.url.strip()}" if resource.url else None,
    ]
    fallback_text = "\n".join(part for part in fallback_text_parts if part)

    source_text = article_text or fallback_text

    if not source_text.strip():
        raise ValueError("No resource content available to summarize")

    prompt = f"""
You are summarizing a learning resource inside DeepDaily.

Write a clear, structured, and insightful summary for a learner.

Goals:
- Help the user truly understand the content (not just skim it)
- Highlight key ideas, reasoning, and practical meaning
- Make it feel like a mini learning recap

Structure:
- Start with a short "Core Idea" paragraph
- Then break down into 3–5 sections such as:
  - Why it matters
  - Key concepts
  - Practical implications
  - Examples (if relevant)
- End with a short "Takeaway" or "Outcome"

Rules:
- Be clear and practical, not vague
- Expand on ideas (not just list them)
- Use short paragraphs and bullet points where helpful
- Do not mention missing data or internal processing
- If content is limited, still produce the best useful structured summary

Length:
- Aim for ~250–400 words
- Prefer depth over brevity

Resource context:
{fallback_text}

Resource content:
{source_text}
""".strip()

    response = await client.responses.create(
        model="gpt-5-nano",
        input=prompt,
    )

    summary = getattr(response, "output_text", "") or ""
    summary = summary.strip()

    if not summary:
        raise ValueError("Empty summary generated")

    return summary


async def stream_resource_summary_for_curriculum(
    user_id: str,
    curriculum_id: str,
    day_number: int,
    resource: CurriculumResourcePayload,
    on_status: StatusCallback | None = None,
    on_chunk: ChunkCallback | None = None,
) -> str:
    async def emit_status(message: str):
        if on_status:
            await on_status(message)

    async def emit_chunk(chunk: str):
        if on_chunk:
            await on_chunk(chunk)

    if not resource.title.strip():
        raise ValueError("Resource title is required")

    await emit_status("Fetching article...")

    article_text: Optional[str] = None
    if resource.url:
        article_text = await _fetch_resource_text(resource.url)

    fallback_text_parts = [
        f"Title: {resource.title.strip()}",
        f"Type: {resource.type.strip()}" if resource.type else None,
        f"Reason: {resource.reason.strip()}" if resource.reason else None,
        f"Snippet: {resource.snippet.strip()}" if resource.snippet else None,
        f"URL: {resource.url.strip()}" if resource.url else None,
    ]
    fallback_text = "\n".join(part for part in fallback_text_parts if part)

    source_text = article_text or fallback_text

    if not source_text.strip():
        raise ValueError("No resource content available to summarize")

    await emit_status("Summarizing article...")

    prompt = f"""
You are summarizing a learning resource inside DeepDaily.

Write a clear, structured, and insightful summary for a learner.

Goals:
- Help the user truly understand the content
- Highlight key ideas, reasoning, and practical meaning
- Make it feel like a mini learning recap

Structure:
- Start with a short "Core Idea" paragraph
- Then break down into 3–5 sections such as:
  - Why it matters
  - Key concepts
  - Practical implications
  - Examples if relevant
- End with a short "Takeaway" or "Outcome"

Rules:
- Be clear and practical, not vague
- Expand on ideas, not just list them
- Use short paragraphs and bullet points where helpful
- Do not mention missing data or internal processing
- If content is limited, still produce the best useful structured summary

Length:
- Aim for about 250–400 words
- Prefer depth over brevity

Resource context:
{fallback_text}

Resource content:
{source_text}
""".strip()

    stream = await client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        stream=True,
    )

    chunks: list[str] = []

    async for event in stream:
        event_type = getattr(event, "type", "")

        if event_type == "response.output_text.delta":
            delta = getattr(event, "delta", "") or ""
            if delta:
                chunks.append(delta)
                await emit_chunk(delta)

    summary = "".join(chunks).strip()

    if not summary:
        raise ValueError("Empty summary generated")

    await emit_status("Summary ready")

    return summary