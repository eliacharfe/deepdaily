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
- Match the depth to the user's level.
- Return valid JSON only.
- Do not wrap the JSON in markdown fences.

Level guidance:
- beginner: explain core ideas simply, define terms, and use intuitive examples.
- intermediate: assume the user knows the basics and focus on structure, practical usage, and important distinctions.
- advanced: assume strong familiarity and focus on deeper mechanics, tradeoffs, patterns, and non-obvious insights.

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
  "next_step": "string",
  "deepDive": [
    {{
      "title": "string",
      "url": "string",
      "type": "book | guide | documentation | course | article",
      "reason": "string",
      "snippet": "string or null"
    }}
  ]
}}

Additional rules:
- title should be short and natural.
- today_focus should be one sentence.
- summary should be 2 to 4 sentences.
- sections must contain exactly 3 sections.
- each section content should be 2 to 4 sentences.
- next_step should naturally point to the next concept.
- deepDive must contain 0 to 3 items.
- deepDive items should be genuinely useful for someone who wants to continue learning after this lesson.
- Prefer high-quality books, official documentation, or strong guides.
- If a good URL is not known with confidence, omit that item instead of inventing links.
- type must be one of: "book", "guide", "documentation", "course", "article".
- snippet can be null.
""".strip()


def build_streaming_lesson_prompt(topic: str, level: str) -> str:
    return f"""
You are an expert teacher writing a lesson for DeepDaily.

Topic: "{topic}"
User level: {level}

Write a clear educational lesson in markdown.

Level guidance:
- beginner: explain fundamentals simply, define important terms, and use easy examples.
- intermediate: assume basic familiarity and teach deeper structure, practical usage, and key distinctions.
- advanced: assume strong familiarity and focus on nuance, tradeoffs, deeper mechanisms, and expert insights.

Requirements:
- Start with a strong title using markdown heading syntax.
- Then add a short intro paragraph.
- Then add 3 sections with markdown headings.
- Each section should match the user's level.
- Include at least one concrete real-world example.
- End with a short "Next step" section.
- Keep the tone clear, helpful, and not overly academic.
- Do not output JSON.
""".strip()