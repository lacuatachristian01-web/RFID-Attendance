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
    "DELETE /students/{student_id} - Delete student by student_id",
    "GET /attendance - Get attendance logs",
    "POST /events - Create event",
    "GET /events - Get all events",
    "PUT /events/{event_id} - Update event by event_id",
    "DELETE /events/{event_id} - Delete event by event_id"
  ]
  }
  ```

### POST /scan

Receive RFID UID from ESP32, check if student exists, and log attendance if authorized.

- **Method:** POST
- **Parameters (JSON body):**
  - `uid` (string, required): RFID UID
  - `event_id` (integer, optional): Event ID for the scan (defaults to 1)

- **Success Response (200) - First scan today:**
  ```json
  {
    "authorized": true,
    "name": "John Doe",
    "event_id": 1,
    "duplicate": false
  }
  ```

- **Success Response (200) - Already scanned today:**
  ```json
  {
    "authorized": true,
    "name": "John Doe",
    "event_id": 1,
    "message": "Already scanned for this event today",
    "duplicate": true
  }
  ```

- **Error Response (400) - No active event:**
  ```json
  {
    "detail": "No active event set. Please set an active event first."
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

### PUT /events/{event_id}

Update an existing event.

- **Method:** PUT
- **Parameters:**
  - `event_id` (integer, required): Event ID in URL path
  - `event_name` (string, optional): New event name
  - `event_date` (string, optional): New event date in YYYY-MM-DD format

- **Success Response (200):**
  ```json
  {
    "status": "success",
    "message": "Event updated successfully"
  }
  ```

- **Error Response (404):** Event not found
  ```json
  {
    "detail": "Event not found"
  }
  ```

- **Error Response (400):** No fields to update
  ```json
  {
    "detail": "No fields to update"
  }
  ```

### DELETE /events/{event_id}

Delete an event by ID. This will also delete all associated attendance logs.

- **Method:** DELETE
- **Parameters:**
  - `event_id` (integer, required): Event ID in URL path

- **Success Response (200):**
  ```json
  {
    "status": "success",
    "message": "Event 'Event Name' deleted successfully"
  }
  ```

- **Error Response (404):** Event not found
  ```json
  {
    "detail": "Event not found"
  }
  ```

### GET /active-event

Get the currently active event.

- **Method:** GET
- **Parameters:** None
- **Success Response (200):**
  ```json
  {
    "active_event": {
      "event_id": 1,
      "event_name": "Sample Event",
      "event_date": "2023-12-01"
    },
    "message": "Active event retrieved successfully"
  }
  ```

- **Response when no active event (200):**
  ```json
  {
    "active_event": null,
    "message": "No active event set"
  }
  ```

### POST /active-event

Set an event as the active event for RFID scanning.

- **Method:** POST
- **Parameters (JSON body):**
  - `event_id` (integer, required): ID of the event to set as active

- **Success Response (200):**
  ```json
  {
    "status": "success",
    "active_event": {
      "event_id": 1,
      "event_name": "Sample Event"
    },
    "message": "Event 'Sample Event' set as active"
  }
  ```

- **Error Response (404):** Event not found
  ```json
  {
    "detail": "Event not found"
  }
  ```

### DELETE /active-event

Clear the active event (no event will be active for scanning).

- **Method:** DELETE
- **Parameters:** None
- **Success Response (200):**
  ```json
  {
    "status": "success",
    "message": "Active event cleared"
  }
  ```

## Interactive Documentation

When the API is running, visit `http://your-ec2-instance:8000/docs` to access the interactive Swagger UI documentation where you can test all endpoints directly in your browser.
