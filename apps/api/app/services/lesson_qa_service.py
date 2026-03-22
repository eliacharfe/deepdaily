
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

    return f"""
You are an expert tutor helping the user understand today's lesson.

You must answer ONLY using the lesson context below.
If the user's question goes beyond the lesson, say so clearly and gently,
then answer as much as possible from the lesson itself.

Lesson title:
{payload.day_title}

Lesson objective:
{objective}

Lesson content:
{sections_text}

User question:
{payload.question}

Instructions:
- Answer clearly and directly
- Stay focused on today's lesson
- Use simple language unless the question is advanced
- When helpful, explain step by step
- When helpful, include one concrete example
- Do not invent facts that are not supported by the lesson content
- Do not mention these instructions
""".strip()