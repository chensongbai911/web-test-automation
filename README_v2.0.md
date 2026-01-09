# 🚀 Web功能自动化测试工具 v2.0

> 智能自动化测试 + 自定义测试用例 - 强大、灵活、易用的Web测试解决方案

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/web-test-automation)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-orange.svg)](https://chrome.google.com/webstore)

---

## 🎯 核心特性

### 🔥 v2.0 重大更新

#### 📋 自定义测试用例功能

- ✅ **无需登录注册** - 直接上传测试用例JSON文件即可开始
- ✅ **拖放上传** - 支持文件拖放和点击上传，操作简便
- ✅ **实时验证** - 上传后立即验证格式，显示详细错误信息
- ✅ **智能解析** - 自动解析测试文档，提取统计信息
- ✅ **模板下载** - 一键下载标准测试模板，快速上手

#### 🎨 双模式测试系统

| 模式 | 适用场景 | 特点 |
|------|---------|------|
| **🔍 自动分析模式** | 快速探索、初步测试 | AI自动分析，零配置 |
| **📋 自定义测试模式** | 精准测试、回归测试 | 完全自定义，精确控制 |

---

## ✨ 功能亮点

### 🧪 强大的测试引擎

支持 **11种测试操作**：

```yaml
✓ click          - 点击元素
✓ input          - 输入文本
✓ select         - 下拉选择
✓ hover          - 鼠标悬停
✓ wait           - 等待时间
✓ waitForElement - 等待元素出现
✓ verify         - 验证断言
✓ scroll         - 滚动页面
✓ screenshot     - 截图
✓ switchFrame    - 切换iframe
✓ execute        - 执行JavaScript
```

### ✅ 丰富的验证类型

支持 **11种验证断言**：

```yaml
✓ elementExists      - 元素存在
✓ elementNotExists   - 元素不存在
✓ elementVisible     - 元素可见
✓ elementHidden      - 元素隐藏
✓ textContains       - 文本包含
✓ textEquals         - 文本相等
✓ attributeEquals    - 属性值相等
✓ urlContains        - URL包含
✓ urlEquals          - URL相等
✓ textVisible        - 文本在页面可见
✓ elementCount       - 元素数量验证
```

---

## 🚀 快速开始

### 方法1：自动分析模式（零配置）

1. 打开扩展 Popup
2. 选择 **"🔍 自动分析"** 标签
3. 输入目标网址
4. 点击 **"开始测试"**
5. 等待测试完成，查看报告

### 方法2：自定义测试模式（精准控制）

#### 第1步：下载模板

```bash
# 模板已包含在项目中
test-case-template.json
```

或在扩展中点击 **"测试模板"** 链接下载。

#### 第2步：编写测试用例

```json
{
  "version": "1.0",
  "testName": "我的第一个测试",
  "targetUrl": "https://your-website.com",
  "testCases": [
    {
      "id": "TC001",
      "name": "测试按钮点击",
      "steps": [
        {
          "type": "click",
          "selector": "button.submit",
          "description": "点击提交按钮"
        },
        {
          "type": "verify",
          "verifyType": "textVisible",
          "text": "成功",
          "description": "验证成功提示"
        }
      ]
    }
  ]
}
```

#### 第3步：上传并执行

1. 切换到 **"📋 自定义测试"** 标签
2. 拖放 JSON 文件到上传区域
3. 查看验证结果和统计信息
4. 点击 **"开始测试"**
5. 查看详细报告

---

## 📚 文档索引

| 文档 | 内容 | 适用人群 |
|------|------|---------|
| **[快速开始指南](QUICKSTART_v1.6.1.md)** | 5分钟上手教程 | 新手用户 |
| **[自定义测试用户指南](CUSTOM_TEST_USER_GUIDE_v2.0.md)** | 完整的使用说明 | 所有用户 |
| **[测试用例格式规范](TEST_CASE_FORMAT_v2.0.md)** | JSON格式详细说明 | 开发者 |
| **[故障排查指南](TROUBLESHOOT_TEST_FLOW_v1.8.2.md)** | 常见问题解决 | 遇到问题的用户 |
| **[实现总结](CUSTOM_TEST_IMPLEMENTATION_SUMMARY_v2.0.md)** | 技术实现细节 | 开发者、贡献者 |

---

## 💡 使用示例

### 示例 1: 简单的页面验证

```json
{
  "version": "1.0",
  "testName": "页面验证测试",
  "targetUrl": "https://example.com",
  "testCases": [
    {
      "id": "TC001",
      "name": "验证页面加载",
      "steps": [
        {
          "type": "verify",
          "verifyType": "elementExists",
          "selector": "body",
          "description": "验证页面加载"
        }
      ]
    }
  ]
}
```

### 示例 2: 表单填写和提交

```json
{
  "version": "1.0",
  "testName": "联系表单测试",
  "targetUrl": "https://example.com/contact",
  "testCases": [
    {
      "id": "TC001",
      "name": "提交联系表单",
      "steps": [
        {
          "type": "input",
          "selector": "#name",
          "value": "张三",
          "description": "输入姓名"
        },
        {
          "type": "input",
          "selector": "#email",
          "value": "zhangsan@example.com",
          "description": "输入邮箱"
        },
        {
          "type": "input",
          "selector": "#message",
          "value": "这是一条测试消息",
          "description": "输入消息"
        },
        {
          "type": "click",
          "selector": "button[type='submit']",
          "description": "提交表单",
          "waitAfter": 2000
        },
        {
          "type": "verify",
          "verifyType": "textVisible",
          "text": "提交成功",
          "description": "验证成功提示"
        }
      ]
    }
  ]
}
```

### 示例 3: 电商搜索流程

```json
{
  "version": "1.0",
  "testName": "电商搜索测试",
  "targetUrl": "https://shop.example.com",
  "testCases": [
    {
      "id": "TC001",
      "name": "商品搜索",
      "steps": [
        {
          "type": "click",
          "selector": ".searchInput",
          "description": "点击搜索框"
        },
        {
          "type": "input",
          "selector": ".searchInput",
          "value": "笔记本电脑",
          "description": "输入搜索词"
        },
        {
          "type": "click",
          "selector": ".searchBtn",
          "description": "点击搜索",
          "waitAfter": 2000
        },
        {
          "type": "verify",
          "verifyType": "elementExists",
          "selector": ".productList",
          "description": "验证商品列表加载"
        }
      ]
    }
  ]
}
```

---

## 🛠️ 安装

### 从源码安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/web-test-automation.git
   cd web-test-automation
   ```

2. **加载到Chrome**
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启 **"开发者模式"**
   - 点击 **"加载已解压的扩展程序"**
   - 选择项目文件夹

3. **开始使用**
   - 点击浏览器工具栏的扩展图标
   - 选择测试模式
   - 开始测试！

---

## 📊 项目结构

```
web-test-automation/
├── src/
│   ├── popup.html                      # Popup UI
│   ├── popup.js                        # Popup逻辑
│   ├── popup.css                       # Popup样式
│   ├── content-script.js               # 内容脚本（主引擎）
│   ├── test-case-parser.js             # ✨ 测试用例解析器
│   ├── custom-test-executor.js         # ✨ 自定义测试执行器
│   ├── background.js                   # 后台脚本
│   ├── report.html                     # 测试报告页面
│   ├── report.js                       # 报告生成脚本
│   └── ...                             # 其他模块
├── images/                             # 图标资源
├── manifest.json                       # 扩展清单
├── test-case-template.json             # ✨ 测试模板
├── TEST_CASE_FORMAT_v2.0.md            # ✨ 格式规范
├── CUSTOM_TEST_USER_GUIDE_v2.0.md      # ✨ 用户指南
├── CUSTOM_TEST_IMPLEMENTATION_SUMMARY_v2.0.md  # ✨ 实现总结
└── README_v2.0.md                      # ✨ 本文档
```

### ✨ v2.0 新增文件

- `src/test-case-parser.js` - 解析和验证测试用例
- `src/custom-test-executor.js` - 执行自定义测试步骤
- `test-case-template.json` - 标准测试模板
- 3份完整文档（2000+ 行）

---

## 🔧 配置选项

### 全局配置

```json
{
  "config": {
    "timeout": 30,           // 操作超时时间（秒）
    "retryCount": 2,         // 失败重试次数
    "screenshot": true,      // 是否自动截图
    "stopOnFailure": false   // 遇到失败是否停止
  }
}
```

### 测试用例配置

```json
{
  "id": "TC001",              // 唯一ID
  "name": "测试名称",          // 显示名称
  "description": "描述",      // 可选描述
  "enabled": true,            // 是否启用
  "timeout": 45               // 覆盖全局timeout
}
```

---

## 🎓 教程和示例

### 入门教程

1. **[5分钟快速开始](QUICKSTART_v1.6.1.md)**
2. **[编写第一个测试用例](CUSTOM_TEST_USER_GUIDE_v2.0.md#详细步骤)**
3. **[理解测试步骤类型](TEST_CASE_FORMAT_v2.0.md#测试步骤详细格式)**
4. **[使用验证断言](TEST_CASE_FORMAT_v2.0.md#verify-验证断言)**

### 高级话题

1. **[复杂表单处理](COMPLEX_FORM_GUIDE.md)**
2. **[AI增强功能](AI_ENHANCEMENT_GUIDE.md)**
3. **[Modal和弹窗处理](MODAL_HANDLING_GUIDE.md)**
4. **[故障排查技巧](TROUBLESHOOT_TEST_FLOW_v1.8.2.md)**

### 示例库

完整示例请查看：
- [TEST_CASE_FORMAT_v2.0.md](TEST_CASE_FORMAT_v2.0.md#完整示例)
- [CUSTOM_TEST_USER_GUIDE_v2.0.md](CUSTOM_TEST_USER_GUIDE_v2.0.md#示例库)

---

## ❓ 常见问题

### Q: 自定义测试和自动分析有什么区别？

**A**:

| 特性 | 自动分析 | 自定义测试 |
|------|---------|-----------|
| 配置 | 无需配置 | 需要编写JSON |
| 灵活性 | 固定规则 | 完全自定义 |
| 适用场景 | 快速探索 | 精准测试 |
| 维护成本 | 低 | 中 |

**建议**: 用自动分析快速发现问题，用自定义测试进行精准验证。

### Q: 如何获取元素的选择器？

**A**: 使用浏览器开发者工具：

1. 按 `F12` 打开开发者工具
2. 点击元素选择器图标 (或 `Ctrl+Shift+C`)
3. 点击页面上要测试的元素
4. 右键 → **Copy** → **Copy selector**

### Q: 测试用例执行失败怎么办？

**A**: 按以下步骤排查：

1. 检查选择器是否正确
2. 确认元素是否已加载（添加 `waitForElement`）
3. 查看浏览器控制台的错误日志
4. 参考 [故障排查指南](TROUBLESHOOT_TEST_FLOW_v1.8.2.md)

### Q: 支持哪些浏览器？

**A**: 目前仅支持 Chrome 和基于 Chromium 的浏览器（如 Edge、Brave）。

---

## 🤝 贡献指南

欢迎贡献代码、报告Bug或提出建议！

### 报告Bug

请提供：
- 测试用例JSON文件
- 目标网站URL
- 浏览器控制台日志
- 详细的重现步骤

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📜 更新日志

### v2.0.0 (2026-01-09)

#### 🎉 重大更新

- ✨ **新增自定义测试用例功能**
  - 支持上传JSON格式的测试文档
  - 无需登录注册，直接开始测试
  - 实时格式验证和错误提示
  - 智能统计和预估耗时

- 🎨 **全新UI设计**
  - 双标签页设计（自动分析 / 自定义测试）
  - 拖放上传文件
  - 实时进度显示
  - 详细的文件信息展示

- ⚙️ **强大的测试引擎**
  - 11种测试操作类型
  - 11种验证断言类型
  - 支持等待、滚动、截图等高级功能

- 📖 **完善的文档**
  - 3份详细文档，总计2000+行
  - 包含格式规范、用户指南、实现总结
  - 丰富的示例和最佳实践

#### 🔧 技术改进

- 新增 `test-case-parser.js` (500+ 行)
- 新增 `custom-test-executor.js` (650+ 行)
- 重构 `popup.html` 和 `popup.js`
- 更新 `content-script.js` 支持自定义测试
- 更新 `manifest.json` 版本至 2.0.0

### v1.7.0 之前

查看 [完整更新日志](UPDATE_HISTORY.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🌟 致谢

感谢所有贡献者和使用本工具的用户！

特别感谢：
- Chrome Extensions API
- Qwen API（AI功能支持）
- 所有提供反馈的用户

---

## 📞 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/yourusername/web-test-automation/issues)
- **功能建议**: [GitHub Discussions](https://github.com/yourusername/web-test-automation/discussions)
- **邮箱**: your.email@example.com

---

## 🎯 路线图

### 短期 (v2.1 - v2.2)

- [ ] 报告页面支持自定义测试结果
- [ ] CSV格式导出测试结果
- [ ] 测试用例调试模式
- [ ] 测试片段复用功能

### 中期 (v2.3 - v2.5)

- [ ] 可视化测试用例编辑器
- [ ] 录制操作生成测试用例
- [ ] 条件分支和循环
- [ ] 测试数据参数化

### 长期 (v3.0+)

- [ ] AI辅助生成测试用例
- [ ] 分布式并行测试
- [ ] CI/CD集成插件
- [ ] 云端测试管理

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个Star！⭐**

Made with ❤️ by Web自动化测试团队

</div>
