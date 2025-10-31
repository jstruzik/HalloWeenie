#!/bin/bash

echo "================================"
echo "  HalloWeenie Spooky Greeter"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo ""
    echo "Please create a .env file with your configuration:"
    echo "1. Copy .env.example to .env"
    echo "2. Add your OpenAI API key"
    echo ""
    echo "Example .env file:"
    echo "OPENAI_API_KEY=your_key_here"
    echo "PORT=3000"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to install dependencies!"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo ""
fi

echo "Starting HalloWeenie server..."
echo "Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js
