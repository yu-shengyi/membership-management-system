# 课程排课预约 Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task-by-task. 用户已确认仅排课预约；在当前会话直接执行。

**Goal:** 完成不改变会员资产的目录、排课、预约、取消。
**Architecture:** 纯规则、统一版本化快照、Zustand 原子提交、独立表单与名单。
**Tech Stack:** 沿用 React/Ant Design/TypeScript/Vite、Node test、Python Playwright，不新增运行依赖。
**Spec:** docs/superpowers/specs/2026-11-13-course-booking-design.md

## Global Constraints

只做排课预约；5～480 分钟、1～500 名额、区间 [开始,结束)。旧 2.0.0/2.1.0 兼容，新 2.2.0 严格校验。在 test/course-booking-20261113 实现，验证通过再发布。

## Review Focus

- 上课日越过到期日必须拒绝。
- 取消再约保留历史，重复操作不增加有效预约。
- 旧预约不补造关联，新备份关联损坏必须拒绝。
- 存储失败可重试且业务不变。
- 移动端详情和筛选无页面横向溢出。

## Task 1: 数据与纯业务

Files: src/types/index.ts, src/utils/{courses,courseValidation,validation,storage,domain}.ts, tests/{courses,core,boundaries}.test.ts。
Interfaces: saveCourse(data,input,id?,now?), saveSession(data,input,id?,now?), bookSession(data,sessionId,memberId,notes?,now?), cancelAppointment(data,id,now?), cancelSession(data,id,now?) 返回 AppData；getOccupancy(data,sessionId) 返回 number；getBookingIssue(data,sessionId,memberId,now?) 返回 string|null。

- [ ] 新增迁移、关联、冲突/相邻、容量、停用、取消级联、资格、撞课、资产不变和存储失败测试，运行 npm test 观察失败。
- [ ] 实现类型、校验、纯规则、旧版迁移和演示清理兼容。
- [ ] npm test 全部通过后提交。

## Task 2: 课程界面

Files: src/store/appStore.ts, src/pages/Courses/{index,CourseForm,SessionForm,SessionDetails}.tsx, src/App.tsx, src/App.css, tests/browser/test_app.py。
Interfaces: store 同名 action 统一提交 Task 1 规则结果；sessionId 深链接打开详情。

- [ ] 写真实浏览器新建课程/排课、预约、满额、取消重约、失败重试、刷新和移动布局用例，在未实现 UI 上运行 CI 观察失败。
- [ ] 实现课程目录、排课筛选、表单、名单及历史预约；损坏数据路由保护。
- [ ] npm test/lint/build，双路径 Chromium 通过后提交。

## Task 3: 集成与发布

Files: src/pages/{Dashboard,Settings}/index.tsx, README.md, TESTING.md, CHANGELOG.md, package.json/package-lock.json。
Interfaces: 工作台使用 getOccupancy 和 sessionId；设置展示 courses/courseSessions/appointments 计数。

- [ ] 浏览器断言工作台入口、备份计数、演示清理保留课次，先观察失败。
- [ ] 集成并更新 2.2.0 文档；三时区业务测试及两路径浏览器回归。
- [ ] 全分支审查，重要发现测试先失败再修复。全部通过后更新 main、检查线上、备份与同步桌面。

## 执行记录

BASE ff4c59a。接口检查：Task 2 使用 Task 1 纯规则，Task 3 使用相同课次类型/getOccupancy，无冲突。用户明确缩小范围，不实现签到计费。完整记录见同目录 2026-11-13-course-booking-progress.md。
