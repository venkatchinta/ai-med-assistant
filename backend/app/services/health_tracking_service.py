"""Health tracking service for daily logs and diet entries."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from datetime import datetime, date
import json

from app.models.health_tracking import DailyHealthLog, DietEntry
from app.models.family import FamilyMember
from app.schemas.health_tracking import (
    DailyHealthLogCreate, DailyHealthLogUpdate,
    DietEntryCreate, DietEntryUpdate
)
from app.core.audit import log_audit_event, AuditEventType


class HealthTrackingService:
    """Service class for health tracking operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def _verify_family_member_access(self, user_id: int, family_member_id: int) -> bool:
        """Verify user has access to the family member."""
        result = await self.db.execute(
            select(FamilyMember).where(
                FamilyMember.id == family_member_id,
                FamilyMember.user_id == user_id
            )
        )
        return result.scalar_one_or_none() is not None
    
    # Daily Health Log Methods
    async def create_health_log(self, user_id: int, log_data: DailyHealthLogCreate) -> Optional[DailyHealthLog]:
        """Create a new daily health log."""
        if not await self._verify_family_member_access(user_id, log_data.family_member_id):
            return None
        
        health_log = DailyHealthLog(
            family_member_id=log_data.family_member_id,
            log_date=log_data.log_date,
            weight=log_data.weight,
            weight_unit=log_data.weight_unit,
            blood_pressure_systolic=log_data.blood_pressure_systolic,
            blood_pressure_diastolic=log_data.blood_pressure_diastolic,
            heart_rate=log_data.heart_rate,
            temperature=log_data.temperature,
            temperature_unit=log_data.temperature_unit,
            blood_glucose=log_data.blood_glucose,
            oxygen_saturation=log_data.oxygen_saturation,
            sleep_hours=log_data.sleep_hours,
            sleep_quality=log_data.sleep_quality,
            steps=log_data.steps,
            exercise_minutes=log_data.exercise_minutes,
            exercise_type=log_data.exercise_type,
            calories_burned=log_data.calories_burned,
            water_intake_oz=log_data.water_intake_oz,
            mood=log_data.mood,
            energy_level=log_data.energy_level,
            stress_level=log_data.stress_level,
            symptoms=json.dumps(log_data.symptoms) if log_data.symptoms else None,
            pain_level=log_data.pain_level,
            pain_location=log_data.pain_location,
            medications_taken=json.dumps(log_data.medications_taken) if log_data.medications_taken else None,
            medications_missed=json.dumps(log_data.medications_missed) if log_data.medications_missed else None,
            notes=log_data.notes
        )
        
        self.db.add(health_log)
        await self.db.flush()
        await self.db.refresh(health_log)
        
        log_audit_event(
            event_type=AuditEventType.PHI_CREATE,
            user_id=user_id,
            resource_type="health_log",
            resource_id=health_log.id,
            action="create_health_log"
        )
        
        return health_log
    
    async def get_health_logs(
        self, user_id: int, family_member_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[DailyHealthLog]:
        """Get health logs for a family member."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return []
        
        query = select(DailyHealthLog).where(DailyHealthLog.family_member_id == family_member_id)
        
        if start_date:
            query = query.where(DailyHealthLog.log_date >= start_date)
        if end_date:
            query = query.where(DailyHealthLog.log_date <= end_date)
        
        result = await self.db.execute(query.order_by(DailyHealthLog.log_date.desc()))
        
        log_audit_event(
            event_type=AuditEventType.PHI_ACCESS,
            user_id=user_id,
            resource_type="health_log",
            action="list_health_logs",
            details={"family_member_id": family_member_id}
        )
        
        return list(result.scalars().all())
    
    async def get_health_log(self, user_id: int, log_id: int) -> Optional[DailyHealthLog]:
        """Get a specific health log."""
        result = await self.db.execute(
            select(DailyHealthLog).where(DailyHealthLog.id == log_id)
        )
        health_log = result.scalar_one_or_none()
        
        if health_log:
            if not await self._verify_family_member_access(user_id, health_log.family_member_id):
                return None
        
        return health_log
    
    async def update_health_log(self, user_id: int, log_id: int, log_data: DailyHealthLogUpdate) -> Optional[DailyHealthLog]:
        """Update a health log."""
        health_log = await self.get_health_log(user_id, log_id)
        if not health_log:
            return None
        
        update_data = log_data.model_dump(exclude_unset=True)
        
        # Handle JSON fields
        if "symptoms" in update_data and update_data["symptoms"] is not None:
            update_data["symptoms"] = json.dumps(update_data["symptoms"])
        if "medications_taken" in update_data and update_data["medications_taken"] is not None:
            update_data["medications_taken"] = json.dumps(update_data["medications_taken"])
        if "medications_missed" in update_data and update_data["medications_missed"] is not None:
            update_data["medications_missed"] = json.dumps(update_data["medications_missed"])
        
        for field, value in update_data.items():
            setattr(health_log, field, value)
        
        health_log.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(health_log)
        
        log_audit_event(
            event_type=AuditEventType.PHI_UPDATE,
            user_id=user_id,
            resource_type="health_log",
            resource_id=log_id,
            action="update_health_log"
        )
        
        return health_log
    
    async def get_today_log(self, user_id: int, family_member_id: int) -> Optional[DailyHealthLog]:
        """Get today's health log for a family member."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return None
        
        today = datetime.utcnow().date()
        result = await self.db.execute(
            select(DailyHealthLog).where(
                DailyHealthLog.family_member_id == family_member_id,
                DailyHealthLog.log_date >= datetime.combine(today, datetime.min.time()),
                DailyHealthLog.log_date < datetime.combine(today, datetime.max.time())
            )
        )
        return result.scalar_one_or_none()
    
    # Diet Entry Methods
    async def create_diet_entry(self, user_id: int, diet_data: DietEntryCreate) -> Optional[DietEntry]:
        """Create a new diet entry."""
        if not await self._verify_family_member_access(user_id, diet_data.family_member_id):
            return None
        
        diet_entry = DietEntry(
            family_member_id=diet_data.family_member_id,
            entry_date=diet_data.entry_date,
            meal_type=diet_data.meal_type,
            food_name=diet_data.food_name,
            description=diet_data.description,
            portion_size=diet_data.portion_size,
            calories=diet_data.calories,
            protein_g=diet_data.protein_g,
            carbs_g=diet_data.carbs_g,
            fat_g=diet_data.fat_g,
            fiber_g=diet_data.fiber_g,
            sugar_g=diet_data.sugar_g,
            sodium_mg=diet_data.sodium_mg,
            vitamin_b12_mcg=diet_data.vitamin_b12_mcg,
            vitamin_d_iu=diet_data.vitamin_d_iu,
            iron_mg=diet_data.iron_mg,
            calcium_mg=diet_data.calcium_mg,
            notes=diet_data.notes
        )
        
        self.db.add(diet_entry)
        await self.db.flush()
        await self.db.refresh(diet_entry)
        
        log_audit_event(
            event_type=AuditEventType.PHI_CREATE,
            user_id=user_id,
            resource_type="diet_entry",
            resource_id=diet_entry.id,
            action="create_diet_entry"
        )
        
        return diet_entry
    
    async def get_diet_entries(
        self, user_id: int, family_member_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[DietEntry]:
        """Get diet entries for a family member."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return []
        
        query = select(DietEntry).where(DietEntry.family_member_id == family_member_id)
        
        if start_date:
            query = query.where(DietEntry.entry_date >= start_date)
        if end_date:
            query = query.where(DietEntry.entry_date <= end_date)
        
        result = await self.db.execute(query.order_by(DietEntry.entry_date.desc()))
        
        return list(result.scalars().all())
    
    async def get_diet_entry(self, user_id: int, entry_id: int) -> Optional[DietEntry]:
        """Get a specific diet entry."""
        result = await self.db.execute(
            select(DietEntry).where(DietEntry.id == entry_id)
        )
        diet_entry = result.scalar_one_or_none()
        
        if diet_entry:
            if not await self._verify_family_member_access(user_id, diet_entry.family_member_id):
                return None
        
        return diet_entry
    
    async def update_diet_entry(self, user_id: int, entry_id: int, diet_data: DietEntryUpdate) -> Optional[DietEntry]:
        """Update a diet entry."""
        diet_entry = await self.get_diet_entry(user_id, entry_id)
        if not diet_entry:
            return None
        
        update_data = diet_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(diet_entry, field, value)
        
        diet_entry.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(diet_entry)
        
        return diet_entry
    
    async def delete_diet_entry(self, user_id: int, entry_id: int) -> bool:
        """Delete a diet entry."""
        diet_entry = await self.get_diet_entry(user_id, entry_id)
        if not diet_entry:
            return False
        
        await self.db.delete(diet_entry)
        await self.db.flush()
        
        return True
    
    async def get_daily_nutrition_summary(self, user_id: int, family_member_id: int, target_date: date) -> dict:
        """Get nutrition summary for a specific day."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return {}
        
        start = datetime.combine(target_date, datetime.min.time())
        end = datetime.combine(target_date, datetime.max.time())
        
        result = await self.db.execute(
            select(DietEntry).where(
                DietEntry.family_member_id == family_member_id,
                DietEntry.entry_date >= start,
                DietEntry.entry_date <= end
            )
        )
        
        entries = result.scalars().all()
        
        summary = {
            "total_calories": 0,
            "total_protein_g": 0,
            "total_carbs_g": 0,
            "total_fat_g": 0,
            "total_fiber_g": 0,
            "total_vitamin_b12_mcg": 0,
            "total_vitamin_d_iu": 0,
            "total_iron_mg": 0,
            "total_calcium_mg": 0,
            "meals_logged": len(entries)
        }
        
        for entry in entries:
            if entry.calories:
                summary["total_calories"] += entry.calories
            if entry.protein_g:
                summary["total_protein_g"] += entry.protein_g
            if entry.carbs_g:
                summary["total_carbs_g"] += entry.carbs_g
            if entry.fat_g:
                summary["total_fat_g"] += entry.fat_g
            if entry.fiber_g:
                summary["total_fiber_g"] += entry.fiber_g
            if entry.vitamin_b12_mcg:
                summary["total_vitamin_b12_mcg"] += entry.vitamin_b12_mcg
            if entry.vitamin_d_iu:
                summary["total_vitamin_d_iu"] += entry.vitamin_d_iu
            if entry.iron_mg:
                summary["total_iron_mg"] += entry.iron_mg
            if entry.calcium_mg:
                summary["total_calcium_mg"] += entry.calcium_mg
        
        return summary
