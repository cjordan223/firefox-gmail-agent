#!/bin/bash

# Gmail Email Tracker - Quick Start Script
echo "🚀 Starting Gmail Email Tracker..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Start backend in background
echo "🚀 Starting FastAPI backend..."
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend failed to start. Check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Install dashboard dependencies
echo "📦 Installing dashboard dependencies..."
cd dashboard
npm install

# Start dashboard
echo "🚀 Starting React dashboard..."
echo "📧 Dashboard will be available at http://localhost:3000"
echo "🔧 Backend API is available at http://localhost:8000"
echo ""
echo "📋 Next steps:"
echo "1. Load the Firefox extension from the extension/ directory"
echo "2. Open Gmail in Firefox"
echo "3. Start capturing emails!"
echo ""
echo "Press Ctrl+C to stop all services"

npm start

# Cleanup on exit
echo "🛑 Stopping services..."
kill $BACKEND_PID 2>/dev/null
echo "✅ All services stopped." 