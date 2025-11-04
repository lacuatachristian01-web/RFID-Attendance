# Setup Guide

This guide walks through setting up the RFID Attendance System components.

## Hardware & Firmware Setup

### ESP32 and RC522 Wiring

1. **Connect RC522 to ESP32 (SPI interface):**

   - RC522 pins: SDA, SCK, MOSI, MISO, RST
   - ESP32 pins: choose SPI-compatible pins (e.g., SDA = 21, SCK = 18, MOSI = 23, MISO = 19, RST = 22)
   - Ensure wiring is secure to prevent read errors.

2. **Connect LEDs and buzzer for feedback:**

   - Green LED: successful scan
   - Red LED: new registration needed
   - Buzzer: optional sound feedback

3. **Power and Test:**

   - Power ESP32 via USB or battery module
   - Run a simple RC522 example sketch to verify UID reading

### ESP32 Firmware

- Upload Arduino sketch from Arduino/ folder to ESP32 (update with API integration).
- Configure Wi-Fi credentials on ESP32 as per Config/.

## Backend Setup

### Automated Deployment (Recommended)

1. Launch AWS EC2 instance (Ubuntu, t3.micro for free tier).
2. Connect to EC2 via SSH.
3. Clone the repository: `git clone https://github.com/Danncode10/RFID-Attendance.git`
4. Navigate to the project: `cd RFID-Attendance`
5. Make the deployment script executable: `chmod +x deploy.sh`
6. Run the automated deployment script: `./deploy.sh`

The deployment script will automatically:
- Update system packages
- Install Python 3, pip, virtual environment, git, and supervisor
- Set up Python virtual environment in the project directory
- Install Python dependencies from `requirements.txt`
- Initialize the SQLite database using `init_db.py`
- Create logs directory for Supervisor
- Configure supervisor for automatic service management
- Start the FastAPI server on port 8000
- Test the API endpoints

**Note:** The script works from the git repository root directory and doesn't create additional subdirectories.

### Manual Setup (Alternative)

If you prefer manual setup:

1. Launch AWS EC2 instance (Ubuntu, t3.micro for free tier).
2. Connect to EC2 via SSH.
3. Install required packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install python3 python3-pip python3-venv git supervisor -y
   ```
4. Set up virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
5. Install dependencies: `pip install -r requirements.txt`
6. Initialize database: `python3 init_db.py`
7. Start the server: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Security Group Configuration

Configure your EC2 security group to allow inbound traffic on port 8000 (TCP) from your IP address or 0.0.0.0/0 for public access.

### Database Initialization

The `init_db.py` script creates three tables:
- `students`: Stores student RFID IDs, names, and course/year information
- `events`: Stores event names and dates
- `attendance_logs`: Records attendance scans with timestamps

A default event is automatically created if no events exist.

### Service Management

The deployment script sets up Supervisor to automatically manage the FastAPI service:
- Auto-start on system boot
- Automatic restart on failure
- Log management in the `logs/` directory

Check service status: `sudo supervisorctl status rfid-attendance`
Restart service: `sudo supervisorctl restart rfid-attendance`

## Mobile UI Setup

1. Install dependencies: `cd UI/ && npm install`
2. Start the app: `npm start`
3. Configure API endpoint to point to EC2 server for registration and viewing attendance.

## Configuration

- See Config/ directory for configuration files and credentials.
- Set WiFi SSID and password for ESP32 internet connectivity.
