#!/bin/bash

# 会员管理系统 - Git 初始化脚本

echo "================================================"
echo "       会员管理系统 - Git 仓库初始化"
echo "================================================"
echo ""

# 检查是否已经是 git 仓库
if [ -d ".git" ]; then
    echo "⚠️  检测到已存在的 Git 仓库"
    read -p "是否要重新初始化？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消操作"
        exit 1
    fi
    rm -rf .git
fi

echo "[1/6] 初始化 Git 仓库..."
git init
echo "✓ Git 仓库初始化完成"
echo ""

echo "[2/6] 添加所有文件..."
git add .
echo "✓ 文件添加完成"
echo ""

echo "[3/6] 创建首次提交..."
git commit -m "Initial commit: 会员管理系统 v1.0.0

- 完整的会员管理功能
- 多种卡种支持
- 积分和等级系统
- 教练和课程管理
- 数据仪表盘
- 数据导入导出
- 完整的项目文档"
echo "✓ 提交完成"
echo ""

echo "[4/6] 设置主分支为 main..."
git branch -M main
echo "✓ 分支设置完成"
echo ""

echo "[5/6] 请输入你的 GitHub 仓库地址"
echo "格式: https://github.com/用户名/仓库名.git"
read -p "仓库地址: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "⚠️  未输入仓库地址，跳过远程仓库设置"
    echo ""
    echo "✓ 本地 Git 仓库初始化完成！"
    echo ""
    echo "提示: 稍后可以使用以下命令添加远程仓库："
    echo "  git remote add origin <仓库地址>"
    echo "  git push -u origin main"
else
    echo "添加远程仓库..."
    git remote add origin "$REPO_URL"
    echo "✓ 远程仓库添加完成"
    echo ""

    echo "[6/6] 推送到远程仓库..."
    read -p "是否立即推送到远程仓库？(Y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "跳过推送"
        echo ""
        echo "提示: 稍后可以使用以下命令推送："
        echo "  git push -u origin main"
    else
        git push -u origin main
        echo "✓ 推送完成"
    fi
fi

echo ""
echo "================================================"
echo "              初始化成功！"
echo "================================================"
echo ""
echo "下一步："
echo "1. 访问你的 GitHub 仓库页面"
echo "2. 在 Settings → Pages 中启用 GitHub Pages"
echo "3. 选择 main 分支和 / (root) 目录"
echo "4. 等待几分钟后访问你的在线地址"
echo ""
echo "建议："
echo "- 编辑 README.md 中的联系方式和仓库链接"
echo "- 编辑 LICENSE 中的作者名称和年份"
echo "- 查看 ROADMAP.md 了解改进建议"
echo ""
echo "祝使用愉快！"
echo ""
