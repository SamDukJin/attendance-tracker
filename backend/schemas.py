from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class EmployeeCreate(BaseModel):
    """Schema for creating a new employee"""
    employee_id: str
    name: str
    email: EmailStr
    face_descriptor: Optional[str] = None


class EmployeeResponse(BaseModel):
    """Schema for employee response"""
    id: int
    employee_id: str
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class LocationCreate(BaseModel):
    """Schema for creating authorized location"""
    location_name: str
    latitude: float
    longitude: float
    radius_meters: float = 200.0


class LocationResponse(BaseModel):
    """Schema for location response"""
    id: int
    location_name: str
    latitude: float
    longitude: float
    radius_meters: float
    
    class Config:
        from_attributes = True


class ClockInRequest(BaseModel):
    """Schema for clock in request"""
    employee_id: str
    session_type: str  # morning, lunch, afternoon, evening
    latitude: float
    longitude: float
    face_descriptor: Optional[str] = None


class ClockOutRequest(BaseModel):
    """Schema for clock out request"""
    employee_id: str
    session_type: str
    latitude: float
    longitude: float


class AttendanceResponse(BaseModel):
    """Schema for attendance record response"""
    id: int
    employee_id: int
    session_type: str
    clock_in_time: Optional[datetime]
    clock_out_time: Optional[datetime]
    clock_in_latitude: Optional[float]
    clock_in_longitude: Optional[float]
    clock_out_latitude: Optional[float]
    clock_out_longitude: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AttendanceHistoryResponse(BaseModel):
    """Schema for attendance history with employee details"""
    attendance: AttendanceResponse
    employee: EmployeeResponse
    
    class Config:
        from_attributes = True
