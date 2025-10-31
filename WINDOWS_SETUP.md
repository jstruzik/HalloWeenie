# HalloWeenie - Windows Setup Guide

## Prerequisites

1. **Arduino Software**: Download and install from [arduino.cc](https://www.arduino.cc/en/software)
2. **Arduino Mega 2560** with USB cable
3. **Adafruit NeoPixel Ring (24 LEDs)**
4. **Webcam** (built-in or USB)

## Hardware Setup

### NeoPixel Wiring
Connect your NeoPixel ring to the Arduino Mega:
- **G (Ground)** → Arduino **GND**
- **PWR (Power)** → Arduino **5V**
- **IN (Data)** → Arduino **Pin 6**

### Upload Arduino Sketch
1. Open Arduino IDE
2. Install the **Adafruit NeoPixel** library:
   - Go to: Sketch → Include Library → Manage Libraries
   - Search "Adafruit NeoPixel"
   - Install it
3. Open `arduino_led.ino`
4. Select **Tools → Board → Arduino Mega 2560**
5. Select **Tools → Port** (COM3, COM4, etc.)
6. Click **Upload**
7. **Close Arduino IDE** (important - the app needs serial port access)

## Software Setup

### Prerequisites
1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org) (LTS version recommended)

### Installation

1. **Extract** the HalloWeenie folder to your desired location

2. **Create `.env` file** in the HalloWeenie folder:
   - Copy `.env.example` to `.env`
   - Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```
   
   Get your API key from: https://platform.openai.com/api-keys

3. **Run the app**:
   - **Double-click `start.bat`** - That's it!
   - The script will automatically install dependencies on first run
   - Your browser will open to `http://localhost:3000`

### First Time Running
The first time you run `start.bat`, it will:
- Check that Node.js is installed
- Automatically run `npm install` to install dependencies
- Start the server

Subsequent runs will start immediately.

## Usage

1. **Connect Arduino**:
   - Click the "Refresh" button next to Arduino Port
   - Select your Arduino from the dropdown (e.g., COM3)
   - Click "Connect"
   
2. **Start monitoring**:
   - Click **START** to begin watching for trick-or-treaters
   - Adjust **Motion Sensitivity** (default: 20)
   - Set **Cooldown** time between greetings (default: 10 seconds)

3. **NeoPixel Ring** will:
   - Turn on when motion is detected
   - Pulse while the skeleton speaks
   - Turn off when done

## Troubleshooting

### Arduino not connecting
- Make sure Arduino IDE Serial Monitor is **closed**
- Click "Refresh" to rescan for ports
- Select the correct COM port from the dropdown
- Click "Connect" to establish connection
- Try unplugging and replugging the Arduino

### Webcam not working
- Allow browser to access camera when prompted
- Check Windows Privacy Settings → Camera permissions

### No audio
- Check browser audio isn't muted
- Test with the **TEST GREETING** button

### NeoPixel not lighting up
- Verify wiring connections
- Test Arduino sketch using Arduino IDE Serial Monitor first
- Send `LED_ON` command to test

## Package Contents

When distributing HalloWeenie, include these files:
- ✅ `start.bat` - Launch script (double-click to run)
- ✅ `server.js` - Main server file
- ✅ `package.json` - Dependencies list
- ✅ `public/` folder - Web interface
- ✅ `arduino_led.ino` - Arduino sketch
- ✅ `.env.example` - Configuration template
- ✅ `WINDOWS_SETUP.md` - This guide

## Notes

- The Arduino must stay connected via USB while running
- Node.js must be installed on the Windows machine
- The `.env` file stays on each user's machine (don't share your API key!)
- All dependencies are automatically installed on first run
