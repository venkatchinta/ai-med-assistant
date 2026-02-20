"""Family member schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.family import RelationshipType, Gender


class FamilyMemberCreate(BaseModel):
    """Schema for creating a family member."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: datetime
    gender: Optional[Gender] = None
    relationship_type: RelationshipType
    phone_number: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    blood_type: Optional[str] = Field(None, max_length=10)
    allergies: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None
    primary_physician: Optional[str] = Field(None, max_length=200)
    physician_phone: Optional[str] = Field(None, max_length=20)


class FamilyMemberUpdate(BaseModel):
    """Schema for updating a family member."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[datetime] = None
    gender: Optional[Gender] = None
    relationship_type: Optional[RelationshipType] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    blood_type: Optional[str] = Field(None, max_length=10)
    allergies: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None
    primary_physician: Optional[str] = Field(None, max_length=200)
    physician_phone: Optional[str] = Field(None, max_length=20)


class FamilyMemberResponse(BaseModel):
    """Schema for family member response."""
    id: int
    user_id: int
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: Optional[Gender] = None
    relationship_type: RelationshipType
    phone_number: Optional[str] = None
    email: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None
    primary_physician: Optional[str] = None
    physician_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
