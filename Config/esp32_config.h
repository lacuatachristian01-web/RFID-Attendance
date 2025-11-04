// ESP32 Configuration File
// WiFi and API settings for RFID Attendance System

#ifndef ESP32_CONFIG_H
#define ESP32_CONFIG_H

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";          // Replace with your WiFi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";  // Replace with your WiFi password

// API Configuration
// For testing: use "http://192.168.1.XXX:8000" (replace XXX with your computer's IP)
// For production: use "http://YOUR_EC2_IP:8000"
const char* API_BASE_URL = "http://192.168.1.100:8000";  // Update this IP for testing
const char* SCAN_ENDPOINT = "/scan";

// Default event ID (can be changed via configuration)
const int DEFAULT_EVENT_ID = 1;

// HTTP timeout in milliseconds
const int HTTP_TIMEOUT = 5000;

#endif
