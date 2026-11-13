# 部署

Node 24，首次运行 npm ci，再运行 npm run dev。生产构建运行 npm run build，部署 dist 目录。
根路径部署需要将所有页面路径回退到 index.html；参考 nginx.conf。Docker方式运行 docker compose up -d --build，访问 http://localhost:8080。
GitHub Pages在仓库Settings → Pages中将Source设为GitHub Actions，推送main会先测试和构建再部署dist。
构建环境变量DEPLOY_BASE指定项目子路径（包含首尾斜杠），本仓库为 /membership-management-system/。子路径构建采用hash路由，刷新无需服务器重写。
不要将旧版assets产物与新版源码混合发布，不上传node_modules、备份文件或实际会员数据。
旧网站和新版使用不同存储格式；请先导出旧站备份保留，未经校验的旧数据不自动导入。当前支持2.0.0/2.1.0备份；v1备份需另行编写迁移工具。
