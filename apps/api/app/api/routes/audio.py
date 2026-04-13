
# apps/api/app/api/routes/audio.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.schemas.audio import SectionAudioRequest
from app.services.tts_service import generate_section_audio
from app.dependencies.auth import get_current_user  # ✅ FIXED


router = APIRouter(prefix="/audio", tags=["audio"])


@router.post("/section")
async def create_section_audio(
    payload: SectionAudioRequest,
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")  # ✅ match your existing pattern

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    try:
        audio_bytes = await generate_section_audio(
            title=payload.title,
            content=payload.content,
            language=payload.language,
        )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "private, max-age=3600",
                "Content-Disposition": 'inline; filename="section-audio.mp3"',
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate audio: {exc}",
        )