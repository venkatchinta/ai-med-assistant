"""Lab result schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.lab_result import LabCategory, ResultStatus


class LabResultCreate(BaseModel):
    """Schema for creating a lab result entry."""
    family_member_id: int
    test_name: str = Field(..., min_length=1, max_length=200)
    test_code: Optional[str] = Field(None, max_length=50)
    category: LabCategory = LabCategory.BLOOD
    value: Optional[float] = None
    value_text: Optional[str] = Field(None, max_length=200)
    unit: Optional[str] = Field(None, max_length=50)
    reference_range_low: Optional[float] = None
    reference_range_high: Optional[float] = None
    reference_range_text: Optional[str] = Field(None, max_length=100)
    test_date: datetime
    result_date: Optional[datetime] = None
    ordering_physician: Optional[str] = Field(None, max_length=200)
    lab_name: Optional[str] = Field(None, max_length=200)
    lab_address: Optional[str] = None
    specimen_type: Optional[str] = Field(None, max_length=100)
    fasting_required: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class LabResultUpdate(BaseModel):
    """Schema for updating a lab result entry."""
    test_name: Optional[str] = Field(None, min_length=1, max_length=200)
    test_code: Optional[str] = Field(None, max_length=50)
    category: Optional[LabCategory] = None
    value: Optional[float] = None
    value_text: Optional[str] = Field(None, max_length=200)
    unit: Optional[str] = Field(None, max_length=50)
    reference_range_low: Optional[float] = None
    reference_range_high: Optional[float] = None
    reference_range_text: Optional[str] = Field(None, max_length=100)
    status: Optional[ResultStatus] = None
    test_date: Optional[datetime] = None
    result_date: Optional[datetime] = None
    ordering_physician: Optional[str] = Field(None, max_length=200)
    lab_name: Optional[str] = Field(None, max_length=200)
    lab_address: Optional[str] = None
    specimen_type: Optional[str] = Field(None, max_length=100)
    fasting_required: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class LabResultResponse(BaseModel):
    """Schema for lab result response."""
    id: int
    family_member_id: int
    test_name: str
    test_code: Optional[str] = None
    category: LabCategory
    value: Optional[float] = None
    value_text: Optional[str] = None
    unit: Optional[str] = None
    reference_range_low: Optional[float] = None
    reference_range_high: Optional[float] = None
    reference_range_text: Optional[str] = None
    status: ResultStatus
    test_date: datetime
    result_date: Optional[datetime] = None
    ordering_physician: Optional[str] = None
    lab_name: Optional[str] = None
    lab_address: Optional[str] = None
    specimen_type: Optional[str] = None
    fasting_required: Optional[str] = None
    notes: Optional[str] = None
    document_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
