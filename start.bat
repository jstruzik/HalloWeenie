@echo off
echo ================================
echo   HalloWeenie Spooky Greeter
echo ================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please create a .env file with your configuration:
    echo 1. Copy .env.example to .env
    echo 2. Add your OpenAI API key
    echo.
    echo Example .env file:
    echo OPENAI_API_KEY=your_key_here
    echo PORT=3000
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

echo Starting HalloWeenie server...
echo Open http://localhost:3000 in your browser
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
