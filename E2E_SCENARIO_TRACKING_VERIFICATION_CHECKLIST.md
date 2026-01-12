# E2E 场景追踪功能 - 验证清单 v1.0

## ✅ 集成验证

### 1️⃣ manifest.json 检查

- [x] `src/e2e-scenario-tracker.js` 已在 `content_scripts` 列表**顶部**注册
  - 确保在其他脚本之前加载
  - 位置: `content_scripts[0].js` 的第一项

### 2️⃣ E2EScenarioTracker 类验证

- [x] 文件: `src/e2e-scenario-tracker.js` 存在
- [x] 导出: `window.e2eTracker` 全局可用
- [x] 核心方法:
  - ✅ `reset()` - 初始化追踪器
  - ✅ `recordStep(step)` - 记录单步操作
  - ✅ `recordDecision(decision)` - 记录 AI 决策
  - ✅ `generateSummary()` - 生成完整摘要
  - ✅ `getPerformanceAnalysis()` - 性能分析
  - ✅ `getAPIStats()` - API 统计
  - ✅ `generateCriticalPath()` - 关键路径生成

### 3️⃣ Content Script 集成验证

- [x] **startAutomatedTest()** 函数:

  ```javascript
  // 测试开始时调用 (行约1945)
  if (window.e2eTracker) {
    window.e2eTracker.reset();
  }
  ```

- [x] **performInteraction()** 函数:

  ```javascript
  // 每步操作后调用 (行约1330)
  try {
    if (window.e2eTracker) {
      const stepData = {
        action: type,
        target: item?.selector || item?.text,
        framework: item?.framework || null,
        componentType: item?.componentType || null,
        success: actionSuccess,
        error: actionError || null,
        duration: Date.now() - startTime,
        apiCalls: apiRequests.map(...)
      };
      window.e2eTracker.recordStep(stepData);
    }
  } catch (e) {
    console.log('[Web测试工具] E2E追踪记录失败:', e);
  }
  ```

- [x] **startAutomatedTest()** 结束时:
  ```javascript
  // 保存E2E数据 (行约2130)
  try {
    if (window.e2eTracker) {
      const scenarioSummary = window.e2eTracker.generateSummary();
      chrome.storage.local.set({ e2eScenario: scenarioSummary });
      console.log("[Web测试工具] E2E场景数据已保存");
    }
  } catch (e) {
    console.log("[Web测试工具] E2E数据保存失败:", e);
  }
  ```

### 4️⃣ Report 脚本集成验证

- [x] **DOMContentLoaded** 事件处理:

  ```javascript
  // 加载e2eScenario数据 (行约13)
  chrome.storage.local.get([..., 'e2eScenario'], (result) => {
    // result.e2eScenario 包含完整追踪数据
  });
  ```

- [x] **renderE2EScenarioFlow()** 函数:

  ```javascript
  // 新增的可视化函数 (行约1078)
  function renderE2EScenarioFlow(scenario) {
    // 渲染5个部分: KPI/表格/性能/API/关键路径
  }
  ```

- [x] **报告页面** 集成点:
  ```javascript
  // 在渲染组件结果后添加E2E可视化 (行约70)
  if (result.e2eScenario) {
    renderE2EScenarioFlow(result.e2eScenario);
  }
  ```

---

## 🧪 功能验证流程

### 验证步骤 1: 追踪器初始化 ✅

**目标**: 确认追踪器在测试开始时被重置

**测试步骤**:

1. 打开浏览器开发者工具 (F12)
2. 打开要测试的网站
3. 点击扩展图标，点击"开始测试"
4. 在 Console 查看日志

**预期结果**:

```
[Web测试工具] ✓ E2E场景追踪已初始化
```

**验证代码** (在 Console 运行):

```javascript
// 检查追踪器是否存在
console.log("Tracker exists:", typeof window.e2eTracker !== "undefined");
console.log(
  "Has reset method:",
  typeof window.e2eTracker?.reset === "function"
);
console.log(
  "Current steps:",
  window.e2eTracker?.getScenario()?.steps?.length || 0
);
```

**成功标志**: 输出显示 `Tracker exists: true`

---

### 验证步骤 2: 步骤记录 ✅

**目标**: 确认每个交互都被正确记录

**测试步骤**:

1. 测试页面上进行多个操作:
   - 点击按钮 (≥2 个)
   - 进行文本输入 (≥1 个)
   - 选择下拉菜单 (≥1 个)
2. 操作完成后，在 Console 检查

**预期结果**:

```javascript
window.e2eTracker.getScenario().steps.length; // 应 >= 4
```

**详细验证** (在 Console 运行):

```javascript
const scenario = window.e2eTracker.getScenario();
console.log("总步骤数:", scenario.steps.length);
console.log("成功步骤:", scenario.steps.filter((s) => s.success).length);
console.log("失败步骤:", scenario.steps.filter((s) => !s.success).length);

// 打印所有步骤的action
scenario.steps.forEach((step, i) => {
  console.log(
    `${i + 1}. ${step.action} - ${step.target} - ${step.success ? "✅" : "❌"}`
  );
});
```

**成功标志**:

- 步骤数 > 0
- 每个步骤有 action, target, success, duration 字段
- success 为 boolean 类型

---

### 验证步骤 3: 数据持久化 ✅

**目标**: 确认 E2E 数据被保存到 Chrome Storage

**测试步骤**:

1. 测试运行完成后，测试状态变为"已完成"
2. 打开 DevTools → Application → LocalStorage → 扩展 URL
3. 查找 `e2eScenario` key

**预期结果**:

- 存在 `e2eScenario` key
- value 是一个完整的 JSON 对象

**验证代码** (在 Console 运行):

```javascript
chrome.storage.local.get(["e2eScenario"], (result) => {
  if (result.e2eScenario) {
    console.log("✅ E2E数据已保存");
    console.log(
      "数据大小:",
      JSON.stringify(result.e2eScenario).length,
      "bytes"
    );
    console.log("步骤数:", result.e2eScenario.steps?.length);
    console.log("性能数据:", result.e2eScenario.performanceAnalysis);
  } else {
    console.log("❌ E2E数据未找到");
  }
});
```

**成功标志**:

- 输出显示 `✅ E2E数据已保存`
- 数据包含 steps, summary, performanceAnalysis 字段

---

### 验证步骤 4: 报告可视化 ✅

**目标**: 确认报告页面正确显示 E2E 流水信息

**测试步骤**:

1. 测试运行完成后，打开报告页面
2. 向下滚动，查找 "📊 E2E 场景流水报告" 标题
3. 验证 5 个报告部分都已渲染

**预期结果**:

- [ ] 标题: "📊 E2E 场景流水报告"
- [ ] KPI 卡片: 显示 "📈 X 步", "✅ X 成功", "❌ X 失败", "📊 X%", "⏱️ X.Xs"
- [ ] 操作序列表: 包含列 "步骤|行为|目标|结果|耗时|框架"
- [ ] 性能分析: 显示平均/最大/最小耗时
- [ ] API 统计: 显示 GET/POST/PUT/DELETE 的分布
- [ ] 关键路径: 显示失败和关键操作 (如有)

**验证代码** (在 Console 运行):

```javascript
// 检查是否找到E2E报告section
const e2eSection = Array.from(document.querySelectorAll("section, div")).find(
  (el) => el.textContent.includes("E2E场景流水报告")
);

if (e2eSection) {
  console.log("✅ E2E报告section已找到");
  console.log("包含内容:");
  console.log(
    "- KPI卡片:",
    e2eSection.textContent.includes("📈") ? "✅" : "❌"
  );
  console.log(
    "- 操作序列:",
    e2eSection.textContent.includes("操作序列") ? "✅" : "❌"
  );
  console.log(
    "- 性能分析:",
    e2eSection.textContent.includes("性能分析") ? "✅" : "❌"
  );
  console.log(
    "- API统计:",
    e2eSection.textContent.includes("API调用") ? "✅" : "❌"
  );
  console.log(
    "- 关键路径:",
    e2eSection.textContent.includes("关键路径") ? "✅" : "❌"
  );
} else {
  console.log("❌ E2E报告section未找到");
}
```

**成功标志**: 输出显示所有部分都被找到 (✅)

---

### 验证步骤 5: 不同操作类型 ✅

**目标**: 确认不同类型的操作都被正确追踪

**测试页面选择**:

- 需要包含以下元素的页面:
  - ✅ 按钮 (button)
  - ✅ 输入框 (input[type="text"])
  - ✅ 下拉菜单 (select 或 UI 框架组件)
  - ✅ 可选: DatePicker, Cascader, Checkbox 等

**测试步骤**:

1. 对每种元素进行交互
2. 测试完成后检查 E2E 数据

**验证代码** (在 Console 运行):

```javascript
chrome.storage.local.get(["e2eScenario"], (result) => {
  const steps = result.e2eScenario?.steps || [];
  const actionTypes = {};

  steps.forEach((step) => {
    actionTypes[step.action] = (actionTypes[step.action] || 0) + 1;
  });

  console.log("操作类型统计:");
  for (const [type, count] of Object.entries(actionTypes)) {
    console.log(`  ${type}: ${count}次`);
  }

  // 检查是否有不同的framework
  const frameworks = new Set(steps.map((s) => s.framework).filter((f) => f));
  console.log(
    "涉及的框架:",
    Array.from(frameworks).join(", ") || "(无框架组件)"
  );
});
```

**成功标志**:

- 至少包含 button, input, component-select 三种操作
- 如果测试页面有特殊组件，相应的 componentType 也应该出现

---

### 验证步骤 6: 性能数据准确性 ✅

**目标**: 确认耗时统计准确

**测试步骤**:

1. 运行测试，记录总耗时
2. 检查 E2E 数据中的性能分析

**验证代码** (在 Console 运行):

```javascript
chrome.storage.local.get(["e2eScenario"], (result) => {
  const scenario = result.e2eScenario;
  const perf = scenario.performanceAnalysis;
  const steps = scenario.steps || [];

  console.log("性能数据验证:");
  console.log("总耗时:", perf.total, "ms");
  console.log("步骤数:", steps.length);
  console.log("平均耗时:", perf.avgDuration.toFixed(2), "ms");
  console.log("最大耗时:", perf.maxDuration, "ms");
  console.log("最小耗时:", perf.minDuration, "ms");

  // 验证计算的正确性
  const calculatedAvg =
    steps.reduce((sum, s) => sum + s.duration, 0) / steps.length;
  const calculatedMax = Math.max(...steps.map((s) => s.duration));
  const calculatedMin = Math.min(...steps.map((s) => s.duration));

  console.log("\n数据一致性检查:");
  console.log(
    "平均耗时匹配:",
    Math.abs(perf.avgDuration - calculatedAvg) < 1 ? "✅" : "❌"
  );
  console.log(
    "最大耗时匹配:",
    perf.maxDuration === calculatedMax ? "✅" : "❌"
  );
  console.log(
    "最小耗时匹配:",
    perf.minDuration === calculatedMin ? "✅" : "❌"
  );
});
```

**成功标志**:

- 所有"数据一致性检查"都显示 ✅
- duration 字段都是正整数

---

### 验证步骤 7: API 追踪 ✅

**目标**: 确认 API 调用被正确记录

**测试页面**: 需要包含会触发 API 调用的操作

**测试步骤**:

1. 运行包含 API 调用的测试
2. 检查 API 统计数据

**验证代码** (在 Console 运行):

```javascript
chrome.storage.local.get(["e2eScenario"], (result) => {
  const apiStats = result.e2eScenario?.apiStats;

  console.log("API调用统计:");
  console.log("按method分布:", apiStats.callsByMethod);

  if (apiStats.failures && apiStats.failures.length > 0) {
    console.log("失败的API:");
    apiStats.failures.forEach((f) => {
      console.log(`  ${f.method} ${f.url} - ${f.status}`);
    });
  } else {
    console.log("✅ 所有API调用都成功");
  }

  // 验证步骤中的API调用
  const stepsWithAPI = result.e2eScenario.steps.filter(
    (s) => s.apiCalls && s.apiCalls.length > 0
  );
  console.log(`\n有API调用的步骤: ${stepsWithAPI.length}个`);
});
```

**成功标志**:

- callsByMethod 包含至少一个 HTTP 方法的计数
- 如果有 API 失败，failures 列表有相应记录

---

## 🔧 常见问题修复

### 问题 1: E2E 追踪器不存在

**症状**: `window.e2eTracker is undefined`

**检查清单**:

- [ ] manifest.json 中是否有 `src/e2e-scenario-tracker.js`
- [ ] 该脚本是否在 `content_scripts` 列表的**顶部**
- [ ] 文件是否被正确加载 (查看 Network 标签)
- [ ] 扩展是否被重新加载过 (右键扩展 → 重新加载)

**修复**:

1. 确保 manifest.json 正确注册脚本
2. 重新加载扩展: Chrome 右上角 → 扩展 → 右键本扩展 → 重新加载

### 问题 2: 步骤没有被记录

**症状**: `window.e2eTracker.getScenario().steps.length === 0`

**检查清单**:

- [ ] 是否运行了测试 (testActive === true)
- [ ] 是否有网络错误导致脚本中断
- [ ] performInteraction() 是否被调用

**修复**:

1. 查看 Console 中是否有错误信息
2. 确认测试状态 (查看浮窗或通知)
3. 重新运行测试，检查网络连接

### 问题 3: 报告页面看不到 E2E 数据

**症状**: 报告页面没有"E2E 场景流水报告"部分

**检查清单**:

- [ ] 是否运行过测试
- [ ] Storage 中是否有 `e2eScenario` 数据
- [ ] 报告页面是否正确加载了 report.js
- [ ] Browser Console 中是否有错误

**修复**:

1. 运行一次完整测试
2. 清除浏览器缓存，刷新报告页面
3. 检查 DevTools → Console 中的错误信息
4. 确保不是在隐身窗口中 (Storage 独立)

### 问题 4: 追踪数据不完整

**症状**: 某些步骤缺少 apiCalls 或 duration 信息

**检查清单**:

- [ ] 是否所有操作都有 duration 字段
- [ ] API 拦截是否正常工作
- [ ] 是否有 JavaScript 错误中断了记录

**修复**:

1. 检查 Console 中的错误信息
2. 查看 performInteraction() 是否正确传递数据
3. 验证 apiRequests 数组是否被正确收集

---

## 📋 完整验证清单

在上线前，请完成以下所有验证:

### 代码集成

- [ ] manifest.json 中 e2e-scenario-tracker.js 位于内容脚本顶部
- [ ] e2e-scenario-tracker.js 无语法错误
- [ ] content-script.js 中 performInteraction() 有 E2E 记录代码
- [ ] content-script.js 中 startAutomatedTest() 有初始化和保存代码
- [ ] report.js 中有 renderE2EScenarioFlow() 函数
- [ ] report.js 中 DOMContentLoaded 加载 e2eScenario

### 功能测试

- [ ] 验证步骤 1: 追踪器初始化 ✅
- [ ] 验证步骤 2: 步骤记录 ✅
- [ ] 验证步骤 3: 数据持久化 ✅
- [ ] 验证步骤 4: 报告可视化 ✅
- [ ] 验证步骤 5: 不同操作类型 ✅
- [ ] 验证步骤 6: 性能数据准确性 ✅
- [ ] 验证步骤 7: API 追踪 ✅

### 跨浏览器测试

- [ ] Chrome (最新版本)
- [ ] Edge (最新版本)
- [ ] 考虑 Firefox (如果支持 MV3)

### 边界情况测试

- [ ] 无操作的测试 (检查 KPI 显示)
- [ ] 全部失败的测试 (检查关键路径突出)
- [ ] 只有成功操作 (检查成功率显示)
- [ ] 长时间运行测试 (检查性能)

---

## 🚀 上线检查清单

**部署前最终确认**:

- [ ] 所有验证步骤都通过 ✅
- [ ] 没有 Console 错误或警告
- [ ] 报告页面在不同分辨率下都能正常显示
- [ ] 存储容量足够 (单个报告 50-200KB)
- [ ] 性能没有明显下降 (测试耗时 < 10% 增长)
- [ ] 文档已更新 (GUIDE + QUICK_REFERENCE)

**上线步骤**:

1. 运行完整验证清单
2. 执行代码审查
3. 部署到生产环境
4. 监控用户反馈
5. 根据反馈迭代改进

---

**验证日期**: ******\_\_\_******
**验证人**: ******\_\_\_******
**验证结果**: ✅ 通过 / ⚠️ 部分通过 / ❌ 未通过

**备注**:

---

---

---
