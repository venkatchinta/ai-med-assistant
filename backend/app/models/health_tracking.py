"""Health tracking models for daily logs and diet entries."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class MoodLevel(str, enum.Enum):
    """Mood levels for daily tracking."""
    EXCELLENT = "excellent"
    GOOD = "good"
    OKAY = "okay"
    POOR = "poor"
    BAD = "bad"


class EnergyLevel(str, enum.Enum):
    """Energy levels for daily tracking."""
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    VERY_LOW = "very_low"


class MealType(str, enum.Enum):
    """Types of meals."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"
    SUPPLEMENT = "supplement"


class DailyHealthLog(Base):
    """Daily health tracking log."""
    __tablename__ = "daily_health_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    # Date
    log_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Vitals
    weight = Column(Float, nullable=True)  # in kg or lbs based on preference
    weight_unit = Column(String(10), default="lbs")
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)  # bpm
    temperature = Column(Float, nullable=True)  # Fahrenheit or Celsius
    temperature_unit = Column(String(10), default="F")
    blood_glucose = Column(Float, nullable=True)  # mg/dL
    oxygen_saturation = Column(Integer, nullable=True)  # SpO2 percentage
    
    # Sleep
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(Integer, nullable=True)  # 1-10 scale
    
    # Activity
    steps = Column(Integer, nullable=True)
    exercise_minutes = Column(Integer, nullable=True)
    exercise_type = Column(String(100), nullable=True)
    calories_burned = Column(Integer, nullable=True)
    
    # Hydration
    water_intake_oz = Column(Float, nullable=True)
    
    # Wellness
    mood = Column(Enum(MoodLevel), nullable=True)
    energy_level = Column(Enum(EnergyLevel), nullable=True)
    stress_level = Column(Integer, nullable=True)  # 1-10 scale
    
    # Symptoms
    symptoms = Column(Text, nullable=True)  # JSON array of symptoms
    pain_level = Column(Integer, nullable=True)  # 1-10 scale
    pain_location = Column(String(200), nullable=True)
    
    # Medication adherence
    medications_taken = Column(Text, nullable=True)  # JSON array of medication IDs taken
    medications_missed = Column(Text, nullable=True)  # JSON array of medication IDs missed
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Apple Health / External sync
    synced_from_external = Column(Boolean, default=False)
    external_source = Column(String(100), nullable=True)  # e.g., "apple_health", "fitbit"
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    family_member = relationship("FamilyMember", back_populates="health_logs")
    
    def __repr__(self):
        return f"<DailyHealthLog {self.log_date.date()}>"


class DietEntry(Base):
    """Diet and nutrition tracking."""
    __tablename__ = "diet_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    # Date and meal
    entry_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    meal_type = Column(Enum(MealType), nullable=False)
    
    # Food details
    food_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    portion_size = Column(String(100), nullable=True)
    
    # Nutrition information (optional)
    calories = Column(Integer, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    sugar_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)
    
    # Vitamins and minerals (relevant for supplement recommendations)
    vitamin_a_iu = Column(Float, nullable=True)
    vitamin_b12_mcg = Column(Float, nullable=True)
    vitamin_c_mg = Column(Float, nullable=True)
    vitamin_d_iu = Column(Float, nullable=True)
    calcium_mg = Column(Float, nullable=True)
    iron_mg = Column(Float, nullable=True)
    potassium_mg = Column(Float, nullable=True)
    magnesium_mg = Column(Float, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    family_member = relationship("FamilyMember", back_populates="diet_entries")
    
    def __repr__(self):
        return f"<DietEntry {self.food_name} - {self.meal_type}>"
