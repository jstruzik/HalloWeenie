# 🎃 HalloWeenie 👻

A Halloween web application that uses motion detection and AI to greet trick-or-treaters with spooky, personalized commentary about their costumes using a skeleton voice.

## Features

- **Motion Detection**: Automatically detects when someone approaches
- **AI Vision**: Analyzes costumes using OpenAI's GPT-4 Vision API
- **Spooky Voice**: Speaks greetings using OpenAI's TTS with a deep, dramatic voice
- **Customizable**: Adjust motion sensitivity and cooldown between greetings
- **Cross-Platform**: Works on Mac and Windows

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=your_actual_api_key_here
PORT=3000
```

### 3. Start the Server

```bash
npm start
```

### 4. Open in Browser

Navigate to `http://localhost:3000`

## Usage

1. **Click START** to begin monitoring for motion
2. The app will automatically:
   - Detect motion when someone approaches
   - Capture their image
   - Analyze their costume with AI
   - Speak a spooky greeting

3. **Adjust Settings**:
   - **Motion Sensitivity**: Lower = more sensitive (detects smaller movements)
   - **Cooldown**: Time in seconds between greetings
   - **Show Video Feed**: Toggle webcam preview (optional)

4. **Test Button**: Capture and analyze current camera view without waiting for motion

## Tips for Best Results

- Position the camera to face your door/walkway
- Adjust motion sensitivity based on camera distance
- Use good lighting for better costume recognition
- Hide the computer - audio will play through speakers
- Recommended cooldown: 10-15 seconds to avoid spamming

## Cost Estimates

Based on OpenAI pricing:
- **Vision API (GPT-4o)**: ~$0.01 per greeting
- **TTS API**: ~$0.0002 per greeting
- **Total**: ~$0.01 per trick-or-treater

For 100 trick-or-treaters: ~$1.00

## Troubleshooting

### Camera Access Issues
- Grant browser permission when prompted
- On Mac: System Settings → Privacy & Security → Camera
- On Windows: Settings → Privacy → Camera

### Audio Not Playing
- Check system volume
- Verify browser can play audio (click to test)
- Check browser console for errors

### "API Key Error"
- Verify `.env` file exists and contains valid API key
- Restart the server after updating `.env`

## Technical Details

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Motion Detection**: Canvas-based frame comparison
- **AI Models**:
  - GPT-4o for vision
  - OpenAI TTS-1 with "onyx" voice

## License

MIT
