"""Schemas for multi-device sync functionality."""
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime


class SyncChange(BaseModel):
    """A single change to be synced."""
    id: str  # Local UUID
    entity_type: str  # medication, appointment, lab_result, etc.
    operation: str  # CREATE, UPDATE, DELETE
    data: dict[str, Any]
    idempotency_key: str
    timestamp: str


class SyncRequest(BaseModel):
    """Request for batch sync from client."""
    device_id: str
    changes: List[SyncChange]
    last_sync: datetime


class SyncChangeResult(BaseModel):
    """Result of processing a single change."""
    local_id: str
    server_id: Optional[int] = None
    version: Optional[int] = None


class SyncConflict(BaseModel):
    """A conflict detected during sync."""
    local_id: str
    reason: str
    server_data: dict[str, Any]


class SyncResponse(BaseModel):
    """Response after processing sync."""
    success: List[SyncChangeResult]
    conflicts: List[SyncConflict]
    new_data: List[dict[str, Any]]
    last_sync: datetime
