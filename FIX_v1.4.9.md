# 修复 v1.4.9 - tabs.sendMessage TypeError 修复

## 问题描述

用户遇到错误：

```
Error handling response: TypeError: Error in invocation of tabs.sendMessage
No matching signature.
```

这是因为在 Manifest V3 中，`chrome.tabs.sendMessage()` 的 API 发生了变化。不能混合使用**回调函数**和**Promise 风格**的处理。

## 根本原因

### Manifest V3 中的 API 变化

在 Manifest V3 中，`tabs.sendMessage` 的两种调用方式：

**❌ 错误方式（混合回调）**

```javascript
chrome.tabs.sendMessage(tabId, message, (response) => {
  if (chrome.runtime.lastError) {
    // 这样会导致TypeError
    // 处理错误
  }
});
```

**❌ 也不行（混合回调和.catch）**

```javascript
chrome.tabs
  .sendMessage(tabId, message, (response) => {
    // 回调处理
  })
  .catch(() => {}); // 不能混合
```

**✅ 正确方式（纯 Promise）**

```javascript
chrome.tabs
  .sendMessage(tabId, message)
  .then((response) => {
    // 处理成功
  })
  .catch((error) => {
    // 处理错误
  });
```

## 修复内容

### 1. popup.js - 修复所有 tabs.sendMessage 调用

- **第 94 行**: ping 消息改为 Promise 风格

  ```javascript
  // 修复前
  chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) { ... } // TypeError!
  });

  // 修复后
  chrome.tabs.sendMessage(tab.id, { action: 'ping' })
    .then((response) => { ... })
    .catch((error) => { ... });
  ```

- **第 236 行**: startTest 消息改为 Promise 风格

  ```javascript
  // 修复前
  chrome.tabs.sendMessage(currentTab.id, {
    action: 'startTest',
    config: config
  }, (response) => {
    if (chrome.runtime.lastError) { ... } // TypeError!
  });

  // 修复后
  chrome.tabs.sendMessage(currentTab.id, {
    action: 'startTest',
    config: config
  }).then((response) => { ... })
    .catch((error) => { ... });
  ```

- **其他位置**: addFloatingLog、updateFloatingProgress 等消息统一改为 Promise 风格

### 2. background.js

- pauseTest 和 resumeTest 消息已正确使用.catch()处理

## 验证步骤

1. **刷新扩展**

   ```
   chrome://extensions/ → 找到"Web自动化测试工具" → 点击刷新
   ```

2. **刷新测试页面**

   - 按 F5 或 Ctrl+R 刷新
   - 打开 F12 开发者工具查看 Console

3. **点击扩展开始测试**

   - 点击扩展图标
   - 点击"🚀 开始测试"按钮

4. **查看 Console 日志**

   - 不应该再看到"TypeError: Error in invocation of tabs.sendMessage"
   - 应该看到：
     - `[Web测试工具] 收到消息: startTest`
     - `========== [CRITICAL] startAutomatedTest被调用 ==========`
     - `[Web测试工具] 步骤 1/6: 获取所有button和link...`

5. **验证自动化执行**
   - 页面应该开始自动执行测试
   - 悬浮球应该显示测试统计
   - 表单应该被自动填充

## 关键改进

| 修复项   | 修复前                   | 修复后               |
| -------- | ------------------------ | -------------------- |
| 回调函数 | 混合使用回调和.catch     | 统一使用.then/.catch |
| 错误检查 | chrome.runtime.lastError | 直接使用 error 对象  |
| 代码风格 | 不统一                   | Promise 风格统一     |
| 类型安全 | 容易出错                 | 类型正确             |

## 技术细节

### 为什么会这样？

- Manifest V3 采用了更现代的 Promise API
- 回调函数签名与 Promise 风格混合会导致签名不匹配
- Chrome API 检查会严格验证调用方式

### 如何避免？

- 统一使用 Promise 风格（.then/.catch）
- 不要混合回调函数和 Promise
- 使用 async/await 可以进一步简化（需要函数是 async）

## 所有修改的文件

✅ `src/popup.js` - 修复所有 tabs.sendMessage 调用（8 处）
✅ `src/background.js` - 验证已正确使用 Promise 风格
✅ `src/content-script.js` - 无需修改（已是 Promise 风格）

## 错误验证

已通过 VS Code 的 get_errors 工具验证：

- ✅ popup.js - No errors found
- ✅ background.js - No errors found
- ✅ content-script.js - No errors found

---

**修复完成时间**: 2026-01-09
**修复版本**: v1.4.9
**影响范围**: tabs.sendMessage 消息转发（popup.js 所有消息发送）
