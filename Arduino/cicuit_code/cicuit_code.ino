#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 21   // SDA
#define RST_PIN 22  // RST
#define BUZZER_PIN 14
#define GREEN_LED 25   // Green LED → Access Granted
#define RED_LED 26     // Red LED → Access Denied

MFRC522 rfid(SS_PIN, RST_PIN);

// ✅ List of authorized card UIDs (you can add more)
byte authorizedUIDs[][4] = {
  {0x56, 0xEE, 0xC2, 0xB8},  // Example UID #1
  {0xD5, 0x13, 0xF4, 0x5E}, 
  {0xA0, 0xC4, 0x70, 0xAC}, // Example UID #2
   {0x19, 0xE1, 0xDC, 0x14},
   {0x60, 0xAA, 0xB4, 0xB2},
   {0xD5, 0xE7, 0xF5, 0x5E},
};
int authorizedCount = 6;

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);

  // Make sure buzzer and LEDs are off at start
  digitalWrite(BUZZER_PIN, HIGH);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

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

  // Print UID
  Serial.print("Card UID: ");
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();

  // Check if authorized
  if (isAuthorized(rfid.uid.uidByte)) {
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

// ✅ Check if card UID matches any authorized UID
bool isAuthorized(byte *uid) {
  for (int i = 0; i < authorizedCount; i++) {
    bool match = true;
    for (int j = 0; j < 4; j++) {
      if (uid[j] != authorizedUIDs[i][j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
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
