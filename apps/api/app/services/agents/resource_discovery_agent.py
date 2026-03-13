#apps/api/app/services/agents/resource_discovery_agent.py

from app.schemas.topic_schema import LessonResource
from app.services.search.web_search_client import WebSearchClient


class ResourceDiscoveryAgent:
    def __init__(self, search_client: WebSearchClient | None = None):
        self.search_client = search_client or WebSearchClient()

    def build_queries(self, topic: str, level: str) -> list[str]:
        return [
            f"{topic} {level} tutorial",
            f"{topic} beginner guide",
            f"{topic} explained video",
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
        ]

        return not any(term in value for term in blocked)

    def build_reason(self, resource_type: str, source: str | None) -> str:
        source_label = source or "a trusted source"

        if resource_type == "video":
            return f"Useful visual introduction from {source_label}"
        if resource_type == "documentation":
            return f"Helpful reference from {source_label}"
        return f"Good learning resource from {source_label}"

    async def discover_resources(self, topic: str, level: str) -> list[LessonResource]:
        queries = self.build_queries(topic=topic, level=level)

        collected: list[LessonResource] = []
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

                collected.append(
                    LessonResource(
                        title=result.title,
                        url=result.url,
                        type=resource_type,
                        reason=self.build_reason(resource_type, result.source),
                    )
                )

        # try to keep a balanced set
        videos = [r for r in collected if r.type == "video"]
        docs = [r for r in collected if r.type == "documentation"]
        articles = [r for r in collected if r.type == "article"]

        balanced: list[LessonResource] = []
        if articles:
            balanced.append(articles[0])
        if videos:
            balanced.append(videos[0])
        if docs:
            balanced.append(docs[0])

        remaining = [r for r in collected if r not in balanced]
        balanced.extend(remaining[: max(0, 4 - len(balanced))])

        return balanced[:4]