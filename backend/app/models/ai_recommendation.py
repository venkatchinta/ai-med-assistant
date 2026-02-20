"""AI recommendation model for storing supplement and dietary suggestions."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class RecommendationType(str, enum.Enum):
    """Types of AI recommendations."""
    SUPPLEMENT = "supplement"
    DIETARY = "dietary"
    LIFESTYLE = "lifestyle"
    MEDICATION_INTERACTION = "medication_interaction"
    LAB_FOLLOWUP = "lab_followup"
    GENERAL_HEALTH = "general_health"


class Priority(str, enum.Enum):
    """Recommendation priority levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class AIRecommendation(Base):
    """AI-generated health recommendations."""
    __tablename__ = "ai_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    # Recommendation details
    recommendation_type = Column(Enum(RecommendationType), nullable=False)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    
    # Content
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    detailed_explanation = Column(Text, nullable=True)
    
    # For supplement recommendations
    supplement_name = Column(String(200), nullable=True)
    suggested_dosage = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    
    # For dietary recommendations
    foods_to_include = Column(Text, nullable=True)  # JSON array
    foods_to_avoid = Column(Text, nullable=True)  # JSON array
    
    # Source data that triggered recommendation
    triggered_by_lab_id = Column(Integer, ForeignKey("lab_results.id"), nullable=True)
    triggered_by_medication_id = Column(Integer, ForeignKey("medications.id"), nullable=True)
    triggering_data = Column(Text, nullable=True)  # JSON with context
    
    # AI model information
    model_used = Column(String(100), nullable=True)  # e.g., "medgemma", "local-llama"
    confidence_score = Column(Float, nullable=True)  # 0-1 confidence
    
    # Status
    is_active = Column(Boolean, default=True)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    
    # User feedback
    user_rating = Column(Integer, nullable=True)  # 1-5 stars
    user_feedback = Column(Text, nullable=True)
    is_followed = Column(Boolean, nullable=True)  # Did user follow recommendation?
    
    # Medical disclaimer
    disclaimer = Column(Text, default="This is an AI-generated suggestion. Please consult with your healthcare provider before making any changes to your diet, supplements, or medications.")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # Recommendations may expire
    
    # Relationships
    family_member = relationship("FamilyMember", back_populates="ai_recommendations")
    
    def __repr__(self):
        return f"<AIRecommendation {self.title}>"
