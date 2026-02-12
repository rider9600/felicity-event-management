@echo off
echo Starting Felicity Platform...
echo.
echo Starting Backend Server (Port 5000)...
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend Server (Port 5173)...
start cmd /k "npm run dev"
echo.
echo Both servers are starting in separate windows...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
