"""Medication model for tracking prescriptions and supplements."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class MedicationType(str, enum.Enum):
    """Types of medications."""
    PRESCRIPTION = "prescription"
    OTC = "otc"  # Over the counter
    SUPPLEMENT = "supplement"
    VITAMIN = "vitamin"
    HERBAL = "herbal"


class FrequencyType(str, enum.Enum):
    """Medication frequency types."""
    ONCE_DAILY = "once_daily"
    TWICE_DAILY = "twice_daily"
    THREE_TIMES_DAILY = "three_times_daily"
    FOUR_TIMES_DAILY = "four_times_daily"
    WEEKLY = "weekly"
    AS_NEEDED = "as_needed"
    OTHER = "other"


class Medication(Base):
    """Medication tracking model."""
    __tablename__ = "medications"
    
    id = Column(Integer, primary_key=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    # Medication details
    name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    medication_type = Column(Enum(MedicationType), default=MedicationType.PRESCRIPTION)
    
    # Dosage information
    dosage = Column(String(100), nullable=False)  # e.g., "500mg"
    dosage_form = Column(String(50), nullable=True)  # e.g., "tablet", "capsule", "liquid"
    frequency = Column(Enum(FrequencyType), default=FrequencyType.ONCE_DAILY)
    frequency_details = Column(String(200), nullable=True)  # Additional frequency info
    
    # Timing
    time_of_day = Column(String(100), nullable=True)  # e.g., "morning", "with meals"
    with_food = Column(Boolean, default=False)
    
    # Prescription details
    prescribing_doctor = Column(String(200), nullable=True)
    pharmacy = Column(String(200), nullable=True)
    prescription_number = Column(String(100), nullable=True)
    
    # Duration
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Refill information
    refills_remaining = Column(Integer, nullable=True)
    last_refill_date = Column(DateTime, nullable=True)
    next_refill_date = Column(DateTime, nullable=True)
    
    # Purpose and notes
    purpose = Column(Text, nullable=True)  # Why taking this medication
    side_effects = Column(Text, nullable=True)  # Known side effects
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    family_member = relationship("FamilyMember", back_populates="medications")
    
    def __repr__(self):
        return f"<Medication {self.name} - {self.dosage}>"
