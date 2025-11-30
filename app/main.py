from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional

app = FastAPI(title="RFID Attendance API", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or later restrict to your React app IP/domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.websockets import WebSocketDisconnect, WebSocketState
from fastapi.responses import HTMLResponse
from fastapi import status

@app.middleware("http")
async def websocket_origin_middleware(request, call_next):
    # Allow WebSocket upgrade requests manually
    if request.headers.get("upgrade", "").lower() == "websocket":
        origin = request.headers.get("origin")
        print(f"🔗 WebSocket upgrade attempt from: {origin}")
    return await call_next(request)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Database connection
def get_db():
    conn = sqlite3.connect('attendance.db')
    conn.row_factory = sqlite3.Row
    return conn

# Pydantic models
class ScanRequest(BaseModel):
    uid: str
    event_id: Optional[int] = None

class RegisterRequest(BaseModel):
    student_id: str
    rfid_id: str
    name: str
    course_year: str

class StudentResponse(BaseModel):
    id: int
    student_id: str
    rfid_id: str
    name: str
    course_year: str

class AttendanceLogResponse(BaseModel):
    log_id: int
    student_id: int
    event_id: int
    scan_timestamp: str

class EventCreate(BaseModel):
    event_name: str
    event_date: str

class EventUpdate(BaseModel):
    event_name: Optional[str] = None
    event_date: Optional[str] = None

class ActiveEventSet(BaseModel):
    event_id: int

@app.post("/scan")
async def scan_rfid(request: ScanRequest):
    """Scan RFID card and check authorization"""
    conn = get_db()
    try:
        # Always use active event (ignore hardware event_id to ensure UI control)
        setting = conn.execute(
            "SELECT value FROM settings WHERE key = 'active_event_id'",
            ()
        ).fetchone()
        if setting:
            event_id = int(setting['value'])
        else:
            raise HTTPException(status_code=400, detail="No active event set. Please set an active event first.")

        # Check if student exists
        student = conn.execute(
            "SELECT id, name FROM students WHERE rfid_id = ?",
            (request.uid,)
        ).fetchone()

        if student:
            # Check if student already scanned for this event today
            today = datetime.now().strftime("%Y-%m-%d")
            existing_scan = conn.execute(
                "SELECT log_id FROM attendance_logs WHERE student_id = ? AND event_id = ? AND DATE(scan_timestamp) = ?",
                (student['id'], event_id, today)
            ).fetchone()

            current_time = datetime.now(timezone.utc).isoformat()

            if existing_scan:
                # Already scanned today - update with latest timestamp
                conn.execute(
                    "UPDATE attendance_logs SET scan_timestamp = ? WHERE log_id = ?",
                    (current_time, existing_scan['log_id'])
                )
                conn.commit()
                # Broadcast the scanned UID to all connected WebSocket clients
                await manager.broadcast(request.uid)
                return {
                    "authorized": True,
                    "name": student['name'],
                    "event_id": event_id,
                    "message": "Attendance time updated",
                    "duplicate": True
                }

            # Log attendance for first scan today
            conn.execute(
                "INSERT INTO attendance_logs (student_id, event_id, scan_timestamp) VALUES (?, ?, ?)",
                (student['id'], event_id, current_time)
            )
            conn.commit()
            # Broadcast the scanned UID to all connected WebSocket clients
            await manager.broadcast(request.uid)
            return {"authorized": True, "name": student['name'], "event_id": event_id, "duplicate": False}
        else:
            # Broadcast the scanned UID even if not authorized, so the app can still populate the field
            await manager.broadcast(request.uid)
            return {"authorized": False, "uid": request.uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # ✅ Manually accept all origins
    await websocket.accept()
    try:
        await manager.connect(websocket)
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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

        # Check if student_id already exists
        existing_id = conn.execute(
            "SELECT id FROM students WHERE student_id = ?",
            (request.student_id,)
        ).fetchone()

        if existing_id:
            raise HTTPException(status_code=400, detail="Student ID already registered")

        # Insert new student
        conn.execute(
            "INSERT INTO students (student_id, rfid_id, name, course_year) VALUES (?, ?, ?, ?)",
            (request.student_id, request.rfid_id, request.name, request.course_year)
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
                """SELECT al.*, s.name, s.course_year, e.event_name,
                          CASE WHEN al.scan_timestamp = (
                              SELECT MIN(al2.scan_timestamp)
                              FROM attendance_logs al2
                              WHERE al2.student_id = al.student_id
                              AND al2.event_id = al.event_id
                              AND DATE(al2.scan_timestamp) = DATE(al.scan_timestamp)
                          ) THEN 0 ELSE 1 END as duplicate
                   FROM attendance_logs al
                   JOIN students s ON al.student_id = s.id
                   JOIN events e ON al.event_id = e.event_id
                   WHERE al.event_id = ?
                   ORDER BY al.scan_timestamp DESC""",
                (event_id,)
            ).fetchall()
        else:
            logs = conn.execute(
                """SELECT al.*, s.name, s.course_year, e.event_name,
                          CASE WHEN al.scan_timestamp = (
                              SELECT MIN(al2.scan_timestamp)
                              FROM attendance_logs al2
                              WHERE al2.student_id = al.student_id
                              AND al2.event_id = al.event_id
                              AND DATE(al2.scan_timestamp) = DATE(al.scan_timestamp)
                          ) THEN 0 ELSE 1 END as duplicate
                   FROM attendance_logs al
                   JOIN students s ON al.student_id = s.id
                   JOIN events e ON al.event_id = e.event_id
                   ORDER BY al.scan_timestamp DESC
                   LIMIT 100""",
                ()
            ).fetchall()

        # Convert to list of dicts and ensure duplicate is boolean
        result = []
        for log in logs:
            log_dict = dict(log)
            log_dict['duplicate'] = bool(log_dict['duplicate'])
            result.append(log_dict)

        return result
    finally:
        conn.close()

@app.post("/events")
async def create_event(request: EventCreate):
    """Create a new event"""
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO events (event_name, event_date) VALUES (?, ?)",
            (request.event_name, request.event_date)
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

@app.put("/events/{event_id}")
async def update_event(event_id: int, request: EventUpdate):
    """Update an existing event"""
    conn = get_db()
    try:
        # Check if event exists
        event = conn.execute(
            "SELECT event_id, event_name, event_date FROM events WHERE event_id = ?",
            (event_id,)
        ).fetchone()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Build update query dynamically based on provided fields
        update_fields = []
        values = []

        if request.event_name is not None:
            update_fields.append("event_name = ?")
            values.append(request.event_name)

        if request.event_date is not None:
            update_fields.append("event_date = ?")
            values.append(request.event_date)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Add event_id to values for WHERE clause
        values.append(event_id)

        # Execute update
        conn.execute(
            f"UPDATE events SET {', '.join(update_fields)} WHERE event_id = ?",
            values
        )
        conn.commit()

        return {"status": "success", "message": "Event updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/events/{event_id}")
async def delete_event(event_id: int):
    """Delete an event by event_id"""
    conn = get_db()
    try:
        # Check if event exists
        event = conn.execute(
            "SELECT event_id, event_name FROM events WHERE event_id = ?",
            (event_id,)
        ).fetchone()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Delete attendance logs first (due to foreign key constraint)
        conn.execute(
            "DELETE FROM attendance_logs WHERE event_id = ?",
            (event_id,)
        )

        # Delete the event
        conn.execute(
            "DELETE FROM events WHERE event_id = ?",
            (event_id,)
        )

        conn.commit()
        return {"status": "success", "message": f"Event '{event['event_name']}' deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/active-event")
async def get_active_event():
    """Get the currently active event"""
    conn = get_db()
    try:
        # Get active event from settings (using a simple key-value approach)
        setting = conn.execute(
            "SELECT value FROM settings WHERE key = 'active_event_id'",
            ()
        ).fetchone()

        if not setting:
            return {"active_event": None, "message": "No active event set"}

        active_event_id = int(setting['value'])

        # Get event details
        event = conn.execute(
            "SELECT event_id, event_name, event_date FROM events WHERE event_id = ?",
            (active_event_id,)
        ).fetchone()

        if not event:
            # Active event was deleted, clear the setting
            conn.execute("DELETE FROM settings WHERE key = 'active_event_id'")
            conn.commit()
            return {"active_event": None, "message": "Active event no longer exists"}

        return {
            "active_event": dict(event),
            "message": "Active event retrieved successfully"
        }
    finally:
        conn.close()

@app.post("/active-event")
async def set_active_event(request: ActiveEventSet):
    """Set the active event"""
    conn = get_db()
    try:
        # Check if event exists
        event = conn.execute(
            "SELECT event_id, event_name FROM events WHERE event_id = ?",
            (request.event_id,)
        ).fetchone()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Store active event in settings
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_event_id', ?)",
            (str(request.event_id),)
        )
        conn.commit()

        return {
            "status": "success",
            "active_event": dict(event),
            "message": f"Event '{event['event_name']}' set as active"
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/active-event")
async def clear_active_event():
    """Clear the active event"""
    conn = get_db()
    try:
        conn.execute("DELETE FROM settings WHERE key = 'active_event_id'")
        conn.commit()
        return {"status": "success", "message": "Active event cleared"}
    finally:
        conn.close()

@app.delete("/students/{student_id}")
async def delete_student(student_id: str):
    """Delete a student by student_id"""
    conn = get_db()
    try:
        # Check if student exists
        student = conn.execute(
            "SELECT id, name FROM students WHERE student_id = ?",
            (student_id,)
        ).fetchone()

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Delete attendance logs first (due to foreign key constraint)
        conn.execute(
            "DELETE FROM attendance_logs WHERE student_id = ?",
            (student['id'],)
        )

        # Delete the student
        conn.execute(
            "DELETE FROM students WHERE student_id = ?",
            (student_id,)
        )

        conn.commit()
        return {"status": "success", "message": f"Student {student['name']} deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
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
            "DELETE /students/{student_id} - Delete student by student_id",
            "GET /attendance - Get attendance logs",
            "POST /events - Create event",
            "GET /events - Get all events",
            "PUT /events/{event_id} - Update event by event_id",
            "DELETE /events/{event_id} - Delete event by event_id",
            "GET /active-event - Get active event",
            "POST /active-event - Set active event",
            "DELETE /active-event - Clear active event"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
