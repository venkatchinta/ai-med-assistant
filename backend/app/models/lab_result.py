"""Lab result model for tracking medical test results."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class LabCategory(str, enum.Enum):
    """Categories of lab tests."""
    BLOOD = "blood"
    URINE = "urine"
    IMAGING = "imaging"
    PATHOLOGY = "pathology"
    GENETIC = "genetic"
    OTHER = "other"


class ResultStatus(str, enum.Enum):
    """Status of lab result values."""
    NORMAL = "normal"
    LOW = "low"
    HIGH = "high"
    CRITICAL_LOW = "critical_low"
    CRITICAL_HIGH = "critical_high"
    ABNORMAL = "abnormal"
    PENDING = "pending"


class LabResult(Base):
    """Lab result tracking model."""
    __tablename__ = "lab_results"
    
    id = Column(Integer, primary_key=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    # Test information
    test_name = Column(String(200), nullable=False)
    test_code = Column(String(50), nullable=True)  # LOINC code or similar
    category = Column(Enum(LabCategory), default=LabCategory.BLOOD)
    
    # Result values
    value = Column(Float, nullable=True)
    value_text = Column(String(200), nullable=True)  # For non-numeric results
    unit = Column(String(50), nullable=True)
    
    # Reference ranges
    reference_range_low = Column(Float, nullable=True)
    reference_range_high = Column(Float, nullable=True)
    reference_range_text = Column(String(100), nullable=True)
    
    # Status
    status = Column(Enum(ResultStatus), default=ResultStatus.PENDING)
    
    # Test details
    test_date = Column(DateTime, nullable=False)
    result_date = Column(DateTime, nullable=True)
    
    # Provider information
    ordering_physician = Column(String(200), nullable=True)
    lab_name = Column(String(200), nullable=True)
    lab_address = Column(Text, nullable=True)
    
    # Additional information
    specimen_type = Column(String(100), nullable=True)  # e.g., "serum", "whole blood"
    fasting_required = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Document storage (path to uploaded PDF/image)
    document_path = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    family_member = relationship("FamilyMember", back_populates="lab_results")
    
    def __repr__(self):
        return f"<LabResult {self.test_name}: {self.value} {self.unit}>"
    
    def determine_status(self) -> ResultStatus:
        """Automatically determine status based on value and reference range."""
        if self.value is None:
            return ResultStatus.PENDING
        
        if self.reference_range_low is not None and self.reference_range_high is not None:
            if self.value < self.reference_range_low:
                # Check if critically low (20% below low range)
                critical_threshold = self.reference_range_low * 0.8
                if self.value < critical_threshold:
                    return ResultStatus.CRITICAL_LOW
                return ResultStatus.LOW
            elif self.value > self.reference_range_high:
                # Check if critically high (20% above high range)
                critical_threshold = self.reference_range_high * 1.2
                if self.value > critical_threshold:
                    return ResultStatus.CRITICAL_HIGH
                return ResultStatus.HIGH
            else:
                return ResultStatus.NORMAL
        
        return ResultStatus.PENDING
