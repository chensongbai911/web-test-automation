# 🚀 自定义测试用例用户指南 v2.0

欢迎使用 **Web功能自动化测试工具**的自定义测试功能！

本指南将帮助你快速上手自定义测试用例，无需编程知识，只需编写简单的 JSON 文件即可完成复杂的自动化测试。

---

## 📚 目录

1. [快速开始](#快速开始)
2. [功能特性](#功能特性)
3. [测试模式对比](#测试模式对比)
4. [详细步骤](#详细步骤)
5. [常见问题](#常见问题)
6. [最佳实践](#最佳实践)
7. [示例库](#示例库)

---

## 🎯 快速开始

### 第1步：下载模板

1. 打开扩展的 Popup 窗口
2. 点击 **"📋 自定义测试"** 标签
3. 点击 **"测试模板"** 链接下载

### 第2步：编辑测试用例

使用任何文本编辑器（VS Code、Notepad++、Sublime Text等）打开模板文件：

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
        }
      ]
    }
  ]
}
```

### 第3步：上传并执行

1. 在 Popup 窗口中拖放文件或点击上传区域
2. 查看文件验证结果
3. 点击 **"开始测试"** 按钮
4. 等待测试完成
5. 点击 **"查看报告"** 查看详细结果

---

## ✨ 功能特性

### 🎨 双模式支持

- **自动分析模式**: AI 自动分析页面，生成测试用例
- **自定义测试模式**: 上传你自己编写的测试用例

### 🔧 丰富的操作类型

| 操作类型 | 说明 | 示例场景 |
|---------|------|---------|
| `click` | 点击元素 | 按钮、链接、菜单 |
| `input` | 输入文本 | 表单填写 |
| `select` | 下拉选择 | 下拉菜单、筛选器 |
| `hover` | 鼠标悬停 | 悬浮菜单 |
| `wait` | 等待时间 | 等待加载 |
| `waitForElement` | 等待元素出现 | 异步加载内容 |
| `verify` | 验证断言 | 结果验证 |
| `scroll` | 滚动页面 | 无限滚动列表 |
| `screenshot` | 截图 | 记录关键状态 |
| `execute` | 执行JavaScript | 自定义操作 |

### ✅ 强大的验证功能

- 元素存在/不存在验证
- 元素可见性验证
- 文本内容验证
- 属性值验证
- URL验证
- 元素数量验证

### 📊 详细的测试报告

- 每个步骤的执行状态
- 失败原因分析
- 执行时间统计
- 可视化展示

---

## 🆚 测试模式对比

| 特性 | 自动分析模式 | 自定义测试模式 |
|------|------------|--------------|
| **学习成本** | 低，无需配置 | 中，需要编写JSON |
| **灵活性** | 低，按固定规则测试 | 高，完全自定义 |
| **精确度** | 中，可能遗漏某些场景 | 高，精确控制每个步骤 |
| **适用场景** | 快速探索性测试 | 回归测试、精准测试 |
| **维护成本** | 低，无需维护 | 中，需要更新测试用例 |
| **复杂场景** | 不支持 | 支持，可组合复杂流程 |
| **登录测试** | 需手动跳过 | 支持，可自定义登录流程 |

**建议使用策略**：

- ✅ **自动分析模式**: 用于探索新网站、快速发现问题
- ✅ **自定义测试模式**: 用于关键业务流程、回归测试、复杂场景

---

## 📖 详细步骤

### 步骤1：创建测试文档

#### 基础结构

```json
{
  "version": "1.0",
  "testName": "测试套件名称",
  "description": "测试套件描述（可选）",
  "targetUrl": "https://example.com",
  "config": {
    "timeout": 30,
    "retryCount": 2,
    "screenshot": true,
    "stopOnFailure": false
  },
  "testCases": [
    // 测试用例列表
  ]
}
```

#### 字段说明

- `version`: 固定为 `"1.0"`
- `testName`: 给你的测试套件起个名字
- `targetUrl`: 要测试的网站地址（必须以 http:// 或 https:// 开头）
- `config`: 全局配置（可选）
  - `timeout`: 每个操作的超时时间（秒）
  - `retryCount`: 失败重试次数
  - `screenshot`: 是否自动截图
  - `stopOnFailure`: 遇到错误是否停止

---

### 步骤2：编写测试用例

每个测试用例包含多个步骤：

```json
{
  "id": "TC001",
  "name": "测试用例名称",
  "description": "测试用例描述（可选）",
  "enabled": true,
  "steps": [
    // 测试步骤
  ]
}
```

---

### 步骤3：编写测试步骤

#### 示例 1: 点击按钮

```json
{
  "type": "click",
  "selector": "#submitBtn",
  "description": "点击提交按钮",
  "waitAfter": 2000
}
```

#### 示例 2: 填写表单

```json
{
  "type": "input",
  "selector": "input[name='email']",
  "value": "test@example.com",
  "clearFirst": true,
  "description": "输入邮箱地址"
}
```

#### 示例 3: 验证结果

```json
{
  "type": "verify",
  "verifyType": "textVisible",
  "text": "登录成功",
  "description": "验证成功提示"
}
```

---

### 步骤4：选择器技巧

选择器是定位页面元素的关键，以下是几种常用方法：

#### 方法1：使用浏览器开发者工具

1. 打开网页，按 `F12` 打开开发者工具
2. 点击 **"Elements"** 标签
3. 点击左上角的选择器图标 (或按 `Ctrl+Shift+C`)
4. 点击你想测试的元素
5. 右键该元素 → **Copy** → **Copy selector**

#### 方法2：常用选择器模式

```css
/* ID选择器（最优先使用） */
#myElement

/* Class选择器 */
.myClass

/* 属性选择器 */
[name="email"]
[type="submit"]
[data-testid="button"]

/* 组合选择器 */
form#loginForm button[type="submit"]
```

---

### 步骤5：上传和执行

1. **上传文件**
   - 拖放文件到上传区域，或
   - 点击上传区域选择文件

2. **查看验证结果**
   - ✅ 绿色：文件格式正确，可以执行
   - ❌ 红色：文件有错误，需要修正

3. **执行测试**
   - 点击 **"开始测试"** 按钮
   - 浏览器会自动打开目标网站
   - 扩展会按照你的测试用例逐步执行

4. **查看结果**
   - 测试完成后点击 **"查看报告"**
   - 报告会显示每个步骤的执行情况

---

## ❓ 常见问题

### Q1: 文件上传后显示 "找不到元素"

**A**: 检查以下几点：

1. **选择器是否正确**
   - 使用浏览器开发者工具验证选择器
   - 确保选择器在目标网站上存在

2. **页面是否加载完成**
   - 在点击前添加 `waitForElement` 步骤
   - 增加 `waitAfter` 延迟

3. **元素是否在iframe中**
   - iframe中的元素需要先 `switchFrame`

**示例修正**：

```json
// ❌ 错误：直接点击可能找不到元素
{
  "type": "click",
  "selector": "#asyncButton"
}

// ✅ 正确：先等待元素出现
{
  "type": "waitForElement",
  "selector": "#asyncButton",
  "timeout": 10000
},
{
  "type": "click",
  "selector": "#asyncButton"
}
```

---

### Q2: 验证总是失败

**A**: 检查验证条件是否准确：

```json
// ❌ 可能失败：文本需要完全匹配
{
  "type": "verify",
  "verifyType": "textEquals",
  "selector": ".message",
  "expected": "Success"
}

// ✅ 更好：使用包含匹配
{
  "type": "verify",
  "verifyType": "textContains",
  "selector": ".message",
  "expected": "Success"
}
```

---

### Q3: 测试在某个步骤卡住

**A**: 可能原因和解决方案：

1. **操作触发了页面跳转**
   - 检查是否需要在新页面继续测试
   - 考虑将测试分为多个测试用例

2. **元素不可点击（被遮挡）**
   - 添加滚动步骤将元素滚动到可见区域

3. **等待时间不足**
   - 增加 `waitAfter` 延迟

---

### Q4: 如何测试需要登录的页面

**A**: 在测试用例前添加登录步骤：

```json
{
  "testCases": [
    {
      "id": "TC000",
      "name": "用户登录",
      "steps": [
        {
          "type": "input",
          "selector": "#username",
          "value": "testuser",
          "description": "输入用户名"
        },
        {
          "type": "input",
          "selector": "#password",
          "value": "password123",
          "description": "输入密码"
        },
        {
          "type": "click",
          "selector": "#loginBtn",
          "description": "点击登录",
          "waitAfter": 3000
        }
      ]
    },
    {
      "id": "TC001",
      "name": "登录后的功能测试",
      "steps": [
        // 实际的测试步骤
      ]
    }
  ]
}
```

---

### Q5: JSON 格式错误怎么办

**A**: 使用在线 JSON 验证器：

1. 访问 [JSONLint](https://jsonlint.com/)
2. 粘贴你的 JSON 内容
3. 点击 **"Validate JSON"**
4. 根据错误提示修正

**常见JSON错误**：

```json
// ❌ 错误：最后一项多了逗号
{
  "id": "TC001",
  "name": "Test",  // ← 多余的逗号
}

// ✅ 正确
{
  "id": "TC001",
  "name": "Test"
}
```

---

## 💡 最佳实践

### 1. 测试用例命名规范

```json
{
  "id": "TC001",              // 使用序号
  "name": "用户登录_正常流程",  // 清晰描述
  "description": "测试用户使用正确的账号密码登录系统"
}
```

### 2. 步骤描述清晰

```json
// ❌ 不好
{
  "type": "click",
  "selector": "#btn1"
}

// ✅ 好
{
  "type": "click",
  "selector": "#btn1",
  "description": "点击首页的'开始测试'按钮"
}
```

### 3. 合理使用等待

```json
// 对于异步内容，使用 waitForElement
{
  "type": "waitForElement",
  "selector": ".loadedContent",
  "timeout": 10000
}

// 对于动画或过渡，使用 waitAfter
{
  "type": "click",
  "selector": "#menuBtn",
  "waitAfter": 500  // 等待菜单展开动画
}
```

### 4. 验证关键步骤

在关键操作后添加验证：

```json
{
  "type": "click",
  "selector": "#submitBtn",
  "description": "提交表单"
},
{
  "type": "verify",
  "verifyType": "textVisible",
  "text": "提交成功",
  "description": "验证提交成功提示"
}
```

### 5. 使用断言保证数据正确性

```json
// 验证表单提交后跳转到正确页面
{
  "type": "verify",
  "verifyType": "urlContains",
  "expected": "/dashboard",
  "description": "验证跳转到仪表板页面"
}

// 验证元素数量
{
  "type": "verify",
  "verifyType": "elementCount",
  "selector": ".listItem",
  "expected": "10",
  "description": "验证列表有10项"
}
```

---

## 📦 示例库

### 示例 1: 电商网站搜索测试

```json
{
  "version": "1.0",
  "testName": "电商搜索功能测试",
  "targetUrl": "https://shop.example.com",
  "testCases": [
    {
      "id": "TC001",
      "name": "商品搜索",
      "steps": [
        {
          "type": "click",
          "selector": ".searchBox",
          "description": "点击搜索框"
        },
        {
          "type": "input",
          "selector": ".searchBox",
          "value": "笔记本电脑",
          "description": "输入搜索关键词"
        },
        {
          "type": "click",
          "selector": ".searchBtn",
          "description": "点击搜索按钮",
          "waitAfter": 2000
        },
        {
          "type": "verify",
          "verifyType": "elementExists",
          "selector": ".productList",
          "description": "验证商品列表加载"
        },
        {
          "type": "verify",
          "verifyType": "elementCount",
          "selector": ".productItem",
          "expected": "10",
          "description": "验证显示10个商品"
        }
      ]
    }
  ]
}
```

### 示例 2: 用户注册流程测试

```json
{
  "version": "1.0",
  "testName": "用户注册流程",
  "targetUrl": "https://example.com/register",
  "testCases": [
    {
      "id": "TC001",
      "name": "完整注册流程",
      "steps": [
        {
          "type": "input",
          "selector": "#firstName",
          "value": "张",
          "description": "输入名字"
        },
        {
          "type": "input",
          "selector": "#lastName",
          "value": "三",
          "description": "输入姓氏"
        },
        {
          "type": "input",
          "selector": "#email",
          "value": "zhangsan@example.com",
          "description": "输入邮箱"
        },
        {
          "type": "input",
          "selector": "#password",
          "value": "SecurePass123!",
          "description": "输入密码"
        },
        {
          "type": "select",
          "selector": "#country",
          "value": "China",
          "description": "选择国家"
        },
        {
          "type": "click",
          "selector": "#terms",
          "description": "同意条款"
        },
        {
          "type": "click",
          "selector": "#submitBtn",
          "description": "提交注册",
          "waitAfter": 3000
        },
        {
          "type": "verify",
          "verifyType": "textVisible",
          "text": "注册成功",
          "description": "验证注册成功"
        }
      ]
    }
  ]
}
```

### 示例 3: 分页列表测试

```json
{
  "version": "1.0",
  "testName": "分页列表测试",
  "targetUrl": "https://blog.example.com",
  "testCases": [
    {
      "id": "TC001",
      "name": "分页导航测试",
      "steps": [
        {
          "type": "verify",
          "verifyType": "elementCount",
          "selector": ".article",
          "expected": "10",
          "description": "第一页显示10篇文章"
        },
        {
          "type": "scroll",
          "direction": "down",
          "amount": 500,
          "description": "滚动查看分页器"
        },
        {
          "type": "click",
          "selector": ".pagination .next",
          "description": "点击下一页",
          "waitAfter": 2000
        },
        {
          "type": "verify",
          "verifyType": "urlContains",
          "expected": "page=2",
          "description": "验证跳转到第2页"
        },
        {
          "type": "verify",
          "verifyType": "elementCount",
          "selector": ".article",
          "expected": "10",
          "description": "第二页也显示10篇文章"
        }
      ]
    }
  ]
}
```

---

## 📞 获取帮助

### 文档资源

- [测试用例格式详细说明](TEST_CASE_FORMAT_v2.0.md)
- [故障排查指南](TROUBLESHOOT_TEST_FLOW_v1.8.2.md)
- [快速开始指南](QUICKSTART_v1.6.1.md)

### 常见错误速查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| JSON格式错误 | JSON语法不正确 | 使用JSON验证器检查 |
| 找不到元素 | 选择器错误 | 使用浏览器工具验证选择器 |
| 验证失败 | 预期值不匹配 | 检查验证条件 |
| 超时 | 页面加载慢 | 增加timeout值 |

---

## 🎉 结语

现在你已经掌握了自定义测试用例的全部知识！

**记住这些要点**：

1. ✅ 从简单的测试用例开始
2. ✅ 使用浏览器开发者工具获取准确的选择器
3. ✅ 在关键步骤后添加验证
4. ✅ 合理使用等待确保页面加载完成
5. ✅ 保持测试用例简单明了

**祝测试顺利！** 🚀

---

**版本**: v2.0
**最后更新**: 2026-01-09
**作者**: Web自动化测试团队
