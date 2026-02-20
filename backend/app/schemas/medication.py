"""Medication schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.medication import MedicationType, FrequencyType


class MedicationCreate(BaseModel):
    """Schema for creating a medication entry."""
    family_member_id: int
    name: str = Field(..., min_length=1, max_length=200)
    generic_name: Optional[str] = Field(None, max_length=200)
    medication_type: MedicationType = MedicationType.PRESCRIPTION
    dosage: str = Field(..., min_length=1, max_length=100)
    dosage_form: Optional[str] = Field(None, max_length=50)
    frequency: FrequencyType = FrequencyType.ONCE_DAILY
    frequency_details: Optional[str] = Field(None, max_length=200)
    time_of_day: Optional[str] = Field(None, max_length=100)
    with_food: bool = False
    prescribing_doctor: Optional[str] = Field(None, max_length=200)
    pharmacy: Optional[str] = Field(None, max_length=200)
    prescription_number: Optional[str] = Field(None, max_length=100)
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    refills_remaining: Optional[int] = None
    purpose: Optional[str] = None
    side_effects: Optional[str] = None
    notes: Optional[str] = None


class MedicationUpdate(BaseModel):
    """Schema for updating a medication entry."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    generic_name: Optional[str] = Field(None, max_length=200)
    medication_type: Optional[MedicationType] = None
    dosage: Optional[str] = Field(None, min_length=1, max_length=100)
    dosage_form: Optional[str] = Field(None, max_length=50)
    frequency: Optional[FrequencyType] = None
    frequency_details: Optional[str] = Field(None, max_length=200)
    time_of_day: Optional[str] = Field(None, max_length=100)
    with_food: Optional[bool] = None
    prescribing_doctor: Optional[str] = Field(None, max_length=200)
    pharmacy: Optional[str] = Field(None, max_length=200)
    prescription_number: Optional[str] = Field(None, max_length=100)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    refills_remaining: Optional[int] = None
    last_refill_date: Optional[datetime] = None
    next_refill_date: Optional[datetime] = None
    purpose: Optional[str] = None
    side_effects: Optional[str] = None
    notes: Optional[str] = None


class MedicationResponse(BaseModel):
    """Schema for medication response."""
    id: int
    family_member_id: int
    name: str
    generic_name: Optional[str] = None
    medication_type: MedicationType
    dosage: str
    dosage_form: Optional[str] = None
    frequency: FrequencyType
    frequency_details: Optional[str] = None
    time_of_day: Optional[str] = None
    with_food: bool
    prescribing_doctor: Optional[str] = None
    pharmacy: Optional[str] = None
    prescription_number: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    refills_remaining: Optional[int] = None
    last_refill_date: Optional[datetime] = None
    next_refill_date: Optional[datetime] = None
    purpose: Optional[str] = None
    side_effects: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
