# 🎯 v1.6.0 快速参考卡片

## 📦 新增功能概览

### 🤖 AI 智能表单分析器

**文件：** `src/ai-form-analyzer.js`

**核心方法：**

```javascript
// 分析整个页面
const analysis = await aiFormAnalyzer.analyzePageAndForms();

// 智能填充表单
const result = await aiFormAnalyzer.smartFillForm(formElement, analysis);
```

**返回内容：**

- 页面类型和业务目的
- 推荐的操作列表（优先级排序）
- 表单填充策略（字段 + 建议值 + 原因）
- 表格操作建议（选择哪一行）
- 弹框处理建议（点击哪个按钮）

---

### 📊 增强测试报告系统

**文件：** `src/enhanced-test-reporter.js`

**核心方法：**

```javascript
// 1. 开始会话
const session = reporter.startSession(config);

// 2. 记录功能点
const feature = reporter.recordFeatureTest({
  name: "用户信息编辑",
  type: "form",
});

// 3. 记录元素测试
const element = reporter.recordElementTest(
  {
    type: "button",
    text: "保存",
  },
  feature.featureId
);

// 4. 记录 API 调用
reporter.recordApiCall(
  {
    method: "POST",
    url: "/api/user/update",
    status: 200,
  },
  element.elementId,
  feature.featureId
);

// 5. 更新状态
reporter.updateElementResult(element.elementId, "passed");
reporter.updateFeatureStatus(feature.featureId, "passed");

// 6. 结束会话
const { report } = reporter.endSession();

// 7. 保存报告
await reporter.saveReport(report);
```

**报告包含：**

- 功能点列表（状态、耗时、关联元素/API）
- 元素列表（状态、操作、触发的 API）
- API 列表（方法、URL、状态、关联功能/元素）
- 完整映射关系（功能 ↔ 元素 ↔API）
- 详细统计数据（通过率、耗时分布）

---

## 🎯 典型使用流程

### 流程 1：智能表单填充

```javascript
// Step 1: AI 分析页面
const analysis = await aiFormAnalyzer.analyzePageAndForms();

// Step 2: 查看 AI 推荐
console.log("推荐操作:", analysis.recommendedActions);
// [
//   { action: 'fillForm', target: '用户表单', priority: 9 },
//   { action: 'selectTableRow', target: '数据表格', priority: 7 }
// ]

// Step 3: 根据推荐填充表单
const form = document.querySelector("form");
const fillResult = await aiFormAnalyzer.smartFillForm(form, analysis);

// Step 4: 查看填充结果
fillResult.results.forEach((r) => {
  console.log(`${r.field}: ${r.value} (${r.reason})`);
});
// username: testuser123 (根据字段名称推断)
// email: test@example.com (邮箱格式字段)
```

### 流程 2：完整测试流程

```javascript
// Step 1: 开始测试会话
const reporter = window.enhancedReporter;
const session = reporter.startSession({
  testInteraction: true,
  monitorAPI: true,
});

// Step 2: AI 分析页面
const analyzer = window.aiFormAnalyzer;
const analysis = await analyzer.analyzePageAndForms();

// Step 3: 记录功能点测试
const feature = reporter.recordFeatureTest({
  name: "用户信息编辑",
  type: "form",
  metadata: { pageUrl: window.location.href },
});

// Step 4: 填充表单并记录
const form = document.querySelector("form");
const fillResult = await analyzer.smartFillForm(form, analysis);

fillResult.results.forEach((result) => {
  const element = reporter.recordElementTest(
    {
      type: "input",
      text: result.field,
      selector: `[name="${result.field}"]`,
    },
    feature.featureId
  );

  reporter.updateElementResult(
    element.elementId,
    result.success ? "passed" : "failed",
    { value: result.value, reason: result.reason },
    result.error
  );
});

// Step 5: 提交表单
const submitBtn = form.querySelector('[type="submit"]');
const submitElement = reporter.recordElementTest(
  {
    type: "button",
    text: "提交",
    element: submitBtn,
  },
  feature.featureId
);

// 记录步骤
reporter.recordFeatureStep(feature.featureId, {
  action: "click",
  target: "提交按钮",
  success: true,
});

submitBtn.click();
await delay(1000);

// Step 6: API 会自动被拦截器记录
// reporter.recordApiCall() 在拦截器中自动调用

// Step 7: 更新功能点状态
const allElementsPassed = true; // 根据实际情况
reporter.updateFeatureStatus(
  feature.featureId,
  allElementsPassed ? "passed" : "failed"
);

// Step 8: 结束会话并生成报告
const { report } = reporter.endSession();

// Step 9: 查看报告内容
console.log("测试统计:", report.summary);
console.log("功能点:", report.features);
console.log("映射关系:", report.mappings);

// Step 10: 保存报告
await reporter.saveReport(report);
```

---

## 📋 报告查询示例

```javascript
// 加载最新报告
const result = await new Promise((resolve) => {
  chrome.storage.local.get(["latestReport"], resolve);
});
const report = result.latestReport;

// 查询1: 找出所有失败的功能点
const failedFeatures = report.features.filter((f) => f.status === "failed");
console.log(
  "失败的功能点:",
  failedFeatures.map((f) => f.featureName)
);

// 查询2: 找出某个功能点触发的所有 API
const feature = report.features.find((f) => f.featureName === "用户信息编辑");
console.log("触发的 API:", feature.relatedApis);

// 查询3: 找出某个 API 对应的功能点
const apiUrl = "/api/user/update";
const api = report.apis.find((a) => a.url === apiUrl);
console.log("API 所属功能:", api.featureName);

// 查询4: 查看元素和 API 的映射
const mapping = report.mappings.elementToApis;
mapping.forEach((m) => {
  console.log(`${m.elementText} → ${m.apis.map((a) => a.url).join(", ")}`);
});

// 查询5: 统计 API 成功率
const totalApis = report.summary.totalApis;
const successApis = report.summary.successApis;
const apiSuccessRate = report.summary.apiSuccessRate;
console.log(`API 成功率: ${apiSuccessRate}% (${successApis}/${totalApis})`);
```

---

## 🔍 调试技巧

### 查看 AI 分析结果

```javascript
// 在浏览器 Console 中运行
const analysis = await window.aiFormAnalyzer.analyzePageAndForms();
console.log("页面分析:", JSON.stringify(analysis, null, 2));
```

### 查看当前测试会话

```javascript
const reporter = window.enhancedReporter;
console.log("当前会话:", reporter.currentSession);
console.log("功能点:", Array.from(reporter.featureMap.values()));
console.log("元素:", Array.from(reporter.elementMap.values()));
console.log("API:", Array.from(reporter.apiMap.values()));
```

### 手动记录功能点

```javascript
const reporter = window.enhancedReporter;

// 如果还没有会话，先开始一个
if (!reporter.currentSession) {
  reporter.startSession({ testInteraction: true });
}

// 记录功能点
const feature = reporter.recordFeatureTest({
  name: "测试功能",
  type: "manual",
  description: "手动记录的功能点",
});

console.log("功能点已记录:", feature.featureId);

// 更新状态
reporter.updateFeatureStatus(feature.featureId, "passed");
```

---

## ⚙️ 配置选项

### AI 分析器配置

```javascript
// 在 ai-form-analyzer.js 中
class AIFormAnalyzer {
  constructor() {
    this.qwenInstance = null; // Qwen 实例
    this.analysisCache = new Map(); // 分析结果缓存
    // ...
  }
}
```

### 报告系统配置

```javascript
// 在 enhanced-test-reporter.js 中
async saveReport(report) {
  // 只保留最近 50 个报告
  const reportsToSave = reports.slice(0, 50);
  // ...
}
```

---

## 📊 统计数据说明

```javascript
{
  statistics: {
    // 功能点统计
    totalFeatures: 5,        // 总功能点数
    testedFeatures: 5,       // 已测试功能点数
    passedFeatures: 4,       // 通过的功能点数
    failedFeatures: 1,       // 失败的功能点数
    featurePassRate: "80.00%", // 功能点通过率

    // 元素统计
    totalElements: 15,       // 总元素数
    testedElements: 15,      // 已测试元素数
    passedElements: 13,      // 通过的元素数
    failedElements: 2,       // 失败的元素数
    elementPassRate: "86.67%", // 元素通过率

    // API 统计
    totalApis: 8,           // 总 API 调用数
    successApis: 7,         // 成功的 API 数
    failedApis: 1,          // 失败的 API 数
    apiSuccessRate: "87.50%" // API 成功率
  }
}
```

---

## 🎓 最佳实践

### 1. 使用 AI 分析优化测试

```javascript
// ✅ 好的做法：先分析后测试
const analysis = await aiFormAnalyzer.analyzePageAndForms();
const actions = analysis.recommendedActions.sort(
  (a, b) => b.priority - a.priority
);
// 按优先级执行推荐的操作

// ❌ 不好的做法：盲目测试
// 直接开始点击所有按钮，没有计划
```

### 2. 充分利用映射关系

```javascript
// ✅ 好的做法：使用映射追踪问题
const failedApis = report.apis.filter((a) => !a.success);
failedApis.forEach((api) => {
  console.log(`失败的 API: ${api.url}`);
  console.log(`来源元素: ${api.elementText}`);
  console.log(`所属功能: ${api.featureName}`);
});

// ❌ 不好的做法：只看统计数字
// 只知道有 API 失败，不知道是哪个功能导致的
```

### 3. 记录详细的测试步骤

```javascript
// ✅ 好的做法：记录每个步骤
reporter.recordFeatureStep(featureId, {
  action: "fillField",
  target: "username",
  value: "testuser",
  success: true,
});

// ❌ 不好的做法：只记录最终结果
// 只知道功能失败，不知道是哪一步失败的
```

---

## 🚨 常见问题

### Q1: AI 分析失败怎么办？

**A:** 系统会自动降级到规则分析

```javascript
// AI 分析失败时会自动调用
ruleBasedAnalysis(pageInfo);
```

### Q2: 报告太多占用空间？

**A:** 定期导出和清理

```javascript
// 导出报告
const reports = await reporter.loadAllReports();
const json = JSON.stringify(reports, null, 2);
// 保存到文件...

// 清理旧报告
chrome.storage.local.set({ enhancedTestReports: [] });
```

### Q3: 如何查看功能点的测试步骤？

**A:**

```javascript
const feature = report.features.find((f) => f.featureName === "用户编辑");
console.log("测试步骤:", feature.steps);
// [
//   { action: 'fillField', target: 'username', success: true },
//   { action: 'fillField', target: 'email', success: true },
//   { action: 'click', target: '提交按钮', success: true }
// ]
```

---

## 📞 获取帮助

- 📖 详细文档: `UPDATE_v1.6.0.md`
- 📖 API 配置: `QWEN_API_CONFIG_GUIDE.md`
- 📖 质量保证: `QUALITY_ASSURANCE_v1.5.2.md`

---

**版本：** 1.6.0
**更新日期：** 2026 年 1 月 9 日
**状态：** ✅ 生产就绪
