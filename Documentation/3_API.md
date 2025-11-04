# API Documentation

This document describes the FastAPI endpoints for the RFID Attendance System.

## Base URL
```
http://your-ec2-instance:8000
```

## Endpoints

### GET /

Root endpoint providing API information.

- **Method:** GET
- **Parameters:** None
- **Response:**
  ```json
  {
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
  ```

### POST /scan

Receive RFID UID from ESP32, check if student exists, and log attendance if authorized.

- **Method:** POST
- **Parameters (JSON body):**
  - `uid` (string, required): RFID UID
  - `event_id` (integer, optional): Event ID for the scan (defaults to 1)

- **Success Response (200):**
  ```json
  {
    "authorized": true,
    "name": "John Doe"
  }
  ```

- **Unauthorized Response (200):**
  ```json
  {
    "authorized": false,
    "uid": "56EEC2B8"
  }
  ```

### POST /register

Register a new student with RFID ID, name, and course/year information.

- **Method:** POST
- **Parameters (JSON body):**
  - `rfid_id` (string, required): RFID UID
  - `name` (string, required): Student name
  - `course_year` (string, required): Student course and year (e.g., "BSIT-3", "Grade 10")

- **Success Response (200):**
  ```json
  {
    "status": "success",
    "message": "Student registered"
  }
  ```

- **Error Response (400):** RFID already registered
  ```json
  {
    "detail": "RFID already registered"
  }
  ```

### GET /students

Retrieve list of all registered students.

- **Method:** GET
- **Parameters:** None
- **Response (200):**
  ```json
  [
    {
      "id": 1,
      "rfid_id": "ABC123",
      "name": "John Doe",
      "course_year": "BSIT-3"
    }
  ]
  ```

### GET /attendance

View attendance logs, optionally filtered by event.

- **Method:** GET
- **Query Parameters:**
  - `event_id` (integer, optional): Filter logs by specific event ID

- **Response (200):** Returns attendance logs with student and event details
  ```json
  [
    {
      "log_id": 1,
      "student_id": 1,
      "event_id": 1,
      "scan_timestamp": "2023-10-28T10:00:00",
      "name": "John Doe",
      "course_year": "BSIT-3",
      "event_name": "Default Event"
    }
  ]
  ```

### POST /events

Create a new event.

- **Method:** POST
- **Parameters (form data):**
  - `event_name` (string, required): Name of the event
  - `event_date` (string, required): Date in YYYY-MM-DD format

- **Success Response (200):**
  ```json
  {
    "status": "success",
    "event_id": 1,
    "message": "Event created"
  }
  ```

### GET /events

Retrieve list of all events.

- **Method:** GET
- **Parameters:** None
- **Response (200):**
  ```json
  [
    {
      "event_id": 1,
      "event_name": "Default Event",
      "event_date": "2023-10-28"
    }
  ]
  ```

## Interactive Documentation

When the API is running, visit `http://your-ec2-instance:8000/docs` to access the interactive Swagger UI documentation where you can test all endpoints directly in your browser.
