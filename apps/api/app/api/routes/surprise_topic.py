
# apps/api/app/api/routes/surprise_topic.py

from fastapi import APIRouter

from app.schemas.surprise_topic import SurpriseTopicRequest, SurpriseTopicResponse
from app.services.surprise_topic import get_surprise_topic

router = APIRouter(prefix="/surprise-topic", tags=["surprise-topic"])


@router.post("/", response_model=SurpriseTopicResponse)
async def create_surprise_topic(payload: SurpriseTopicRequest) -> SurpriseTopicResponse:
    topic = await get_surprise_topic(
        level=payload.level,
        exclude_topics=payload.exclude_topics,
    )
    return SurpriseTopicResponse(topic=topic)