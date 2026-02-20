"""Appointment management routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.appointment_service import AppointmentService
from app.models.appointment import AppointmentStatus
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appt_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new appointment for a family member."""
    appt_service = AppointmentService(db)
    appointment = await appt_service.create_appointment(current_user.id, appt_data)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this family member"
        )
    
    return appointment


@router.get("/family/{family_member_id}", response_model=List[AppointmentResponse])
async def get_family_member_appointments(
    family_member_id: int,
    upcoming_only: bool = Query(False, description="Filter to upcoming appointments only"),
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all appointments for a family member."""
    appt_service = AppointmentService(db)
    appointments = await appt_service.get_appointments(
        current_user.id, family_member_id,
        upcoming_only=upcoming_only,
        status=status_filter
    )
    return appointments


@router.get("/calendar", response_model=List[AppointmentResponse])
async def get_calendar_appointments(
    start_date: Optional[datetime] = Query(None, description="Start date for calendar view"),
    end_date: Optional[datetime] = Query(None, description="End date for calendar view"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all family appointments for calendar view."""
    appt_service = AppointmentService(db)
    appointments = await appt_service.get_all_family_appointments(
        current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    return appointments


@router.get("/reminders", response_model=List[AppointmentResponse])
async def get_upcoming_reminders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get appointments that need reminder notifications."""
    appt_service = AppointmentService(db)
    reminders = await appt_service.get_upcoming_reminders(current_user.id)
    return reminders


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific appointment."""
    appt_service = AppointmentService(db)
    appointment = await appt_service.get_appointment(current_user.id, appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    appt_data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an appointment."""
    appt_service = AppointmentService(db)
    appointment = await appt_service.update_appointment(current_user.id, appointment_id, appt_data)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an appointment."""
    appt_service = AppointmentService(db)
    deleted = await appt_service.delete_appointment(current_user.id, appointment_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
