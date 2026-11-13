# SDD ledger — plan: docs/superpowers/plans/2026-11-13-course-booking.md

BASE ff4c59a。当前会话直接执行，用户确认“先只做排课和预约”。

- Pre-flight: Task 1 提供规则/类型给 Task 2，Task 3 使用同一课次类型；无接口冲突。
- Task 1: complete (commit 936f64e; npm test 36/36, lint/build exit 0)。新增测试首先因缺少课程模块失败，随后实现并通过。
- Task 2 RED: GitHub run 43397729152，浏览器课程用例因新增课程入口不存在失败；本地实际 DOM 同样失败。旧业务检查通过。
- Task 2 implementation: 课程目录、排课表单、筛选、详情、名单、取消、深链接及错误恢复；本地实际 DOM 课程入口已通过。等待完整 Chromium 验证。
- Task 3 implementation: 工作台今日课程、备份新集合计数与覆盖说明。没有加入签到计费。

本记录中待验证项不视为完成。原生 Windows 无法启动真实浏览器，使用 GitHub Linux Chromium，不以 DOM 测试代替布局验收。

- Task 2: complete implementation (c19567d, 07d7807)。实际 DOM 全流程建课、排课、预约、取消通过；根路径 Chromium 17/17 通过。Pages 路径 16/17 通过，剩余用例因测试直接写存储后 hash 导航不重读内存而失败；测试补真实刷新，不修改生产逻辑。
- Task 3: complete implementation。工作台、设置、2.2.0 文档和 17 项浏览器用例齐备；全分支独立审查重新运行 39/39，无 Critical/Important。
- Final: fixed 已完成历史预约可能被整课取消改写 — 新增“课次取消不能改写已完成的历史预约” RED→GREEN，39/39。
- Final: fixed 损坏预约关联返回空引用异常 — 新增“损坏预约关联先给出校验错误” RED→GREEN，39/39；先验证全部关联，再检查冲突。
- Final: minor (deferred): 新排课在当前日期/页签筛选之外时，需手动调整筛选查看，后续可自动定位。
- Final: minor (deferred): 已取消预约保留原课程/时间数据，但名单中没有单独展示这些历史快照，后续可补充展示。
- 三时区 Asia/Shanghai、America/Los_Angeles、UTC 各 39/39；lint、build、依赖审计均通过（已知漏洞 0）。早期测试固定 UTC 时间在洛杉矶对应前一日的问题已修正测试样例，并添加独立本地午夜/深夜用例。
- 桌面同步预检无冲突，已备份旧文件。最终 CI 通过前不更新 main；最终发布/线上/桌面验证结果保存工作区 outputs/course-development-review.json。
