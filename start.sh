#!/bin/bash

# 会员管理系统 - Mac/Linux 启动脚本

clear

echo ""
echo "=========================================="
echo "      会员管理系统 - 正在启动"
echo "=========================================="
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 启动服务器
python3 -m http.server 8080

# 如果 python3 不存在，尝试 python
if [ $? -ne 0 ]; then
    python -m http.server 8080
fi
