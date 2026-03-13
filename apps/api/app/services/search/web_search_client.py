#apps/api/app/services/search/web_search_client.py

from app.schemas.search_schema import SearchResult

class WebSearchClient:
    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        # Mocked results for now.
        # Later this will call a real search provider.

        query_lower = query.lower()

        if "rag" in query_lower:
            return [
                SearchResult(
                    title="What is Retrieval-Augmented Generation (RAG)?",
                    url="https://www.pinecone.io/learn/retrieval-augmented-generation/",
                    snippet="A beginner-friendly introduction to RAG and how it works.",
                    source="Pinecone",
                ),
                SearchResult(
                    title="Retrieval Augmented Generation Explained",
                    url="https://www.youtube.com/watch?v=T-D1OfcDW1M",
                    snippet="A video introduction explaining RAG concepts visually.",
                    source="YouTube",
                ),
                SearchResult(
                    title="RAG from Scratch Tutorial",
                    url="https://huggingface.co/learn/cookbook/rag_zephyr_langchain",
                    snippet="A practical tutorial showing how RAG systems can be built.",
                    source="Hugging Face",
                ),
            ][:max_results]

        if "swift concurrency" in query_lower:
            return [
                SearchResult(
                    title="Swift Concurrency",
                    url="https://developer.apple.com/documentation/swift/swift_standard_library/concurrency",
                    snippet="Official Apple documentation for Swift concurrency concepts.",
                    source="Apple Developer",
                ),
                SearchResult(
                    title="Meet async/await in Swift",
                    url="https://www.hackingwithswift.com/books/ios-swiftui/introducing-async-await",
                    snippet="A beginner-friendly explanation of async/await in Swift.",
                    source="Hacking with Swift",
                ),
                SearchResult(
                    title="Swift Concurrency explained",
                    url="https://www.youtube.com/results?search_query=swift+concurrency+explained",
                    snippet="Video resources to understand Swift concurrency visually.",
                    source="YouTube",
                ),
            ][:max_results]

        return [
            SearchResult(
                title=f"Introduction to {query}",
                url="https://example.com/article",
                snippet=f"A beginner-friendly article about {query}.",
                source="Example",
            ),
            SearchResult(
                title=f"{query} explained",
                url="https://example.com/video",
                snippet=f"A video explanation for {query}.",
                source="Example",
            ),
            SearchResult(
                title=f"{query} practical guide",
                url="https://example.com/guide",
                snippet=f"A practical guide to understanding {query}.",
                source="Example",
            ),
        ][:max_results]