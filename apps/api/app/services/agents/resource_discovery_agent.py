#apps/api/app/services/agents/resource_discovery_agent.py

from typing import Any
from urllib.parse import urlparse

from app.schemas.topic_schema import LessonResource, LessonDeepDiveItem
from app.services.search.web_search_client import WebSearchClient

TRUSTED_VIDEO_DOMAINS = (
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "m.youtube.com",
)


class ResourceDiscoveryAgent:
    def __init__(self, search_client: WebSearchClient | None = None):
        self.search_client = search_client or WebSearchClient()

        self.preferred_domains = {
            "developer.apple.com": 4,
            "docs.python.org": 4,
            "react.dev": 4,
            "nextjs.org": 4,
            "fastapi.tiangolo.com": 4,
            "platform.openai.com": 4,
            "investopedia.com": 4,
            "bogleheads.org": 3,
            "morningstar.com": 3,
            "coursera.org": 2,
            "youtube.com": 2,
            "udemy.com": 1,
            "goodreads.com": 1,
            "amazon.com": 1,
            "medium.com": -1,
            "reddit.com": -3,
            "quora.com": -3,
        }

    async def search(self, query: str, max_results: int = 5) -> list[dict[str, Any]]:
        results = await self.search_client.search(query=query, max_results=max_results)

        normalized: list[dict[str, Any]] = []
        for result in results:
            normalized.append(
                {
                    "title": getattr(result, "title", "") or "",
                    "url": getattr(result, "url", "") or "",
                    "snippet": getattr(result, "snippet", "") or "",
                    "source": getattr(result, "source", "") or "",
                }
            )
        return normalized

    def build_queries(self, topic: str, level: str) -> list[str]:
        return [
            f"{topic} {level} tutorial",
            f"{topic} beginner guide",
            f"{topic} explained video",
            f"{topic} practical example",
        ]

    def infer_resource_type(self, url: str, title: str) -> str:
        value = f"{url} {title}".lower()

        if "youtube.com" in value or "youtu.be" in value:
            return "video"
        if any(x in value for x in ["docs.", "/docs", "documentation", "developer.apple.com"]):
            return "documentation"
        return "article"

    def is_good_result(self, title: str, url: str) -> bool:
        value = f"{title} {url}".lower()

        blocked = [
            "login",
            "sign in",
            "signup",
            "register",
            "course catalog",
            "reddit",
            "quora",
            "job",
            "jobs",
        ]

        return not any(term in value for term in blocked)

    def extract_domain(self, url: str) -> str:
        try:
            hostname = urlparse(url).hostname or ""
            return hostname.replace("www.", "").lower()
        except Exception:
            return ""

    def domain_score(self, url: str) -> int:
        domain = self.extract_domain(url)
        return self.preferred_domains.get(domain, 0)

    def title_score(self, title: str, level: str) -> int:
        title_lower = title.lower()
        score = 0

        positive_terms = ["beginner", "introduction", "guide", "tutorial", "explained", "basics"]
        advanced_terms = ["advanced", "benchmark", "research paper", "arxiv", "optimization"]

        for term in positive_terms:
            if term in title_lower:
                score += 1

        if level == "beginner":
            for term in advanced_terms:
                if term in title_lower:
                    score -= 2

        return score

    def type_bonus(self, resource_type: str) -> int:
        if resource_type == "documentation":
            return 2
        if resource_type == "video":
            return 1
        return 0

    def build_reason(self, resource_type: str, source: str | None) -> str:
        source_label = source or "a trusted source"

        if resource_type == "video":
            return f"Useful visual introduction from {source_label}"
        if resource_type == "documentation":
            return f"Helpful reference from {source_label}"
        return f"Good learning resource from {source_label}"

    def score_result(self, title: str, url: str, resource_type: str, level: str) -> int:
        return (
            self.domain_score(url)
            + self.title_score(title, level)
            + self.type_bonus(resource_type)
        )

    async def discover_resources(self, topic: str, level: str) -> list[LessonResource]:
        queries = self.build_queries(topic=topic, level=level)

        collected: list[tuple[int, LessonResource]] = []
        seen_urls: set[str] = set()

        for query in queries:
            results = await self.search_client.search(query=query, max_results=5)

            for result in results:
                if result.url in seen_urls:
                    continue

                if not self.is_good_result(result.title, result.url):
                    continue

                seen_urls.add(result.url)

                resource_type = self.infer_resource_type(result.url, result.title)
                score = self.score_result(
                    title=result.title,
                    url=result.url,
                    resource_type=resource_type,
                    level=level,
                )

                collected.append(
                    (
                        score,
                        LessonResource(
                            title=result.title,
                            url=result.url,
                            type=resource_type,
                            reason=self.build_reason(resource_type, result.source),
                            snippet=result.snippet,
                        ),
                    )
                )

        collected.sort(key=lambda item: item[0], reverse=True)

        ranked = [resource for _, resource in collected]

        videos = [r for r in ranked if r.type == "video"]
        docs = [r for r in ranked if r.type == "documentation"]
        articles = [r for r in ranked if r.type == "article"]

        balanced: list[LessonResource] = []

        if articles:
            balanced.append(articles[0])
        if videos:
            balanced.append(videos[0])
        if docs:
            balanced.append(docs[0])

        for resource in ranked:
            if resource not in balanced:
                balanced.append(resource)
            if len(balanced) >= 4:
                break

        return balanced[:4]

    def build_deep_dive_queries(self, topic: str, level: str) -> list[str]:
        return [
            f"best books for {topic} beginners",
            f"{topic} beginner reading list",
            f"{topic} best guide",
            f"{topic} course for beginners",
        ]

    def infer_deep_dive_type(self, url: str, title: str) -> str:
        value = f"{url} {title}".lower()

        if "youtube.com" in value or "youtu.be" in value:
            return "course"
        if "coursera.org" in value or "udemy.com" in value:
            return "course"
        if "goodreads.com" in value or "amazon." in value or "book" in value or "books" in value:
            return "book"
        if any(x in value for x in ["docs.", "/docs", "documentation", "developer.apple.com"]):
            return "documentation"
        if any(x in value for x in ["guide", "tutorial"]):
            return "guide"
        return "article"

    def build_deep_dive_reason(self, resource_type: str, source: str | None) -> str:
        source_label = source or "a trusted source"

        if resource_type == "book":
            return f"Strong book recommendation from {source_label}"
        if resource_type == "course":
            return f"Structured learning option from {source_label}"
        if resource_type == "documentation":
            return f"Useful reference for going deeper from {source_label}"
        if resource_type == "guide":
            return f"In-depth guide from {source_label}"
        return f"Helpful follow-up resource from {source_label}"

    async def discover_deep_dive(self, topic: str, level: str) -> list[LessonDeepDiveItem]:
        queries = self.build_deep_dive_queries(topic=topic, level=level)

        collected: list[tuple[int, LessonDeepDiveItem]] = []
        seen_urls: set[str] = set()

        for query in queries:
            results = await self.search_client.search(query=query, max_results=5)

            for result in results:
                if not result.url or result.url in seen_urls:
                    continue

                if not self.is_good_result(result.title, result.url):
                    continue

                seen_urls.add(result.url)

                resource_type = self.infer_deep_dive_type(result.url, result.title)
                score = self.score_result(
                    title=result.title,
                    url=result.url,
                    resource_type="documentation" if resource_type == "documentation" else "article",
                    level=level,
                )

                if resource_type == "book":
                    score += 2
                elif resource_type == "course":
                    score += 1

                collected.append(
                    (
                        score,
                        LessonDeepDiveItem(
                            title=result.title,
                            url=result.url,
                            type=resource_type,
                            reason=self.build_deep_dive_reason(resource_type, result.source),
                            snippet=result.snippet,
                        ),
                    )
                )

        collected.sort(key=lambda item: item[0], reverse=True)

        ranked = [resource for _, resource in collected]

        books = [r for r in ranked if r.type == "book"]
        guides = [r for r in ranked if r.type == "guide"]
        docs = [r for r in ranked if r.type == "documentation"]
        courses = [r for r in ranked if r.type == "course"]
        articles = [r for r in ranked if r.type == "article"]

        balanced: list[LessonDeepDiveItem] = []

        if books:
            balanced.append(books[0])
        if guides:
            balanced.append(guides[0])
        elif articles:
            balanced.append(articles[0])
        if docs:
            balanced.append(docs[0])
        elif courses:
            balanced.append(courses[0])

        for resource in ranked:
            if resource not in balanced:
                balanced.append(resource)
            if len(balanced) >= 3:
                break

        return balanced[:3]

    async def discover_day_resources(
        self,
        *,
        topic: str,
        level: str,
        day_title: str,
        day_objective: str,
        day_summary: str,
        sections: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        query = f"{topic} {day_title} {day_objective} {level} tutorial OR lecture OR guide"

        results = await self.search(query=query, max_results=8)

        resources: list[dict[str, Any]] = []
        seen_urls: set[str] = set()
        added_video = False

        for item in results:
            url = (item.get("url") or "").strip()
            title = (item.get("title") or "").strip()
            snippet = (item.get("snippet") or "").strip()

            if not url or not title or url in seen_urls:
                continue

            if not self.is_good_result(title, url):
                continue

            lower_url = url.lower()

            if any(domain in lower_url for domain in TRUSTED_VIDEO_DOMAINS):
                if added_video:
                    continue

                resources.append(
                    {
                        "title": title,
                        "url": url,
                        "type": "video",
                        "reason": f"Relevant video for {day_title}",
                        "snippet": snippet,
                    }
                )
                seen_urls.add(url)
                added_video = True
                continue

            resources.append(
                {
                    "title": title,
                    "url": url,
                    "type": self.infer_resource_type(url, title),
                    "reason": f"Helpful supporting resource for {day_title}",
                    "snippet": snippet,
                }
            )
            seen_urls.add(url)

            if len(resources) >= 3:
                break

        return resources