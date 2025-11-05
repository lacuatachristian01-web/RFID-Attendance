#!/usr/bin/env python3
"""
Mock API server for testing ESP32 RFID firmware
Run this locally to test the ESP32 HTTP requests before deploying to EC2
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from datetime import datetime

app = FastAPI(title="Mock RFID Attendance API")

class ScanRequest(BaseModel):
    uid: str
    event_id: int = 1

# Mock database of authorized UIDs
AUTHORIZED_UIDS = {
    "56EEC2B8": {"name": "John Doe", "course_year": "BSIT-3"},
    "D513F45E": {"name": "Jane Smith", "course_year": "BSIT-2"},
    "A0C470AC": {"name": "Bob Johnson", "course_year": "Grade 10"},
    "19E1DC14": {"name": "Alice Brown", "course_year": "Grade 11"},
    "60AAB4B2": {"name": "Charlie Wilson", "course_year": "BSIT-1"},
    "D5E7F55E": {"name": "Diana Davis", "course_year": "Grade 12"}
}

@app.get("/")
def root():
    return {
        "message": "Mock RFID Attendance API running locally",
        "version": "1.0.0",
        "endpoints": [
            "POST /scan - Scan RFID card (mock)",
            "GET /students - Get mock students"
        ]
    }

@app.post("/scan")
def scan_card(request: ScanRequest):
    uid = request.uid.upper()
    print(f"Mock API: Received scan request for UID: {uid}, Event: {request.event_id}")

    if uid in AUTHORIZED_UIDS:
        student = AUTHORIZED_UIDS[uid]
        print(f"Mock API: Access granted for {student['name']}")
        return {
            "authorized": True,
            "name": student["name"]
        }
    else:
        print(f"Mock API: Access denied for UID: {uid}")
        return {
            "authorized": False,
            "uid": uid
        }

@app.get("/students")
def get_students():
    return [
        {
            "id": i+1,
            "rfid_id": uid,
            "name": data["name"],
            "course_year": data["course_year"]
        }
        for i, (uid, data) in enumerate(AUTHORIZED_UIDS.items())
    ]

if __name__ == "__main__":
    print("Starting Mock RFID Attendance API...")
    print("Test UIDs:")
    for uid, data in AUTHORIZED_UIDS.items():
        print(f"  {uid} -> {data['name']} ({data['course_year']})")
    print("\nAPI will be available at: http://localhost:8000")
    print("Use this for testing ESP32 firmware before deploying to EC2")
    uvicorn.run(app, host="0.0.0.0", port=8000)
