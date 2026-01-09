# 自动化测试优化方案 v1.5.0

## 核心优化目标

1. **质量第一** - 严格的校验逻辑，不漏掉任何功能点
2. **效率合理** - 在保证质量的前提下，优化执行速度
3. **完整性** - 处理所有类型的表单控件和筛选条件

## 优化清单

### 1. 按钮文案优化 ✅

- [x] "开始测试" 按钮在测试进行中改为 "⏳ 测试进行中..."
- [x] 测试完成后改为 "🔄 重新测试"
- [x] 查看报告按钮在测试完成时启用
- [ ] 悬浮球暂停按钮改为 "✅ 测试完成" (进行中)

### 2. 表单校验严谨化

**当前问题**: 表单填充没有校验，直接提交
**改进方案**:

```javascript
// 校验流程
1. 检查字段类型和必填属性
2. 根据类型填充合适的值
3. 触发change/input事件以激活验证
4. 检查是否有错误提示（error class、aria-invalid等）
5. 确保通过验证才提交
6. 监听submit事件和API调用
```

### 3. 下拉菜单选择优化

**当前问题**: 直接赋值，不等待选项加载，没有验证选中值
**改进方案**:

```javascript
// 逐步选择流程
1. 点击打开下拉菜单 (click)
2. 等待options DOM渲染 (waitFor或观察器)
3. 验证options存在且非空
4. 选择合适的option (click或修改value)
5. 触发change事件
6. 等待UI更新
7. 验证选中值显示在UI上
```

### 4. 时间控件选择优化

**当前问题**: 直接赋值，不处理日期选择器的交互
**改进方案**:

```javascript
// 逐步选择流程
1. 打开日期选择器 (click)
2. 等待日期面板渲染
3. 如需改月份，先点击月份切换
4. 等待日历更新
5. 点击具体日期
6. 确认选择（如有确认按钮）
7. 验证选中日期显示在input上
```

### 5. 筛选条件全覆盖

**覆盖类型**:

- [x] 普通 input 文本框
- [x] 按钮/链接点击
- [ ] 下拉菜单 (需优化)
- [ ] 时间范围 (需优化)
- [ ] 多选框组
- [ ] 单选框组
- [ ] 树形选择
- [ ] 标签选择

## 实现步骤

### Phase 1: 悬浮球状态更新 (当前)

- [ ] 在 content-script 发送 testComplete 时，同时更新悬浮球状态
- [ ] 隐藏或禁用悬浮球的操作按钮
- [ ] 显示 "✅ 测试完成" 文案

### Phase 2: 表单校验系统

- [ ] 创建 FormValidator 类
- [ ] 实现字段校验规则库
- [ ] 添加错误收集和报告机制
- [ ] 在提交前进行完整校验

### Phase 3: 下拉菜单增强

- [ ] 创建 SelectHandler 类
- [ ] 实现逐步选择逻辑
- [ ] 添加选项验证
- [ ] 处理动态加载选项

### Phase 4: 时间控件增强

- [ ] 创建 DateTimeHandler 类
- [ ] 支持各种日期选择器（HTML5、Ant Design、Element UI 等）
- [ ] 实现月份/日期切换
- [ ] 验证选中日期

### Phase 5: 筛选条件适配

- [ ] 分析页面所有筛选控件
- [ ] 根据类型选择相应处理器
- [ ] 按顺序执行筛选逻辑
- [ ] 验证筛选结果

## 技术实现细节

### 校验函数签名

```javascript
async validateField(field) {
  // 1. 检查必填
  if (field.required && !field.value) {
    return { valid: false, error: '必填字段未填' };
  }

  // 2. 检查格式
  const formatValid = this.validateFormat(field);

  // 3. 触发validation事件
  field.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(100);

  // 4. 检查错误提示
  const hasError = field.classList.contains('error') ||
                   field.getAttribute('aria-invalid') === 'true';

  return { valid: !hasError, error: hasError ? '验证不通过' : null };
}
```

### 下拉选择函数签名

```javascript
async selectOption(selectEl, optionText) {
  // 1. 点击打开
  selectEl.click();
  await sleep(200);

  // 2. 等待options
  const options = selectEl.querySelectorAll('option, li[role="option"]');
  if (options.length === 0) {
    await waitFor(() => selectEl.querySelectorAll('option, li[role="option"]').length > 0, 1000);
  }

  // 3. 查找并点击选项
  const targetOption = Array.from(options).find(o => o.textContent.includes(optionText));
  if (!targetOption) throw new Error(`未找到选项: ${optionText}`);

  // 4. 选择
  targetOption.click();
  selectEl.dispatchEvent(new Event('change', { bubbles: true }));

  // 5. 验证
  await sleep(100);
  const selectedValue = selectEl.value || selectEl.textContent;
  if (!selectedValue.includes(optionText)) {
    throw new Error(`选择失败: ${optionText}`);
  }
}
```

## 测试质量指标

| 指标           | 要求 | 优化前 | 优化后 |
| -------------- | ---- | ------ | ------ |
| 表单校验覆盖率 | 100% | 0%     | 100%   |
| 下拉选择成功率 | 95%  | 50%    | 95%    |
| 时间选择成功率 | 95%  | 40%    | 95%    |
| 筛选条件覆盖率 | 100% | 60%    | 100%   |
| 执行速度       | 合理 | 快     | 稳定   |

## 优先级排序

1. **高优先级** (必须做)

   - 表单校验
   - 下拉菜单逐步选择
   - 时间控件逐步选择
   - 悬浮球状态更新

2. **中优先级** (应该做)

   - 筛选条件全覆盖
   - 错误重试机制
   - 详细日志记录

3. **低优先级** (可以做)
   - UI 美化
   - 性能优化
   - 统计报告增强

---

**目标**: 建立一个严谨、高质量的自动化测试框架，确保不漏掉任何功能点！
