#!/bin/bash
# setup_server.sh - Automated setup for the Flow Weaver AI Flask Server

echo "🚀 Starting setup for Flow Weaver AI Server..."

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed. Please install it first."
    exit 1
fi

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment (venv)..."
    python3 -m venv venv
else
    echo "✅ Virtual environment (venv) already exists."
fi

# Activate the virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies (flask, flask-cors, groq)..."
pip install --upgrade pip
pip install flask flask-cors groq

# Create requirements.txt if it doesn't exist
echo "flask" > requirements.txt
echo "flask-cors" >> requirements.txt
echo "groq" >> requirements.txt

echo "------------------------------------------------"
echo "✅ Setup Complete!"
echo "To start your server, run:"
echo "source venv/bin/activate && python3 server.py"
echo "------------------------------------------------"
