from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class Employee(Base):
    """Employee model for storing employee information"""
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    face_descriptor = Column(String, nullable=True)  # Stored as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    attendance_records = relationship("AttendanceRecord", back_populates="employee")
    
    def __repr__(self):
        return f"<Employee(id={self.id}, employee_id={self.employee_id}, name={self.name})>"


class AuthorizedLocation(Base):
    """Authorized location model for GPS validation"""
    __tablename__ = "authorized_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=200.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AuthorizedLocation(name={self.location_name}, lat={self.latitude}, lng={self.longitude})>"


class AttendanceRecord(Base):
    """Attendance record model for tracking clock in/out"""
    __tablename__ = "attendance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    session_type = Column(String, nullable=False)  # morning, lunch, afternoon, evening
    clock_in_time = Column(DateTime, nullable=True)
    clock_out_time = Column(DateTime, nullable=True)
    clock_in_latitude = Column(Float, nullable=True)
    clock_in_longitude = Column(Float, nullable=True)
    clock_out_latitude = Column(Float, nullable=True)
    clock_out_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    employee = relationship("Employee", back_populates="attendance_records")
    
    def __repr__(self):
        return f"<AttendanceRecord(employee_id={self.employee_id}, session={self.session_type}, clock_in={self.clock_in_time})>"


class Database:
    """Database handler class using OOP"""
    
    def __init__(self, database_url: str = None):
        if database_url is None:
            database_url = os.getenv("DATABASE_URL", "sqlite:///./attendance.db")
        
        # Fix for Render PostgreSQL URLs
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    def create_tables(self):
        """Create all tables in the database"""
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self):
        """Get database session"""
        session = self.SessionLocal()
        try:
            yield session
        finally:
            session.close()
