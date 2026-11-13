# SDD ledger — plan: docs/superpowers/plans/2026-11-13-course-booking.md

BASE ff4c59a。当前会话直接执行，用户确认“先只做排课和预约”。

- Pre-flight: Task 1 提供规则/类型给 Task 2，Task 3 使用同一课次类型；无接口冲突。
- Task 1: complete (commit 936f64e; npm test 36/36, lint/build exit 0)。新增测试首先因缺少课程模块失败，随后实现并通过。
- Task 2 RED: GitHub run 43397729152，浏览器课程用例因新增课程入口不存在失败；本地实际 DOM 同样失败。旧业务检查通过。
- Task 2 implementation: 课程目录、排课表单、筛选、详情、名单、取消、深链接及错误恢复；本地实际 DOM 课程入口已通过。等待完整 Chromium 验证。
- Task 3 implementation: 工作台今日课程、备份新集合计数与覆盖说明。没有加入签到计费。

本记录中待验证项不视为完成。原生 Windows 无法启动真实浏览器，使用 GitHub Linux Chromium，不以 DOM 测试代替布局验收。
