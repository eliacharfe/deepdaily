#apps/api/app/services/agents/resource_discovery_agent.py

from app.schemas.topic_schema import LessonResource
from app.services.search.web_search_client import WebSearchClient

from urllib.parse import urlparse

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
            "huggingface.co": 3,
            "pinecone.io": 3,
            "langchain.com": 3,
            "langchain.dev": 3,
            "youtube.com": 2,
            "coursera.org": 2,
            "udemy.com": 1,
            "medium.com": -1,
            "reddit.com": -3,
            "quora.com": -3,
        }

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