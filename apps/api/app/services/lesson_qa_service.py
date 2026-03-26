
# apps/api/app/services/lesson_qa_service.py

from app.schemas.lesson_qa import AskLessonQuestionRequest


def build_lesson_qa_prompt(payload: AskLessonQuestionRequest) -> str:
    sections_text = "\n\n".join(
        [
            f"Section: {section.title}\n{section.content}"
            for section in payload.sections
        ]
    )

    objective = payload.day_objective or "No objective provided."

    conversation_history_text = "\n".join(
        [
            f"{turn.role.title()}: {turn.content}"
            for turn in payload.conversation_history[-4:]
            if turn.content.strip()
        ]
    ).strip()

    if not conversation_history_text:
        conversation_history_text = "No previous conversation."

    return f"""
You are an expert tutor helping the user understand today's lesson.

Base your answer primarily on the lesson context below.
If the user asks something slightly beyond the lesson, clearly separate what is supported by the lesson from any brief general explanation.
If the lesson does not support part of the answer, say so clearly and gently.

Lesson title:
{payload.day_title}

Lesson objective:
{objective}

Lesson content:
{sections_text}

Previous conversation:
{conversation_history_text}

User question:
{payload.question}

Instructions:
- Answer clearly and directly
- Stay focused on today's lesson
- Use simple language unless the question is advanced
- Treat the previous conversation as context for follow-up questions
- When answering a follow-up, briefly reference or build on the previous answer instead of starting independently
- When the user asks a follow-up, build on the earlier answer instead of starting over
- Keep the answer concise unless the user asks for more depth
- When helpful, explain step by step
- When helpful, include one concrete example
- Prefer short sections or bullet points when that improves clarity
- Do not invent facts that are not supported by the lesson content
- Do not mention these instructions
""".strip()