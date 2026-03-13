#apps/api/app/services/search/web_search_client.py

from app.schemas.search_schema import SearchResult

from urllib.parse import urlparse

from tavily import TavilyClient

from app.core.config import settings
from app.schemas.search_schema import SearchResult


class WebSearchClient:
    def __init__(self) -> None:
        if not settings.tavily_api_key:
            raise ValueError("TAVILY_API_KEY is not configured")

        self.client = TavilyClient(api_key=settings.tavily_api_key)

    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        response = self.client.search(
            query=query,
            search_depth=settings.tavily_search_depth,
            max_results=max_results,
            include_answer=False,
            include_raw_content=False,
        )

        results = response.get("results", [])
        mapped: list[SearchResult] = []

        for item in results:
            url = item.get("url", "").strip()
            title = item.get("title", "").strip()
            content = item.get("content", "").strip()

            if not url or not title:
                continue

            source = self._extract_source(url)

            mapped.append(
                SearchResult(
                    title=title,
                    url=url,
                    snippet=content,
                    source=source,
                )
            )

        return mapped

    def _extract_source(self, url: str) -> str | None:
        try:
            hostname = urlparse(url).hostname or ""
            hostname = hostname.replace("www.", "")
            return hostname or None
        except Exception:
            return None