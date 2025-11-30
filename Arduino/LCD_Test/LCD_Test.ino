#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Define I2C LCD pins and object
#define LCD_SDA 32
#define LCD_SCL 33
LiquidCrystal_I2C lcd(0x27, 16, 2); // I2C address 0x27, 16 columns, 2 rows

void setup() {
  Serial.begin(115200);
  Serial.println("LCD Test Starting...");

  // Initialize I2C
  Wire.begin(LCD_SDA, LCD_SCL);
  Serial.println("Wire.begin() called");

  // Initialize LCD
  Serial.println("Trying LCD initialization...");
  lcd.begin(16, 2);
  Serial.println("LCD begin(16, 2) called");

  // Turn on backlight
  lcd.backlight();
  Serial.println("LCD backlight() called");

  // Clear and print test message
  lcd.clear();
  Serial.println("LCD clear() called");
  lcd.print("LCD Test!");
  Serial.println("Printed 'LCD Test!' to LCD");

  Serial.println("LCD Test setup complete. Check if you see 'LCD Test!' on the LCD.");
}

void loop() {
  // Simple test - blink cursor
  static bool cursorOn = false;
  cursorOn = !cursorOn;
  if (cursorOn) {
    lcd.cursor();
  } else {
    lcd.noCursor();
  }
  delay(1000);
}
