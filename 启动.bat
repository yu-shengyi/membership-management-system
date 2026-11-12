@echo off
chcp 936 >nul
cls

echo.
echo ==========================================
echo       会员管理系统 - 正在启动
echo ==========================================
echo.

cd /d %~dp0

python -m http.server 8080

pause
