@echo off
chcp 936 >nul
title GitHub Upload Helper
color 0B
cls

echo.
echo ========================================
echo         GitHub Upload Helper
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git not installed
    echo.
    echo Please install Git first:
    echo https://git-scm.com/download/win
    echo.
    echo Then restart your computer
    echo.
    pause
    exit
)
echo [OK] Git is installed
echo.

echo Step 2: Initializing Git repository...
git init
echo.

echo Step 3: Adding files...
git add .
echo.

echo Step 4: Creating commit...
git commit -m "Initial commit: Membership Management System v1.0.0"
echo.

echo Step 5: Setting main branch...
git branch -M main
echo.

echo Step 6: Please enter your GitHub repository URL
echo Format: https://github.com/username/repository.git
echo.
set /p REPO_URL="Repository URL: "

if "%REPO_URL%"=="" (
    echo.
    echo [ERROR] No URL entered
    echo.
    pause
    exit
)

echo.
echo Step 7: Uploading to GitHub...
git remote add origin "%REPO_URL%"
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo          Upload Success!
    echo ========================================
    echo.
    echo Check your GitHub repository
    echo.
) else (
    echo.
    echo ========================================
    echo          Upload Failed
    echo ========================================
    echo.
    echo Possible reasons:
    echo 1. Network issue
    echo 2. Wrong repository URL
    echo 3. Need GitHub login
    echo.
)

pause
