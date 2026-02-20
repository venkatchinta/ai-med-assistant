"""Appointment schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.appointment import AppointmentType, AppointmentStatus


class AppointmentCreate(BaseModel):
    """Schema for creating an appointment."""
    family_member_id: int
    title: str = Field(..., min_length=1, max_length=200)
    appointment_type: AppointmentType = AppointmentType.CHECKUP
    appointment_date: datetime
    duration_minutes: int = Field(default=30, ge=5, le=480)
    provider_name: Optional[str] = Field(None, max_length=200)
    provider_specialty: Optional[str] = Field(None, max_length=100)
    provider_phone: Optional[str] = Field(None, max_length=20)
    facility_name: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = None
    room_number: Optional[str] = Field(None, max_length=50)
    preparation_instructions: Optional[str] = None
    documents_needed: Optional[List[str]] = None
    reminder_enabled: bool = True
    reminder_days_before: int = Field(default=1, ge=0, le=30)
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    """Schema for updating an appointment."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    appointment_type: Optional[AppointmentType] = None
    status: Optional[AppointmentStatus] = None
    appointment_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    provider_name: Optional[str] = Field(None, max_length=200)
    provider_specialty: Optional[str] = Field(None, max_length=100)
    provider_phone: Optional[str] = Field(None, max_length=20)
    facility_name: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = None
    room_number: Optional[str] = Field(None, max_length=50)
    preparation_instructions: Optional[str] = None
    documents_needed: Optional[List[str]] = None
    reminder_enabled: Optional[bool] = None
    reminder_days_before: Optional[int] = Field(None, ge=0, le=30)
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None
    post_visit_notes: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[datetime] = None


class AppointmentResponse(BaseModel):
    """Schema for appointment response."""
    id: int
    family_member_id: int
    title: str
    appointment_type: AppointmentType
    status: AppointmentStatus
    appointment_date: datetime
    duration_minutes: int
    provider_name: Optional[str] = None
    provider_specialty: Optional[str] = None
    provider_phone: Optional[str] = None
    facility_name: Optional[str] = None
    address: Optional[str] = None
    room_number: Optional[str] = None
    preparation_instructions: Optional[str] = None
    documents_needed: Optional[List[str]] = None
    reminder_enabled: bool
    reminder_days_before: int
    reminder_sent: bool
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None
    post_visit_notes: Optional[str] = None
    follow_up_required: bool
    follow_up_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
