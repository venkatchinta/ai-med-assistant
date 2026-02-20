"""AI recommendation routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import base64

from app.core.database import get_db
from app.schemas.ai_recommendation import (
    AIRecommendationResponse, 
    RecommendationFeedback,
    GenerateRecommendationsRequest
)
from app.services.ai_agent_service import AIAgentService
from app.api.deps import get_current_user
from app.models.user import User


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    image_data: Optional[str] = None  # base64 encoded image


class ChatRequest(BaseModel):
    family_member_id: int
    message: str
    image_data: Optional[str] = None  # base64 encoded image
    conversation_history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    response: str
    model_used: str
    has_image_analysis: bool = False

router = APIRouter(prefix="/ai-recommendations", tags=["AI Recommendations"])


@router.post("/generate", response_model=List[AIRecommendationResponse])
async def generate_recommendations(
    request: GenerateRecommendationsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate AI recommendations based on patient data."""
    ai_service = AIAgentService(db)
    recommendations = await ai_service.generate_recommendations(
        current_user.id,
        request.family_member_id,
        include_supplements=request.include_supplements,
        include_dietary=request.include_dietary,
        focus_areas=request.focus_areas
    )
    
    return recommendations


@router.get("/family/{family_member_id}", response_model=List[AIRecommendationResponse])
async def get_recommendations(
    family_member_id: int,
    active_only: bool = Query(True, description="Filter to active recommendations only"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get existing recommendations for a family member."""
    ai_service = AIAgentService(db)
    recommendations = await ai_service.get_recommendations(
        current_user.id, family_member_id, active_only
    )
    return recommendations


@router.post("/{recommendation_id}/acknowledge", response_model=AIRecommendationResponse)
async def acknowledge_recommendation(
    recommendation_id: int,
    feedback: RecommendationFeedback,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Acknowledge a recommendation and provide feedback."""
    ai_service = AIAgentService(db)
    recommendation = await ai_service.acknowledge_recommendation(
        current_user.id,
        recommendation_id,
        rating=feedback.user_rating,
        feedback=feedback.user_feedback,
        is_followed=feedback.is_followed
    )
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found"
        )
    
    return recommendation


@router.post("/{recommendation_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Dismiss/deactivate a recommendation."""
    ai_service = AIAgentService(db)
    dismissed = await ai_service.dismiss_recommendation(current_user.id, recommendation_id)
    
    if not dismissed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found"
        )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Interactive chat with MedGemma AI, supports text and image analysis."""
    ai_service = AIAgentService(db)
    
    result = await ai_service.chat(
        user_id=current_user.id,
        family_member_id=request.family_member_id,
        message=request.message,
        image_data=request.image_data,
        conversation_history=request.conversation_history
    )
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
    
    return ChatResponse(
        response=result.get("response", ""),
        model_used=result.get("model", "unknown"),
        has_image_analysis=result.get("has_image_analysis", False)
    )


@router.post("/chat/upload")
async def chat_with_image_upload(
    family_member_id: int = Form(...),
    message: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Chat endpoint with file upload support for X-rays, lab results, etc."""
    try:
        image_data = None
        
        if image:
            contents = await image.read()
            image_data = base64.b64encode(contents).decode('utf-8')
        
        ai_service = AIAgentService(db)
        
        result = await ai_service.chat(
            user_id=current_user.id,
            family_member_id=family_member_id,
            message=message,
            image_data=image_data,
            conversation_history=None
        )
        
        if "error" in result:
            # Return error as response instead of raising exception
            return ChatResponse(
                response=f"Error: {result['error']}",
                model_used="error",
                has_image_analysis=False
            )
        
        return ChatResponse(
            response=result.get("response", ""),
            model_used=result.get("model", "unknown"),
            has_image_analysis=image_data is not None
        )
    except Exception as e:
        return ChatResponse(
            response=f"Error: {str(e)}",
            model_used="error",
            has_image_analysis=False
        )
