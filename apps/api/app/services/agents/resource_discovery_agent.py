#apps/api/app/services/agents/resource_discovery_agent.py

from app.schemas.topic_schema import LessonResource
from app.services.search.web_search_client import WebSearchClient


class ResourceDiscoveryAgent:
    def __init__(self, search_client: WebSearchClient | None = None):
        self.search_client = search_client or WebSearchClient()

    def build_queries(self, topic: str, level: str) -> list[str]:
        return [
            f"{topic} {level} tutorial",
            f"{topic} introduction article",
            f"{topic} explained video",
        ]

    def infer_resource_type(self, url: str, title: str) -> str:
        value = f"{url} {title}".lower()

        if "youtube.com" in value or "youtu.be" in value:
            return "video"
        if "docs" in value or "documentation" in value or "developer.apple.com" in value:
            return "documentation"
        return "article"

    def build_reason(self, resource_type: str, source: str | None) -> str:
        source_label = source or "a trusted source"

        if resource_type == "video":
            return f"Useful visual introduction from {source_label}"
        if resource_type == "documentation":
            return f"Helpful official reference from {source_label}"
        return f"Good learning resource from {source_label}"

    async def discover_resources(self, topic: str, level: str) -> list[LessonResource]:
        queries = self.build_queries(topic=topic, level=level)

        collected = []
        seen_urls = set()

        for query in queries:
            results = await self.search_client.search(query=query, max_results=3)

            for result in results:
                if result.url in seen_urls:
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

        return collected[:4]