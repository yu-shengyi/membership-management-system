# Membership Optimization Implementation Plan

> 执行方式：在当前会话直接实施。用户已确认设计与实施，无需重复确认。

**Goal:** 修复数据一致性、恢复与日常页面操作。
**Architecture:** 统一快照持久化，纯业务函数验证并生成新状态，Zustand 在保存成功后统一发布。页面共用状态、筛选与日期工具。
**Tech Stack:** 保留 React、TypeScript、Ant Design、Zustand、Recharts；Node 原生测试。
**Spec:** ../specs/2026-11-13-membership-optimization-design.md

## Global Constraints
- 不扩展完整课程预约或后端，不操作用户浏览器实际数据。
- 保留旧存储与历史交易兼容，未知数据不自动覆盖。
- 保留余额消费并可选扣次规则，消费方式明确为余额。
- 项目没有 Git；保留原文件压缩副本，直接在授权目录实施，不初始化仓库。

## Review Focus
- 持久化失败不能留下部分交易、部分恢复或被清空的表单。
- 零余额、浮点金额、小数次数、冻结、到期当天与重复标识。
- 旧数据缺可选新字段、损坏备份、跨页面数据同步。
- 手机/平板导航可达，表格不能撑开整个页面。
- 演示数据不能覆盖或清除真实会员及关联记录。

## Task 1 — 数据与业务
Files: src/types/index.ts; src/utils/{storage,validation,domain,dates}.ts; src/store/{appStore,memberStore,transactionStore}.ts; tests/core.test.ts
Interfaces: storage.readSnapshot(): Snapshot; storage.commit(data: AppData): Snapshot; storage.importBackup(text: string): void; storage.getAutoBackups(): Backup[]; storage.restoreBackup(id: string): void; createTransaction(data: AppData, input: TransactionInput, today?: string): AppData; getMemberStatus(member: Member, today?: string): MemberStatus.
- [x] 写回归测试：无效导入拒绝、失败导入原数据不变，先在旧实现观察失败。
- [x] 统一保存和校验，迁移旧数据，备份稳定 ID 与倒序，纯业务运算。
- [x] 扩展测试覆盖边界、迁移、归档、演示数据与报表聚合；执行 node --experimental-strip-types --test tests/*.test.ts。

## Task 2 — 页面与布局
Files: src/App.tsx; src/{index,App}.css; src/components/Layout/*; src/components/{ConsumeForm,RechargeForm,TransactionForm,PageHeader}.tsx; src/pages/*; src/utils/testData.ts; index.html
Interfaces: useAppStore.load(): void; addMember(input), updateMember(id, input), archiveMember(id, archived), transact(input): void. Form.onSubmit 返回 void/Promise<void>，抛出表示失败，保留输入。
- [x] 连接工作台待办、会员与交易筛选，充值消费预览，备份预览确认。
- [x] 清理模板样式，统一断点与响应式表格/图表，演示管理移入设置。
- [x] 独立DOM环境检查工作流；真实浏览器启动受限，390/820/1440px视觉检查未完成，限制已记录。

## Task 3 — 构建、复核与交付
Files: tsconfig.app.json; package.json; README.md; docs/optimization-progress.md
- [x] 修复 baseUrl 及编译发现的问题，更新项目元信息、脚本和使用说明。
- [x] 运行 npm test、npm run lint、npm run build，保存结果。
- [x] 独立复核数据迁移、错误路径和实际工作流，修复重要问题并回归。
- [x] 输出改动报告和可运行构建；如浏览器验证受限，明确记录限制。
