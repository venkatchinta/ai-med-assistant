"""Sync endpoint for multi-device data synchronization."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.sync import SyncRequest, SyncResponse, SyncChangeResult, SyncConflict
from app.models import User, Medication, Appointment, LabResult
from app.schemas import MedicationCreate, MedicationUpdate, AppointmentCreate, LabResultCreate

router = APIRouter(prefix="/sync", tags=["sync"])
logger = logging.getLogger(__name__)


@router.post("", response_model=SyncResponse)
async def sync_changes(
    request: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Batch sync endpoint for multi-device synchronization.

    Processes client changes and returns conflicts and new server data.
    Strategy: Server authority - server state wins on conflicts.
    """
    try:
        success_results = []
        conflicts = []
        new_data = []
        last_sync = datetime.utcnow()

        # Process each change from client
        for change in request.changes:
            try:
                if change.operation == "CREATE":
                    result = await _handle_create(
                        change, current_user.id, db
                    )
                    success_results.append(result)

                elif change.operation == "UPDATE":
                    result = await _handle_update(
                        change, current_user.id, db
                    )
                    if isinstance(result, SyncChangeResult):
                        success_results.append(result)
                    else:  # conflict
                        conflicts.append(result)

                elif change.operation == "DELETE":
                    result = await _handle_delete(
                        change, current_user.id, db
                    )
                    success_results.append(result)

            except Exception as e:
                logger.error(f"Error processing change {change.id}: {str(e)}")
                conflicts.append(SyncConflict(
                    local_id=change.id,
                    reason=f"Processing error: {str(e)}",
                    server_data={}
                ))

        # Commit all successful changes
        await db.commit()

        return SyncResponse(
            success=success_results,
            conflicts=conflicts,
            new_data=new_data,
            last_sync=last_sync
        )

    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Sync failed: {str(e)}")


async def _handle_create(change, user_id: int, db: AsyncSession) -> SyncChangeResult:
    """Handle CREATE operation."""
    entity_type = change.entity_type
    data = change.data

    try:
        if entity_type == "medication":
            med = Medication(
                family_member_id=data["family_member_id"],
                name=data["name"],
                dosage=data["dosage"],
                frequency=data["frequency"],
                reason=data.get("reason", ""),
                start_date=data["start_date"],
                end_date=data.get("end_date"),
                is_active=data.get("is_active", True),
            )
            db.add(med)
            await db.flush()
            return SyncChangeResult(
                local_id=change.id,
                server_id=med.id,
                version=1
            )

        elif entity_type == "appointment":
            appt = Appointment(
                family_member_id=data["family_member_id"],
                doctor_name=data["doctor_name"],
                appointment_type=data["appointment_type"],
                location=data["location"],
                scheduled_at=data["scheduled_at"],
                notes=data.get("notes", ""),
            )
            db.add(appt)
            await db.flush()
            return SyncChangeResult(
                local_id=change.id,
                server_id=appt.id,
                version=1
            )

        elif entity_type == "lab_result":
            lab = LabResult(
                family_member_id=data["family_member_id"],
                test_name=data["test_name"],
                value=data["value"],
                unit=data["unit"],
                reference_range=data["reference_range"],
                test_date=data["test_date"],
            )
            db.add(lab)
            await db.flush()
            return SyncChangeResult(
                local_id=change.id,
                server_id=lab.id,
                version=1
            )

        else:
            raise ValueError(f"Unknown entity type: {entity_type}")

    except Exception as e:
        raise ValueError(f"Failed to create {entity_type}: {str(e)}")


async def _handle_update(change, user_id: int, db: AsyncSession):
    """Handle UPDATE operation. Returns SyncChangeResult or SyncConflict."""
    # For Phase 1, we'll use simple server-authority approach
    # In Phase 2, implement CRDT-based conflict resolution

    entity_type = change.entity_type
    data = change.data
    server_id = data.get("id")

    try:
        if entity_type == "medication" and server_id:
            med = await db.get(Medication, server_id)
            if not med:
                raise ValueError(f"Medication {server_id} not found")

            # Update fields
            for field, value in data.items():
                if field != "id" and hasattr(med, field):
                    setattr(med, field, value)

            return SyncChangeResult(
                local_id=change.id,
                server_id=med.id,
                version=2
            )

        elif entity_type == "appointment" and server_id:
            appt = await db.get(Appointment, server_id)
            if not appt:
                raise ValueError(f"Appointment {server_id} not found")

            for field, value in data.items():
                if field != "id" and hasattr(appt, field):
                    setattr(appt, field, value)

            return SyncChangeResult(
                local_id=change.id,
                server_id=appt.id,
                version=2
            )

        else:
            raise ValueError(f"Cannot update {entity_type} without server ID")

    except Exception as e:
        return SyncConflict(
            local_id=change.id,
            reason=str(e),
            server_data=data
        )


async def _handle_delete(change, user_id: int, db: AsyncSession) -> SyncChangeResult:
    """Handle DELETE operation."""
    entity_type = change.entity_type
    server_id = change.data.get("id")

    try:
        if entity_type == "medication" and server_id:
            med = await db.get(Medication, server_id)
            if med:
                await db.delete(med)
        elif entity_type == "appointment" and server_id:
            appt = await db.get(Appointment, server_id)
            if appt:
                await db.delete(appt)
        elif entity_type == "lab_result" and server_id:
            lab = await db.get(LabResult, server_id)
            if lab:
                await db.delete(lab)

        return SyncChangeResult(
            local_id=change.id,
            server_id=server_id,
            version=None
        )

    except Exception as e:
        raise ValueError(f"Failed to delete {entity_type}: {str(e)}")
