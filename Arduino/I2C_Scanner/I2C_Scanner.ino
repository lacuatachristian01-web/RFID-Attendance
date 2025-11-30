// #include <Wire.h>

// void setup() {
//   Serial.begin(115200);
//   Serial.println("\nI2C Scanner");
//   Wire.begin(32, 33); // Initialize I2C with SDA on GPIO 32 and SCL on GPIO 33

//   // Set up LCD pins for Wire.begin()
//   // Wire.begin(LCD_SDA, LCD_SCL); // This is already done in your main code
// }

// void loop() {
//   byte error, address;
//   int nDevices;

//   Serial.println("Scanning...");

//   nDevices = 0;
//   for(address = 1; address < 127; address++ ) {
//     // The i2c_scanner uses the return value of
//     // the Write.endTransmisstion to see if
//     // a device did acknowledge to the address.
//     Wire.beginTransmission(address);
//     error = Wire.endTransmission();

//     if (error == 0) {
//       Serial.print("I2C device found at address 0x");
//       if (address<16) {
//         Serial.print("0");
//       }
//       Serial.println(address,HEX);
//       nDevices++;
//     }
//     else if (error==4) {
//       Serial.print("Unknow error at address 0x");
//       if (address<16) {
//         Serial.print("0");
//       }
//       Serial.println(address,HEX);
//     }    
//   }
//   if (nDevices == 0) {
//     Serial.println("No I2C devices found\n");
//   } else {
//     Serial.println("done\n");
//   }
//   delay(5000); // Wait 5 seconds for next scan
// }









#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define SDA_PIN 32
#define SCL_PIN 33

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();         // Initialize LCD
  lcd.backlight();    // Turn backlight ON
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Hello, ESP32!");
  delay(1000);
  lcd.setCursor(0, 1);
  lcd.print("Addr: 0x27");
}

void loop() {}

