"""Medication management routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationResponse
from app.services.medication_service import MedicationService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/medications", tags=["Medications"])


@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    med_data: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new medication for a family member."""
    med_service = MedicationService(db)
    medication = await med_service.create_medication(current_user.id, med_data)
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this family member"
        )
    
    return medication


@router.get("/family/{family_member_id}", response_model=List[MedicationResponse])
async def get_family_member_medications(
    family_member_id: int,
    active_only: bool = Query(False, description="Filter to active medications only"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all medications for a family member."""
    med_service = MedicationService(db)
    medications = await med_service.get_medications(
        current_user.id, family_member_id, active_only
    )
    return medications


@router.get("/all", response_model=List[MedicationResponse])
async def get_all_family_medications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all medications for all family members."""
    med_service = MedicationService(db)
    medications = await med_service.get_all_family_medications(current_user.id)
    return medications


@router.get("/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific medication."""
    med_service = MedicationService(db)
    medication = await med_service.get_medication(current_user.id, medication_id)
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    return medication


@router.put("/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: int,
    med_data: MedicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a medication."""
    med_service = MedicationService(db)
    medication = await med_service.update_medication(current_user.id, medication_id, med_data)
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    return medication


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    medication_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a medication."""
    med_service = MedicationService(db)
    deleted = await med_service.delete_medication(current_user.id, medication_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
