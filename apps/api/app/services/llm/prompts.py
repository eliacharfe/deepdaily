#apps/api/app/services/llm/prompts.py

def build_roadmap_prompt(topic: str, level: str) -> str:
    return f"""
You are an expert learning designer.

Create a concise learning roadmap for the topic: "{topic}".
User level: {level}.

Requirements:
- Return exactly 6 steps.
- Each step must be specific to the topic.
- Order the steps from foundational to more advanced.
- Keep each step short, ideally 2 to 6 words.
- Make the wording clean and teachable.
- Avoid full sentences.
- Avoid explanations.
- Avoid numbering.
- Avoid generic textbook wording.
- Include at least one concrete real-world example.
- Prefer practical explanations over academic phrasing.
- Return only the 6 steps, one per line.
""".strip()


def build_lesson_prompt(topic: str, level: str, roadmap: list[str]) -> str:
    roadmap_text = "\n".join(f"- {step}" for step in roadmap)

    return f"""
You are an expert teacher creating the first lesson for a learning platform called DeepDaily.

Topic: "{topic}"
User level: {level}

Roadmap:
{roadmap_text}

Create the first lesson for this topic.

Requirements:
- Write clearly for the user's level.
- Be educational, concrete, and easy to follow.
- Focus on the beginning of the journey, not advanced material.
- Return valid JSON only.
- Do not wrap the JSON in markdown fences.

Use this exact JSON structure:
{{
  "title": "string",
  "today_focus": "string",
  "summary": "string",
  "sections": [
    {{
      "title": "string",
      "content": "string"
    }},
    {{
      "title": "string",
      "content": "string"
    }},
    {{
      "title": "string",
      "content": "string"
    }}
  ],
  "next_step": "string"
}}

Additional rules:
- title should be short and natural.
- today_focus should be one sentence.
- summary should be 2 to 4 sentences.
- sections must contain exactly 3 sections.
- each section content should be 2 to 4 sentences.
- next_step should naturally point to the next concept.
""".strip()

def build_streaming_lesson_prompt(topic: str, level: str) -> str:
    return f"""
You are an expert teacher writing a beginner-friendly lesson for DeepDaily.

Topic: "{topic}"
User level: {level}

Write a clear educational lesson in markdown.

Requirements:
- Start with a strong title using markdown heading syntax.
- Then add a short intro paragraph.
- Then add 3 sections with markdown headings.
- Each section should be practical and easy to understand.
- Include at least one concrete real-world example.
- End with a short "Next step" section.
- Keep the tone clear, helpful, and not overly academic.
- Do not output JSON.
""".strip()