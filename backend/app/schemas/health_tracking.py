"""Health tracking schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.health_tracking import MoodLevel, EnergyLevel, MealType


class DailyHealthLogCreate(BaseModel):
    """Schema for creating a daily health log."""
    family_member_id: int
    log_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Vitals
    weight: Optional[float] = Field(None, gt=0)
    weight_unit: str = "lbs"
    blood_pressure_systolic: Optional[int] = Field(None, ge=60, le=250)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=150)
    heart_rate: Optional[int] = Field(None, ge=30, le=250)
    temperature: Optional[float] = Field(None, ge=90, le=110)
    temperature_unit: str = "F"
    blood_glucose: Optional[float] = Field(None, ge=20, le=600)
    oxygen_saturation: Optional[int] = Field(None, ge=70, le=100)
    
    # Sleep
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    
    # Activity
    steps: Optional[int] = Field(None, ge=0)
    exercise_minutes: Optional[int] = Field(None, ge=0)
    exercise_type: Optional[str] = Field(None, max_length=100)
    calories_burned: Optional[int] = Field(None, ge=0)
    
    # Hydration
    water_intake_oz: Optional[float] = Field(None, ge=0)
    
    # Wellness
    mood: Optional[MoodLevel] = None
    energy_level: Optional[EnergyLevel] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    
    # Symptoms
    symptoms: Optional[List[str]] = None
    pain_level: Optional[int] = Field(None, ge=1, le=10)
    pain_location: Optional[str] = Field(None, max_length=200)
    
    # Medication adherence
    medications_taken: Optional[List[int]] = None
    medications_missed: Optional[List[int]] = None
    
    # Notes
    notes: Optional[str] = None


class DailyHealthLogUpdate(BaseModel):
    """Schema for updating a daily health log."""
    weight: Optional[float] = Field(None, gt=0)
    weight_unit: Optional[str] = None
    blood_pressure_systolic: Optional[int] = Field(None, ge=60, le=250)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=150)
    heart_rate: Optional[int] = Field(None, ge=30, le=250)
    temperature: Optional[float] = Field(None, ge=90, le=110)
    temperature_unit: Optional[str] = None
    blood_glucose: Optional[float] = Field(None, ge=20, le=600)
    oxygen_saturation: Optional[int] = Field(None, ge=70, le=100)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    steps: Optional[int] = Field(None, ge=0)
    exercise_minutes: Optional[int] = Field(None, ge=0)
    exercise_type: Optional[str] = Field(None, max_length=100)
    calories_burned: Optional[int] = Field(None, ge=0)
    water_intake_oz: Optional[float] = Field(None, ge=0)
    mood: Optional[MoodLevel] = None
    energy_level: Optional[EnergyLevel] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    symptoms: Optional[List[str]] = None
    pain_level: Optional[int] = Field(None, ge=1, le=10)
    pain_location: Optional[str] = Field(None, max_length=200)
    medications_taken: Optional[List[int]] = None
    medications_missed: Optional[List[int]] = None
    notes: Optional[str] = None


class DailyHealthLogResponse(BaseModel):
    """Schema for daily health log response."""
    id: int
    family_member_id: int
    log_date: datetime
    weight: Optional[float] = None
    weight_unit: str
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    temperature_unit: str
    blood_glucose: Optional[float] = None
    oxygen_saturation: Optional[int] = None
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    steps: Optional[int] = None
    exercise_minutes: Optional[int] = None
    exercise_type: Optional[str] = None
    calories_burned: Optional[int] = None
    water_intake_oz: Optional[float] = None
    mood: Optional[MoodLevel] = None
    energy_level: Optional[EnergyLevel] = None
    stress_level: Optional[int] = None
    symptoms: Optional[List[str]] = None
    pain_level: Optional[int] = None
    pain_location: Optional[str] = None
    medications_taken: Optional[List[int]] = None
    medications_missed: Optional[List[int]] = None
    notes: Optional[str] = None
    synced_from_external: bool
    external_source: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DietEntryCreate(BaseModel):
    """Schema for creating a diet entry."""
    family_member_id: int
    entry_date: datetime = Field(default_factory=datetime.utcnow)
    meal_type: MealType
    food_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    portion_size: Optional[str] = Field(None, max_length=100)
    calories: Optional[int] = Field(None, ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sugar_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)
    vitamin_b12_mcg: Optional[float] = Field(None, ge=0)
    vitamin_d_iu: Optional[float] = Field(None, ge=0)
    iron_mg: Optional[float] = Field(None, ge=0)
    calcium_mg: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class DietEntryUpdate(BaseModel):
    """Schema for updating a diet entry."""
    meal_type: Optional[MealType] = None
    food_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    portion_size: Optional[str] = Field(None, max_length=100)
    calories: Optional[int] = Field(None, ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sugar_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)
    vitamin_b12_mcg: Optional[float] = Field(None, ge=0)
    vitamin_d_iu: Optional[float] = Field(None, ge=0)
    iron_mg: Optional[float] = Field(None, ge=0)
    calcium_mg: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class DietEntryResponse(BaseModel):
    """Schema for diet entry response."""
    id: int
    family_member_id: int
    entry_date: datetime
    meal_type: MealType
    food_name: str
    description: Optional[str] = None
    portion_size: Optional[str] = None
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    vitamin_b12_mcg: Optional[float] = None
    vitamin_d_iu: Optional[float] = None
    iron_mg: Optional[float] = None
    calcium_mg: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
