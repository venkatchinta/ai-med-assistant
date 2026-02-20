"""Appointment model for tracking medical and lab appointments."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class AppointmentType(str, enum.Enum):
    """Types of medical appointments."""
    CHECKUP = "checkup"
    FOLLOW_UP = "follow_up"
    SPECIALIST = "specialist"
    LAB_WORK = "lab_work"
    IMAGING = "imaging"
    PROCEDURE = "procedure"
    VACCINATION = "vaccination"
    DENTAL = "dental"
    VISION = "vision"
    THERAPY = "therapy"
    OTHER = "other"


class AppointmentStatus(str, enum.Enum):
    """Appointment status."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class Appointment(Base):
    """Medical appointment tracking model."""
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    # Appointment details
    title = Column(String(200), nullable=False)
    appointment_type = Column(Enum(AppointmentType), default=AppointmentType.CHECKUP)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    
    # Date and time
    appointment_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    
    # Provider information
    provider_name = Column(String(200), nullable=True)
    provider_specialty = Column(String(100), nullable=True)
    provider_phone = Column(String(20), nullable=True)
    
    # Location
    facility_name = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    room_number = Column(String(50), nullable=True)
    
    # Preparation
    preparation_instructions = Column(Text, nullable=True)  # e.g., "Fasting required"
    documents_needed = Column(Text, nullable=True)  # JSON array
    
    # Reminders
    reminder_enabled = Column(Boolean, default=True)
    reminder_days_before = Column(Integer, default=1)
    reminder_sent = Column(Boolean, default=False)
    
    # Notes
    reason_for_visit = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    post_visit_notes = Column(Text, nullable=True)
    
    # Follow-up
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    family_member = relationship("FamilyMember", back_populates="appointments")
    
    def __repr__(self):
        return f"<Appointment {self.title} on {self.appointment_date}>"
