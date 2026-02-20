"""Medication service for managing prescriptions and supplements."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import datetime

from app.models.medication import Medication
from app.models.family import FamilyMember
from app.schemas.medication import MedicationCreate, MedicationUpdate
from app.core.audit import log_audit_event, AuditEventType


class MedicationService:
    """Service class for medication operations."""
    
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
    
    async def create_medication(self, user_id: int, med_data: MedicationCreate) -> Optional[Medication]:
        """Create a new medication entry."""
        if not await self._verify_family_member_access(user_id, med_data.family_member_id):
            return None
        
        medication = Medication(
            family_member_id=med_data.family_member_id,
            name=med_data.name,
            generic_name=med_data.generic_name,
            medication_type=med_data.medication_type,
            dosage=med_data.dosage,
            dosage_form=med_data.dosage_form,
            frequency=med_data.frequency,
            frequency_details=med_data.frequency_details,
            time_of_day=med_data.time_of_day,
            with_food=med_data.with_food,
            prescribing_doctor=med_data.prescribing_doctor,
            pharmacy=med_data.pharmacy,
            prescription_number=med_data.prescription_number,
            start_date=med_data.start_date,
            end_date=med_data.end_date,
            refills_remaining=med_data.refills_remaining,
            purpose=med_data.purpose,
            side_effects=med_data.side_effects,
            notes=med_data.notes
        )
        
        self.db.add(medication)
        await self.db.flush()
        await self.db.refresh(medication)
        
        log_audit_event(
            event_type=AuditEventType.PHI_CREATE,
            user_id=user_id,
            resource_type="medication",
            resource_id=medication.id,
            action="create_medication",
            details={"family_member_id": med_data.family_member_id}
        )
        
        return medication
    
    async def get_medications(self, user_id: int, family_member_id: int, active_only: bool = False) -> List[Medication]:
        """Get all medications for a family member."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return []
        
        query = select(Medication).where(Medication.family_member_id == family_member_id)
        if active_only:
            query = query.where(Medication.is_active == True)
        
        result = await self.db.execute(query.order_by(Medication.name))
        medications = result.scalars().all()
        
        log_audit_event(
            event_type=AuditEventType.PHI_ACCESS,
            user_id=user_id,
            resource_type="medication",
            action="list_medications",
            details={"family_member_id": family_member_id, "count": len(medications)}
        )
        
        return list(medications)
    
    async def get_medication(self, user_id: int, medication_id: int) -> Optional[Medication]:
        """Get a specific medication."""
        result = await self.db.execute(
            select(Medication).where(Medication.id == medication_id)
        )
        medication = result.scalar_one_or_none()
        
        if medication:
            if not await self._verify_family_member_access(user_id, medication.family_member_id):
                return None
            
            log_audit_event(
                event_type=AuditEventType.PHI_ACCESS,
                user_id=user_id,
                resource_type="medication",
                resource_id=medication_id,
                action="view_medication"
            )
        
        return medication
    
    async def update_medication(self, user_id: int, medication_id: int, med_data: MedicationUpdate) -> Optional[Medication]:
        """Update a medication entry."""
        medication = await self.get_medication(user_id, medication_id)
        if not medication:
            return None
        
        update_data = med_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(medication, field, value)
        
        medication.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(medication)
        
        log_audit_event(
            event_type=AuditEventType.PHI_UPDATE,
            user_id=user_id,
            resource_type="medication",
            resource_id=medication_id,
            action="update_medication",
            details={"fields_updated": list(update_data.keys())}
        )
        
        return medication
    
    async def delete_medication(self, user_id: int, medication_id: int) -> bool:
        """Delete a medication entry."""
        medication = await self.get_medication(user_id, medication_id)
        if not medication:
            return False
        
        await self.db.delete(medication)
        await self.db.flush()
        
        log_audit_event(
            event_type=AuditEventType.PHI_DELETE,
            user_id=user_id,
            resource_type="medication",
            resource_id=medication_id,
            action="delete_medication"
        )
        
        return True
    
    async def get_all_family_medications(self, user_id: int) -> List[Medication]:
        """Get all medications for all family members of a user."""
        result = await self.db.execute(
            select(Medication)
            .join(FamilyMember)
            .where(FamilyMember.user_id == user_id)
            .order_by(FamilyMember.first_name, Medication.name)
        )
        return list(result.scalars().all())
