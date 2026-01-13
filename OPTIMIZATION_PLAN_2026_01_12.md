# 综合优化方案 - 2026 年 1 月 12 日

## 问题诊断

### 1. 测试统计数据始终为 0

**症状**：弹窗中显示"已测试项目: 0，成功: 0，失败: 0"
**可能原因**：

- content-script 的 `testStats` 对象没有正确初始化
- `updateStatus()` 函数发送的消息没有被 popup 接收
- popup 的消息监听器没有正确更新 DOM

**排查步骤**：

1. 在 `startAutomatedTest()` 开始时打印 `testStats` 初始值
2. 在每次点击/交互后打印 `testStats` 更新值
3. 确认 `chrome.runtime.sendMessage` 是否成功（检查 lastError）
4. 确认 popup 的 `chrome.runtime.onMessage` 是否触发

### 2. 页面无自动化交互行为

**症状**：测试运行时页面没有点击、输入等操作
**可能原因**：

- `startAutomatedTest()` 函数没有被调用
- 测试执行被某个错误中断
- 元素选择器无法找到目标元素

**排查步骤**：

1. 检查 Console 是否有 `[Web测试工具] 开始自动化测试` 日志
2. 检查是否有错误日志
3. 确认 `testActive` 标志是否为 true

### 3. 状态持久化不完整

**缺失的状态**：

- AI 生成的测试计划
- 用户输入的测试意图
- 测试用例报告按钮状态
- AI 助手提示词

## 解决方案

### 方案 1：增强日志输出（调试用）

在关键位置添加详细日志：

- content-script.js 的 `startAutomatedTest()` 入口
- 每次元素点击/输入操作
- `testStats` 更新时
- 消息发送/接收时

### 方案 2：修复统计数据更新

确保 testStats 正确初始化和更新：

```javascript
// content-script.js - startAutomatedTest()
testStats = {
  testedCount: 0,
  successCount: 0,
  failureCount: 0,
  apiErrorCount: 0,
  totalButtons: buttons.length, // 确保 totalButtons 被设置
};

// 每次操作后立即更新并发送
testStats.testedCount++;
testStats.successCount++; // 或 failureCount
updateStatus(); // 立即发送到 popup
```

### 方案 3：完善状态持久化

扩展 testingState 对象，包含所有 UI 数据：

```javascript
{
  inProgress: true,
  mode: 'auto' | 'intelligent',
  url: string,
  tabId: number,
  startTime: string,
  config: {...},

  // 新增字段
  testIntent: string,           // 用户输入的测试意图
  aiPlan: object,               // AI 生成的测试计划
  hasTestCaseReport: boolean,   // 是否有测试用例报告
  testStats: {...},             // 当前统计数据
  aiAssistantHints: string[]    // AI 助手提示词历史
}
```

### 方案 4：添加测试完成通知

使用 Chrome Notifications API：

```javascript
chrome.notifications.create({
  type: "basic",
  iconUrl: "images/icon-128.png",
  title: "✅ 测试完成",
  message: `总计: ${testedCount} 项 | 成功: ${successCount} | 失败: ${failureCount}`,
  priority: 2,
});
```

### 方案 5：实现暂停/恢复功能

添加暂停标志并保存到 storage：

```javascript
let testPaused = false;

// popup.js - 添加暂停/恢复按钮
pauseTestBtn.addEventListener("click", () => {
  if (testPaused) {
    // 恢复测试
    chrome.tabs.sendMessage(currentTab.id, { action: "resumeTest" });
    chrome.storage.local.set({ testPaused: false });
  } else {
    // 暂停测试
    chrome.tabs.sendMessage(currentTab.id, { action: "pauseTest" });
    chrome.storage.local.set({ testPaused: true });
  }
});

// content-script.js - 在测试循环中检查暂停状态
while (testActive && !testPaused) {
  // 执行测试操作
  await delay(config.delay);
}
```

## 实施计划

### 阶段 1：诊断和日志增强（当前）

- [ ] 添加详细日志到 content-script.js
- [ ] 确认消息发送/接收流程
- [ ] 验证 testStats 更新逻辑

### 阶段 2：修复统计数据更新

- [ ] 确保 testStats 正确初始化
- [ ] 在每次操作后立即发送 updateStatus
- [ ] 添加错误处理和重试机制

### 阶段 3：实现测试完成通知

- [ ] 添加 notifications 权限到 manifest.json ✅
- [ ] 在测试完成时发送通知 ✅
- [ ] 点击通知打开报告页面

### 阶段 4：实现暂停/恢复功能

- [ ] 添加暂停/恢复按钮
- [ ] 保存暂停状态到 storage
- [ ] 修改测试执行循环支持暂停

### 阶段 5：完善状态持久化

- [ ] 保存 AI 计划和测试意图 ✅
- [ ] 保存测试用例报告状态
- [ ] 恢复时完整还原所有 UI 状态

## 优先级

**P0（立即修复）**：

1. 统计数据为 0 的问题
2. 页面无交互行为的问题

**P1（重要）**： 3. 测试完成通知 ✅ 4. 暂停/恢复功能

**P2（优化）**： 5. 完善状态持久化 6. UI 体验优化
