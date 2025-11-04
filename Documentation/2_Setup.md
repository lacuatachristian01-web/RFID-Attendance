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

1. Launch AWS EC2 instance (Ubuntu, t3.micro for free tier).
2. Connect to EC2 via SSH.
3. Install Python and pip: `sudo apt update && sudo apt install python3 python3-pip`
4. Set up virtual environment: `python3 -m venv venv && source venv/bin/activate`
5. Install dependencies: `pip install fastapi uvicorn sqlalchemy sqlite3`
6. Upload Database/schema.sql and run it to initialize SQLite database.
7. Upload FastAPI code and start server: `uvicorn main:app --host 0.0.0.0 --port 8000`
8. Configure security group to allow inbound traffic on port 8000.

## Mobile UI Setup

1. Install dependencies: `cd UI/ && npm install`
2. Start the app: `npm start`
3. Configure API endpoint to point to EC2 server for registration and viewing attendance.

## Configuration

- See Config/ directory for configuration files and credentials.
- Set WiFi SSID and password for ESP32 internet connectivity.
