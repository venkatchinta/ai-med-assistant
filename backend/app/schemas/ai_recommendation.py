"""AI recommendation schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.ai_recommendation import RecommendationType, Priority


class AIRecommendationResponse(BaseModel):
    """Schema for AI recommendation response."""
    id: int
    family_member_id: int
    recommendation_type: RecommendationType
    priority: Priority
    title: str
    description: str
    detailed_explanation: Optional[str] = None
    supplement_name: Optional[str] = None
    suggested_dosage: Optional[str] = None
    frequency: Optional[str] = None
    foods_to_include: Optional[List[str]] = None
    foods_to_avoid: Optional[List[str]] = None
    triggered_by_lab_id: Optional[int] = None
    triggered_by_medication_id: Optional[int] = None
    model_used: Optional[str] = None
    confidence_score: Optional[float] = None
    is_active: bool
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    user_rating: Optional[int] = None
    user_feedback: Optional[str] = None
    is_followed: Optional[bool] = None
    disclaimer: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RecommendationFeedback(BaseModel):
    """Schema for user feedback on recommendations."""
    user_rating: Optional[int] = Field(None, ge=1, le=5)
    user_feedback: Optional[str] = None
    is_followed: Optional[bool] = None
    is_acknowledged: bool = True


class GenerateRecommendationsRequest(BaseModel):
    """Schema for requesting AI recommendations."""
    family_member_id: int
    include_supplements: bool = True
    include_dietary: bool = True
    include_lifestyle: bool = True
    focus_areas: Optional[List[str]] = None  # e.g., ["vitamin_deficiency", "heart_health"]
