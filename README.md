# 会员管理系统 (Membership Management System)

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-stable-brightgreen.svg)

一个功能完善的健身/运动场馆会员管理系统，基于现代化前端技术构建

</div>

## ✨ 功能特性

### 核心功能
- 📋 **会员信息管理** - 增删改查、照片上传、积分管理
- 💳 **多种卡种支持** - 次数卡、日卡、月卡、季卡等灵活配置
- 💰 **交易记录管理** - 消费/充值记录追踪
- 🏆 **积分系统** - 自动积分累计和等级升降
- 👨‍🏫 **教练管理** - 教练人员信息维护
- 📚 **私教课管理** - 项目管理与消课记录
- 📊 **数据仪表盘** - 可视化数据分析
- 💾 **数据导入/导出** - 支持数据备份和迁移

### 技术特点
- 🚀 基于 React + Ant Design 构建
- 💾 使用 LocalStorage 本地存储数据
- 📱 响应式设计，支持移动端访问
- 🎨 现代化 UI 设计，用户体验优秀
- ⚡ 无需后端，开箱即用

## 📸 系统截图

*(建议添加系统截图展示主要功能界面)*

## 🚀 快速开始

### 系统要求

- **操作系统**: Windows / macOS / Linux
- **浏览器**: Chrome / Edge / Firefox / Safari (现代浏览器)
- **运行环境**: Python 3（必需）

### 安装步骤

#### 1. 安装 Python（如果还没有）

**Windows:**
1. 访问 https://www.python.org/downloads/
2. 下载并运行安装程序
3. ⚠️ **重要：勾选 "Add Python to PATH"**
4. 点击 "Install Now"

**Mac:**
```bash
brew install python3
```

**Linux:**
```bash
sudo apt install python3  # Ubuntu/Debian
sudo yum install python3  # CentOS/RHEL
```

#### 2. 启动系统

**Windows 用户**
- 双击 `启动.bat` 文件

**Mac / Linux 用户**
```bash
bash start.sh
```

#### 3. 访问系统

看到 "Serving HTTP on..." 信息后，打开浏览器访问:
```
http://localhost:8080
```

#### 4. 导入示例数据（推荐）

首次使用建议导入示例数据：
1. 进入系统后点击"设置"或"数据管理"
2. 点击"数据导入"
3. 选择项目中的 `demo-data.json` 文件
4. 系统会自动导入示例会员、教练、课程数据

## 📖 使用说明

### ⚠️ 重要提示

1. **必须使用 HTTP 服务器运行**
   - 不能直接双击 `index.html` 文件
   - 原因: 浏览器安全策略不允许 `file://` 协议加载 ES 模块

2. **数据存储说明**
   - 所有数据保存在浏览器的 LocalStorage 中
   - 不同浏览器/电脑的数据是独立的
   - 清除浏览器缓存会导致数据丢失

3. **数据备份建议**
   - 定期使用系统内的"数据导出"功能备份数据
   - 路径: 设置 → 数据导出 → 下载 JSON 备份文件
   - 将备份文件保存到安全位置

4. **数据恢复**
   - 使用"数据导入"功能可恢复之前导出的数据
   - 在新电脑/浏览器上可以通过此方式迁移数据

### 基本操作流程

1. **添加会员**: 会员管理 → 新增会员 → 填写信息 → 保存
2. **办理卡种**: 在会员详情页选择卡种类型 → 充值
3. **消费记录**: 会员列表 → 选择会员 → 记录消费
4. **查看统计**: 访问仪表盘查看整体运营数据
5. **数据备份**: 设置 → 数据管理 → 导出数据

## 📁 项目结构

```
会员管理系统/
├── index.html              # 主页面
├── favicon.svg             # 网站图标
├── icons.svg               # SVG 图标集
├── 启动.bat                # Windows 启动脚本（一键启动）
├── start.sh                # Mac/Linux 启动脚本
│
├── assets/                 # 打包后的资源文件
│   ├── index-*.js         # JavaScript bundle
│   └── index-*.css        # CSS bundle
│
├── .github/                # GitHub 配置
│   └── workflows/
│       └── deploy.yml     # 自动部署到 GitHub Pages
│
├── scripts/                # 工具脚本
│   ├── init-git.bat       # Windows Git 初始化
│   └── init-git.sh        # Linux/Mac Git 初始化
│
├── 📚 文档
├── README.md              # 项目说明（你正在看的）
├── DEPLOYMENT.md          # 部署指南
├── FAQ.md                 # 常见问题
├── CONTRIBUTING.md        # 贡献指南
├── CHANGELOG.md           # 更新日志
├── ROADMAP.md             # 项目路线图
│
├── 📦 配置文件
├── .gitignore             # Git 忽略规则
├── LICENSE                # MIT 许可证
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose
└── demo-data.json         # 示例数据
```

## 🛠️ 技术栈

- **前端框架**: React 18
- **UI 组件库**: Ant Design
- **构建工具**: Vite
- **状态管理**: LocalStorage
- **图表库**: Ant Design Charts

## 🔧 开发说明

此项目当前提供的是构建后的生产版本。如果需要开发版本:

1. 源代码需要包含 `src/` 目录和构建配置文件
2. 使用 Vite 作为开发服务器
3. 运行 `npm install` 安装依赖
4. 运行 `npm run dev` 启动开发服务器
5. 运行 `npm run build` 构建生产版本

## 📝 更新日志

### v1.0.0 (2024-07-07)
- ✅ 初始版本发布
- ✅ 完整的会员管理功能
- ✅ 多种卡种支持
- ✅ 数据导入导出
- ✅ 仪表盘统计

## 🤝 贡献指南

欢迎贡献代码! 请遵循以下步骤:

1. Fork 本仓库
2. 创建新的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 💬 联系方式

如有问题或建议，请通过以下方式联系:

- 提交 Issue: [GitHub Issues](https://github.com/yourusername/membership-management-system/issues)
- Email: your.email@example.com

## 🙏 致谢

感谢以下开源项目:

- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- [Vite](https://vitejs.dev/)

---

<div align="center">
Made with ❤️ by Your Name
</div>
