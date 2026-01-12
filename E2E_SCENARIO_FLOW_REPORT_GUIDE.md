# E2E 场景流水报告生成指南

## 📋 概述

E2E 场景流水报告是一份**按用户操作路径**追踪整个测试流程的详细记录。它记录每一个用户操作（点击、输入、选择等），并展示操作的成功/失败、耗时、API 调用等关键指标，帮助深入理解测试的完整流程和性能瓶颈。

---

## 🔄 工作流程

### 1️⃣ 数据收集 (Content Script)

#### 初始化阶段

- **startAutomatedTest()** 开始时：
  ```javascript
  if (window.e2eTracker) {
    window.e2eTracker.reset(); // 清空之前的追踪数据
  }
  ```

#### 交互记录阶段

- **performInteraction()** 每执行一步操作后：

  ```javascript
  // 记录这一步的完整信息
  if (window.e2eTracker) {
    const stepData = {
      action: type, // button | link | input | component-select | component-interaction
      target: item?.selector || item?.text, // 目标元素选择器或文本
      framework: item?.framework || null, // element-plus | ant-design-vue | naive-ui
      componentType: item?.componentType, // select | datepicker | cascader | checkbox | radio | switch
      success: actionSuccess, // 操作是否成功
      error: actionError || null, // 失败原因
      duration: Date.now() - startTime, // 耗时(ms)
      apiCalls: apiRequests.map((r) => ({
        // API调用列表
        method: r.method,
        url: r.url,
        status: r.status,
      })),
    };
    window.e2eTracker.recordStep(stepData);
  }
  ```

- 支持的操作类型：
  - **button**: 按钮点击
  - **link**: 链接导航
  - **input**: 文本/邮箱/密码/数字输入
  - **component-select**: UI 框架的下拉选择组件
  - **component-interaction**: DatePicker、Cascader、Checkbox、Radio、Switch 等组件

#### 保存阶段

- **startAutomatedTest()** 测试结束时：

  ```javascript
  // 生成完整的场景摘要
  const scenarioSummary = window.e2eTracker.generateSummary();

  // 保存到Chrome Storage
  chrome.storage.local.set({ e2eScenario: scenarioSummary });
  ```

---

### 2️⃣ 数据存储格式

`e2eScenario` 结构如下：

```javascript
{
  // 元数据
  metadata: {
    startTime: "2024-01-15T10:30:45.123Z",
    duration: 45678,              // 总耗时(ms)
    pageUrl: "http://example.com"
  },

  // 汇总统计
  summary: {
    totalSteps: 42,
    successSteps: 38,
    failureSteps: 4,
    successRate: 90.5
  },

  // 性能数据
  performanceAnalysis: {
    avgDuration: 1087,        // 平均每步耗时(ms)
    maxDuration: 5230,        // 最长单步耗时(ms)
    minDuration: 120,         // 最短单步耗时(ms)
    total: 45678              // 总耗时(ms)
  },

  // API调用统计
  apiStats: {
    callsByMethod: {
      "GET": 15,
      "POST": 8,
      "PUT": 2,
      "DELETE": 1
    },
    failures: [
      { method: "POST", url: "/api/user/save", status: 500 },
      { method: "GET", url: "/api/data", status: 404 }
    ]
  },

  // 关键路径（失败+关键操作）
  criticalPath: [
    {
      id: "step-23",
      action: "submit",
      target: "#submitBtn",
      success: false,
      error: "API错误: 500",
      duration: 3450,
      isCritical: true
    },
    // ... 其他失败或关键步骤
  ],

  // 完整步骤序列
  steps: [
    {
      id: "step-1",
      timestamp: "2024-01-15T10:30:45.234Z",
      relativeTime: 111,        // 相对于测试开始的时间(ms)
      action: "button",
      target: ".add-user-btn",
      framework: null,
      componentType: null,
      success: true,
      error: null,
      beforeValue: null,
      afterValue: null,
      valueChanged: false,
      duration: 234,
      apiCalls: [
        { method: "POST", url: "/api/user", status: 201 }
      ],
      screenshot: null,         // 可选
      notes: "用户新增弹框已打开"
    },
    // ... 其他42步
  ],

  // AI决策记录（如果有）
  decisions: [
    {
      step: 5,
      decision: "continue",
      reason: "表单填充成功，继续下一步",
      timestamp: "2024-01-15T10:30:52.456Z"
    }
  ]
}
```

---

### 3️⃣ 可视化展示 (Report)

#### 页面加载时

```javascript
// report.js DOMContentLoaded事件
chrome.storage.local.get(["e2eScenario"], (result) => {
  if (result.e2eScenario) {
    renderE2EScenarioFlow(result.e2eScenario);
  }
});
```

#### 渲染内容

##### 📊 KPI 概览卡片

```
┌─────────────────────────────────────────────────┐
│  📈 42步  │ ✅ 38成功 │ ❌ 4失败 │ 📊 90.5% │ ⏱️ 45.6s │
└─────────────────────────────────────────────────┘
```

##### 🔄 操作序列表格

| 步骤 | 行为             | 目标              | 结果 | 耗时   | 框架         |
| ---- | ---------------- | ----------------- | ---- | ------ | ------------ |
| 1    | 按钮             | .add-user-btn     | ✅   | 234ms  | -            |
| 2    | 组件交互(select) | .user-role-select | ✅   | 567ms  | element-plus |
| 3    | 输入             | #username         | ✅   | 145ms  | -            |
| ...  | ...              | ...               | ...  | ...    | ...          |
| 23   | 按钮             | #submitBtn        | ❌   | 3450ms | -            |

**失败步骤会显示错误原因：**

```
⚠️ 错误: API错误: 500 Internal Server Error
```

##### ⏱️ 性能分析

```
平均耗时      最大耗时        最小耗时
  1.09s        5.23s           120ms
[====●═══════][═══════●═]  [●═══════════]
```

##### 🌐 API 调用统计

```
GET    (15) [█████████████████░░░░]
POST   (8)  [██████████░░░░░░░░░░]
PUT    (2)  [███░░░░░░░░░░░░░░░░░]
DELETE (1)  [██░░░░░░░░░░░░░░░░░░]

⚠️ 失败请求 (2)
  POST /api/user/save - 500
  GET  /api/data - 404
```

##### 🎯 关键路径突出显示

```
❌ submit [失败] [关键]
  target: #submitBtn (3450ms)
  错误: API错误: 500

🎯 navigate [成功] [关键]
  target: /dashboard (1234ms)

❌ login [失败]
  target: #loginBtn (892ms)
  错误: 账户已锁定
```

---

## 🎯 关键特性

### 1️⃣ 按操作路径完整追踪

每一步操作都被完整记录，包括：

- ✅ 操作成功/失败状态
- ⏱️ 单步和总体耗时
- 🌐 触发的 API 调用及状态
- 🔗 元素信息（选择器、文本）
- 🎨 框架和组件类型

### 2️⃣ 自动关键路径识别

系统自动识别和突出显示：

- ❌ **失败步骤**：任何操作失败
- 🎯 **关键操作**：submit、navigate、login、logout 等
- ⚡ **性能瓶颈**：耗时特别长的操作

### 3️⃣ 多维度分析

- **性能维度**：平均/最大/最小耗时统计
- **可靠性维度**：成功率、失败原因统计
- **API 维度**：按 HTTP 方法分类，失败请求列表
- **框架维度**：按 UI 框架类型分组操作

### 4️⃣ 交互式展示

- 表格显示，方便排序和搜索
- 失败步骤自动展开显示错误详情
- 性能数据以图表形式可视化
- 关键路径用颜色和标签突出显示

---

## 📊 使用场景

### 场景 1：调试失败的测试

1. 打开 E2E 流水报告
2. 在"关键路径"部分查看失败的操作
3. 从"操作序列表"找到失败步骤的前后操作
4. 查看"API 统计"了解是否是后端问题

**快速定位**：

```
❌ 失败步骤 #23: 表单提交 - 目标 #submitBtn
  错误: API错误: 500
  前置步骤: 表单填充成功，API调用正常
  → 问题根因: 后端服务器错误，非前端问题
```

### 场景 2：性能优化分析

1. 查看"性能分析"的平均/最大/最小耗时
2. 在"操作序列表"中找到最耗时的操作
3. 分析该操作是否涉及大量 API 调用

**优化建议**：

```
最大耗时操作: DatePicker选择 (5.23s)
  - 可能原因: 日历数据加载缓慢
  - 优化建议:
    1. 检查API响应时间
    2. 考虑前端缓存日期数据
    3. 减少不必要的re-render
```

### 场景 3：跨框架组件兼容性测试

1. 在"操作序列表"按"框架"列过滤
2. 对比不同框架中相同组件类型的成功率
3. 识别框架特定的问题

**对比分析**：

```
Select组件成功率:
  Element Plus: 100% (10/10) ✅
  Ant Design Vue: 90% (9/10) ⚠️
  Naive UI: 80% (8/10) ⚠️

→ Element Plus最稳定，考虑采用该框架
```

---

## 🔧 技术实现细节

### E2EScenarioTracker 类

**核心方法：**

```javascript
// 1. 重置追踪器
tracker.reset()

// 2. 记录每一步操作
tracker.recordStep({
  action: 'button',
  target: '.btn',
  success: true,
  duration: 234,
  apiCalls: [...]
})

// 3. 记录AI决策（可选）
tracker.recordDecision({
  decision: 'continue',
  reason: '表单填充成功'
})

// 4. 生成完整摘要
const summary = tracker.generateSummary()
// → 包含 metadata, summary, performanceAnalysis, apiStats, criticalPath, steps, decisions

// 5. 性能分析
tracker.getPerformanceAnalysis()
// → { avgDuration, maxDuration, minDuration, total }

// 6. API统计
tracker.getAPIStats()
// → { callsByMethod, failures }

// 7. 获取关键路径
tracker.generateCriticalPath()
// → 失败 + 关键操作的列表
```

### Storage 集成

**写入时机：**

```
startAutomatedTest() → reset()
    ↓
performInteraction() → recordStep() [重复42次]
    ↓
测试结束 → generateSummary() → chrome.storage.local.set({ e2eScenario })
```

**读取时机：**

```
report.html DOMContentLoaded → chrome.storage.local.get(['e2eScenario'])
    ↓
renderE2EScenarioFlow() → 生成HTML并插入页面
```

---

## 📈 报告示例

### 简单案例：4 步操作，全部成功

```
📊 E2E场景流水报告

📈 4步 | ✅ 4成功 | ❌ 0失败 | 📊 100% | ⏱️ 1.2s

🔄 操作序列
1. 按钮点击 → .new-item-btn → ✅ 234ms
2. 输入 → #itemName → ✅ 145ms
3. 下拉选择 → .category-select (Element Plus) → ✅ 567ms
4. 按钮点击 → #saveBtn → ✅ 289ms

⏱️ 性能分析
平均耗时: 308.75ms
最大耗时: 567ms (步骤3)
最小耗时: 145ms (步骤2)

🌐 API调用统计
POST (1) 成功

✅ 无失败，无关键路径
```

### 复杂案例：42 步操作，部分失败

```
📊 E2E场景流水报告

📈 42步 | ✅ 38成功 | ❌ 4失败 | 📊 90.5% | ⏱️ 45.6s

🔄 操作序列 [显示前10步，其余省略]
1. 按钮点击 → .add-user-btn → ✅ 234ms
...
23. 按钮点击 → #submitBtn → ❌ 3450ms
    ⚠️ 错误: API错误: 500
...

⏱️ 性能分析
平均耗时: 1087ms
最大耗时: 5230ms (步骤18) [DatePicker交互]
最小耗时: 120ms (步骤3)

🌐 API调用统计
GET    (15) ├─────────────────●
POST   (8)  ├──────────●
PUT    (2)  ├──●
DELETE (1)  ├─●

⚠️ 失败请求 (2)
  POST /api/user/save - 500
  GET  /api/data/list - 404

🎯 关键路径
[关键操作 & 失败步骤]

❌ submit [失败] [关键]
  target: #submitBtn (3450ms)
  错误: API错误: 500 Internal Server Error

🎯 navigate [成功] [关键]
  target: /dashboard (1234ms)

❌ login [失败]
  target: #loginBtn (892ms)
  错误: 账户已锁定

❌ delete [失败]
  target: #deleteBtn (456ms)
  错误: 权限不足
```

---

## 🚀 快速启用

E2E 追踪已自动集成到测试流程中。只需：

1. **运行测试**

   ```
   打开要测试的网页 → 点击扩展 → 点击"开始测试"
   ```

2. **等待完成**

   ```
   测试自动收集所有操作步骤
   ```

3. **查看报告**
   ```
   打开报告页面 → 向下滚动找到"E2E场景流水报告"部分
   ```

---

## 🔐 隐私和数据

- E2E 数据**仅保存在本地** Chrome Storage
- **不上传**到任何服务器
- 关闭标签页后自动清理（可选）
- 支持手动清除数据

---

## 📚 相关文档

- [E2EScenarioTracker 类实现](./src/e2e-scenario-tracker.js)
- [Content Script 集成点](./src/content-script.js#performInteraction)
- [Report 可视化函数](./src/report.js#renderE2EScenarioFlow)

---

**最后更新**: 2024-01-15
**版本**: 2.0 (E2E Flow Report)
