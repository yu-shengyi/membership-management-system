@echo off
chcp 936 >nul
title GitHub 上传助手
color 0B

echo.
echo ========================================
echo         GitHub 上传助手
echo ========================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 检查是否安装 Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未安装 Git
    echo.
    echo 请先安装 Git:
    echo https://git-scm.com/download/win
    echo.
    echo 安装后请重启电脑再运行此脚本
    echo.
    pause
    exit
)

echo [1/6] 初始化 Git 仓库...
git init
echo.

echo [2/6] 添加所有文件...
git add .
echo.

echo [3/6] 创建提交...
git commit -m "Initial commit: 会员管理系统 v1.0.0"
echo.

echo [4/6] 设置主分支...
git branch -M main
echo.

echo [5/6] 请输入 GitHub 仓库地址
echo 格式: https://github.com/用户名/仓库名.git
echo.
set /p REPO_URL="仓库地址: "

if "%REPO_URL%"=="" (
    echo.
    echo [错误] 未输入仓库地址
    echo.
    pause
    exit
)

echo.
echo [6/6] 正在上传到 GitHub...
git remote add origin "%REPO_URL%"
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo          上传成功！
    echo ========================================
    echo.
    echo 访问你的 GitHub 仓库查看
    echo.
) else (
    echo.
    echo ========================================
    echo          上传失败
    echo ========================================
    echo.
    echo 可能的原因:
    echo 1. 网络问题
    echo 2. 仓库地址错误
    echo 3. 需要登录 GitHub
    echo.
)

pause
