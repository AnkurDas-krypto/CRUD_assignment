#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting MyChoice App...${NC}"

# Navigate to backend directory and start Django server
echo -e "${GREEN}Starting Django backend server...${NC}"
cd backend
python manage.py migrate
python manage.py runserver &
BACKEND_PID=$!
echo -e "${GREEN}Django server started with PID: $BACKEND_PID${NC}"

# Wait a moment for the backend to initialize
sleep 2

# Navigate to frontend directory and install dependencies if needed
echo -e "${GREEN}Checking frontend dependencies...${NC}"
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start React frontend
echo -e "${GREEN}Starting React frontend...${NC}"
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}React frontend started with PID: $FRONTEND_PID${NC}"

# Function to handle script termination
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo -e "\n${GREEN}App is running!${NC}"
echo -e "${YELLOW}Backend:${NC} http://localhost:8000"
echo -e "${YELLOW}Frontend:${NC} http://localhost:3000"
echo -e "${RED}Press Ctrl+C to stop all servers${NC}"

# Keep the script running
wait
