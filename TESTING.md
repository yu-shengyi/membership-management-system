# 测试与故障回归

## 业务与构建

使用 Node 24：

```sh
npm ci
npm test
npm run lint -- --deny-warnings
npm run build
npm audit
```

业务测试使用隔离的模拟存储，覆盖金额、账户与流水一致性、会员状态、编辑保护、导入恢复、演示清理、日期报表等，不读取实际浏览器资料。测试预期使用独立的固定样例。

## 真实浏览器

安装 Python 3.13+，再执行：

```sh
python -m pip install -r tests/browser/requirements.txt
python -m playwright install chromium
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

保持预览服务运行，在另一个终端进入项目目录执行：

```sh
npm run test:browser
```

默认测试地址为 http://127.0.0.1:4173/。所有会员为测试虚构数据，每个用例使用独立浏览器上下文，不访问实际用户存储。测试覆盖持久化、重复手机号、重复提交、余额不足、存储失败重试、归档恢复、导入预览与取消、损坏数据恢复、禁止本地存储、演示编辑和手机表单。

响应式检查包含 390、820、1440px，检查六个页面的横向溢出、导航和刷新，并保存截图。测试结束将截图和交互追踪写入 test-results/browser；追踪可用 `python -m playwright show-trace 路径.zip` 查看。截图不是与基准图对比的像素测试。

GitHub Actions 分别在根路径和 /membership-management-system/ 子路径构建后测试；全部通过才发布。失败信息写入检查注释，截图与追踪保存在 browser-* 产物。Windows 如禁止启动测试浏览器，测试应明确失败；不能跳过后宣称浏览器测试通过，可使用 GitHub 的 Linux 测试结果。

## 手动复查

真实 iPhone/Android 的软键盘、触控、不同字体和浏览器私密模式仍需人工复查。当前 Chromium 测试不能代表 Safari、Firefox 或多操作员并发支持。依赖扫描只反映当时公开记录，不代表没有安全风险。
