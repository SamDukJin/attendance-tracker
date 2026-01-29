from sqlalchemy.orm import Session
from models import Employee, AttendanceRecord, AuthorizedLocation
from schemas import EmployeeCreate, LocationCreate, ClockInRequest, ClockOutRequest
from datetime import datetime, date
from math import radians, sin, cos, sqrt, atan2
from typing import List, Optional


class LocationService:
    """Service class for location-related operations"""
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two GPS coordinates using Haversine formula
        Returns distance in meters
        """
        R = 6371000  # Earth radius in meters
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distance = R * c
        return distance
    
    @staticmethod
    def is_within_authorized_location(db: Session, latitude: float, longitude: float) -> bool:
        """Check if given coordinates are within any authorized location"""
        locations = db.query(AuthorizedLocation).all()
        
        for location in locations:
            distance = LocationService.calculate_distance(
                latitude, longitude,
                location.latitude, location.longitude
            )
            if distance <= location.radius_meters:
                return True
        
        return False


class EmployeeService:
    """Service class for employee-related operations"""
    
    @staticmethod
    def create_employee(db: Session, employee_data: EmployeeCreate) -> Employee:
        """Create a new employee"""
        employee = Employee(
            employee_id=employee_data.employee_id,
            name=employee_data.name,
            email=employee_data.email,
            face_descriptor=employee_data.face_descriptor
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee
    
    @staticmethod
    def get_employee_by_employee_id(db: Session, employee_id: str) -> Optional[Employee]:
        """Get employee by employee ID"""
        return db.query(Employee).filter(Employee.employee_id == employee_id).first()
    
    @staticmethod
    def get_all_employees(db: Session) -> List[Employee]:
        """Get all employees"""
        return db.query(Employee).all()
    
    @staticmethod
    def update_face_descriptor(db: Session, employee_id: str, face_descriptor: str) -> Optional[Employee]:
        """Update employee's face descriptor"""
        employee = EmployeeService.get_employee_by_employee_id(db, employee_id)
        if employee:
            employee.face_descriptor = face_descriptor
            db.commit()
            db.refresh(employee)
        return employee


class AttendanceService:
    """Service class for attendance-related operations"""
    
    @staticmethod
    def clock_in(db: Session, clock_in_data: ClockInRequest) -> dict:
        """Process clock in"""
        # Verify location
        if not LocationService.is_within_authorized_location(
            db, clock_in_data.latitude, clock_in_data.longitude
        ):
            return {
                "success": False,
                "message": "Location not authorized. You must be within 200m of an authorized location."
            }
        
        # Get employee
        employee = EmployeeService.get_employee_by_employee_id(db, clock_in_data.employee_id)
        if not employee:
            return {"success": False, "message": "Employee not found"}
        
        # Update face descriptor if provided
        if clock_in_data.face_descriptor:
            employee.face_descriptor = clock_in_data.face_descriptor
            db.commit()
        
        # Check if already clocked in for this session today
        today = date.today()
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.session_type == clock_in_data.session_type,
            AttendanceRecord.clock_in_time >= datetime.combine(today, datetime.min.time())
        ).first()
        
        if existing_record and existing_record.clock_in_time:
            return {"success": False, "message": f"Already clocked in for {clock_in_data.session_type} session today"}
        
        # Create new attendance record
        attendance = AttendanceRecord(
            employee_id=employee.id,
            session_type=clock_in_data.session_type,
            clock_in_time=datetime.utcnow(),
            clock_in_latitude=clock_in_data.latitude,
            clock_in_longitude=clock_in_data.longitude
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return {
            "success": True,
            "message": f"Successfully clocked in for {clock_in_data.session_type} session",
            "attendance_id": attendance.id,
            "clock_in_time": attendance.clock_in_time
        }
    
    @staticmethod
    def clock_out(db: Session, clock_out_data: ClockOutRequest) -> dict:
        """Process clock out"""
        # Verify location
        if not LocationService.is_within_authorized_location(
            db, clock_out_data.latitude, clock_out_data.longitude
        ):
            return {
                "success": False,
                "message": "Location not authorized. You must be within 200m of an authorized location."
            }
        
        # Get employee
        employee = EmployeeService.get_employee_by_employee_id(db, clock_out_data.employee_id)
        if not employee:
            return {"success": False, "message": "Employee not found"}
        
        # Find today's attendance record for this session
        today = date.today()
        attendance = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.session_type == clock_out_data.session_type,
            AttendanceRecord.clock_in_time >= datetime.combine(today, datetime.min.time()),
            AttendanceRecord.clock_out_time == None
        ).first()
        
        if not attendance:
            return {"success": False, "message": f"No active clock-in found for {clock_out_data.session_type} session today"}
        
        # Update clock out
        attendance.clock_out_time = datetime.utcnow()
        attendance.clock_out_latitude = clock_out_data.latitude
        attendance.clock_out_longitude = clock_out_data.longitude
        db.commit()
        db.refresh(attendance)
        
        return {
            "success": True,
            "message": f"Successfully clocked out for {clock_out_data.session_type} session",
            "attendance_id": attendance.id,
            "clock_out_time": attendance.clock_out_time
        }
    
    @staticmethod
    def get_employee_attendance_history(db: Session, employee_id: str, limit: int = 50) -> List[AttendanceRecord]:
        """Get attendance history for an employee"""
        employee = EmployeeService.get_employee_by_employee_id(db, employee_id)
        if not employee:
            return []
        
        return db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == employee.id
        ).order_by(AttendanceRecord.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_all_attendance_records(db: Session, limit: int = 100) -> List[AttendanceRecord]:
        """Get all attendance records"""
        return db.query(AttendanceRecord).order_by(
            AttendanceRecord.created_at.desc()
        ).limit(limit).all()
