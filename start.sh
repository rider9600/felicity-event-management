#!/bin/bash

echo "Starting Felicity Platform..."
echo ""

# Start backend in background
echo "Starting Backend Server (Port 5000)..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting Frontend Server (Port 5173)..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are running:"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
