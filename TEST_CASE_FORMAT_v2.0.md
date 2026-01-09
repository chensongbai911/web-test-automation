# 🎯 自定义测试用例文档格式 v2.0

## 📋 概述

用户可以通过上传 **JSON 格式**的测试用例文档来执行自定义的自动化测试。无需登录注册，直接上传文件即可开始测试。

---

## 📄 测试用例文档格式规范

### 基础结构

```json
{
  "version": "1.0",
  "testName": "示例网站测试套件",
  "description": "用于测试示例网站的完整测试套件",
  "targetUrl": "https://example.com",
  "config": {
    "timeout": 30,
    "retryCount": 2,
    "screenshot": true,
    "stopOnFailure": false
  },
  "testCases": [
    // 测试用例数组
  ]
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `version` | string | ✅ | 文档版本，当前为 `1.0` |
| `testName` | string | ✅ | 测试套件名称 |
| `description` | string | ❌ | 测试套件描述 |
| `targetUrl` | string | ✅ | 目标网址 |
| `config` | object | ❌ | 全局配置 |
| `testCases` | array | ✅ | 测试用例数组 |

---

## 🧪 测试用例详细格式

### 测试用例基础结构

```json
{
  "id": "TC001",
  "name": "登录功能测试",
  "description": "测试用户登录流程",
  "enabled": true,
  "timeout": 30,
  "steps": [
    // 测试步骤数组
  ]
}
```

### 测试用例字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 测试用例唯一ID（如TC001） |
| `name` | string | ✅ | 测试用例名称 |
| `description` | string | ❌ | 测试用例描述 |
| `enabled` | boolean | ❌ | 是否启用此用例，默认 `true` |
| `timeout` | number | ❌ | 此用例的超时时间（秒），默认继承全局配置 |
| `steps` | array | ✅ | 测试步骤数组 |

---

## 🚀 测试步骤详细格式

### 步骤类型汇总

| 类型 | 说明 | 参数 |
|------|------|------|
| `click` | 点击元素 | `selector`, `description`, `waitAfter` |
| `input` | 输入文本 | `selector`, `value`, `clearFirst`, `description` |
| `select` | 下拉框选择 | `selector`, `value`, `description` |
| `hover` | 鼠标悬停 | `selector`, `description`, `waitAfter` |
| `wait` | 等待 | `duration`, `description` |
| `waitForElement` | 等待元素出现 | `selector`, `timeout`, `description` |
| `screenshot` | 截图 | `filename`, `description` |
| `verify` | 验证 | `type`, `target`, `expected`, `description` |
| `scroll` | 滚动 | `direction`, `amount`, `description` |
| `switchFrame` | 切换frame | `selector`, `description` |
| `execute` | 执行JS | `script`, `description` |

---

## 📝 详细步骤类型说明

### 1. `click` - 点击元素

```json
{
  "type": "click",
  "selector": "#loginBtn",
  "description": "点击登录按钮",
  "waitAfter": 2000
}
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `selector` | string | ✅ | CSS选择器 |
| `description` | string | ❌ | 步骤描述 |
| `waitAfter` | number | ❌ | 点击后等待毫秒数 |

### 2. `input` - 输入文本

```json
{
  "type": "input",
  "selector": "#usernameInput",
  "value": "testuser@example.com",
  "clearFirst": true,
  "description": "输入用户名"
}
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `selector` | string | ✅ | CSS选择器 |
| `value` | string | ✅ | 要输入的文本 |
| `clearFirst` | boolean | ❌ | 输入前是否清空，默认 `false` |
| `description` | string | ❌ | 步骤描述 |

### 3. `select` - 下拉框选择

```json
{
  "type": "select",
  "selector": "#countrySelect",
  "value": "China",
  "description": "选择国家"
}
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `selector` | string | ✅ | CSS选择器 |
| `value` | string | ✅ | 要选择的值或文本 |
| `description` | string | ❌ | 步骤描述 |

### 4. `hover` - 鼠标悬停

```json
{
  "type": "hover",
  "selector": ".menuItem",
  "description": "悬停菜单项",
  "waitAfter": 500
}
```

### 5. `wait` - 等待

```json
{
  "type": "wait",
  "duration": 2000,
  "description": "等待页面加载"
}
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `duration` | number | ✅ | 等待毫秒数 |
| `description` | string | ❌ | 步骤描述 |

### 6. `waitForElement` - 等待元素出现

```json
{
  "type": "waitForElement",
  "selector": ".loadingSpinner",
  "timeout": 10000,
  "description": "等待加载完成"
}
```

### 7. `screenshot` - 截图

```json
{
  "type": "screenshot",
  "filename": "login_success.png",
  "description": "登录成功截图"
}
```

### 8. `verify` - 验证（断言）

```json
{
  "type": "verify",
  "verifyType": "elementExists",
  "selector": ".successMessage",
  "description": "验证成功提示消息出现"
}
```

#### 验证类型 (`verifyType`)

| 验证类型 | 参数 | 说明 |
|---------|------|------|
| `elementExists` | `selector` | 元素存在 |
| `elementNotExists` | `selector` | 元素不存在 |
| `elementVisible` | `selector` | 元素可见 |
| `elementHidden` | `selector` | 元素隐藏 |
| `textContains` | `selector`, `expected` | 文本包含指定内容 |
| `textEquals` | `selector`, `expected` | 文本完全相等 |
| `attributeEquals` | `selector`, `attribute`, `expected` | 属性值相等 |
| `urlContains` | `expected` | 当前URL包含 |
| `urlEquals` | `expected` | 当前URL完全相等 |
| `textVisible` | `text` | 页面上可见指定文本 |
| `elementCount` | `selector`, `expected` | 元素数量等于指定值 |

示例：

```json
{
  "type": "verify",
  "verifyType": "textContains",
  "selector": ".message",
  "expected": "Success",
  "description": "验证消息包含 Success"
}
```

### 9. `scroll` - 滚动

```json
{
  "type": "scroll",
  "direction": "down",
  "amount": 500,
  "description": "向下滚动500像素"
}
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `direction` | string | ✅ | 滚动方向: `up`, `down`, `left`, `right` |
| `amount` | number | ✅ | 滚动像素数 |
| `description` | string | ❌ | 步骤描述 |

### 10. `switchFrame` - 切换iframe

```json
{
  "type": "switchFrame",
  "selector": "iframe[name='editor']",
  "description": "切换到编辑器frame"
}
```

### 11. `execute` - 执行JavaScript

```json
{
  "type": "execute",
  "script": "return document.title;",
  "description": "获取页面标题"
}
```

---

## 💡 完整示例 1: 简单登录测试

```json
{
  "version": "1.0",
  "testName": "简单登录测试",
  "description": "测试基本的登录功能",
  "targetUrl": "https://example.com/login",
  "config": {
    "timeout": 30,
    "retryCount": 1,
    "screenshot": true,
    "stopOnFailure": false
  },
  "testCases": [
    {
      "id": "TC001",
      "name": "用户登录流程",
      "description": "测试用户成功登录",
      "steps": [
        {
          "type": "waitForElement",
          "selector": "#usernameInput",
          "timeout": 10000,
          "description": "等待用户名输入框加载"
        },
        {
          "type": "input",
          "selector": "#usernameInput",
          "value": "testuser@example.com",
          "clearFirst": true,
          "description": "输入用户名"
        },
        {
          "type": "input",
          "selector": "#passwordInput",
          "value": "password123",
          "clearFirst": true,
          "description": "输入密码"
        },
        {
          "type": "click",
          "selector": "#loginBtn",
          "description": "点击登录按钮",
          "waitAfter": 2000
        },
        {
          "type": "verify",
          "verifyType": "urlContains",
          "expected": "/dashboard",
          "description": "验证登录后跳转到仪表板"
        },
        {
          "type": "screenshot",
          "filename": "login_success.png",
          "description": "登录成功截图"
        }
      ]
    }
  ]
}
```

---

## 💡 完整示例 2: 表单测试（多步骤）

```json
{
  "version": "1.0",
  "testName": "复杂表单测试",
  "description": "测试多字段表单提交",
  "targetUrl": "https://example.com/register",
  "config": {
    "timeout": 45,
    "retryCount": 2,
    "screenshot": true,
    "stopOnFailure": true
  },
  "testCases": [
    {
      "id": "TC001",
      "name": "用户注册表单提交",
      "description": "完整的用户注册流程",
      "enabled": true,
      "steps": [
        {
          "type": "waitForElement",
          "selector": "form",
          "timeout": 10000,
          "description": "等待表单加载"
        },
        {
          "type": "input",
          "selector": "input[name='firstName']",
          "value": "张",
          "description": "输入名字"
        },
        {
          "type": "input",
          "selector": "input[name='lastName']",
          "value": "三",
          "description": "输入姓氏"
        },
        {
          "type": "input",
          "selector": "input[name='email']",
          "value": "zhangsan@example.com",
          "description": "输入邮箱"
        },
        {
          "type": "select",
          "selector": "#countrySelect",
          "value": "China",
          "description": "选择国家"
        },
        {
          "type": "click",
          "selector": "input[type='checkbox'][name='termsAccept']",
          "description": "勾选同意条款"
        },
        {
          "type": "scroll",
          "direction": "down",
          "amount": 300,
          "description": "滚动以查看提交按钮"
        },
        {
          "type": "click",
          "selector": "button[type='submit']",
          "description": "点击提交按钮",
          "waitAfter": 3000
        },
        {
          "type": "verify",
          "verifyType": "textVisible",
          "text": "注册成功",
          "description": "验证成功消息"
        },
        {
          "type": "screenshot",
          "filename": "registration_success.png",
          "description": "注册成功截图"
        }
      ]
    }
  ]
}
```

---

## 💡 完整示例 3: 多用例测试套件

```json
{
  "version": "1.0",
  "testName": "电商平台完整测试",
  "description": "包含浏览、搜索、加购、结算的完整电商流程",
  "targetUrl": "https://shop.example.com",
  "config": {
    "timeout": 60,
    "retryCount": 2,
    "screenshot": true,
    "stopOnFailure": false
  },
  "testCases": [
    {
      "id": "TC001",
      "name": "首页加载验证",
      "description": "验证首页正常加载",
      "steps": [
        {
          "type": "verify",
          "verifyType": "elementExists",
          "selector": ".header",
          "description": "验证页头存在"
        },
        {
          "type": "verify",
          "verifyType": "elementExists",
          "selector": ".productList",
          "description": "验证商品列表存在"
        }
      ]
    },
    {
      "id": "TC002",
      "name": "搜索功能测试",
      "description": "测试搜索功能",
      "steps": [
        {
          "type": "click",
          "selector": ".searchInput",
          "description": "点击搜索框"
        },
        {
          "type": "input",
          "selector": ".searchInput",
          "value": "手机",
          "clearFirst": true,
          "description": "输入搜索词"
        },
        {
          "type": "click",
          "selector": ".searchBtn",
          "description": "点击搜索按钮",
          "waitAfter": 2000
        },
        {
          "type": "verify",
          "verifyType": "urlContains",
          "expected": "q=手机",
          "description": "验证URL包含搜索参数"
        }
      ]
    },
    {
      "id": "TC003",
      "name": "加入购物车",
      "description": "测试加入购物车功能",
      "steps": [
        {
          "type": "click",
          "selector": ".productCard:first-child .addToCartBtn",
          "description": "点击加入购物车",
          "waitAfter": 1000
        },
        {
          "type": "verify",
          "verifyType": "textVisible",
          "text": "已添加到购物车",
          "description": "验证成功提示"
        }
      ]
    }
  ]
}
```

---

## 🔍 验证和错误处理

### 格式验证

系统会自动验证上传的文件：

- ✅ JSON 格式有效性
- ✅ 必需字段完整性
- ✅ 选择器有效性
- ✅ 参数类型正确性

### 错误提示

如果验证失败，系统会显示：

```
❌ JSON格式错误: 第5行缺少逗号
❌ 必需字段缺失: testCases
❌ 步骤类型无效: "clickk" (应为 "click")
```

---

## 📋 最佳实践

### 1. 选择器选择

```json
// ✅ 好的做法
"selector": "#submitBtn"              // ID最优先
"selector": "[name='email']"          // 属性选择器
"selector": ".primary-button"         // class选择器

// ❌ 避免
"selector": "button"                  // 太通用
"selector": "body > div:nth-child(3) > form > button"  // 太具体
```

### 2. 等待处理

```json
// ✅ 推荐
{
  "type": "click",
  "selector": "#asyncBtn",
  "waitAfter": 2000,
  "description": "点击异步按钮并等待"
}

// ✅ 或使用waitForElement
{
  "type": "waitForElement",
  "selector": ".result",
  "timeout": 10000,
  "description": "等待结果加载"
}
```

### 3. 验证策略

```json
// ✅ 多重验证
{
  "type": "verify",
  "verifyType": "elementVisible",
  "selector": ".successMessage",
  "description": "验证成功消息可见"
},
{
  "type": "verify",
  "verifyType": "textContains",
  "selector": ".successMessage",
  "expected": "成功",
  "description": "验证消息文本"
}
```

### 4. 注释和文档

```json
{
  "id": "TC001",
  "name": "用户登录",
  "description": "测试用户登录流程，预期：用户成功登录后跳转到仪表板",
  "steps": [
    {
      "type": "input",
      "selector": "#email",
      "value": "test@example.com",
      "description": "输入测试邮箱（建议：确保此邮箱已在系统中注册）"
    }
  ]
}
```

---

## 🛠️ 常见选择器参考

```json
// ID选择器
"selector": "#myId"

// Class选择器
"selector": ".myClass"

// 属性选择器
"selector": "[name='email']"
"selector": "[type='submit']"
"selector": "[data-testid='button']"

// 标签选择器（加上属性）
"selector": "button.primary"
"selector": "input[type='text']"

// 组合选择器
"selector": "form#loginForm button[type='submit']"

// CSS选择器
"selector": "div > p:first-child"
"selector": ".container .item:nth-child(3)"

// XPath (某些场景)
"selector": "//button[contains(text(), '登录')]"
```

---

## 📦 文件上传建议

- 文件格式：`.json`
- 文件大小：建议 < 1MB
- 编码：UTF-8
- 最大步骤数：500
- 最大用例数：100

---

## ✅ 用前检查清单

上传前请确保：

- [ ] JSON 格式正确（可用在线 JSON 验证器验证）
- [ ] 所有必需字段都已填写
- [ ] CSS 选择器在目标网站上存在
- [ ] 超时时间设置合理
- [ ] 步骤顺序逻辑清晰
- [ ] 验证语句清楚明确
- [ ] 文件大小合理

---

## 📞 获取帮助

- 查看 [TEST_CASE_EXAMPLES.md](TEST_CASE_EXAMPLES.md) 获取更多示例
- 查看 [CUSTOM_TEST_USER_GUIDE.md](CUSTOM_TEST_USER_GUIDE.md) 了解完整指南
- 查看浏览器控制台日志获取详细错误信息

---

**版本**: 2.0
**最后更新**: 2026-01-09
**维护者**: Web自动化测试团队
