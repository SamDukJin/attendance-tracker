from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models import Database
from schemas import (
    EmployeeCreate, EmployeeResponse, LocationCreate, LocationResponse,
    ClockInRequest, ClockOutRequest, AttendanceResponse
)
from services import EmployeeService, AttendanceService, LocationService
from models import Employee, AttendanceRecord, AuthorizedLocation
from typing import List
import os

# Initialize FastAPI app
app = FastAPI(
    title="Attendance Tracker API",
    description="API for employee attendance tracking with facial recognition and GPS validation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
database = Database()
database.create_tables()


# Dependency to get DB session
def get_db():
    db = next(database.get_session())
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Attendance Tracker API",
        "version": "1.0.0",
        "status": "active"
    }


# Employee endpoints
@app.post("/employees", response_model=EmployeeResponse, status_code=201)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee"""
    # Check if employee already exists
    existing = EmployeeService.get_employee_by_employee_id(db, employee.employee_id)
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    new_employee = EmployeeService.create_employee(db, employee)
    return new_employee


@app.get("/employees", response_model=List[EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    """Get all employees"""
    employees = EmployeeService.get_all_employees(db)
    return employees


@app.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    """Get employee by employee ID"""
    employee = EmployeeService.get_employee_by_employee_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


# Location endpoints
@app.post("/locations", response_model=LocationResponse, status_code=201)
def create_location(location: LocationCreate, db: Session = Depends(get_db)):
    """Create an authorized location"""
    new_location = AuthorizedLocation(
        location_name=location.location_name,
        latitude=location.latitude,
        longitude=location.longitude,
        radius_meters=location.radius_meters
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location


@app.get("/locations", response_model=List[LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    """Get all authorized locations"""
    locations = db.query(AuthorizedLocation).all()
    return locations


# Attendance endpoints
@app.post("/attendance/clock-in")
def clock_in(clock_in_data: ClockInRequest, db: Session = Depends(get_db)):
    """Clock in for a session"""
    result = AttendanceService.clock_in(db, clock_in_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/attendance/clock-out")
def clock_out(clock_out_data: ClockOutRequest, db: Session = Depends(get_db)):
    """Clock out from a session"""
    result = AttendanceService.clock_out(db, clock_out_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/attendance/history/{employee_id}", response_model=List[AttendanceResponse])
def get_employee_history(employee_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Get attendance history for an employee"""
    records = AttendanceService.get_employee_attendance_history(db, employee_id, limit)
    return records


@app.get("/attendance/all", response_model=List[AttendanceResponse])
def get_all_attendance(limit: int = 100, db: Session = Depends(get_db)):
    """Get all attendance records"""
    records = AttendanceService.get_all_attendance_records(db, limit)
    return records


@app.get("/attendance/status/{employee_id}")
def get_attendance_status(employee_id: str, db: Session = Depends(get_db)):
    """Get current attendance status for an employee"""
    from datetime import date, datetime
    
    employee = EmployeeService.get_employee_by_employee_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    today = date.today()
    sessions = ["morning", "lunch", "afternoon", "evening"]
    status = {}
    
    for session in sessions:
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.session_type == session,
            AttendanceRecord.clock_in_time >= datetime.combine(today, datetime.min.time())
        ).first()
        
        if record:
            status[session] = {
                "clocked_in": record.clock_in_time is not None,
                "clocked_out": record.clock_out_time is not None,
                "clock_in_time": record.clock_in_time,
                "clock_out_time": record.clock_out_time
            }
        else:
            status[session] = {
                "clocked_in": False,
                "clocked_out": False,
                "clock_in_time": None,
                "clock_out_time": None
            }
    
    return {
        "employee_id": employee_id,
        "employee_name": employee.name,
        "date": today,
        "sessions": status
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
