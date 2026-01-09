# Web 测试自动化插件 - 文件说明

## 项目文件总览

### 核心配置文件

#### `manifest.json`

- Chrome 扩展的配置文件（必需）
- 定义权限、权限和 UI 入口
- 指定 background script、content script 等

### 用户界面文件

#### `src/popup.html`

- 插件弹窗的 HTML 结构
- 定义 URL 输入框、测试按钮、配置选项
- 包含实时日志显示区域

#### `src/popup.css`

- 弹窗的样式表
- 渐变背景、响应式布局
- 按钮、输入框、日志框的美化

#### `src/popup.js`

- 弹窗的交互逻辑
- 处理按钮点击事件
- 显示实时测试进度
- 与 content script 和 background 通信

### 测试执行文件

#### `src/content-script.js`

- 在目标网页中运行
- **关键函数**：
  - `getInteractiveElements()` - 识别所有可交互元素
  - `performInteraction()` - 执行单个元素的测试
  - `startAutomatedTest()` - 启动自动化测试流程
- 拦截 Fetch 和 XHR 请求
- 收集测试数据并发送给 popup

#### `src/background.js`

- Service Worker 后台进程
- 消息中转转发
- 生命周期管理

### 报告生成文件

#### `src/report.html`

- 测试报告页面的 HTML 结构
- 统计卡片、图表容器、数据表格
- 导出按钮

#### `src/report.css`

- 报告页面的样式
- 卡片布局、表格美化
- 响应式设计、打印样式

#### `src/report.js`

- 报告数据处理和渲染
- **关键函数**：
  - `renderReport()` - 渲染完整报告
  - `renderPieChart()` - 绘制结果分布饼图
  - `renderBarChart()` - 绘制元素类型柱状图
  - `renderAPIStats()` - 显示 API 统计
  - `exportToJSON()` - 导出 JSON
  - `exportToCSV()` - 导出 CSV
- 使用 Chart.js 库绘制图表

### 文档文件

#### `README.md`

- 完整的项目文档
- 功能介绍、安装方法、使用指南
- 技术架构、常见问题、开发扩展

#### `QUICKSTART.md`

- 快速入门指南
- 5 分钟快速开始
- 常用操作和快捷键

#### `package.json`

- Node.js 项目配置（可选）
- 项目元数据

#### `FILES.md`

- 本文件，文件说明文档

## 关键函数流程图

### 测试启动流程

```
popup.js: startTestBtn.click()
    ↓
popup.js: chrome.tabs.create() 打开新标签页
    ↓
popup.js: 初始化testData到storage
    ↓
popup.js: chrome.tabs.sendMessage() 发送startTest命令
    ↓
content-script.js: 收到startTest消息
    ↓
content-script.js: startAutomatedTest()
    ↓
content-script.js: getInteractiveElements() 识别元素
    ↓
content-script.js: 循环调用 performInteraction()
    ↓
content-script.js: 拦截API请求并记录
    ↓
content-script.js: 发送updateStatus消息给popup
    ↓
popup.js: 更新UI进度显示
    ↓
content-script.js: 测试完成，发送testComplete消息
    ↓
popup.js: 启用"查看报告"按钮
```

### 报告生成流程

```
popup.js: 点击"查看报告"按钮
    ↓
popup.js: chrome.tabs.create(report.html)
    ↓
report.html: 加载DOM
    ↓
report.js: DOMContentLoaded 事件
    ↓
report.js: chrome.storage.get() 读取lastTestReport
    ↓
report.js: renderReport() 渲染报告
    ↓
report.js: renderPieChart() 绘制饼图
    ↓
report.js: renderBarChart() 绘制柱状图
    ↓
report.js: renderAPIStats() 显示API统计
    ↓
report.js: renderElementsTable() 显示元素表
    ↓
report.js: renderRequestsTable() 显示API请求表
    ↓
最终生成完整的可视化报告
```

## 数据流向

### 1. 测试数据结构

```javascript
{
  url: "https://example.com",
  timestamp: "2024-01-15T10:30:00Z",
  totalElements: 45,
  stats: {
    testedCount: 45,
    successCount: 40,
    failureCount: 5,
    apiErrorCount: 2
  },
  apiRequests: [
    {
      type: "fetch",
      method: "GET",
      url: "https://api.example.com/data",
      timestamp: "2024-01-15T10:30:01Z",
      status: 200,
      error: null
    },
    // ... more requests
  ],
  elements: [
    {
      type: "button",
      text: "Submit",
      selector: "#submitBtn"
    },
    // ... more elements
  ]
}
```

### 2. 消息通信

#### popup.js → content-script.js

```javascript
{
  action: "startTest",
  config: {
    testInteraction: true,
    monitorAPI: true,
    captureScreenshot: true,
    captureConsole: true
  }
}
```

#### content-script.js → popup.js

```javascript
// 更新状态
{
  action: "updateStatus",
  data: {
    testedCount: 10,
    successCount: 8,
    failureCount: 2,
    apiErrorCount: 0,
    totalButtons: 45
  }
}

// 添加日志
{
  action: "addLog",
  message: "开始测试...",
  type: "info"
}

// 测试完成
{
  action: "testComplete"
}
```

## 存储结构

### Chrome Storage Local

```
{
  "savedConfig": {
    "testInteraction": true,
    "monitorAPI": true,
    "captureScreenshot": true,
    "captureConsole": true
  },
  "testData": {
    // 当前测试的临时数据
  },
  "lastTestReport": {
    // 最后一次测试的完整报告
  }
}
```

## 权限说明

### manifest.json 中的权限

| 权限               | 用途                |
| ------------------ | ------------------- |
| `activeTab`        | 获取活跃标签页信息  |
| `scriptingContent` | 执行 content script |
| `tabs`             | 创建新标签页        |
| `storage`          | 保存测试数据        |
| `webNavigation`    | 监听页面导航        |
| `<all_urls>`       | 在所有网站上运行    |

## 代码修改指南

### 修改识别规则

编辑 `content-script.js` 中的 `getInteractiveElements()`：

```javascript
function getInteractiveElements() {
  const elements = [];

  // 添加自定义选择器
  document.querySelectorAll("你的自定义选择器").forEach((el) => {
    elements.push({
      element: el,
      type: "自定义类型",
      text: el.textContent.trim(),
      selector: getElementSelector(el),
    });
  });

  return elements;
}
```

### 修改测试方式

编辑 `content-script.js` 中的 `performInteraction()`：

```javascript
async function performInteraction(item, index, total) {
  // 添加自定义测试逻辑
  if (item.type === "自定义类型") {
    // 执行特殊操作
  }
}
```

### 添加自定义报告部分

编辑 `report.html` 添加新的 section：

```html
<section class="section">
  <h2>自定义统计</h2>
  <div id="customChart"></div>
</section>
```

然后在 `report.js` 中添加渲染函数：

```javascript
function renderCustomChart() {
  // 实现自定义图表
}
```

## 调试建议

### 1. Content Script 调试

- 在目标网页按 F12
- 搜索 "[Web 测试工具]" 日志
- 修改 `content-script.js` 中的 console.log

### 2. Service Worker 调试

- `chrome://extensions/` → 此插件 → "Service Worker"
- 查看后台进程日志

### 3. Storage 调试

- F12 → Application → Local Storage
- 查看存储的测试数据

### 4. 网络调试

- F12 → Network 标签
- 查看 API 请求是否被正确拦截

## 性能优化建议

1. **减少 DOM 查询**

   - 缓存 querySelector 结果
   - 使用更具体的选择器

2. **优化循环**

   - 避免在循环中创建大量对象
   - 使用及时的垃圾回收

3. **异步操作**

   - 使用 async/await 代替回调
   - 合理使用 Promise.all()

4. **数据去重**
   - 避免收集重复的 API 请求
   - 合并相同的错误信息

## 扩展功能建议

### 可添加的功能

- ✨ 截图功能（capture screenshot）
- 📹 录制视频
- 🔐 登录流程测试
- 🎯 性能监控（FCP、LCP 等）
- 📱 移动设备模拟
- 🔄 重试机制
- ⏱️ 超时设置
- 🎨 自定义主题

### 技术扩展

- 集成 Selenium 进行跨浏览器测试
- 使用 WebDriver Protocol
- 添加机器学习分类
- 集成 CI/CD 流程

---

**最后更新**: 2024 年 1 月
