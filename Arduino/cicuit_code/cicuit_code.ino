#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "../../Config/esp32_config.h"

#define SS_PIN 21   // SDA
#define RST_PIN 22  // RST
#define BUZZER_PIN 14
#define GREEN_LED 25   // Green LED → Access Granted
#define RED_LED 26     // Red LED → Access Denied

MFRC522 rfid(SS_PIN, RST_PIN);

// // ✅ List of authorized card UIDs (you can add more)
// byte authorizedUIDs[][4] = {
//   {0x56, 0xEE, 0xC2, 0xB8},  // Example UID #1
//   {0xD5, 0x13, 0xF4, 0x5E}, 
//   {0xA0, 0xC4, 0x70, 0xAC}, // Example UID #2
//    {0x19, 0xE1, 0xDC, 0x14},
//    {0x60, 0xAA, 0xB4, 0xB2},
//    {0xD5, 0xE7, 0xF5, 0x5E},
// };
// int authorizedCount = 6;

void setup() {
  Serial.begin(115200);

  // Initialize WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  SPI.begin();
  rfid.PCD_Init();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);

  // Make sure buzzer and LEDs are off at start
  digitalWrite(BUZZER_PIN, HIGH);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  Serial.println("RFID Attendance System Ready!");
  Serial.println("Place your card near the reader...");
}

void loop() {
  // Wait for a card
  if (!rfid.PICC_IsNewCardPresent()) {
    digitalWrite(BUZZER_PIN, HIGH);  // ensure silent when idle
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    digitalWrite(BUZZER_PIN, HIGH);  // ensure silent when idle
    return;
  }

  // Convert UID to string format
  String uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    uidString += String(rfid.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();

  Serial.print("Card UID: ");
  Serial.println(uidString);

  // Send UID to API for authorization
  bool authorized = checkAuthorizationWithAPI(uidString);

  if (authorized) {
    Serial.println("Access Granted");

    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);

    beepOnce();  // 🔊 single beep
    delay(500);

    digitalWrite(GREEN_LED, LOW);
  } else {
    Serial.println("Access Denied");

    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);

    beepDenied();  // 🚫 double beep
    delay(500);

    digitalWrite(RED_LED, LOW);
  }

  // Halt card
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// Check authorization with API server
bool checkAuthorizationWithAPI(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + String(SCAN_ENDPOINT);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT);

  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"uid\":\"" + uid + "\",";
  jsonPayload += "\"event_id\":" + String(DEFAULT_EVENT_ID);
  jsonPayload += "}";

  Serial.print("Sending request to: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);

    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);

    if (error) {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
      http.end();
      return false;
    }

    // Check if authorized
    bool authorized = doc["authorized"] | false;
    if (authorized) {
      String name = doc["name"] | "Unknown";
      Serial.print("Welcome, ");
      Serial.println(name);
    } else {
      Serial.println("Card not registered");
    }

    http.end();
    return authorized;
  } else {
    Serial.print("HTTP request failed, error: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

void beepOnce() {
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);  // short beep
  digitalWrite(BUZZER_PIN, HIGH);
}

void beepDenied() {
  for (int i = 0; i < 2; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(80);
    digitalWrite(BUZZER_PIN, LOW);
    delay(80);
  }
}
