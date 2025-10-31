require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Arduino Serial Connection
let arduinoPort = null;
const ARDUINO_PATH = process.env.ARDUINO_PORT || '/dev/cu.usbmodem14201'; // Update this to your Arduino port

// Try to connect to Arduino
function connectArduino() {
  try {
    arduinoPort = new SerialPort({
      path: ARDUINO_PATH,
      baudRate: 9600
    });

    const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    arduinoPort.on('open', () => {
      console.log('🔌 Arduino connected on', ARDUINO_PATH);
    });

    arduinoPort.on('error', (err) => {
      console.log('⚠️  Arduino connection error:', err.message);
      console.log('💡 LED control disabled - app will work without Arduino');
      arduinoPort = null;
    });

    parser.on('data', (data) => {
      console.log('Arduino:', data);
    });
  } catch (error) {
    console.log('⚠️  Could not connect to Arduino:', error.message);
    console.log('💡 LED control disabled - app will work without Arduino');
    arduinoPort = null;
  }
}

// Send command to Arduino
function sendToArduino(command) {
  if (arduinoPort && arduinoPort.isOpen) {
    arduinoPort.write(command + '\n');
    return true;
  }
  return false;
}

// Initialize Arduino connection
connectArduino();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Track last greeting time to avoid spam
let lastGreetingTime = 0;
const COOLDOWN_MS = 10000; // 10 seconds between greetings

// Analyze costume and generate greeting
app.post('/api/greet', async (req, res) => {
  try {
    const { images } = req.body;

    // Check cooldown
    const now = Date.now();
    if (now - lastGreetingTime < COOLDOWN_MS) {
      return res.json({
        success: false,
        message: 'Cooling down... wait a moment'
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    // Log image details
    const totalSize = images.reduce((sum, img) => sum + img.length, 0);
    const totalSizeKB = Math.round((totalSize * 3 / 4) / 1024);
    console.log(`\n📸 Received ${images.length} images: ${totalSizeKB} KB total`);
    console.log(`Image format: ${images[0].substring(0, 30)}...`);

    // Optionally save last image for debugging (uncomment to enable)
    // const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    // fs.writeFileSync('last_captured.jpg', base64Data, 'base64');
    // console.log('💾 Saved image to last_captured.jpg for inspection');

    // Turn on LED when processing starts
    sendToArduino('LED_ON');

    console.log('🤖 Analyzing costume with GPT-4 Vision...');

    // Build content array with text prompt and all images
    const content = [
      {
        type: "text",
        text: `You are a friendly but spooky skeleton host greeting trick-or-treaters at the door on Halloween night. You're a theatrical character who's been waiting all year for Halloween - think playful haunted house performer.

Look at the images (multiple shots captured a moment apart to get a clear view) and deliver a SHORT (2 sentences max) greeting that:
- Opens with a dramatic Halloween exclamation ("MUAHAHAHA!" or "Well, well, well..." or "Ah-ha-ha!")
- Makes a fun Halloween pun or playful comment about their costume or appearance
- Keeps the spooky Halloween spirit while being entertaining and welcoming

Only if you cannot tell what the image is, make a general spooky greeting to the arriving guests.

Jump straight into character with your greeting - be theatrical and fun!`
      }
    ];

    // Add all images to the content array
    images.forEach(image => {
      content.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    });

    // Send images to GPT-4 Vision
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: 150
    });

    const greeting = visionResponse.choices[0].message.content;
    console.log('✅ Generated greeting:', greeting);
    console.log(`📊 Tokens used: ${visionResponse.usage?.total_tokens || 'unknown'}`);

    // Convert to speech using OpenAI TTS
    console.log('🎤 Generating spooky voice...');
    const mp3Response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "onyx", // Deep, dramatic voice
      input: greeting,
      instructions: `Delivery: Theatrical and dramatic with exaggerated emphasis, like performing from beyond the grave. Use dramatic pauses, sudden outbursts, and bone-rattling cackles where written.

Voice: Darkly comedic and slightly unhinged, with gleeful energy that suggests centuries of isolation in a crypt. Mischievous and eager, like a showman finally getting an audience.

Tone: Equal parts spooky and hilarious—creepy enough to send shivers but amusing enough to make people laugh. Grandiose and theatrical, reveling in the drama of Halloween night.

Pronunciation: Emphasize spooky words and puns with relish. Stretch out dramatic exclamations (like "Muahahaha" or "Well, well, well"). Make death jokes sound deliciously wicked.`,
      speed: 1.2
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    const audioSizeKB = Math.round(buffer.length / 1024);
    console.log(`🔊 Audio generated: ${audioSizeKB} KB`);

    const totalTime = Date.now() - now;
    console.log(`⏱️  Total processing time: ${totalTime}ms\n`);

    // Start pulsing LED for talking animation
    sendToArduino('LED_PULSE_START');

    // Send audio back as base64
    res.json({
      success: true,
      audio: buffer.toString('base64'),
      text: greeting
    });

    // Update last greeting time AFTER successful completion
    lastGreetingTime = Date.now();

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    
    // Turn off LED on error
    sendToArduino('LED_OFF');
    
    res.status(500).json({
      error: 'Failed to generate greeting',
      details: error.message
    });
  }
});

// Endpoint to stop LED pulse when audio finishes
app.post('/api/audio-done', (req, res) => {
  sendToArduino('LED_PULSE_STOP');
  console.log('🔇 Audio finished, stopping LED pulse');
  res.json({ success: true });
});

// List available serial ports
app.get('/api/arduino/ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json({
      ports: ports,
      currentPort: arduinoPort && arduinoPort.isOpen ? arduinoPort.path : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to specific Arduino port
app.post('/api/arduino/connect', async (req, res) => {
  try {
    const { port } = req.body;
    
    if (!port) {
      return res.status(400).json({ success: false, message: 'No port specified' });
    }
    
    // Close existing connection if any
    if (arduinoPort && arduinoPort.isOpen) {
      await arduinoPort.close();
      console.log('🔌 Closed previous Arduino connection');
    }
    
    // Connect to new port
    arduinoPort = new SerialPort({
      path: port,
      baudRate: 9600
    });
    
    const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    arduinoPort.on('open', () => {
      console.log('🔌 Arduino connected on', port);
    });
    
    arduinoPort.on('error', (err) => {
      console.log('⚠️  Arduino connection error:', err.message);
    });
    
    parser.on('data', (data) => {
      console.log('Arduino:', data);
    });
    
    res.json({ success: true, message: `Connected to ${port}` });
    
  } catch (error) {
    console.error('❌ Error connecting to Arduino:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HalloWeenie is alive!' });
});

app.listen(PORT, () => {
  console.log(`🎃 HalloWeenie server running on http://localhost:${PORT}`);
  console.log('👻 Ready to greet trick-or-treaters!');
});
