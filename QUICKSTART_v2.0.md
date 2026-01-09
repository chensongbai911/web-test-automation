# 🚀 快速开始指南 - Web自动化测试工具 v2.0

## ✅ 问题已解决！

**Manifest错误已修复** ✨
- 问题：`Manifest is not valid JSON` 
- 原因：description 字段缺失闭合引号
- 状态：✅ 已修复，可以正常加载

---

## 🎯 30秒快速部署

### 步骤1️⃣: 打开扩展页面
```
Chrome → 菜单 → 更多工具 → 扩展程序
或直接访问: chrome://extensions/
```

### 步骤2️⃣: 启用开发者模式
- 右上角打开 "开发者模式" 开关

### 步骤3️⃣: 加载扩展
```
点击 "加载已解压的扩展程序"
选择: ~/Desktop/auto-test/web-test-automation
```

### 步骤4️⃣: 验证加载成功
- ✅ 应该看到扩展出现在列表中
- ✅ 工具栏有新的扩展图标

---

## 📖 两种测试模式

### 模式1: 🔍 自动分析（推荐新手）
```
输入URL → AI自动分析 → 自动生成测试 → 执行 → 报告
```

**使用步骤:**
```
1. 扩展弹窗 → "🔍 自动分析" 标签页
2. 输入目标网址 (如: https://example.com)
3. 点击 "开始测试"
4. 等待2-3分钟
5. 点击 "查看报告"
```

### 模式2: 📋 自定义测试（高级用户）
```
上传JSON → 解析验证 → 执行测试 → 报告
```

**使用步骤:**
```
1. 扩展弹窗 → "📋 自定义测试" 标签页
2. 点击上传框或拖放 JSON 文件
3. 验证文件格式 (自动)
4. 点击 "开始测试"
5. 等待执行完成
6. 点击 "查看报告"
```

---

## 📋 自定义测试用例 - 最小示例

### 简单登录测试 (5行步骤)

**新建文件: login-test.json**

```json
{
  "version": "1.0",
  "testName": "登录功能测试",
  "targetUrl": "https://example.com/login",
  "testCases": [
    {
      "id": "TC001",
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
          "selector": "button[type='submit']",
          "waitAfter": 2000,
          "description": "点击登录按钮"
        },
        {
          "type": "verify",
          "verifyType": "textVisible",
          "text": "登录成功",
          "description": "验证成功提示"
        }
      ]
    }
  ]
}
```

**上传并执行：**
1. 保存上面的内容为 `login-test.json`
2. 打开 "📋 自定义测试" 标签页
3. 上传文件
4. 点击 "开始测试"

---

## 🔧 支持的步骤类型

| 类型 | 示例 | 用途 |
|------|------|------|
| `click` | 点击按钮 | 触发事件 |
| `input` | 填充表单 | 输入数据 |
| `select` | 选择选项 | 下拉框选择 |
| `verify` | 验证元素存在 | 断言测试 |
| `wait` | 等待2秒 | 等待动作 |
| `scroll` | 向下滚动 | 页面滚动 |
| `hover` | 悬停菜单 | 触发悬停 |
| ... | 还有5种 | 见完整文档 |

---

## ✅ 常见问题速解

### ❓ Q: 扩展加载失败怎么办？
**A:** 
```
1. 检查 chrome://extensions/ 有无错误信息
2. 运行: bash deployment-check.sh (检查文件)
3. 重新加载扩展 (刷新按钮)
4. 清空缓存后重试
```

### ❓ Q: JSON文件格式不对怎样？
**A:**
```
1. 使用在线JSON验证器检查格式
2. 看错误提示找出问题位置
3. 下载模板参考正确格式
```

### ❓ Q: 测试失败了怎么办？
**A:**
```
1. 打开浏览器控制台 (F12)
2. 查看 [CustomTestExecutor] 日志
3. 检查选择器是否正确
4. 确认网页已完全加载
```

### ❓ Q: 如何获取选择器？
**A:**
```
1. 打开网页 F12 → Elements
2. 右键点击元素 → Inspect
3. 看代码中的 id、class、name 等
4. 使用: #id, .class, [name='xxx']
```

---

## 📚 完整文档

| 文档 | 内容 |
|------|------|
| [TEST_CASE_FORMAT_v2.0.md](TEST_CASE_FORMAT_v2.0.md) | **必读** - 完整的JSON格式规范 |
| [CUSTOM_TEST_USER_GUIDE_v2.0.md](CUSTOM_TEST_USER_GUIDE_v2.0.md) | 详细的使用指南 |
| [DEPLOYMENT_COMPLETE_v2.0.md](DEPLOYMENT_COMPLETE_v2.0.md) | 部署和配置说明 |

---

## 🎯 测试用例示例

### 例1: 简单页面验证
```json
{
  "testCases": [{
    "id": "TC001",
    "name": "页面加载检查",
    "steps": [{
      "type": "verify",
      "verifyType": "elementExists",
      "selector": ".header",
      "description": "检查页头"
    }]
  }]
}
```

### 例2: 表单提交
```json
{
  "testCases": [{
    "id": "TC002",
    "name": "表单提交",
    "steps": [
      {"type": "input", "selector": "[name='email']", "value": "test@example.com"},
      {"type": "input", "selector": "[name='message']", "value": "Hello"},
      {"type": "click", "selector": "button[type='submit']", "waitAfter": 1000},
      {"type": "verify", "verifyType": "textVisible", "text": "提交成功"}
    ]
  }]
}
```

### 例3: 搜索功能
```json
{
  "testCases": [{
    "id": "TC003",
    "name": "搜索测试",
    "steps": [
      {"type": "click", "selector": ".search-box"},
      {"type": "input", "selector": ".search-box", "value": "keyword"},
      {"type": "click", "selector": ".search-btn", "waitAfter": 2000},
      {"type": "verify", "verifyType": "urlContains", "expected": "?q="}
    ]
  }]
}
```

---

## 🚨 故障排查

### 问题：扩展图标不显示
```
1. 检查 chrome://extensions/ 中扩展是否启用
2. 检查网站是否在 manifest 中的 matches 范围内
3. 刷新网页试试
```

### 问题：JSON验证失败
```
检查点:
- □ 所有字符串用双引号
- □ 数组和对象的逗号位置
- □ 没有多余逗号 (最后一项后)
- □ 使用在线工具验证
```

### 问题：测试执行出错
```
排查步骤:
1. 打开 F12 → Console
2. 搜索错误信息
3. 检查选择器 (右键检查元素)
4. 增加 waitAfter 等待时间
```

---

## 💡 最佳实践

✅ **推荐做法：**
```
1. 从模板开始，逐步修改
2. 先测试简单的场景
3. 给每个步骤添加 description
4. 使用特定的选择器 (ID > class > tag)
5. 添加充足的等待时间
```

❌ **避免：**
```
1. 使用过于复杂的选择器
2. 忘记等待异步操作
3. 选择器太通用 (如: "div")
4. 长链选择器 ("body > div > p > span")
```

---

## 🎓 学习路径

### 初级 (5分钟)
✅ 了解两种模式
✅ 运行自动分析测试
✅ 查看测试报告

### 中级 (20分钟)
✅ 了解JSON格式
✅ 下载模板
✅ 编写简单测试用例
✅ 上传并执行

### 高级 (1小时)
✅ 掌握11种步骤类型
✅ 编写复杂测试场景
✅ 学习调试技巧
✅ 优化测试用例

---

## 🎉 现在就开始！

**三步启动：**

```bash
# 1️⃣ 进入项目目录
cd ~/Desktop/auto-test/web-test-automation

# 2️⃣ 验证部署 (可选)
bash deployment-check.sh

# 3️⃣ 打开 chrome://extensions/ 并加载
```

**然后：**
1. 打开任何网站
2. 点击工具栏的扩展图标
3. 选择 "🔍 自动分析" 或 "📋 自定义测试"
4. 开始测试！

---

**祝你测试顺利！🚀**

有问题？查看相关文档或运行 `deployment-check.sh` 检查。
