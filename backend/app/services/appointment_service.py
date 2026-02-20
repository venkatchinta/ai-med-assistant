"""Appointment service for managing medical appointments."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from datetime import datetime, timedelta

from app.models.appointment import Appointment, AppointmentStatus
from app.models.family import FamilyMember
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.core.audit import log_audit_event, AuditEventType


class AppointmentService:
    """Service class for appointment operations."""
    
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
    
    async def create_appointment(self, user_id: int, appt_data: AppointmentCreate) -> Optional[Appointment]:
        """Create a new appointment."""
        if not await self._verify_family_member_access(user_id, appt_data.family_member_id):
            return None
        
        appointment = Appointment(
            family_member_id=appt_data.family_member_id,
            title=appt_data.title,
            appointment_type=appt_data.appointment_type,
            appointment_date=appt_data.appointment_date,
            duration_minutes=appt_data.duration_minutes,
            provider_name=appt_data.provider_name,
            provider_specialty=appt_data.provider_specialty,
            provider_phone=appt_data.provider_phone,
            facility_name=appt_data.facility_name,
            address=appt_data.address,
            room_number=appt_data.room_number,
            preparation_instructions=appt_data.preparation_instructions,
            documents_needed=str(appt_data.documents_needed) if appt_data.documents_needed else None,
            reminder_enabled=appt_data.reminder_enabled,
            reminder_days_before=appt_data.reminder_days_before,
            reason_for_visit=appt_data.reason_for_visit,
            notes=appt_data.notes
        )
        
        self.db.add(appointment)
        await self.db.flush()
        await self.db.refresh(appointment)
        
        log_audit_event(
            event_type=AuditEventType.PHI_CREATE,
            user_id=user_id,
            resource_type="appointment",
            resource_id=appointment.id,
            action="create_appointment",
            details={"family_member_id": appt_data.family_member_id}
        )
        
        return appointment
    
    async def get_appointments(
        self, user_id: int, family_member_id: int,
        upcoming_only: bool = False,
        status: Optional[AppointmentStatus] = None
    ) -> List[Appointment]:
        """Get all appointments for a family member."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return []
        
        query = select(Appointment).where(Appointment.family_member_id == family_member_id)
        
        if upcoming_only:
            query = query.where(Appointment.appointment_date >= datetime.utcnow())
        if status:
            query = query.where(Appointment.status == status)
        
        result = await self.db.execute(query.order_by(Appointment.appointment_date))
        appointments = result.scalars().all()
        
        log_audit_event(
            event_type=AuditEventType.PHI_ACCESS,
            user_id=user_id,
            resource_type="appointment",
            action="list_appointments",
            details={"family_member_id": family_member_id, "count": len(appointments)}
        )
        
        return list(appointments)
    
    async def get_appointment(self, user_id: int, appointment_id: int) -> Optional[Appointment]:
        """Get a specific appointment."""
        result = await self.db.execute(
            select(Appointment).where(Appointment.id == appointment_id)
        )
        appointment = result.scalar_one_or_none()
        
        if appointment:
            if not await self._verify_family_member_access(user_id, appointment.family_member_id):
                return None
            
            log_audit_event(
                event_type=AuditEventType.PHI_ACCESS,
                user_id=user_id,
                resource_type="appointment",
                resource_id=appointment_id,
                action="view_appointment"
            )
        
        return appointment
    
    async def update_appointment(self, user_id: int, appointment_id: int, appt_data: AppointmentUpdate) -> Optional[Appointment]:
        """Update an appointment."""
        appointment = await self.get_appointment(user_id, appointment_id)
        if not appointment:
            return None
        
        update_data = appt_data.model_dump(exclude_unset=True)
        
        if "documents_needed" in update_data and update_data["documents_needed"] is not None:
            update_data["documents_needed"] = str(update_data["documents_needed"])
        
        for field, value in update_data.items():
            setattr(appointment, field, value)
        
        appointment.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(appointment)
        
        log_audit_event(
            event_type=AuditEventType.PHI_UPDATE,
            user_id=user_id,
            resource_type="appointment",
            resource_id=appointment_id,
            action="update_appointment",
            details={"fields_updated": list(update_data.keys())}
        )
        
        return appointment
    
    async def delete_appointment(self, user_id: int, appointment_id: int) -> bool:
        """Delete an appointment."""
        appointment = await self.get_appointment(user_id, appointment_id)
        if not appointment:
            return False
        
        await self.db.delete(appointment)
        await self.db.flush()
        
        log_audit_event(
            event_type=AuditEventType.PHI_DELETE,
            user_id=user_id,
            resource_type="appointment",
            resource_id=appointment_id,
            action="delete_appointment"
        )
        
        return True
    
    async def get_all_family_appointments(
        self, user_id: int, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Appointment]:
        """Get all appointments for all family members (calendar view)."""
        query = (
            select(Appointment)
            .join(FamilyMember)
            .where(FamilyMember.user_id == user_id)
        )
        
        if start_date:
            query = query.where(Appointment.appointment_date >= start_date)
        if end_date:
            query = query.where(Appointment.appointment_date <= end_date)
        
        result = await self.db.execute(query.order_by(Appointment.appointment_date))
        
        log_audit_event(
            event_type=AuditEventType.PHI_ACCESS,
            user_id=user_id,
            resource_type="appointment",
            action="list_all_family_appointments"
        )
        
        return list(result.scalars().all())
    
    async def get_upcoming_reminders(self, user_id: int) -> List[Appointment]:
        """Get appointments that need reminders sent."""
        now = datetime.utcnow()
        
        result = await self.db.execute(
            select(Appointment)
            .join(FamilyMember)
            .where(
                FamilyMember.user_id == user_id,
                Appointment.reminder_enabled == True,
                Appointment.reminder_sent == False,
                Appointment.status == AppointmentStatus.SCHEDULED,
                Appointment.appointment_date >= now
            )
        )
        
        appointments = result.scalars().all()
        reminders_due = []
        
        for appt in appointments:
            reminder_date = appt.appointment_date - timedelta(days=appt.reminder_days_before)
            if now >= reminder_date:
                reminders_due.append(appt)
        
        return reminders_due
