@echo off
title ResumeAI - Python NLP Server
color 0A
echo.
echo  ==========================================
echo   ResumeAI Python NLP Server
echo  ==========================================
echo.

cd /d "%~dp0"

:: Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Python not found!
    echo  Download from: https://python.org/downloads
    echo  Make sure to check "Add Python to PATH"
    pause
    exit /b 1
)

:: Create venv if missing
IF NOT EXIST "venv\Scripts\python.exe" (
    echo  [1/4] Creating virtual environment...
    python -m venv venv
    echo  Done.
)

:: Install packages
echo  [2/4] Installing packages ^(first run only^)...
venv\Scripts\pip install --quiet fastapi uvicorn python-multipart pydantic spacy scikit-learn PyMuPDF python-docx pypdf numpy python-dotenv

:: Download spaCy model if missing
echo  [3/4] Checking spaCy model...
venv\Scripts\python -c "import spacy; spacy.load('en_core_web_sm')" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  Downloading spaCy English model ~13MB...
    venv\Scripts\python -m spacy download en_core_web_sm
)

:: Start server
echo  [4/4] Starting NLP server on port 8000...
echo.
echo  API running at: http://localhost:8000
echo  API docs at:    http://localhost:8000/docs
echo  Press Ctrl+C to stop
echo.
venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
