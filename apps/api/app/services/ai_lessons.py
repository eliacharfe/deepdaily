#apps/api/app/services/ai_lessons.py

async def generate_lesson_with_ai(topic: str, level: str) -> dict:
    # Replace this with your real LLM call
    # Must return:
    # {
    #   "title": "...",
    #   "sections": [
    #       {"title": "...", "content": "..."}
    #   ]
    # }
    return {
        "title": f"{topic.title()} for {level.title()} Learners",
        "sections": [
            {
                "title": "Introduction",
                "content": f"This is a lesson about {topic} for {level} learners."
            }
        ],
    }