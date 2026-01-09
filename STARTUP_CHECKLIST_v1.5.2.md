# 🚀 快速启动检查清单 v1.5.2

**版本：** 1.5.2
**发布日期：** 2026 年 1 月 9 日
**用途：** 快速验证扩展是否正确安装和配置

---

## ✅ 安装检查

### Step 1: 验证文件完整性

```powershell
# 在 d:\test-auto\web-test-automation 目录中检查：

✓ manifest.json               - 扩展配置文件
✓ src/popup.html             - UI 界面
✓ src/popup.js               - UI 逻辑
✓ src/content-script.js      - 内容脚本
✓ src/qwen-integration.js    - Qwen 集成
✓ src/floating-ball.js       - 悬浮球
✓ src/background.js          - 后台脚本
```

**检查命令：**

```powershell
Get-ChildItem -Path "d:\test-auto\web-test-automation" -Recurse |
  Where-Object { $_.Extension -in '.html', '.js', '.json', '.css' } |
  Select-Object FullName
```

### Step 2: 验证 Chrome 扩展加载

1. **打开 Chrome**

   ```
   Address: chrome://extensions/
   ```

2. **找到扩展**

   - 搜索: "Web 功能自动化测试工具"
   - 验证状态: ✅ 已启用
   - 版本号: 1.3.0+

3. **检查权限**
   - ✓ 活动标签页
   - ✓ 脚本编制
   - ✓ 标签页
   - ✓ 存储
   - ✓ Web 导航

### Step 3: 启用开发者模式（可选）

```
1. 打开 chrome://extensions/
2. 右上角启用"开发者模式"
3. 可以看到详细错误信息和快速加载选项
```

---

## 🔧 Qwen 密钥配置

### Step 1: 打开扩展

1. **点击扩展图标**

   - 在地址栏右侧找到扩展图标
   - 或访问 `chrome://extensions/` → "Web 功能自动化测试工具" → 扩展选项

2. **打开 Popup**
   - 弹出窗口显示测试配置界面

### Step 2: 配置 Qwen 密钥

1. **点击 ⚙️ Qwen 设置 按钮**

   - 位置: Popup 右上角
   - 显示 Qwen 配置模态窗口

2. **输入 API 密钥**

   ```
   API 密钥输入框 → sk-ca34cf449ebe4deb9ce529d40d37b21a
   ```

3. **测试连接**

   - 点击 🔍 测试连接 按钮
   - 等待 2-3 秒
   - 显示 ✅ 连接成功！

4. **保存配置**
   - 点击 💾 保存配置 按钮
   - 显示 ✅ 配置已保存！
   - 模态窗口自动关闭

### Step 3: 验证配置

在浏览器 Console 中检查：

```javascript
// 打开 F12 → Console，运行以下命令：

chrome.storage.local.get(['qwenApiKey', 'qwenEnabled'], (result) => {
  console.log('Qwen 配置:', {
    已保存密钥: result.qwenApiKey ? '✓ 是' : '✗ 否',
    AI 已启用: result.qwenEnabled ? '✓ 是' : '✗ 否',
    密钥前缀: result.qwenApiKey ? result.qwenApiKey.substring(0, 15) + '...' : '无'
  });
});

// 预期输出：
// Qwen 配置: {已保存密钥: "✓ 是", AI 已启用: "✓ 是", 密钥前缀: "sk-ca34cf449eb..."}
```

---

## 🧪 功能测试

### Test 1: 基础测试流程

```
1. 打开测试页面
   └─ URL: http://192.168.8.158:30002/application-design/menu

2. 点击扩展图标打开 Popup

3. 验证 URL 自动填充
   └─ 输入框应显示当前页面 URL
   └─ 不应显示硬编码的 "https://www.baidu.com"

4. 选择测试配置
   └─ 测试交互按钮: ✓ 勾选
   └─ 监控 API 请求: ✓ 勾选
   └─ 测试间隔: 1200 ms
   └─ 最大元素数: 100

5. 点击 ▶ 开始测试

6. 观察测试过程
   └─ Popup 显示实时日志
   └─ 悬浮球显示进度
   └─ 测试应持续 1-2 分钟

7. 等待测试完成
   └─ 显示 ✅ 测试完成
   └─ 显示成功/失败/错误统计
```

### Test 2: 控制台错误检查

```
1. 打开测试页面

2. 按 F12 打开开发者工具
   └─ 选择 Console 标签

3. 清空现有日志
   └─ console.clear()

4. 开始测试
   └─ 点击 ▶ 开始测试

5. 观察 Console 输出
   └─ ✗ 不应出现红色的"elements is not defined"错误
   └─ ✓ 应出现蓝色的 "[Web测试工具]" 前缀日志
   └─ ✓ 可能出现黄色的警告信息（正常）

6. 搜索关键字
```

在 Console 中搜索:

- "elements is not defined" → 不应出现 ✓
- "Qwen" → 应出现相关日志 ✓
- "error" → 应该很少 ✓

```

```

### Test 3: 弹框处理测试

```
1. 打开带有弹框的测试页面

2. 开始测试
   └─ 点击 ▶ 开始测试

3. 观察弹框行为
   └─ 弹框出现后应自动关闭
   └─ 不应出现多个重叠弹框
   └─ 遮罩层应完全消失

4. 检查关闭方式
   └─ 优先使用右上角 X 按钮
   └─ 若无 X 则使用确定/确认按钮
   └─ 若无则使用取消按钮
   └─ 若无则点击遮罩层边缘

5. 验证页面状态
   └─ 弹框关闭后页面应能继续交互
   └─ 页面滚动应恢复正常
   └─ 其他元素应能被访问
```

### Test 4: 测试间隔验证

```
1. 打开 Popup

2. 检查测试间隔
   └─ 应显示: 1200 (毫秒)
   └─ 不应显示: 800

3. 修改测试间隔（可选）
   └─ 改为 1500 试试
   └─ 开始测试观察速度变化
   └─ 改回 1200

4. 验证间隔应用
   └─ 每个按钮点击后应等待 1200ms
   └─ 测试进度应均匀进行
```

```

### Test 5: 测试报告验证

```

1. 完成一次测试

2. 点击 📊 查看报告 按钮

3. 查看报告内容
   └─ 应包含测试 URL
   └─ 应包含时间戳
   └─ 应包含成功率百分比
   └─ 应包含元素类型分布

4. 检查详细数据
   └─ 展开"详细元素结果"
   └─ 应看到每个元素的测试结果
   └─ 应包含成功/失败状态
   └─ 应包含执行时长

5. 查看 API 请求
   └─ 应列出所有被监控的 API
   └─ 应包含请求方法和 URL
   └─ 应包含响应状态码
   └─ 应包含响应时间

6. 导出报告（可选）
   └─ JSON 格式
   └─ CSV 格式
   └─ 验证数据完整性

```

---

## 🐛 故障排除

### 问题 1: 扩展未加载

```

症状: chrome://extensions/ 找不到扩展

解决:

1. 检查文件路径是否正确
2. 重新加载扩展
   └─ 点击刷新按钮
3. 检查 manifest.json 是否有效
   └─ F12 查看错误信息
4. 重新安装扩展

```

### 问题 2: 密钥保存失败

```

症状: 点击"保存配置"后没有反应

解决:

1. 检查 API 密钥是否为空
2. 检查浏览器权限
   └─ chrome://settings/content/storage
3. 清除浏览器缓存并重新加载
4. 打开 F12 → Console 查看错误

```

### 问题 3: 测试连接失败

```

症状: 点击"测试连接"显示 ❌ 连接失败

原因可能:

1. API 密钥无效
   └─ 验证密钥是否正确
   └─ 从 DashScope 重新复制

2. 网络连接问题
   └─ 检查网络是否正常
   └─ 尝试访问 dashscope.aliyuncs.com

3. DashScope 服务异常
   └─ 检查 https://status.aliyun.com
   └─ 稍后重试

解决:

1. 验证密钥完整性（不要有多余空格）
2. 检查网络连接
3. 重新测试连接
4. 联系 Qwen 支持

```

### 问题 4: 测试卡住

```

症状: 开始测试后没有进度，测试卡住

原因可能:

1. AI 功能导致超时
2. 网络连接问题
3. 页面问题

解决:

1. 禁用 AI 功能重试
   └─ 打开 Qwen 设置
   └─ 取消勾选"启用 Qwen AI 分析"
   └─ 保存配置

2. 停止当前测试
   └─ 点击 ⏹ 停止测试

3. 检查网络
   └─ 打开浏览器网络标签
   └─ 查看是否有请求卡住

4. 重新加载扩展并重试

```

### 问题 5: "elements is not defined" 错误

```

症状: Console 出现红色错误: "elements is not defined"

原因: 旧版本代码问题（已在 v1.5.2 修复）

解决:

1. 确认已安装 v1.5.2 或更高版本
2. 重新加载扩展
   └─ chrome://extensions/ → 刷新按钮
3. 清除浏览器缓存
   └─ Ctrl+Shift+Delete
4. 重新启动浏览器

```

---

## 📝 测试报告模板

完成测试后，记录以下信息：

```

测试日期: [YYYY-MM-DD HH:mm:ss]
测试页面: [URL]
测试版本: 1.5.2

✓ 功能状态:
☐ 扩展加载正常
☐ Qwen 密钥配置成功
☐ API 连接测试通过
☐ 基础测试流程完整
☐ 弹框处理正常
☐ 测试报告生成正常
☐ 无控制台错误

✓ 测试统计:

- 总测试元素: [数量]
- 成功: [数量]
- 失败: [数量]
- 错误: [数量]
- 成功率: [百分比]%
- 测试耗时: [秒]

✓ 遇到的问题:

1. [问题描述]
   解决方案: [描述]

✓ 其他说明:
[任何其他需要记录的信息]

```

---

## 🎯 验收标准

系统满足以下标准时视为安装成功：

- [x] 扩展在 chrome://extensions/ 中显示
- [x] 扩展能正确打开 Popup
- [x] URL 自动填充正常（无硬编码 URL）
- [x] Qwen 设置模态窗口能打开
- [x] API 密钥能成功保存到 Storage
- [x] 密钥测试连接通过
- [x] 基础测试流程能完整运行
- [x] 弹框能自动检测和关闭
- [x] 测试报告能正常生成
- [x] **Console 中无 "elements is not defined" 错误**
- [x] 测试间隔稳定在 1200ms

---

## 📞 需要帮助？

### 快速参考

| 问题 | 文档 |
|------|------|
| 如何配置 Qwen 密钥 | [QWEN_API_CONFIG_GUIDE.md](./QWEN_API_CONFIG_GUIDE.md) |
| 弹框不关闭 | [MODAL_HANDLING_GUIDE.md](./MODAL_HANDLING_GUIDE.md) |
| 测试报告说明 | [QUALITY_ASSURANCE_v1.5.2.md](./QUALITY_ASSURANCE_v1.5.2.md) |
| 快速开始 | [QUICKSTART.md](./QUICKSTART.md) |
| 项目概览 | [README.md](./README.md) |

### 获取更多帮助

1. 查看浏览器 Console 日志
2. 查看对应的文档
3. 检查 manifest.json 配置
4. 验证文件完整性
5. 尝试清除缓存重新加载

---

**最后更新：** 2026年1月9日
**版本：** 1.5.2
**状态：** ✅ 生产就绪

祝您使用愉快！🎉
```
