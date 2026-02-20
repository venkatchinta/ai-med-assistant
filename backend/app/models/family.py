"""Family member model for managing household health data."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class RelationshipType(str, enum.Enum):
    """Family relationship types."""
    SELF = "self"
    SPOUSE = "spouse"
    CHILD = "child"
    PARENT = "parent"
    SIBLING = "sibling"
    OTHER = "other"


class Gender(str, enum.Enum):
    """Gender options."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class FamilyMember(Base):
    """Family member model for tracking health data of household members."""
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Basic information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(Enum(Gender), nullable=True)
    relationship_type = Column(Enum(RelationshipType), nullable=False)
    
    # Contact information
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Medical information (encrypted for HIPAA)
    blood_type = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)  # JSON array, encrypted
    medical_conditions = Column(Text, nullable=True)  # JSON array, encrypted
    emergency_contact = Column(Text, nullable=True)  # JSON object, encrypted
    
    # Insurance information (encrypted)
    insurance_info = Column(Text, nullable=True)  # JSON object, encrypted
    
    # Primary care provider
    primary_physician = Column(String(200), nullable=True)
    physician_phone = Column(String(20), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="family_members")
    medications = relationship("Medication", back_populates="family_member", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="family_member", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="family_member", cascade="all, delete-orphan")
    health_logs = relationship("DailyHealthLog", back_populates="family_member", cascade="all, delete-orphan")
    diet_entries = relationship("DietEntry", back_populates="family_member", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="family_member", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<FamilyMember {self.first_name} {self.last_name}>"
