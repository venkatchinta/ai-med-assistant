"""Lab results management routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.schemas.lab_result import LabResultCreate, LabResultUpdate, LabResultResponse
from app.services.lab_result_service import LabResultService
from app.models.lab_result import LabCategory, ResultStatus
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/lab-results", tags=["Lab Results"])


@router.post("", response_model=LabResultResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_result(
    lab_data: LabResultCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new lab result for a family member."""
    lab_service = LabResultService(db)
    lab_result = await lab_service.create_lab_result(current_user.id, lab_data)
    
    if not lab_result:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this family member"
        )
    
    return lab_result


@router.get("/family/{family_member_id}", response_model=List[LabResultResponse])
async def get_family_member_lab_results(
    family_member_id: int,
    category: Optional[LabCategory] = Query(None, description="Filter by category"),
    status_filter: Optional[ResultStatus] = Query(None, alias="status", description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all lab results for a family member."""
    lab_service = LabResultService(db)
    lab_results = await lab_service.get_lab_results(
        current_user.id, family_member_id, 
        category=category.value if category else None,
        status=status_filter
    )
    return lab_results


@router.get("/family/{family_member_id}/abnormal", response_model=List[LabResultResponse])
async def get_abnormal_lab_results(
    family_member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all abnormal lab results for a family member."""
    lab_service = LabResultService(db)
    lab_results = await lab_service.get_abnormal_results(current_user.id, family_member_id)
    return lab_results


@router.get("/family/{family_member_id}/latest", response_model=dict)
async def get_latest_lab_results(
    family_member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the latest result for each test type."""
    lab_service = LabResultService(db)
    latest = await lab_service.get_latest_results_by_test(current_user.id, family_member_id)
    
    return {
        test_name: LabResultResponse.model_validate(result)
        for test_name, result in latest.items()
    }


@router.get("/{lab_result_id}", response_model=LabResultResponse)
async def get_lab_result(
    lab_result_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific lab result."""
    lab_service = LabResultService(db)
    lab_result = await lab_service.get_lab_result(current_user.id, lab_result_id)
    
    if not lab_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab result not found"
        )
    
    return lab_result


@router.put("/{lab_result_id}", response_model=LabResultResponse)
async def update_lab_result(
    lab_result_id: int,
    lab_data: LabResultUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a lab result."""
    lab_service = LabResultService(db)
    lab_result = await lab_service.update_lab_result(current_user.id, lab_result_id, lab_data)
    
    if not lab_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab result not found"
        )
    
    return lab_result


@router.delete("/{lab_result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_result(
    lab_result_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a lab result."""
    lab_service = LabResultService(db)
    deleted = await lab_service.delete_lab_result(current_user.id, lab_result_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab result not found"
        )
