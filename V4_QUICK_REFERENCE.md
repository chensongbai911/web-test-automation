# 🚀 v4.0 快速参考卡片

## 初始化

```javascript
const commander = new AITestCommander(qwenApiKey);
```

---

## 启动测试 (一行代码)

```javascript
const report = await commander.startIntelligentTesting(url, "测试页面");
```

---

## 核心对象

| 对象                         | 用途                   |
| ---------------------------- | ---------------------- |
| `commander`                  | 主要入口，协调整个测试 |
| `commander.contextEngine`    | 状态监控和上下文管理   |
| `commander.flowOrchestrator` | 流程生成和执行         |
| `commander.featureRecorder`  | 数据收集和报告         |

---

## 常用方法

### AITestCommander

```javascript
// 启动测试
await commander.startIntelligentTesting(url, intent);

// 获取会话信息
commander.getSessionInfo();

// 清理资源
commander.destroy();
```

### ContextEngine

```javascript
// 状态检查
context.checkForModals();
context.checkForLoadingStates();

// 任务管理
context.pushTask({ name, type });
context.completeTask(result);

// 等待
await context.waitForModalOpen(timeout);
await context.waitForModalClose(timeout);
await context.waitForPageStable(timeout);

// 监听
context.onStateChange((event, data, ctx) => {});

// 获取信息
context.getContext();
context.getExecutionContext();
```

### FlowOrchestrator

```javascript
// 生成流程
const flow = await orchestrator.generateTestFlow(feature);

// 执行流程
const result = await orchestrator.executeFlow(flow, context);

// 执行步骤
const stepResult = await orchestrator.executeStep(step, context);
```

### FeatureRecorder

```javascript
// 记录功能
recorder.startFeature(featureInfo);
recorder.addStep(featureId, step);
recorder.recordOperation(featureId, operation);
recorder.recordError(featureId, error);
recorder.recordAssertion(featureId, assertion);
recorder.completeFeature(featureId, result);

// 获取报告
const report = recorder.getFullReport();
const metrics = recorder.getKeyMetrics();

// 导出
recorder.exportAsJSON();
recorder.exportAsHTML();
```

---

## 事件类型

```
modal_opened       - 弹框打开
modal_closed       - 弹框关闭
loading_started    - 加载开始
loading_completed  - 加载完成
task_started       - 任务开始
task_completed     - 任务完成
step_complete      - 步骤完成
step_fail          - 步骤失败
```

---

## 功能结构

```javascript
{
  id: string,              // 功能ID
  name: string,            // 功能名称
  description: string,     // 功能描述
  userStory: string,       // 用户故事
  priority: number,        // 优先级 (1-10)
  triggerElement: string,  // 触发元素选择器
  expectedFlow: string[],  // 预期流程步骤
  completionCriteria: string // 完成标准
}
```

---

## 流程模板

| 模板                | 用途     |
| ------------------- | -------- |
| `modal_interaction` | 弹框操作 |
| `form_submission`   | 表单提交 |
| `table_operation`   | 表格操作 |
| `search_operation`  | 搜索功能 |

---

## 步骤动作类型

```
click/trigger       - 点击
input              - 输入文本
select             - 选择选项
wait_modal_open    - 等待弹框打开
wait_modal_close   - 等待弹框关闭
close_modal        - 关闭弹框
submit/submit_form - 提交表单
verify             - 验证结果
wait_response      - 等待响应
wait               - 等待
```

---

## 页面状态

```
normal       - 正常状态
modal_open   - 弹框打开
loading      - 加载中
error        - 错误状态
dropdown_open - 下拉框打开
```

---

## 示例 1: 基础使用

```javascript
const cmd = new AITestCommander(apiKey);
const report = await cmd.startIntelligentTesting(url, "test");
console.log(report.summary);
```

---

## 示例 2: 监听状态

```javascript
const ctx = cmd.contextEngine;
ctx.onStateChange((event, data, ctx) => {
  console.log(event, ctx.pageState);
});
```

---

## 示例 3: 自定义流程

```javascript
const feature = {
  name: "添加用户",
  description: "打开弹框填写用户信息",
  triggerElement: "#btn-add",
  expectedFlow: ["打开", "填写", "保存"],
  completionCriteria: "关闭",
};

const flow = await cmd.flowOrchestrator.generateTestFlow(feature);
const result = await cmd.flowOrchestrator.executeFlow(flow, cmd.contextEngine);
```

---

## 示例 4: 获取报告

```javascript
const report = cmd.featureRecorder.getFullReport();
console.log(report.summary);

// 导出HTML
const html = cmd.featureRecorder.exportAsHTML();
downloadFile(html, "report.html");
```

---

## 调试技巧

```javascript
// 查看当前状态
console.log(context.getContext());

// 查看执行上下文
console.log(context.getExecutionContext());

// 查看功能记录
console.log(recorder.getFeatureRecord(featureId));

// 查看所有功能
console.log(recorder.getAllFeatures());

// 查看关键指标
console.log(recorder.getKeyMetrics());
```

---

## 常见错误

| 错误       | 原因         | 解决方案          |
| ---------- | ------------ | ----------------- |
| 弹框未检测 | 选择器错误   | 检查弹框 class/id |
| 元素未找到 | 选择器不准确 | 使用文本搜索      |
| 流程失败   | 超时         | 增加 waitAfter    |
| 页面混乱   | 弹框未关闭   | 使用 close_modal  |

---

## 性能优化

```javascript
// 设置合理的超时
step.target.timeout = 5000;

// 合理安排步骤顺序
// （优先级高的功能先测试）

// 监听页面稳定
await context.waitForPageStable();

// 重用context实例
// （不要重复创建）
```

---

## 项目文件

```
src/
├── ai-test-commander.js          (主类)
├── context-engine.js             (状态管理)
├── flow-orchestrator.js          (流程执行)
├── feature-recorder.js           (报告生成)
└── v4-examples.js               (8个示例)

docs/
├── INTELLIGENT_TESTING_V4_IMPLEMENTATION.md (完整文档)
├── INTELLIGENT_FLOW_ORIENTED_TESTING_SYSTEM_.md (需求文档)
└── V4_IMPLEMENTATION_SUMMARY.md  (实现总结)
```

---

## 更多帮助

- 📖 完整文档: `INTELLIGENT_TESTING_V4_IMPLEMENTATION.md`
- 💻 代码示例: `src/v4-examples.js`
- 📋 API 文档: 各个类的 JSDoc 注释
- 🐛 故障排查: 完整文档中的 Troubleshooting 部分

---

**快速提示**: 大多数情况下，一行代码就够了：

```javascript
await new AITestCommander(key).startIntelligentTesting(url, "测试");
```
