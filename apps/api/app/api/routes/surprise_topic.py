
# apps/api/app/api/routes/surprise_topic.py

from fastapi import APIRouter  # pyright: ignore[reportMissingImports]

from app.schemas.surprise_topic import SurpriseTopicRequest, SurpriseTopicResponse
from app.services.surprise_topic import get_surprise_topics

router = APIRouter(prefix="/surprise-topic", tags=["surprise-topic"])


@router.post("/", response_model=SurpriseTopicResponse)
async def create_surprise_topic(payload: SurpriseTopicRequest) -> SurpriseTopicResponse:
    topics = await get_surprise_topics(
        level=payload.level,
        exclude_topics=payload.exclude_topics,
        count=payload.count,
    )
    return SurpriseTopicResponse(topics=topics)