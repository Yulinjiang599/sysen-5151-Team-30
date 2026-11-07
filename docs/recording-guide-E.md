# E 录屏路径：Codebase to Model（约 3 分钟）

## 录制前确认

- 当前展示对象是 `04-整理后的代码` 桌面工作包，不是已提交到 GitHub main 的版本。
- 先运行 `python3 scripts/verify.py`，确认输出为 `local: passed`，打开 `evidence/verification.log` 和 `evidence/ci-summary.json`。
- `docs/traceability.md` 的链接指向当前带注释版本行号；不要用旧草稿的行号。
- 若需要展示 GitHub CI 通过，必须由用户授权将工作包内容提交到仓库后，让对应提交的 Actions 真正运行。旧 PR 的绿色结果不属于这份桌面工作包。

## 建议展示顺序

| 时间 | 展示文件或操作 | 需要讲清楚的事实 |
|---|---|---|
| 0:00–0:30 | [traceability.md](traceability.md) | 选定 F.1.5；五个子功能对应代码、CR 需求、执行组件和现有测试。模型实体与关系以 XML 为依据，代码链接是实现映射。 |
| 0:30–1:15 | 点击 identifySchedulingConstraints，再看 allocatePrioritizedTasks / assembleStudyPlan | JSDoc 标出 Function ID、需求 ID、ICOM、参数、返回值及异常。原始 profile 与模型已排序任务集的差异明确保留。 |
| 1:15–2:00 | [Python 测试入口](../tests/test_functional_requirements.py)、[测试映射](test-requirement-map.md)、本次实际日志 | 以需求 ID 命名的 Python 方法调用真实 JavaScript；31 项本地测试；12 场景各 3 次，五类保存修改检查实际计划输出。 |
| 2:00–2:35 | [api-v1.yaml](../contracts/api-v1.yaml)、[route-table.md](route-table.md) | 九个本地操作有参数、前置条件和返回值；DOM 页面不是后端路由，paths 为空；核心逻辑测试和浏览器验收分开。 |
| 2:35–3:00 | [CI 配置](../.github/workflows/verify.yml)、当前运行记录 | 当前只能展示本地检查通过和准备好的 Actions 配置；上传后才能展示该提交的真实远端运行。若还未上传，就明确说明远端 CI 待运行。 |

## 可直接解释的一条链路

模型中 F.1.5.2 Determine Available Study Slots 由 C.2.5.2 执行，CR-2 traced from 1.4.5 且 satisfied by C.2.5.2。代码中的 determineAvailableStudySlots 将约束变成可用时段；对应测试独立核对重叠窗口归一化及固定安排扣除后的区间。Function-to-code/test 是本项目实现证据，不是新建的模型关系。

## 不应宣称

- 不把 XML 的 satisfied by / verified by 关系说成程序已通过全部验收。
- 不把 DOM 测试环境说成真实浏览器布局测试。
- 不把本地通过、工作流配置或旧提交的绿灯说成当前工作包远端 CI 已通过。
- 不把 Alex/Maya 显示隔离说成身份认证；不把内部日历数据说成外部日历集成。
- 不把保存任务或删除确认弹窗说成学生确认具体计划。

## 剩余交接项

真实浏览器验证和对应提交的远端 CI 结果仍待完成。任何必须更改产品行为的模型差异，由团队确认后再处理；录屏不得隐藏这些边界。

## 后续真实浏览器检查记录

已完成一次真实浏览器核心流程检查，见 [browser-smoke.md](browser-smoke.md)。可展示任务工作量修改与可用时间添加后的缺口变化；截图使用实际临时数据，不代表全部验收。日历短块长标题有截断，讲解时使用 Agenda。远端 CI、未测浏览器路径和模型差异仍按原状态说明。
