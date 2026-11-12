# 贡献指南 (Contributing Guide)

感谢你对会员管理系统的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复或新功能
- 🌍 翻译文档

## 📋 目录

- [行为准则](#行为准则)
- [开始贡献](#开始贡献)
- [报告问题](#报告问题)
- [提交代码](#提交代码)
- [代码规范](#代码规范)
- [提交信息规范](#提交信息规范)

---

## 行为准则

本项目遵循贡献者公约（Contributor Covenant）。参与本项目即表示你同意遵守其条款。

我们期望所有贡献者：
- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员保持同理心

---

## 开始贡献

### 环境准备

如果你想贡献源代码（需要开发环境），请确保安装：

- Node.js 16+ 或 18+
- Git
- 代码编辑器（推荐 VS Code）

### Fork 和克隆仓库

1. **Fork 本仓库**
   - 点击 GitHub 页面右上角的 "Fork" 按钮

2. **克隆你的 Fork**
```bash
git clone https://github.com/你的用户名/membership-management-system.git
cd membership-management-system
```

3. **添加上游仓库**
```bash
git remote add upstream https://github.com/原作者/membership-management-system.git
```

4. **保持同步**
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## 报告问题

### Bug 报告

发现 Bug 时，请通过 [GitHub Issues](https://github.com/yourusername/membership-management-system/issues) 提交报告，并包含：

#### Bug 报告模板

```markdown
**Bug 描述**
清晰简洁地描述这个 Bug

**复现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
描述你期望发生什么

**实际行为**
描述实际发生了什么

**截图**
如果可能，添加截图帮助说明问题

**环境信息**
- 操作系统: [如 Windows 11, macOS 14.0]
- 浏览器: [如 Chrome 119, Safari 17]
- 系统版本: [如 v1.0.0]

**额外信息**
添加其他相关信息
```

### 功能请求

提出新功能建议时，请说明：

```markdown
**功能描述**
清晰描述你想要的功能

**使用场景**
描述这个功能解决什么问题或满足什么需求

**替代方案**
描述你考虑过的其他解决方案

**额外信息**
添加其他相关信息、截图或参考
```

---

## 提交代码

### 工作流程

1. **创建分支**
```bash
git checkout -b feature/amazing-feature
# 或
git checkout -b fix/bug-description
```

分支命名规范：
- `feature/功能名称` - 新功能
- `fix/bug描述` - Bug 修复
- `docs/文档描述` - 文档更新
- `refactor/重构描述` - 代码重构
- `style/样式描述` - 样式调整

2. **开发和测试**
```bash
# 安装依赖（如果是源码版本）
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试（如果有）
npm test
```

3. **提交更改**
```bash
git add .
git commit -m "feat: 添加新功能描述"
```

4. **推送到你的 Fork**
```bash
git push origin feature/amazing-feature
```

5. **创建 Pull Request**
   - 访问你的 Fork 页面
   - 点击 "Compare & pull request"
   - 填写 PR 描述
   - 提交 PR

### Pull Request 指南

#### PR 标题格式
```
类型(范围): 简短描述

例如:
feat(会员管理): 添加会员照片上传功能
fix(积分系统): 修复积分计算错误
docs(readme): 更新安装说明
```

#### PR 描述模板

```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 变更描述
清晰描述这个 PR 做了什么

## 相关 Issue
Closes #issue编号

## 测试
描述你如何测试这些更改

## 截图（如果适用）
添加截图展示变更

## 检查清单
- [ ] 代码遵循项目代码规范
- [ ] 已进行自我代码审查
- [ ] 已添加必要的注释
- [ ] 文档已更新
- [ ] 已测试所有功能正常
- [ ] 没有引入新的警告
```

---

## 代码规范

### JavaScript/React 规范

```javascript
// ✅ 推荐
const handleClick = () => {
  // 使用 const/let，不使用 var
  const data = fetchData();
  
  // 使用有意义的变量名
  const memberList = getMembers();
  
  // 函数命名使用驼峰式
  function calculateTotalPoints(member) {
    return member.points * 2;
  }
};

// ❌ 不推荐
var x = 1; // 不使用 var
const a = getData(); // 变量名太短
```

### 组件规范

```javascript
// ✅ 推荐 - 函数组件
import React from 'react';

const MemberCard = ({ member, onEdit }) => {
  return (
    <div className="member-card">
      <h3>{member.name}</h3>
      <button onClick={() => onEdit(member)}>编辑</button>
    </div>
  );
};

export default MemberCard;
```

### CSS 规范

```css
/* ✅ 使用有意义的类名 */
.member-card {
  padding: 16px;
  border-radius: 8px;
}

.member-card__title {
  font-size: 18px;
  font-weight: bold;
}

/* ❌ 避免单字母类名 */
.m { margin: 10px; }
```

### 注释规范

```javascript
/**
 * 计算会员积分
 * @param {Object} member - 会员对象
 * @param {number} amount - 消费金额
 * @returns {number} 新的积分总数
 */
function calculatePoints(member, amount) {
  // 每消费 10 元获得 1 积分
  const newPoints = Math.floor(amount / 10);
  return member.points + newPoints;
}
```

---

## 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式
```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

### 类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
# 新功能
git commit -m "feat(会员): 添加会员批量导入功能"

# Bug 修复
git commit -m "fix(积分): 修复积分过期时间计算错误"

# 文档
git commit -m "docs(readme): 更新部署说明"

# 重构
git commit -m "refactor(api): 优化数据获取逻辑"

# 带正文的提交
git commit -m "feat(教练): 添加教练排班功能

- 支持按周排班
- 支持查看历史排班
- 支持导出排班表"
```

---

## 开发建议

### 1. 保持代码简洁

```javascript
// ✅ 推荐
const isActive = member.status === 'active';

// ❌ 不推荐
const isActive = member.status === 'active' ? true : false;
```

### 2. 使用现代 JavaScript 特性

```javascript
// ✅ 推荐 - 解构赋值
const { name, age } = member;

// ✅ 推荐 - 模板字符串
const greeting = `欢迎 ${name}`;

// ✅ 推荐 - 箭头函数
const doubled = numbers.map(n => n * 2);
```

### 3. 错误处理

```javascript
// ✅ 推荐
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  console.error('数据获取失败:', error);
  showErrorMessage('操作失败，请重试');
}
```

### 4. 性能考虑

```javascript
// ✅ 使用 useMemo 避免不必要的计算
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ 使用 useCallback 避免不必要的函数重建
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

---

## 审查流程

提交 PR 后：

1. **自动检查**: CI/CD 会自动运行测试和代码检查
2. **代码审查**: 维护者会审查你的代码
3. **讨论修改**: 可能需要根据反馈进行修改
4. **合并**: 审查通过后，代码会被合并到主分支

### 审查标准

- 代码质量和可读性
- 是否遵循项目规范
- 功能是否完整
- 是否有充分的测试
- 文档是否更新

---

## 获取帮助

如果有任何问题：

- 💬 在 [Discussions](https://github.com/yourusername/membership-management-system/discussions) 发起讨论
- 📧 发送邮件至 your.email@example.com
- 📝 查看项目 [Wiki](https://github.com/yourusername/membership-management-system/wiki)

---

## 致谢

感谢所有为本项目做出贡献的开发者！

你的贡献让这个项目变得更好！🎉

---

最后更新: 2024-11-12
