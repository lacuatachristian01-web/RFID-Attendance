# Arduino Firmware

This folder contains the ESP32 firmware for the RFID attendance scanner.

## Files
- `cicuit_code/cicuit_code.ino` - Main ESP32 firmware
- `../Config/esp32_config.h` - WiFi and API configuration
- `../mock_api.py` - Mock API server for testing

## Required Libraries
Install these in Arduino IDE:
- MFRC522 (for RFID reading)
- WiFi
- HTTPClient
- ArduinoJson (for JSON parsing)

## Testing Setup

### 1. Test with Mock API (Recommended First Step)
```bash
# Run the mock API server on your computer
python mock_api.py
```
The mock API will be available at `http://localhost:8000`

### 2. Configure ESP32 for Testing
1. Update `Config/esp32_config.h`:
   - Set your WiFi SSID and password
   - Change `API_BASE_URL` to your computer's IP (e.g., `http://192.168.1.100:8000`)
   - Find your computer's IP with: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### 3. Upload to ESP32
1. Open `cicuit_code/cicuit_code.ino` in Arduino IDE
2. Select ESP32 board
3. Upload the code
4. Open Serial Monitor to see debug output

### 4. Test RFID Cards
The mock API includes these test UIDs:
- `56EEC2B8` → John Doe (Authorized - Green LED + single beep)
- `D513F45E` → Jane Smith (Authorized - Green LED + single beep)
- `A0C470AC` → Bob Johnson (Authorized - Green LED + single beep)
- Any other UID → Access Denied (Red LED + double beep)

## Production Deployment
1. Update `Config/esp32_config.h` with your EC2 instance IP
2. Re-upload the firmware to ESP32
3. Test with real API server

## Hardware Connections
- MFRC522 SDA → GPIO 21
- MFRC522 RST → GPIO 22
- Buzzer → GPIO 14
- Green LED → GPIO 25
- Red LED → GPIO 26
