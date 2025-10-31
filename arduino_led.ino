// HalloWeenie Arduino Mega 2560 + Neopixel Ring Controller
// Upload this to your Arduino Mega 2560
// Requires: Adafruit NeoPixel library (Install via Arduino Library Manager)

#include <Adafruit_NeoPixel.h>

#define LED_PIN 6          // Pin connected to NeoPixel ring (can use any digital pin)
#define LED_COUNT 24       // Number of LEDs in your ring

Adafruit_NeoPixel ring(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  ring.begin();           // Initialize NeoPixel ring
  ring.setBrightness(100); // Set brightness higher for testing (0-255)
  ring.show();            // Turn all LEDs off initially
  
  Serial.begin(9600);
  delay(1000); // Give serial time to initialize
  Serial.println("HalloWeenie Arduino Mega Ready with NeoPixel Ring!");
  
  // Test pattern on startup - flash all LEDs to confirm wiring
  Serial.println("Testing NeoPixel ring...");
  for (int i = 0; i < LED_COUNT; i++) {
    ring.setPixelColor(i, ring.Color(255, 0, 0)); // Red
  }
  ring.show();
  delay(500);
  ring.clear();
  ring.show();
  Serial.println("Test complete. Ready for commands!");
}

bool isPulsing = false;
int pulseStep = 0;
int pulseDirection = 1;
unsigned long lastPulseTime = 0;

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "LED_ON") {
      isPulsing = false;
      spookyPulse();
      Serial.println("LED ON - Spooky Pulse");
    }
    else if (command == "LED_OFF") {
      isPulsing = false;
      fadeOut();
      Serial.println("LED OFF");
    }
    else if (command == "LED_PULSE_START") {
      isPulsing = true;
      pulseStep = 0;
      pulseDirection = 1;
      Serial.println("LED PULSE START - Talking");
    }
    else if (command == "LED_PULSE_STOP") {
      isPulsing = false;
      fadeOut();
      Serial.println("LED PULSE STOP");
    }
    else if (command == "LED_BLINK") {
      isPulsing = false;
      spookyBlink();
      Serial.println("LED BLINK COMPLETE");
    }
  }
  
  // Continuous pulse animation while talking
  if (isPulsing) {
    unsigned long currentTime = millis();
    if (currentTime - lastPulseTime >= 30) { // Update every 30ms
      lastPulseTime = currentTime;
      continuousPulse();
    }
  }
}

// Spooky orange pulse effect
void spookyPulse() {
  uint32_t orange = ring.Color(255, 50, 0); // Spooky orange
  
  // Fade in
  for (int brightness = 0; brightness <= 100; brightness += 5) {
    ring.setBrightness(brightness);
    for (int i = 0; i < LED_COUNT; i++) {
      ring.setPixelColor(i, orange);
    }
    ring.show();
    delay(30);
  }
}

// Fade out effect
void fadeOut() {
  // Fade out
  for (int brightness = 100; brightness >= 0; brightness -= 5) {
    ring.setBrightness(brightness);
    ring.show();
    delay(30);
  }
  
  // Turn all off
  ring.clear();
  ring.show();
}

// Spooky blink pattern
void spookyBlink() {
  uint32_t purple = ring.Color(128, 0, 128);
  uint32_t green = ring.Color(0, 255, 0);
  
  for (int blink = 0; blink < 3; blink++) {
    // Alternate colors
    uint32_t color = (blink % 2 == 0) ? purple : green;
    
    for (int i = 0; i < LED_COUNT; i++) {
      ring.setPixelColor(i, color);
    }
    ring.show();
    delay(150);
    
    ring.clear();
    ring.show();
    delay(150);
  }
}

// Continuous pulse animation for talking
void continuousPulse() {
  uint32_t orange = ring.Color(255, 50, 0);
  
  // Pulse brightness up and down
  pulseStep += pulseDirection * 3;
  
  if (pulseStep >= 100) {
    pulseStep = 100;
    pulseDirection = -1;
  } else if (pulseStep <= 20) {
    pulseStep = 20;
    pulseDirection = 1;
  }
  
  ring.setBrightness(pulseStep);
  for (int i = 0; i < LED_COUNT; i++) {
    ring.setPixelColor(i, orange);
  }
  ring.show();
}

// Optional: Spinning effect (you can add this command if you want)
void spinningEffect() {
  uint32_t orange = ring.Color(255, 50, 0);
  
  for (int j = 0; j < LED_COUNT * 2; j++) {
    for (int i = 0; i < LED_COUNT; i++) {
      if (i == (j % LED_COUNT)) {
        ring.setPixelColor(i, orange);
      } else {
        ring.setPixelColor(i, ring.Color(0, 0, 0));
      }
    }
    ring.show();
    delay(50);
  }
}
