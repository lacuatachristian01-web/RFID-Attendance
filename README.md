# RFID Attendance

*Wireless ESP32 RFID Scanner for School Event Attendance with FastAPI Backend on AWS EC2*

This project implements a wireless RFID attendance system for school events using an ESP32 and RC522 RFID module. Scans are sent via HTTP to a FastAPI backend server running on AWS EC2 that manages the SQLite database. First-time scans prompt registration through the mobile UI. The student council can manage events and view attendance through a React Native mobile app.

---

## Features

- **Cloud-based Backend**: FastAPI server deployed on AWS EC2 with automated setup
- **Automated Deployment**: One-command deployment script for EC2 instances
- **WiFi-connected ESP32**: Connects to school WiFi or mobile hotspot for internet access
- **RFID Scanning**: Reads RFID cards with RC522 module
- **Real-time API**: HTTP requests to FastAPI backend for attendance logging
- **Registration Workflow**: First-time scan registration via mobile app
- **Visual/Audio Feedback**: LED and buzzer feedback on ESP32
- **Event Management**: Create and manage multiple events
- **Attendance Analytics**: View attendance logs with student and event details

---

## Architecture

```
ESP32 + RC522 ──WiFi──> AWS EC2 (FastAPI) ──> SQLite Database
                        │
Mobile App ─────────────┘
```

---

## Hardware

- ESP32 Development Board (WiFi-enabled)
- RC522 RFID Reader Module
- LED and Buzzer for feedback
- AWS EC2 Instance (Ubuntu) for backend
- Optional: Small OLED display

---

## Software Stack

### ESP32 Firmware
- Arduino IDE or PlatformIO
- MFRC522 library for RFID reading
- WiFi.h for internet connectivity
- HTTPClient.h for API requests

### Backend (AWS EC2)
- Python 3.8+
- FastAPI for REST API
- Uvicorn ASGI server
- SQLite3 database
- SQLAlchemy ORM
- Supervisor for process management

### Mobile UI
- React Native / Expo
- API integration with FastAPI backend

---

## Database Schema

**students**
| id | rfid_id | name | course_year |

**events**
| event_id | event_name | event_date |

**attendance_logs**
| log_id | student_id | event_id | scan_timestamp |

*Note:* All tables use SQLite-specific syntax. See Database/schema.sql for full schema.

---

## Quick Start

### 1. Deploy Backend to AWS EC2

```bash
# On your EC2 instance:
git clone https://github.com/Danncode10/RFID-Attendance.git
cd RFID-Attendance
chmod +x deploy.sh
./deploy.sh
```

The script automatically:
- Updates system packages
- Installs Python, pip, virtual environment, supervisor
- Sets up Python virtual environment in project directory
- Installs dependencies from requirements.txt
- Initializes SQLite database
- Creates logs directory
- Configures supervisor for auto-start
- Starts FastAPI server on port 8000

### 2. Configure Security Group

Allow inbound traffic on port 8000 (TCP) in your EC2 security group.

### 3. Setup ESP32 Hardware

1. Connect RC522 to ESP32 (SPI pins)
2. Connect LED and buzzer for feedback
3. Upload Arduino firmware from Arduino/ folder
4. Configure WiFi credentials to point to your EC2 API

### 4. Setup Mobile App

```bash
cd UI/
npm install
npm start
```

Configure API endpoint to your EC2 instance: `http://your-ec2-ip:8000`

---

## Project Structure

- **UI/**: React Native mobile app for event management and attendance viewing
- **app/**: FastAPI backend application code
- **Arduino/**: ESP32 firmware for RFID scanning
- **Database/**: SQLite schemas and initialization scripts
- **Hardware/**: Wiring diagrams and hardware setup notes
- **Documentation/**: Setup guides, API docs, and development notes
- **Config/**: Configuration files and credentials
- **deploy.sh**: Automated EC2 deployment script
- **init_db.py**: Database initialization script
- **requirements.txt**: Python dependencies

---

## API Endpoints

- `GET /` - API information
- `POST /scan` - Scan RFID card and log attendance
- `POST /register` - Register new student
- `GET /students` - Get all registered students
- `GET /attendance` - Get attendance logs (with optional event filter)
- `POST /events` - Create new event
- `GET /events` - Get all events

Interactive API docs available at: `http://your-ec2-ip:8000/docs`

---

## Development

See Documentation/ folder for detailed setup guides, API documentation, and development notes.

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize database
python3 init_db.py

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## License

MIT License
