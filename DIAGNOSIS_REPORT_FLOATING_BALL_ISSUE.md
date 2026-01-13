# 悬浮球不显示问题诊断报告

**时间**: 2026 年 1 月 13 日
**场景**: 用户在新页面 qianwen.com 上点击"AI 智能分析"按钮，悬浮球没有出现，状态也没有保持
**严重级别**: 🔴 高 - 关键功能不可用

---

## 📊 执行流程分析

### 1. 用户点击"AI 智能分析"按钮的流程

```
用户点击 startIntelligentTestBtn
    ↓
startIntelligentTestWithIntent(url, intent) 被调用
    ↓
生成AI测试计划 (content-script 中 startIntelligentTest 被调用)
    ↓
AI计划生成完成，调用 startAutoTest()  ✅ 正确
    ↓
startAutoTest() 执行
    ↓
打开/导航到目标页面 qianwen.com
    ↓
等待页面加载完成
    ↓
🔴 发送 showFloatingBall 消息（第一次）
    ↓
启动测试流程
    ↓
再次发送 showFloatingBall 消息（第二次）
```

---

## 🔍 问题诊断

### **问题 1: showFloatingBall 消息可能未被正确接收 - qianwen.com 特定问题**

#### 位置: `src/popup.js` 第 1555-1564 行

```javascript
// 🔥 立即显示悬浮球（在测试开始前）
try {
  const ballResult = await chrome.tabs.sendMessage(currentTab.id, {
    action: "showFloatingBall",
  });
  console.log("[Popup] ✅ 悬浮球显示命令发送成功，响应:", ballResult);
} catch (err) {
  console.error("[Popup] ❌ 悬浮球显示失败:", err);
  // ⚠️ 失败后只记录日志，不会重试！
  addLog("⚠️ 悬浮球显示失败，但测试继续...", "warning");
}
```

#### 根本原因:

1. **Content Script 可能未正确加载**: 在 `qianwen.com` 上，content-script.js 可能由于：

   - CSP (Content Security Policy) 限制
   - 页面框架限制 (如 iframe 隔离)
   - 扩展注入时机问题
   - 导致无法收到/处理消息

2. **消息发送失败没有重试机制**: 代码中仅记录错误，不会进行重试，导致悬浮球永远不显示

3. **缺少响应超时处理**: 发送消息后没有超时检测，可能会一直等待

#### 证据:

- **文件**: `src/popup.js` 第 112-130 行有 `sendShowBallWithRetry()` 函数，但在 `startAutoTest()` 中 **没有被使用**
- **对比**: 该函数应该被调用，但实际上只用了一次简单的 `chrome.tabs.sendMessage()`
- **缺陷**: 当消息传递失败时，没有重试机制

---

### **问题 2: Content Script 中消息处理链路不完整**

#### 位置: `src/content-script.js` 第 656-671 行

```javascript
else if (request.action === 'showFloatingBall') {
  console.log('[Web测试工具] ========== 🔥 收到showFloatingBall消息 ==========');

  try {
    // 通过自定义事件发送到页面主上下文
    const event = new CustomEvent('floatingBallMessage', {
      detail: { action: 'showFloatingBall' }
    });

    window.dispatchEvent(event);  // ✅ 事件已发送
    sendResponse({ success: true });  // ✅ 响应已返回
  } catch (err) {
    console.error('[Web测试工具] ❌ 发送CustomEvent失败:', err);
    sendResponse({ success: false });
  }
}
```

#### 潜在问题:

1. **事件发送不保证接收**: `window.dispatchEvent()` 发送事件后，无法确认监听器是否收到
2. **floating-ball.js 可能未注入**: 如果 floating-ball-injector.js 中的注入失败，监听器就不存在
3. **消息时序问题**: 事件发送时，floating-ball.js 可能还未初始化

#### 证据:

- **文件**: `src/floating-ball-injector.js` 第 105-130 行显示，floating-ball.js 是通过延迟 100ms 后才注入的：

```javascript
setTimeout(() => {
  console.log("[FloatingBallInjector] 🚀 准备注入 FloatingBall 脚本...");
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/floating-ball.js");
  // ...
  (document.head || document.documentElement).appendChild(script);
}, 100); // ⚠️ 仅延迟 100ms，可能不够！
```

- 如果 qianwen.com 页面加载速度特别快或特别慢，这个 100ms 的延迟可能不足够

---

### **问题 3: Content Script 加载不完整**

#### 位置: `src/popup.js` 第 1542-1543 行

```javascript
await waitForPageReady(currentTab.id, targetUrl, needWait ? 15000 : 5000);
await ensureContentScriptReady(currentTab.id);
```

#### 潜在问题:

1. **确保脚本就绪后，仍然立即发送消息**: `ensureContentScriptReady()` 可能只验证了基本的消息通道，但不能保证 floating-ball-injector.js 已完全执行

2. **对 qianwen.com 的特殊情况处理不足**: 某些网站可能有：
   - 严格的 CSP 限制
   - 特殊的页面生命周期
   - 阻止脚本注入的安全措施

---

### **问题 4: 状态保活定时器可能被中断**

#### 位置: `src/popup.js` 第 2503-2528 行

```javascript
function startStateKeepAlive() {
  if (stateKeepAliveTimer) {
    clearInterval(stateKeepAliveTimer);
  }

  console.log("[Popup] 🔥 启动状态保活定时器（每2秒刷新一次）");

  stateKeepAliveTimer = setInterval(() => {
    if (testingInProgress && currentTab) {
      chrome.storage.local.get(["testingState"], (result) => {
        const existing = result.testingState || {};
        chrome.storage.local.set(
          {
            testingState: {
              ...existing,
              inProgress: true,
              tabId: currentTab.id,
              lastUpdate: new Date().toISOString(),
            },
          },
          () => {
            console.log("[Popup] ♻️ 状态已刷新（保活）");
          }
        );
      });
    }
  }, 2000);
}
```

#### 问题分析:

1. **定时器依赖于 testingInProgress 标志**: 如果 testingInProgress 在测试过程中被意外设置为 false，定时器会停止刷新状态

2. **使用了 chrome.storage.local 的回调**: 某些情况下，storage API 可能超时或失败，导致后续操作被中断

3. **缺少定时器的健康检查**: 无法检测定时器是否真的在运行

#### 证据:

- **状态可能在以下情况丢失**:
  - 如果 testingInProgress 被设置为 false（由于某个消息处理失败）
  - 如果 chrome.storage.local.set() 在某个迭代中失败
  - 如果 currentTab 变成 null（虽然不太可能）

---

### **问题 5: 智能测试模式下的额外问题**

#### 位置: `src/popup.js` 第 1137-1295 行

在 `startIntelligentTestWithIntent()` 中:

```javascript
// 行 1287: 调用 startAutoTest()
startAutoTest();
```

**关键缺陷**:

1. **没有传递任何参数**: `startAutoTest()` 调用时没有标记这是一个"智能测试恢复"
2. **智能测试的 tabId 没有被正确保存**: 代码在 1276-1283 行设置 `tabId: null`，然后依赖 `startAutoTest()` 稍后填充
3. **时序问题**: `testingState` 的保存与 `startAutoTest()` 的执行之间可能存在竞速条件

```javascript
// 行 1272-1283
chrome.storage.local.set(
  {
    testingState: {
      inProgress: true,
      mode: "intelligent",
      url: url,
      intent: intent,
      config: config,
      startTime: intentStartTime,
      tabId: null, // ⚠️ 这里先保存为 null
    },
  },
  () => {
    // 行 1286-1287: 立即调用 startAutoTest
    console.log("[Popup] 开始调用 startAutoTest()");
    startAutoTest();
  }
);
```

这存在竞速条件：

- `startAutoTest()` 立即执行
- 但此时 `testingState.tabId` 仍为 null
- 即使后续更新了 tabId，中间可能存在状态不一致的窗口

---

## 🎯 问题总结表

| 序号 | 问题描述                            | 位置                              | 严重性 | 影响               |
| ---- | ----------------------------------- | --------------------------------- | ------ | ------------------ |
| 1    | showFloatingBall 消息发送失败无重试 | popup.js:1555-1564                | 🔴 高  | 悬浮球永不显示     |
| 2    | Content Script 可能未完全加载       | floating-ball-injector.js:105-130 | 🔴 高  | 消息无法被处理     |
| 3    | 事件发送不保证接收                  | content-script.js:656-671         | 🟠 中  | 消息可能丢失       |
| 4    | floating-ball.js 注入延迟不足       | floating-ball-injector.js:110     | 🟠 中  | 快速页面无法初始化 |
| 5    | 状态保活依赖于标志位                | popup.js:2503-2528                | 🟠 中  | 状态可能被中断     |
| 6    | 智能测试 tabId 时序问题             | popup.js:1272-1287                | 🟠 中  | 状态可能不一致     |

---

## 🔧 修复建议

### **建议 1: 添加重试机制到 showFloatingBall 消息**

**优先级**: 🔴 **必须立即修复**

在 `src/popup.js` 的 `startAutoTest()` 中，替换现有的单次消息发送，使用带重试的版本：

```javascript
// 旧代码（第 1555-1564 行）：
try {
  const ballResult = await chrome.tabs.sendMessage(currentTab.id, {
    action: "showFloatingBall",
  });
  console.log("[Popup] ✅ 悬浮球显示命令发送成功");
} catch (err) {
  console.error("[Popup] ❌ 悬浮球显示失败:", err);
  addLog("⚠️ 悬浮球显示失败，但测试继续...", "warning");
}

// 新代码（使用重试机制）：
console.log("[Popup] ========== 🔥 准备使用重试机制显示悬浮球 ==========");
sendShowBallWithRetry(currentTab.id, {
  maxRetries: 8, // 增加重试次数
  retryInterval: 500, // 增加重试间隔到 500ms
  silent: false,
});
```

**原因**:

- 现有 `sendShowBallWithRetry()` 函数已实现，但未被 `startAutoTest()` 使用
- 重试机制可以处理 content-script 初始化延迟的情况
- 增加重试间隔可以等待更长的初始化时间

---

### **建议 2: 增加 floating-ball.js 的注入延迟**

**优先级**: 🟠 **应该修复**

在 `src/floating-ball-injector.js` 中增加注入延迟：

```javascript
// 旧代码（第 110 行）：
setTimeout(() => {
  console.log("[FloatingBallInjector] 🚀 准备注入 FloatingBall 脚本...");
  const script = document.createElement("script");
  // ...
}, 100); // ⚠️ 仅 100ms

// 新代码：
setTimeout(() => {
  console.log("[FloatingBallInjector] 🚀 准备注入 FloatingBall 脚本...");
  const script = document.createElement("script");
  // ...
}, 300); // 增加到 300ms，给页面更多时间初始化
```

**原因**:

- 某些页面加载速度快，但 DOM 不稳定
- 300ms 延迟仍然用户无感，但可以确保更可靠的初始化

---

### **建议 3: 添加消息发送的确认机制**

**优先级**: 🟠 **应该修复**

在 `src/content-script.js` 中增强消息处理，添加确认机制：

```javascript
// 在消息处理器中，对 showFloatingBall 的响应添加状态检查：
else if (request.action === 'showFloatingBall') {
  console.log('[Web测试工具] 收到showFloatingBall消息');

  try {
    // 检查 floating-ball-injector 是否已执行
    const container = document.getElementById('floating-ball-container');
    if (!container) {
      console.warn('[Web测试工具] ⚠️ floating-ball-container 未找到');
      // 尝试等待容器就绪
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('floatingBallMessage', {
          detail: { action: 'showFloatingBall' }
        }));
      }, 200);
    } else {
      // 容器存在，直接转发
      window.dispatchEvent(new CustomEvent('floatingBallMessage', {
        detail: { action: 'showFloatingBall' }
      }));
    }
    sendResponse({ success: true });
  } catch (err) {
    console.error('[Web测试工具] showFloatingBall 处理失败:', err);
    sendResponse({ success: false, error: err.message });
  }
}
```

**原因**:

- 检查 DOM 容器是否存在
- 如果不存在，给予更多延迟时间再转发
- 提供更详细的失败信息

---

### **建议 4: 加强状态保活的健康检查**

**优先级**: 🟠 **应该修复**

在 `src/popup.js` 的 `startStateKeepAlive()` 中添加健康检查：

```javascript
function startStateKeepAlive() {
  if (stateKeepAliveTimer) {
    clearInterval(stateKeepAliveTimer);
  }

  console.log("[Popup] 🔥 启动状态保活定时器");
  let successCount = 0;

  stateKeepAliveTimer = setInterval(() => {
    if (!testingInProgress || !currentTab) {
      console.log("[Popup] ⚠️ 测试中断或无当前标签页，停止保活");
      stopStateKeepAlive();
      return;
    }

    chrome.storage.local.get(["testingState"], (result) => {
      const existing = result.testingState || {};

      chrome.storage.local.set(
        {
          testingState: {
            ...existing,
            inProgress: true,
            tabId: currentTab.id,
            lastUpdate: new Date().toISOString(),
            keepAliveCount: (existing.keepAliveCount || 0) + 1,
          },
        },
        () => {
          successCount++;
          if (successCount % 10 === 0) {
            // 每 10 次保活成功时输出一次
            console.log("[Popup] ♻️ 状态已保活", successCount * 2, "秒");
          }
        }
      );
    });
  }, 2000);
}
```

**原因**:

- 添加计数器跟踪保活是否真的在进行
- 监控是否有内存泄漏
- 定期输出日志便于调试

---

### **建议 5: 修复智能测试的 tabId 时序问题**

**优先级**: 🟠 **应该修复**

在 `src/popup.js` 的 `startIntelligentTestWithIntent()` 中，不预先保存状态，让 `startAutoTest()` 统一处理：

```javascript
// 旧代码（第 1272-1287 行）：
chrome.storage.local.set(
  {
    testingState: {
      inProgress: true,
      mode: "intelligent",
      url: url,
      intent: intent,
      config: config,
      startTime: intentStartTime,
      tabId: null, // ⚠️ null 导致不一致
    },
  },
  () => {
    startAutoTest(); // 立即调用，但 tabId 可能还是 null
  }
);

// 新代码（通过全局标志）：
testingMode = "intelligent";
testIntentInput.value = intent; // 保持意图以供 startAutoTest 读取

// 立即调用 startAutoTest，它会自动以当前的 testingMode 保存状态
startAutoTest();
```

**原因**:

- 避免状态不一致的窗口期
- `startAutoTest()` 已经有完整的状态保存逻辑
- 统一的流程更易维护

---

## 📋 验证清单

修复后应该验证：

1. ✅ 在 qianwen.com 上点击"AI 智能分析"按钮 → 悬浮球出现
2. ✅ 关闭 popup 后重新打开 → 悬浮球仍在
3. ✅ 刷新页面 → 状态得到保持（或恢复）
4. ✅ 网络较差时 → 悬浮球仍能显示（通过重试机制）
5. ✅ 普通自动测试 → 悬浮球显示正常（不被新修复破坏）

---

## 💾 文件修改清单

| 文件                          | 修改行    | 修改类型             |
| ----------------------------- | --------- | -------------------- |
| src/popup.js                  | 1555-1564 | 替换为重试调用       |
| src/floating-ball-injector.js | 110       | 增加延迟时间         |
| src/content-script.js         | 656-671   | 增加容器检查         |
| src/popup.js                  | 2503-2528 | 增加健康检查         |
| src/popup.js                  | 1272-1287 | 移除 tabId:null 设置 |

---

**诊断完成时间**: 2026 年 1 月 13 日
**建议优先级**: 先修复建议 1，然后修复 2-5
