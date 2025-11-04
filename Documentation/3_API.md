# API Documentation

This document describes the FastAPI endpoints for the RFID Attendance System.

## Endpoints

### POST /scan

Receive UID from ESP32, check if student exists, log attendance if yes.

- **Parameters (JSON body):**
  - `uid` (string): RFID UID
  - `event_id` (int): Event ID for the scan

- **Response:**
  - `{"authorized": true, "name": "John Doe"}` if student exists and attendance logged
  - `{"authorized": false, "uid": "56EEC2B8"}` if new student needs registration

### POST /register

Register new student with name/grade from UI.

- **Parameters (JSON body):**
  - `rfid_id` (string): RFID UID
  - `name` (string): Student name
  - `grade` (string): Student grade

- **Response:**
  - `{"status": "success", "message": "Student registered"}`

### GET /students

Retrieve student list for UI.

- **Parameters:** None
- **Response:**
  - `[{"student_id": 1, "rfid_id": "ABC123", "name": "John Doe", "grade": "Grade 10"}, ...]`

### POST /events

Create/manage events.

- **Parameters (JSON body):**
  - `event_name` (string): Name of the event
  - `event_date` (string): Date in YYYY-MM-DD format

- **Response:**
  - `{"status": "success", "event_id": 1, "message": "Event created"}`

### GET /attendance

View attendance logs.

- **Parameters (query, optional):**
  - `event_id` (int): Filter by event
- **Response:**
  - `[{"log_id": 1, "student_id": 1, "event_id": 1, "scan_timestamp": "2023-10-28T10:00:00Z"}, ...]`
