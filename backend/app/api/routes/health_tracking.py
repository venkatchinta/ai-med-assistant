"""Health tracking routes for daily logs and diet entries."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.schemas.health_tracking import (
    DailyHealthLogCreate, DailyHealthLogUpdate, DailyHealthLogResponse,
    DietEntryCreate, DietEntryUpdate, DietEntryResponse
)
from app.services.health_tracking_service import HealthTrackingService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/health-tracking", tags=["Health Tracking"])


# Daily Health Log Routes
@router.post("/logs", response_model=DailyHealthLogResponse, status_code=status.HTTP_201_CREATED)
async def create_health_log(
    log_data: DailyHealthLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new daily health log."""
    tracking_service = HealthTrackingService(db)
    health_log = await tracking_service.create_health_log(current_user.id, log_data)
    
    if not health_log:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this family member"
        )
    
    return health_log


@router.get("/logs/family/{family_member_id}", response_model=List[DailyHealthLogResponse])
async def get_health_logs(
    family_member_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get health logs for a family member."""
    tracking_service = HealthTrackingService(db)
    logs = await tracking_service.get_health_logs(
        current_user.id, family_member_id,
        start_date=start_date,
        end_date=end_date
    )
    return logs


@router.get("/logs/family/{family_member_id}/today", response_model=Optional[DailyHealthLogResponse])
async def get_today_health_log(
    family_member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get today's health log for a family member."""
    tracking_service = HealthTrackingService(db)
    log = await tracking_service.get_today_log(current_user.id, family_member_id)
    return log


@router.get("/logs/{log_id}", response_model=DailyHealthLogResponse)
async def get_health_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific health log."""
    tracking_service = HealthTrackingService(db)
    log = await tracking_service.get_health_log(current_user.id, log_id)
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    return log


@router.put("/logs/{log_id}", response_model=DailyHealthLogResponse)
async def update_health_log(
    log_id: int,
    log_data: DailyHealthLogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a health log."""
    tracking_service = HealthTrackingService(db)
    log = await tracking_service.update_health_log(current_user.id, log_id, log_data)
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    return log


# Diet Entry Routes
@router.post("/diet", response_model=DietEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_diet_entry(
    diet_data: DietEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new diet entry."""
    tracking_service = HealthTrackingService(db)
    entry = await tracking_service.create_diet_entry(current_user.id, diet_data)
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this family member"
        )
    
    return entry


@router.get("/diet/family/{family_member_id}", response_model=List[DietEntryResponse])
async def get_diet_entries(
    family_member_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get diet entries for a family member."""
    tracking_service = HealthTrackingService(db)
    entries = await tracking_service.get_diet_entries(
        current_user.id, family_member_id,
        start_date=start_date,
        end_date=end_date
    )
    return entries


@router.get("/diet/family/{family_member_id}/summary", response_model=dict)
async def get_nutrition_summary(
    family_member_id: int,
    target_date: date = Query(..., description="Date for nutrition summary"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get daily nutrition summary for a family member."""
    tracking_service = HealthTrackingService(db)
    summary = await tracking_service.get_daily_nutrition_summary(
        current_user.id, family_member_id, target_date
    )
    return summary


@router.get("/diet/{entry_id}", response_model=DietEntryResponse)
async def get_diet_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific diet entry."""
    tracking_service = HealthTrackingService(db)
    entry = await tracking_service.get_diet_entry(current_user.id, entry_id)
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diet entry not found"
        )
    
    return entry


@router.put("/diet/{entry_id}", response_model=DietEntryResponse)
async def update_diet_entry(
    entry_id: int,
    diet_data: DietEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a diet entry."""
    tracking_service = HealthTrackingService(db)
    entry = await tracking_service.update_diet_entry(current_user.id, entry_id, diet_data)
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diet entry not found"
        )
    
    return entry


@router.delete("/diet/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diet_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a diet entry."""
    tracking_service = HealthTrackingService(db)
    deleted = await tracking_service.delete_diet_entry(current_user.id, entry_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diet entry not found"
        )
