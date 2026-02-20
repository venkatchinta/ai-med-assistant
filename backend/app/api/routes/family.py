"""Family member management routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.config import settings
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate, FamilyMemberResponse
from app.services.family_service import FamilyService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/family", tags=["Family Members"])


@router.post("", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_family_member(
    member_data: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new family member (max 6 per account)."""
    family_service = FamilyService(db)
    
    # Check limit
    current_count = await family_service.get_family_member_count(current_user.id)
    if current_count >= settings.MAX_FAMILY_MEMBERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum of {settings.MAX_FAMILY_MEMBERS} family members allowed"
        )
    
    member = await family_service.create_family_member(current_user.id, member_data)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create family member"
        )
    
    # Decrypt sensitive data for response
    decrypted = family_service.decrypt_member_data(member)
    response = FamilyMemberResponse.model_validate(member)
    response.allergies = decrypted["allergies"]
    response.medical_conditions = decrypted["medical_conditions"]
    
    return response


@router.get("", response_model=List[FamilyMemberResponse])
async def get_family_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all family members for the current user."""
    family_service = FamilyService(db)
    members = await family_service.get_family_members(current_user.id)
    
    responses = []
    for member in members:
        decrypted = family_service.decrypt_member_data(member)
        response = FamilyMemberResponse.model_validate(member)
        response.allergies = decrypted["allergies"]
        response.medical_conditions = decrypted["medical_conditions"]
        responses.append(response)
    
    return responses


@router.get("/{member_id}", response_model=FamilyMemberResponse)
async def get_family_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific family member."""
    family_service = FamilyService(db)
    member = await family_service.get_family_member(current_user.id, member_id)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    decrypted = family_service.decrypt_member_data(member)
    response = FamilyMemberResponse.model_validate(member)
    response.allergies = decrypted["allergies"]
    response.medical_conditions = decrypted["medical_conditions"]
    
    return response


@router.put("/{member_id}", response_model=FamilyMemberResponse)
async def update_family_member(
    member_id: int,
    member_data: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a family member."""
    family_service = FamilyService(db)
    member = await family_service.update_family_member(current_user.id, member_id, member_data)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    decrypted = family_service.decrypt_member_data(member)
    response = FamilyMemberResponse.model_validate(member)
    response.allergies = decrypted["allergies"]
    response.medical_conditions = decrypted["medical_conditions"]
    
    return response


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a family member and all associated data."""
    family_service = FamilyService(db)
    deleted = await family_service.delete_family_member(current_user.id, member_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
