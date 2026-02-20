"""Family member service for managing household health data."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime
import json

from app.models.family import FamilyMember
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate
from app.core.config import settings
from app.core.security import phi_encryption
from app.core.audit import log_audit_event, AuditEventType


class FamilyService:
    """Service class for family member operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_family_member_count(self, user_id: int) -> int:
        """Get count of family members for a user."""
        result = await self.db.execute(
            select(func.count(FamilyMember.id)).where(FamilyMember.user_id == user_id)
        )
        return result.scalar() or 0
    
    async def create_family_member(self, user_id: int, member_data: FamilyMemberCreate) -> Optional[FamilyMember]:
        """Create a new family member."""
        # Check family member limit
        current_count = await self.get_family_member_count(user_id)
        if current_count >= settings.MAX_FAMILY_MEMBERS:
            return None
        
        # Encrypt sensitive PHI data
        allergies_encrypted = None
        if member_data.allergies:
            allergies_encrypted = phi_encryption.encrypt(json.dumps(member_data.allergies))
        
        conditions_encrypted = None
        if member_data.medical_conditions:
            conditions_encrypted = phi_encryption.encrypt(json.dumps(member_data.medical_conditions))
        
        member = FamilyMember(
            user_id=user_id,
            first_name=member_data.first_name,
            last_name=member_data.last_name,
            date_of_birth=member_data.date_of_birth,
            gender=member_data.gender,
            relationship_type=member_data.relationship_type,
            phone_number=member_data.phone_number,
            email=member_data.email,
            blood_type=member_data.blood_type,
            allergies=allergies_encrypted,
            medical_conditions=conditions_encrypted,
            primary_physician=member_data.primary_physician,
            physician_phone=member_data.physician_phone
        )
        
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        
        log_audit_event(
            event_type=AuditEventType.PHI_CREATE,
            user_id=user_id,
            resource_type="family_member",
            resource_id=member.id,
            action="create_family_member"
        )
        
        return member
    
    async def get_family_members(self, user_id: int) -> List[FamilyMember]:
        """Get all family members for a user."""
        result = await self.db.execute(
            select(FamilyMember).where(FamilyMember.user_id == user_id)
        )
        members = result.scalars().all()
        
        log_audit_event(
            event_type=AuditEventType.PHI_ACCESS,
            user_id=user_id,
            resource_type="family_member",
            action="list_family_members",
            details={"count": len(members)}
        )
        
        return list(members)
    
    async def get_family_member(self, user_id: int, member_id: int) -> Optional[FamilyMember]:
        """Get a specific family member."""
        result = await self.db.execute(
            select(FamilyMember).where(
                FamilyMember.id == member_id,
                FamilyMember.user_id == user_id
            )
        )
        member = result.scalar_one_or_none()
        
        if member:
            log_audit_event(
                event_type=AuditEventType.PHI_ACCESS,
                user_id=user_id,
                resource_type="family_member",
                resource_id=member_id,
                action="view_family_member"
            )
        
        return member
    
    async def update_family_member(
        self, user_id: int, member_id: int, member_data: FamilyMemberUpdate
    ) -> Optional[FamilyMember]:
        """Update a family member."""
        member = await self.get_family_member(user_id, member_id)
        if not member:
            return None
        
        update_data = member_data.model_dump(exclude_unset=True)
        
        # Handle encrypted fields
        if "allergies" in update_data and update_data["allergies"] is not None:
            update_data["allergies"] = phi_encryption.encrypt(json.dumps(update_data["allergies"]))
        
        if "medical_conditions" in update_data and update_data["medical_conditions"] is not None:
            update_data["medical_conditions"] = phi_encryption.encrypt(json.dumps(update_data["medical_conditions"]))
        
        for field, value in update_data.items():
            setattr(member, field, value)
        
        member.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(member)
        
        log_audit_event(
            event_type=AuditEventType.PHI_UPDATE,
            user_id=user_id,
            resource_type="family_member",
            resource_id=member_id,
            action="update_family_member",
            details={"fields_updated": list(update_data.keys())}
        )
        
        return member
    
    async def delete_family_member(self, user_id: int, member_id: int) -> bool:
        """Delete a family member."""
        member = await self.get_family_member(user_id, member_id)
        if not member:
            return False
        
        await self.db.delete(member)
        await self.db.flush()
        
        log_audit_event(
            event_type=AuditEventType.PHI_DELETE,
            user_id=user_id,
            resource_type="family_member",
            resource_id=member_id,
            action="delete_family_member"
        )
        
        return True
    
    def decrypt_member_data(self, member: FamilyMember) -> dict:
        """Decrypt sensitive member data for response."""
        allergies = None
        if member.allergies:
            try:
                decrypted = phi_encryption.decrypt(member.allergies)
                allergies = json.loads(decrypted)
            except:
                allergies = []
        
        conditions = None
        if member.medical_conditions:
            try:
                decrypted = phi_encryption.decrypt(member.medical_conditions)
                conditions = json.loads(decrypted)
            except:
                conditions = []
        
        return {
            "allergies": allergies,
            "medical_conditions": conditions
        }
