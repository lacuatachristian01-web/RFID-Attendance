# RFID Attendance System Overview

## Objective

We are building a wireless ESP32 device with RC522 RFID scanner to track attendance for school events.

- Each scan is linked to a specific event created/managed by the Student Council.
- First-time scans trigger a UI prompt to register the student.
- The device connects to internet and sends scanned data to a FastAPI backend on AWS EC2, which manages the SQLite database.
- Visual/audio feedback confirms successful scans or new registrations.
- Internet connectivity via school WiFi or mobile hotspot ensures reliability.

## Technologies and Components

### Hardware

- ESP32 development board (Wi-Fi enabled)
- RC522 RFID module
- LEDs and/or buzzer for feedback

### Software / Libraries

#### Arduino / C++ (ESP32 firmware)

- MFRC522 library for RFID reading
- WiFi.h (ESP32 Wi-Fi connectivity)
- HTTPClient.h for API requests to FastAPI
- Optional: EEPROM.h or SPIFFS.h for temporary offline storage

#### Backend

- FastAPI (Python) for REST API
- SQLite as the database
- SqlAlchemy or similar ORM for database interactions

### Database

- SQLite
- Tables: students, events, attendance_logs

## System Architecture

The system consists of three main components:

1. **ESP32 Scanner**: Connects to WiFi, reads RFID cards, sends data to backend via HTTP.
2. **FastAPI Backend**: Runs on AWS EC2, handles API requests, manages database storage and retrieval.
3. **React Native UI**: Mobile app for student council to manage events, register students, and view attendance.
