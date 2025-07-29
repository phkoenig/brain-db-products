@echo off
echo Fixing development environment...

echo Stopping any running processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Stopping process %%a
    taskkill /PID %%a /F 2>nul
)

echo Deleting .next directory...
if exist .next rmdir /s /q .next

echo Clearing npm cache...
npm cache clean --force

echo Installing dependencies...
npm install

echo Starting development server...
npm run dev

pause 