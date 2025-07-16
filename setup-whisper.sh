#!/bin/bash

echo "🚀 Setting up Whisper Speech-to-Text for MyChoice App"
echo "================================================="

# Navigate to backend and install Python dependencies
echo "📦 Installing backend dependencies..."
cd backend

# Install Python packages
pip install -r requirements.txt

echo "✅ Backend dependencies installed!"

# Navigate to frontend
cd ../frontend

echo "📦 Installing frontend dependencies..."
# No additional npm packages needed for basic audio recording

echo "✅ Frontend setup complete!"

echo ""
echo "🎯 Setup Complete! Here's what was added:"
echo "----------------------------------------"
echo "Backend:"
echo "  ✓ OpenAI Whisper for speech-to-text"
echo "  ✓ PyTorch for ML processing"
echo "  ✓ New API endpoint: /items/speech_to_text/"
echo ""
echo "Frontend:"
echo "  ✓ SpeechRecorder component"
echo "  ✓ Voice input page at /speech"
echo "  ✓ Updated navigation header"
echo ""
echo "🎤 Usage:"
echo "  1. Start the backend: cd backend && python manage.py runserver"
echo "  2. Start the frontend: cd frontend && npm start"
echo "  3. Navigate to http://localhost:3000/speech"
echo "  4. Click 'Start Recording' and say something like:"
echo "     - 'name apple group primary'"
echo "     - 'add banana to secondary group'"
echo "     - 'orange primary'"
echo ""
echo "💡 Note: The first time you use Whisper, it will download the model (~140MB for base model)"
echo "     This is completely FREE and runs locally on your machine!"
