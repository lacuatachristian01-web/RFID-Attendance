# App Master Plan: ESP32 Wireless RFID Firmware for Event Attendance

## Objective

We are building an ESP32 device with RC522 RFID scanner and an I2C LCD to track attendance for school events. The mobile UI app will now use manual input for RFID UIDs.

- Each scan is linked to a specific event created/managed by the Student Council.
- First-time scans trigger a UI prompt to register the student.
- The device connects to internet and sends scanned data to a FastAPI backend on AWS EC2, which manages the SQLite database.
- Visual/audio feedback confirms successful scans or new registrations.
- Internet connectivity via school WiFi or mobile hotspot ensures reliability.

## Technologies and Components

### Hardware

- ESP32 development board (Wi-Fi enabled)
- RC522 RFID module
- I2C LCD display (e.g., 16x2 or 20x4) for displaying RFID UIDs
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

## Step-by-Step Implementation Plan – Detailed

### Step 1: UI Development and Design

**Goal:** Develop the mobile app interface for student council members to manage events, register students, and monitor attendance.

**Tasks & Details:**

1. Set up React Native project with necessary dependencies for navigation and API integration.
2. Design screens: Event Management, Student Registration, Attendance Logs, Scanner Connection.
3. Implement UI components for creating events, viewing students, logging attendance.
4. Connect to ESP32 hotspot and FastAPI server via API calls.
5. Add UI prompts for registering new RFID scans detected by the hardware.

**Why it matters:**

- Provides the user interface for interaction before hardware integration.
- Ensures the app handles registration and management workflows.

### Step 2: FastAPI Backend Setup

**Goal:** Set up the FastAPI server to handle database operations and API requests from both UI and hardware.

**Tasks & Details:**

1. Set up a Python virtual environment and install FastAPI, Uvicorn, SqlAlchemy, SQLite.
2. Define API endpoints:

   - POST /scan: Receive UID from ESP32, check if student exists, log attendance if yes, return new_student if no.
   - POST /register: Register new student with name/grade from UI.
   - GET /students: Retrieve student list for UI.
   - POST /events: Create/manage events.
   - GET /attendance: View attendance logs.

3. Initialize SQLite database with schema from Database/schema.sql.
4. Secure API with basic auth or API keys if needed.
5. Run FastAPI server for testing with UI.

**Why it matters:**

- Backend is developed early to support UI functionality.

### Step 3: Hardware Setup

**Goal:** Prepare the ESP32 and RC522 module for scanning RFID tags and provide feedback.

**Tasks & Details:**

1. **Connect RC522 to ESP32 (SPI interface):**

   - RC522 pins: SDA, SCK, MOSI, MISO, RST
   - ESP32 pins: choose SPI-compatible pins (e.g., SDA = 21, SCK = 18, MOSI = 23, MISO = 19, RST = 22)
   - Ensure wiring is secure to prevent read errors.

2. **Connect LEDs and buzzer for feedback:**

   - Green LED: successful scan
   - Red LED: new registration needed
   - Buzzer: optional sound feedback

3. **Test basic power & connectivity:**

   - Power ESP32 via USB or battery module
   - Run a simple RC522 example sketch to verify UID reading

**Why it matters:**

- Correct wiring is critical for accurate RFID reading.
- Feedback devices improve usability for students and council members.

### Step 4: ESP32 Hotspot Setup

**Goal:** Make the ESP32 act as a Wi-Fi hotspot so the student council app or device can connect to it directly.

**Tasks & Details:**

1. Use the WiFi.h library to configure an access point (AP mode):

   ```cpp
   WiFi.softAP("EventScanner_01", "password123");
   IPAddress IP = WiFi.softAPIP();
   Serial.print("AP IP address: ");
   Serial.println(IP);
   ```

2. Set SSID and password for security.
3. Test the hotspot using a mobile device or laptop to ensure it is visible and connectable.

**Why it matters:**

- Hotspot ensures wireless communication without relying on school Wi-Fi.
- Students or council members can scan and register offline from the network created by ESP32.

### Step 5: RFID Reading Logic

**Goal:** Detect and read RFID cards, determine if they are new, and prepare data for the database.

**Tasks & Details:**

1. Initialize the RC522 module with the MFRC522 library.
2. Read the UID of each scanned RFID card.
3. Convert UID to a readable string format for SQL storage.
4. Check the database for existing student ID:

   - If exists, prepare to log attendance.
   - If new, trigger registration prompt (LED/buzzer or app interface).

**Sample pseudo-flow:**

Scan RFID -> Read UID -> Convert UID -> Query students table
   -> If exists: log attendance
   -> Else: prompt for registration

**Why it matters:**

- Ensures first-time scans register students properly.
- Avoids duplicate entries in the database.

### Step 7: UI / Registration Prompt (Manual Input)

**Goal:** Allow student council members to manually input RFID UIDs for registration in the mobile app.

**Tasks & Details:**

1. **Manual Input in Mobile App:**

   - Provide a dedicated input field for RFID UID in the registration screen.
   - User manually types or pastes the RFID UID displayed on the ESP32's LCD.
   - Input name/grade/class, send POST /register to FastAPI.

**Why it matters:**

- Simplifies the UI interaction by removing direct hardware integration for registration.
- Provides flexibility for registration even if the hardware is not directly connected to the app.

### Step 8: Feedback Mechanism

**Goal:** Provide real-time feedback to ensure smooth scanning.

**Tasks & Details:**

1. Green LED for successful scan
2. Red LED for first-time registration
3. Optional buzzer: different tones for success/failure
4. Display RFID UID on the I2C LCD screen.
5. Can also display other info on the LCD screen (student name, event name, status messages).

**Why it matters:**

- Instant feedback reduces errors and confusion during events.

### Step 9: Offline Handling (Optional but Recommended)

**Goal:** Ensure scanning works even if Wi-Fi/backend connection fails.

**Tasks & Details:**

1. Use EEPROM or SPIFFS to store temporary scans: UID + timestamp + event_id
2. Once connection is restored, batch upload scans via API to FastAPI server.
3. Mark synced entries as completed to avoid duplicates.

**Why it matters:**

- Avoids lost attendance records during network issues.
- Increases reliability for large school events.

### Step 10: Testing & Debugging

**Goal:** Validate the system for real-world use.

**Tasks & Details:**

1. Test individual RFID scans with known IDs
2. Test first-time registration workflow
3. Verify attendance logging to SQL database
4. Test event-specific logging (multiple events)
5. Test LED/buzzer feedback
6. Simulate offline/online scenario if implementing offline mode

**Why it matters:**

- Ensures robustness and usability.
- Identifies edge cases before deployment.

**Result:** After completing these steps, the ESP32 RFID scanner will be fully functional for wireless event attendance, first-time registration, and API-based SQLite logging, with user-friendly feedback for the student council.
