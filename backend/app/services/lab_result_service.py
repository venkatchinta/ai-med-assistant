"""Lab result service for managing medical test results."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import datetime

from app.models.lab_result import LabResult, ResultStatus
from app.models.family import FamilyMember
from app.schemas.lab_result import LabResultCreate, LabResultUpdate
from app.core.audit import log_audit_event, AuditEventType


class LabResultService:
    """Service class for lab result operations."""
    
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
    
    async def create_lab_result(self, user_id: int, lab_data: LabResultCreate) -> Optional[LabResult]:
        """Create a new lab result entry."""
        if not await self._verify_family_member_access(user_id, lab_data.family_member_id):
            return None
        
        lab_result = LabResult(
            family_member_id=lab_data.family_member_id,
            test_name=lab_data.test_name,
            test_code=lab_data.test_code,
            category=lab_data.category,
            value=lab_data.value,
            value_text=lab_data.value_text,
            unit=lab_data.unit,
            reference_range_low=lab_data.reference_range_low,
            reference_range_high=lab_data.reference_range_high,
            reference_range_text=lab_data.reference_range_text,
            test_date=lab_data.test_date,
            result_date=lab_data.result_date,
            ordering_physician=lab_data.ordering_physician,
            lab_name=lab_data.lab_name,
            lab_address=lab_data.lab_address,
            specimen_type=lab_data.specimen_type,
            fasting_required=lab_data.fasting_required,
            notes=lab_data.notes
        )
        
        # Auto-determine status based on value and reference range
        lab_result.status = lab_result.determine_status()
        
        self.db.add(lab_result)
        await self.db.flush()
        await self.db.refresh(lab_result)
        
        log_audit_event(
            event_type=AuditEventType.PHI_CREATE,
            user_id=user_id,
            resource_type="lab_result",
            resource_id=lab_result.id,
            action="create_lab_result",
            details={"family_member_id": lab_data.family_member_id, "test_name": lab_data.test_name}
        )
        
        return lab_result
    
    async def get_lab_results(
        self, user_id: int, family_member_id: int, 
        category: Optional[str] = None,
        status: Optional[ResultStatus] = None
    ) -> List[LabResult]:
        """Get all lab results for a family member."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return []
        
        query = select(LabResult).where(LabResult.family_member_id == family_member_id)
        
        if category:
            query = query.where(LabResult.category == category)
        if status:
            query = query.where(LabResult.status == status)
        
        result = await self.db.execute(query.order_by(LabResult.test_date.desc()))
        lab_results = result.scalars().all()
        
        log_audit_event(
            event_type=AuditEventType.PHI_ACCESS,
            user_id=user_id,
            resource_type="lab_result",
            action="list_lab_results",
            details={"family_member_id": family_member_id, "count": len(lab_results)}
        )
        
        return list(lab_results)
    
    async def get_lab_result(self, user_id: int, lab_result_id: int) -> Optional[LabResult]:
        """Get a specific lab result."""
        result = await self.db.execute(
            select(LabResult).where(LabResult.id == lab_result_id)
        )
        lab_result = result.scalar_one_or_none()
        
        if lab_result:
            if not await self._verify_family_member_access(user_id, lab_result.family_member_id):
                return None
            
            log_audit_event(
                event_type=AuditEventType.PHI_ACCESS,
                user_id=user_id,
                resource_type="lab_result",
                resource_id=lab_result_id,
                action="view_lab_result"
            )
        
        return lab_result
    
    async def update_lab_result(self, user_id: int, lab_result_id: int, lab_data: LabResultUpdate) -> Optional[LabResult]:
        """Update a lab result entry."""
        lab_result = await self.get_lab_result(user_id, lab_result_id)
        if not lab_result:
            return None
        
        update_data = lab_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lab_result, field, value)
        
        # Re-determine status if value or reference range changed
        if any(k in update_data for k in ['value', 'reference_range_low', 'reference_range_high']):
            lab_result.status = lab_result.determine_status()
        
        lab_result.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(lab_result)
        
        log_audit_event(
            event_type=AuditEventType.PHI_UPDATE,
            user_id=user_id,
            resource_type="lab_result",
            resource_id=lab_result_id,
            action="update_lab_result",
            details={"fields_updated": list(update_data.keys())}
        )
        
        return lab_result
    
    async def delete_lab_result(self, user_id: int, lab_result_id: int) -> bool:
        """Delete a lab result entry."""
        lab_result = await self.get_lab_result(user_id, lab_result_id)
        if not lab_result:
            return False
        
        await self.db.delete(lab_result)
        await self.db.flush()
        
        log_audit_event(
            event_type=AuditEventType.PHI_DELETE,
            user_id=user_id,
            resource_type="lab_result",
            resource_id=lab_result_id,
            action="delete_lab_result"
        )
        
        return True
    
    async def get_abnormal_results(self, user_id: int, family_member_id: int) -> List[LabResult]:
        """Get all abnormal lab results for a family member."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return []
        
        abnormal_statuses = [
            ResultStatus.LOW, ResultStatus.HIGH,
            ResultStatus.CRITICAL_LOW, ResultStatus.CRITICAL_HIGH,
            ResultStatus.ABNORMAL
        ]
        
        result = await self.db.execute(
            select(LabResult)
            .where(
                LabResult.family_member_id == family_member_id,
                LabResult.status.in_(abnormal_statuses)
            )
            .order_by(LabResult.test_date.desc())
        )
        
        return list(result.scalars().all())
    
    async def get_latest_results_by_test(self, user_id: int, family_member_id: int) -> dict:
        """Get the latest result for each test type."""
        if not await self._verify_family_member_access(user_id, family_member_id):
            return {}
        
        result = await self.db.execute(
            select(LabResult)
            .where(LabResult.family_member_id == family_member_id)
            .order_by(LabResult.test_date.desc())
        )
        
        lab_results = result.scalars().all()
        latest_by_test = {}
        
        for lab in lab_results:
            if lab.test_name not in latest_by_test:
                latest_by_test[lab.test_name] = lab
        
        return latest_by_test
