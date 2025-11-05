from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
from datetime import datetime
from typing import List, Optional

app = FastAPI(title="RFID Attendance API", version="1.0.0")

# Database connection
def get_db():
    conn = sqlite3.connect('attendance.db')
    conn.row_factory = sqlite3.Row
    return conn

# Pydantic models
class ScanRequest(BaseModel):
    uid: str
    event_id: int = 1

class RegisterRequest(BaseModel):
    rfid_id: str
    name: str
    course_year: str

class StudentResponse(BaseModel):
    id: int
    rfid_id: str
    name: str
    course_year: str

class AttendanceLogResponse(BaseModel):
    log_id: int
    student_id: int
    event_id: int
    scan_timestamp: str

@app.post("/scan")
async def scan_rfid(request: ScanRequest):
    """Scan RFID card and check authorization"""
    conn = get_db()
    try:
        # Check if student exists
        student = conn.execute(
            "SELECT id, name FROM students WHERE rfid_id = ?",
            (request.uid,)
        ).fetchone()

        if student:
            # Log attendance
            conn.execute(
                "INSERT INTO attendance_logs (student_id, event_id, scan_timestamp) VALUES (?, ?, ?)",
                (student['id'], request.event_id, datetime.now().isoformat())
            )
            conn.commit()
            return {"authorized": True, "name": student['name']}
        else:
            return {"authorized": False, "uid": request.uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/register")
async def register_student(request: RegisterRequest):
    """Register a new student"""
    conn = get_db()
    try:
        # Check if RFID already exists
        existing = conn.execute(
            "SELECT id FROM students WHERE rfid_id = ?",
            (request.rfid_id,)
        ).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="RFID already registered")

        # Insert new student
        conn.execute(
            "INSERT INTO students (rfid_id, name, course_year) VALUES (?, ?, ?)",
            (request.rfid_id, request.name, request.course_year)
        )
        conn.commit()
        return {"status": "success", "message": "Student registered"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/students")
async def get_students():
    """Get all registered students"""
    conn = get_db()
    try:
        students = conn.execute("SELECT * FROM students ORDER BY name").fetchall()
        return [dict(student) for student in students]
    finally:
        conn.close()

@app.get("/attendance")
async def get_attendance(event_id: Optional[int] = None):
    """Get attendance logs, optionally filtered by event"""
    conn = get_db()
    try:
        if event_id:
            logs = conn.execute(
                """SELECT al.*, s.name, s.course_year, e.event_name
                   FROM attendance_logs al
                   JOIN students s ON al.student_id = s.id
                   JOIN events e ON al.event_id = e.event_id
                   WHERE al.event_id = ?
                   ORDER BY al.scan_timestamp DESC""",
                (event_id,)
            ).fetchall()
        else:
            logs = conn.execute(
                """SELECT al.*, s.name, s.course_year, e.event_name
                   FROM attendance_logs al
                   JOIN students s ON al.student_id = s.id
                   JOIN events e ON al.event_id = e.event_id
                   ORDER BY al.scan_timestamp DESC
                   LIMIT 100""",
                ()
            ).fetchall()

        return [dict(log) for log in logs]
    finally:
        conn.close()

@app.post("/events")
async def create_event(event_name: str, event_date: str):
    """Create a new event"""
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO events (event_name, event_date) VALUES (?, ?)",
            (event_name, event_date)
        )
        event_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.commit()
        return {"status": "success", "event_id": event_id, "message": "Event created"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/events")
async def get_events():
    """Get all events"""
    conn = get_db()
    try:
        events = conn.execute("SELECT * FROM events ORDER BY event_date DESC").fetchall()
        return [dict(event) for event in events]
    finally:
        conn.close()

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "RFID Attendance API running on AWS EC2",
        "version": "1.0.0",
        "endpoints": [
            "POST /scan - Scan RFID card",
            "POST /register - Register new student",
            "GET /students - Get all students",
            "GET /attendance - Get attendance logs",
            "POST /events - Create event",
            "GET /events - Get all events"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
