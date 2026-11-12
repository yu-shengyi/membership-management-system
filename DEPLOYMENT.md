# 部署指南 (Deployment Guide)

本文档提供了会员管理系统的详细部署说明，包括本地部署、服务器部署和云平台部署。

## 📋 目录

- [本地部署](#本地部署)
- [服务器部署](#服务器部署)
- [云平台部署](#云平台部署)
- [Docker 部署](#docker-部署)
- [常见问题](#常见问题)

---

## 本地部署

### 方式一：使用提供的启动脚本（推荐）

#### Windows 用户
```bash
# 直接双击运行
启动服务器.bat
```

#### Mac / Linux 用户
```bash
# 添加执行权限（首次需要）
chmod +x start.sh

# 运行脚本
./start.sh
```

### 方式二：手动启动

#### 使用 Python（推荐）
```bash
# 进入项目目录
cd membership-management-system

# 启动服务器
python -m http.server 8080
# 或
python3 -m http.server 8080

# 访问
# http://localhost:8080
```

#### 使用 Node.js
```bash
# 使用 npx serve（无需安装）
npx serve . -l 8080

# 或全局安装 serve
npm install -g serve
serve . -l 8080

# 或使用 http-server
npx http-server -p 8080
```

### 方式三：使用其他 Web 服务器

#### Nginx
```nginx
server {
    listen 8080;
    server_name localhost;
    root /path/to/membership-management-system;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache
```apache
<VirtualHost *:8080>
    DocumentRoot "/path/to/membership-management-system"
    <Directory "/path/to/membership-management-system">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

## 服务器部署

### 在 Linux 服务器上部署

#### 1. 上传文件到服务器
```bash
# 使用 scp
scp -r membership-management-system user@server:/var/www/

# 或使用 git clone
ssh user@server
cd /var/www/
git clone https://github.com/yourusername/membership-management-system.git
```

#### 2. 配置 Nginx

创建配置文件: `/etc/nginx/sites-available/membership`

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/membership-management-system;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/membership /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. 配置 HTTPS（可选但推荐）

使用 Let's Encrypt 免费证书：
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书并自动配置
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 云平台部署

### GitHub Pages

1. **准备仓库**
```bash
# 推送代码到 GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/membership-management-system.git
git push -u origin main
```

2. **配置 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 `main` 分支和 `/`(root) 目录
   - 点击 Save
   - 访问 `https://yourusername.github.io/membership-management-system/`

3. **自定义域名（可选）**
   - 在仓库根目录创建 `CNAME` 文件
   - 内容为你的域名，如: `membership.example.com`
   - 在域名提供商处配置 DNS CNAME 记录

### Vercel

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **部署**
```bash
# 进入项目目录
cd membership-management-system

# 登录并部署
vercel
```

3. **或通过 Web 界面**
   - 访问 [vercel.com](https://vercel.com)
   - Import Git Repository
   - 选择你的 GitHub 仓库
   - 自动部署

### Netlify

1. **使用 Netlify CLI**
```bash
# 安装 CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod
```

2. **或通过 Web 界面**
   - 访问 [netlify.com](https://netlify.com)
   - New site from Git
   - 选择仓库并部署

### Cloudflare Pages

1. 登录 Cloudflare Dashboard
2. Pages → Create a project
3. 连接 GitHub 仓库
4. 构建设置留空（因为已经是构建后的文件）
5. 部署

---

## Docker 部署

### 创建 Dockerfile

在项目根目录创建 `Dockerfile`:

```dockerfile
FROM nginx:alpine

# 复制项目文件到 nginx 默认目录
COPY . /usr/share/nginx/html

# 复制自定义 nginx 配置（可选）
# COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t membership-system .

# 运行容器
docker run -d -p 8080:80 --name membership membership-system

# 访问
# http://localhost:8080
```

### 使用 Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

---

## 常见问题

### 1. 页面空白或显示 404

**原因**: 直接双击 `index.html` 文件打开

**解决**: 必须通过 HTTP 服务器访问，使用本文档中的任一启动方式

### 2. 端口被占用

**错误信息**: `Address already in use` 或 `端口被占用`

**解决**:
```bash
# 查找占用端口的进程
# Windows
netstat -ano | findstr :8080

# Mac/Linux
lsof -i :8080

# 更换端口
python -m http.server 8081
```

### 3. 防火墙问题

如果外网无法访问服务器：

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 4. 数据迁移

**从旧设备迁移到新设备**:

1. 旧设备: 系统设置 → 数据导出 → 下载 JSON 文件
2. 新设备: 系统设置 → 数据导入 → 选择 JSON 文件

### 5. 性能优化建议

#### 启用 HTTP/2
```nginx
listen 443 ssl http2;
```

#### 配置浏览器缓存
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 启用 Brotli 压缩（比 gzip 更优）
```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

---

## 生产环境检查清单

部署到生产环境前，请确认：

- [ ] 已配置 HTTPS
- [ ] 已设置防火墙规则
- [ ] 已启用 gzip/brotli 压缩
- [ ] 已配置静态资源缓存
- [ ] 已设置定期数据备份提醒
- [ ] 已测试所有功能正常运行
- [ ] 已配置错误日志监控
- [ ] 已设置自动备份机制（提醒用户导出数据）

---

## 技术支持

如遇到部署问题，请：

1. 查看本文档的常见问题部分
2. 查看项目 [GitHub Issues](https://github.com/yourusername/membership-management-system/issues)
3. 提交新的 Issue 描述问题

---

最后更新: 2024-11-12
