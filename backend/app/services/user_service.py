"""User service for authentication and user management."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.audit import log_audit_event, AuditEventType


class UserService:
    """Service class for user operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user account."""
        hashed_password = get_password_hash(user_data.password)
        
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_number=user_data.phone_number,
            date_of_birth=user_data.date_of_birth
        )
        
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        
        log_audit_event(
            event_type=AuditEventType.PHI_CREATE,
            user_id=user.id,
            resource_type="user",
            resource_id=user.id,
            action="create_account"
        )
        
        return user
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def authenticate_user(self, email: str, password: str, ip_address: Optional[str] = None) -> Optional[User]:
        """Authenticate user with email and password."""
        user = await self.get_user_by_email(email)
        
        if not user:
            log_audit_event(
                event_type=AuditEventType.LOGIN_FAILED,
                user_id=None,
                resource_type="user",
                action="login_attempt",
                details={"email": email, "reason": "user_not_found"},
                ip_address=ip_address,
                success=False
            )
            return None
        
        if not verify_password(password, user.hashed_password):
            log_audit_event(
                event_type=AuditEventType.LOGIN_FAILED,
                user_id=user.id,
                resource_type="user",
                resource_id=user.id,
                action="login_attempt",
                details={"reason": "invalid_password"},
                ip_address=ip_address,
                success=False
            )
            return None
        
        if not user.is_active:
            log_audit_event(
                event_type=AuditEventType.LOGIN_FAILED,
                user_id=user.id,
                resource_type="user",
                resource_id=user.id,
                action="login_attempt",
                details={"reason": "account_inactive"},
                ip_address=ip_address,
                success=False
            )
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        await self.db.flush()
        
        log_audit_event(
            event_type=AuditEventType.LOGIN,
            user_id=user.id,
            resource_type="user",
            resource_id=user.id,
            action="login_success",
            ip_address=ip_address
        )
        
        return user
    
    async def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update user profile."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(user)
        
        log_audit_event(
            event_type=AuditEventType.PHI_UPDATE,
            user_id=user_id,
            resource_type="user",
            resource_id=user_id,
            action="update_profile",
            details={"fields_updated": list(update_data.keys())}
        )
        
        return user
    
    async def deactivate_user(self, user_id: int) -> bool:
        """Deactivate a user account."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        await self.db.flush()
        
        log_audit_event(
            event_type=AuditEventType.SECURITY_EVENT,
            user_id=user_id,
            resource_type="user",
            resource_id=user_id,
            action="account_deactivated"
        )
        
        return True
