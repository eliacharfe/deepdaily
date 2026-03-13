#apps/api/app/api/routes/topics.py

from fastapi import APIRouter
from app.schemas.topic_schema import TopicRequest, TopicResponse
from app.services.topic_service import generate_topic

router = APIRouter(prefix="/topics", tags=["topics"])


@router.post("/generate", response_model=TopicResponse)
async def generate_topic_endpoint(request: TopicRequest):

    return await generate_topic(request.topic, request.level)