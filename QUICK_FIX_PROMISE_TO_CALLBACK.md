# 🔧 关键修复 - Promise 改为回调方式

## 问题根因

原来的代码使用 `.then().catch()` Promise 方式发送消息：

```javascript
chrome.tabs.sendMessage(...).then((resp) => {
  // 这里检查 chrome.runtime.lastError 已经太晚了
  if (chrome.runtime.lastError) { ... }
})
```

**为什么这样不行？**

- Chrome 的 `runtime.lastError` 必须在回调函数的**第一时间**检查
- 使用 Promise 时，错误处理机制不同，lastError 可能未设置
- 导致错误被静默忽略，用户看不到任何反馈

## ✅ 修复方案

改为回调函数方式：

```javascript
chrome.tabs.sendMessage(..., (resp) => {
  // 第一时间检查 runtime.lastError
  if (chrome.runtime.lastError) {
    const errorMsg = chrome.runtime.lastError.message || '';
    // 处理错误...
    return;
  }

  // 检查响应是否存在
  if (!resp) {
    // 无响应...
    return;
  }

  // 正常处理响应
  if (resp.success) { ... }
});
```

## 🎯 立即操作

### 1. 重新加载扩展 ⚡

```
chrome://extensions/ → 找到扩展 → 点击"重新加载"
```

### 2. 刷新测试页面

```
F5 或 Ctrl+R 刷新页面
```

### 3. 重新测试

```
1. 打开扩展popup
2. 输入URL
3. 填写/不填写测试意图
4. 点击"让AI智能分析"
5. 现在应该能看到详细的错误提示了
```

## 💡 预期行为

### 如果扩展正常

- 看到进度提示："正在生成测试计划..."
- 悬浮球出现
- 测试开始执行

### 如果有问题

现在会显示清晰的错误提示：

- ⚠️ 扩展上下文已失效 → 重新加载扩展
- ⚠️ 未收到响应 → 检查 content script
- ⚠️ AI 意图理解失败 → 检查 Qwen API 配置

## 📝 修改的文件

**src/popup.js** - 行 ~670-760

- ✅ 将 `.then()` 改为回调函数
- ✅ 第一时间检查 `chrome.runtime.lastError`
- ✅ 添加响应为空的检测
- ✅ 移除 `.catch()` 块
- ✅ 增强错误提示信息

---

**请立即重新加载扩展测试！**
