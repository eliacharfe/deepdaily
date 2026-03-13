#apps/api/app/api/routes/topics.py

from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.schemas.topic_schema import TopicRequest, TopicResponse
from app.services.topic_service import generate_topic

router = APIRouter(prefix="/topics", tags=["topics"])


@router.post("/generate", response_model=TopicResponse)
async def generate_topic_endpoint(
    request: TopicRequest,
    current_user=Depends(get_current_user),
):
    return await generate_topic(request.topic, request.level)