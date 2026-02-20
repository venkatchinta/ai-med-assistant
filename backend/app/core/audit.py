"""HIPAA-compliant audit logging for tracking PHI access."""
import logging
import json
from datetime import datetime
from typing import Optional, Any
from pathlib import Path

from app.core.config import settings

# Create logs directory if it doesn't exist
log_dir = Path(settings.AUDIT_LOG_PATH).parent
log_dir.mkdir(parents=True, exist_ok=True)

# Configure audit logger
audit_logger = logging.getLogger("hipaa_audit")
audit_logger.setLevel(logging.INFO)

# File handler for audit logs
file_handler = logging.FileHandler(settings.AUDIT_LOG_PATH)
file_handler.setLevel(logging.INFO)

# Format for audit logs
formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(formatter)
audit_logger.addHandler(file_handler)


class AuditEventType:
    """HIPAA audit event types."""
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    PHI_ACCESS = "PHI_ACCESS"
    PHI_CREATE = "PHI_CREATE"
    PHI_UPDATE = "PHI_UPDATE"
    PHI_DELETE = "PHI_DELETE"
    PHI_EXPORT = "PHI_EXPORT"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
    SECURITY_EVENT = "SECURITY_EVENT"


def log_audit_event(
    event_type: str,
    user_id: Optional[int],
    resource_type: str,
    resource_id: Optional[int] = None,
    action: str = "",
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    success: bool = True
):
    """Log a HIPAA-compliant audit event."""
    if not settings.AUDIT_LOG_ENABLED:
        return
    
    audit_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "action": action,
        "details": details or {},
        "ip_address": ip_address,
        "user_agent": user_agent,
        "success": success
    }
    
    audit_logger.info(json.dumps(audit_entry))


def log_phi_access(
    user_id: int,
    patient_id: int,
    data_type: str,
    action: str,
    ip_address: Optional[str] = None
):
    """Convenience function for logging PHI access events."""
    log_audit_event(
        event_type=AuditEventType.PHI_ACCESS,
        user_id=user_id,
        resource_type=data_type,
        resource_id=patient_id,
        action=action,
        ip_address=ip_address
    )
