# 🚀 快速启动指南 - v1.6.1

## 第一步：安装和加载扩展

### 1. 打开 Chrome 扩展管理页面
```
chrome://extensions/
```

### 2. 开启"开发者模式"
- 在右上角找到"开发者模式"开关
- 点击打开

### 3. 加载扩展
- 点击"加载已解压的扩展程序"
- 选择项目文件夹: `d:\test-auto\web-test-automation\`
- 确认加载

### 4. 验证安装
- 在扩展列表中看到"Web功能自动化测试工具"
- 图标显示在浏览器工具栏

---

## 第二步：配置 Qwen API（重要！）

### 1. 打开扩展弹窗
- 点击工具栏中的扩展图标
- 弹出测试控制面板

### 2. 打开设置
- 点击弹窗右上角的 ⚙️ 设置按钮
- 出现 Qwen API 设置弹窗

### 3. 输入 API Key
```
sk-ca34cf449ebe4deb9ce529d40d37b21a
```

### 4. 测试连接
- 点击"测试连接"按钮
- 等待几秒
- 看到 ✅ "连接成功，模型：qwen-max"

### 5. 保存设置
- 点击"保存设置"
- 看到"保存成功"提示
- 点击"关闭"

---

## 第三步：测试复杂表单功能

### 方法 A：使用测试页面

1. **打开测试页面**
   ```
   文件位置: d:\test-auto\test-complex-form.html
   ```
   - 在 Chrome 中打开此文件
   - 或在地址栏输入: `file:///d:/test-auto/test-complex-form.html`

2. **观察页面内容**
   - 看到"复杂表单测试页面"标题
   - 表单包含多个字段
   - **重点：** 有两个红框字段（部门、职位）

3. **手动测试弹框功能**（了解预期行为）
   - 点击"所属部门"红框字段
   - 弹框打开，显示部门表格
   - 点击任意行的"选择"按钮
   - 点击弹框底部"确定"按钮
   - 弹框关闭，字段显示选中的部门名称

   - 点击"职位"红框字段
   - 弹框打开，显示职位单选列表
   - 点击任意单选框
   - 点击"确定"
   - 弹框关闭，字段显示选中的职位

4. **启动自动化测试**
   - 打开扩展弹窗
   - 点击"开始测试"
   - 观察测试日志

5. **期望结果**
   ```
   ✅ 自动填充姓名、邮箱、手机号
   ✅ 自动点击"部门"字段
   ✅ 弹框打开
   ✅ 在弹框表格中点击"选择"按钮
   ✅ 点击"确定"关闭弹框
   ✅ 验证部门字段已更新

   ✅ 自动点击"职位"字段
   ✅ 弹框打开
   ✅ 选择一个单选框
   ✅ 点击"确定"
   ✅ 验证职位字段已更新

   ✅ 自动选择角色下拉框
   ✅ 填充备注
   ✅ 点击"保存"按钮
   ✅ 跟踪 API 调用
   ```

6. **查看测试报告**
   - 点击"查看报告"
   - 看到完整的测试数据
   - 包括功能-元素-API 映射

### 方法 B：在真实网站测试

1. **打开目标网站**
   - 访问你要测试的网站
   - 找到包含表单的页面（如"新增用户"、"编辑信息"等）

2. **检查表单结构**
   - 按 F12 打开开发者工具
   - 检查表单中是否有弹框选择器
   - 特征：
     - `readonly` 属性的输入框
     - 点击后会打开弹框
     - 弹框中有表格/单选框/列表

3. **启动测试**
   - 打开扩展弹窗
   - 配置测试选项：
     - ✅ 测试按钮
     - ✅ 测试链接
     - ✅ 测试输入框
   - 点击"开始测试"

4. **观察执行**
   - 工具会自动点击页面上的按钮
   - 检测到表单后自动填充
   - 遇到弹框选择器会自动处理
   - 验证表单后自动点击保存

5. **查看日志**
   - 在弹窗中查看实时日志
   - 在控制台查看详细日志（搜索 `[复杂表单]`）

---

## 第四步：查看测试报告

### 1. 打开报告页面
- 测试完成后，点击"查看报告"
- 或手动打开: `chrome-extension://[扩展ID]/src/report.html`

### 2. 查看统计信息
- 顶部显示测试概况
- 功能点统计
- 元素测试统计
- API 调用统计

### 3. 查看详细数据

#### 功能点记录
```
功能点: 表单填充
状态: ✅ 通过
关联元素: 5个
关联API: 1个
步骤:
  1. fillInput - 姓名 = "测试用户"
  2. modalSelect - 部门 = "研发部"
  3. selectOption - 角色 = "管理员"
  4. clickSave - 保存按钮
```

#### 元素测试结果
```
元素: 部门选择器
类型: modal-select
状态: ✅ 通过
详情:
  - 值: "研发部"
  - 选中文本: "研发部"
```

#### API 调用记录
```
API: POST /api/user/save
状态: 200 OK
耗时: 245ms
关联:
  - 功能点: 表单填充
  - 元素: 保存按钮
```

### 4. 导出报告
- 点击"导出 JSON"
- 保存测试数据

---

## 常见问题排查

### Q1: 点击"开始测试"没有反应？

**检查：**
1. 打开控制台（F12）查看是否有错误
2. 检查扩展是否正确加载
3. 刷新页面重试

**解决：**
```javascript
// 在控制台执行，检查模块加载
console.log('complexFormHandler:', window.complexFormHandler);
console.log('enhancedReporter:', window.enhancedReporter);
console.log('aiFormAnalyzer:', window.aiFormAnalyzer);

// 应该都不是 undefined
```

### Q2: 弹框选择器没有被识别？

**检查：**
1. 打开控制台
2. 选中该字段
3. 执行：
   ```javascript
   const field = $0; // Chrome 会自动选中当前选中的元素
   console.log('className:', field.className);
   console.log('readOnly:', field.readOnly);
   console.log('onclick:', field.onclick);
   ```

**解决：**
- 如果 className 不包含 'select' 或 'picker'
- 编辑 `src/complex-form-handler.js`
- 在 `detectFieldType` 方法中添加自定义判断

### Q3: 弹框没有自动关闭？

**检查：**
1. 手动打开弹框
2. 在控制台执行：
   ```javascript
   const modal = document.querySelector('.modal.active'); // 或其他选择器
   const buttons = modal.querySelectorAll('button');
   buttons.forEach((btn, i) => {
     console.log(i, btn.textContent, btn.className);
   });
   ```

**解决：**
- 记住确定按钮的 className
- 编辑 `src/complex-form-handler.js`
- 在 `closeModalWithConfirm` 方法中添加该选择器

### Q4: API 没有被跟踪？

**检查：**
```javascript
// 控制台执行
console.log('apiRequests:', window.apiRequests);
```

**解决：**
- 如果是 `undefined`，说明 API 拦截器没有加载
- 刷新页面
- 确保在开始测试前加载了所有模块

### Q5: AI 分析失败？

**检查：**
1. 打开扩展设置
2. 点击"测试连接"
3. 查看是否返回错误

**解决：**
- 如果 API Key 错误，重新输入
- 如果网络错误，检查网络连接
- 如果模型不可用，稍后重试

---

## 调试技巧

### 1. 查看详细日志

所有关键操作都会输出日志：

```javascript
// 打开控制台（F12），筛选日志
[复杂表单] 开始智能填充表单...
[复杂表单] AI 分析结果: {...}
[复杂表单] 字段分组: {...}
[复杂表单] 步骤1: 填充普通输入框
[复杂表单] 步骤2: 填充普通下拉框
[复杂表单] 步骤3: 处理弹框选择器
[复杂表单]   步骤1: 点击打开弹框
[复杂表单]   步骤2: 弹框已出现
[复杂表单]     找到 4 个可选项
[复杂表单]   步骤3: 已选择 "研发部"
[复杂表单]     点击确定按钮: 确定
[复杂表单]   步骤4: 弹框已关闭
[复杂表单] 步骤4: 验证所有字段
[复杂表单] 步骤5: 查找保存按钮
[复杂表单] 找到保存按钮，准备点击
[复杂表单] 点击保存按钮...
[复杂表单] 捕获到 1 个 API 调用
```

### 2. 手动调用测试

```javascript
// 在控制台手动测试单个表单
const form = document.querySelector('form');
const result = await window.complexFormHandler.fillComplexForm(form);
console.log('结果:', result);
```

### 3. 查看测试报告

```javascript
// 获取完整报告数据
const report = await window.enhancedReporter.generateFullReport();
console.log('报告:', report);
```

### 4. 单步调试

在 `src/complex-form-handler.js` 中设置断点：
- 第 36 行: `fillComplexForm` 入口
- 第 127 行: `analyzeFormWithAI`
- 第 365 行: `fillModalSelect` （重点）
- 第 407 行: `detectModal`
- 第 425 行: `selectFromModal`

---

## 性能优化建议

### 1. 调整延迟时间

如果网站响应较慢，可以增加延迟：

```javascript
// 编辑 src/complex-form-handler.js
// 搜索 delay() 调用，增加延迟时间

// 例如：
await this.delay(500);  // 改为 1000
```

### 2. 减少 AI 调用

如果不需要 AI 分析，可以跳过：

```javascript
// 编辑 src/complex-form-handler.js
// 在 analyzeFormWithAI 方法开头添加：

async analyzeFormWithAI(formElement) {
  // 快速返回，不调用 AI
  // return { fields: this.extractFieldsWithoutAI(formElement) };

  // 继续原有逻辑...
}
```

### 3. 批量处理

如果有多个相似的表单，可以配置数据模板复用。

---

## 下一步

1. **阅读完整文档**
   - `COMPLEX_FORM_GUIDE.md` - 详细功能说明
   - `UPDATE_v1.6.1.md` - 版本更新说明

2. **自定义配置**
   - 根据实际网站调整选择器
   - 添加自定义字段类型判断
   - 配置验证规则

3. **集成到 CI/CD**
   - 使用 Puppeteer 控制 Chrome
   - 自动化运行测试
   - 生成测试报告

---

**祝测试顺利！** 🎉

有问题随时查看文档或控制台日志。
