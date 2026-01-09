/**
 * 复杂表单智能处理器
 * 专门处理带下拉弹框选择、验证规则的复杂表单
 */

class ComplexFormHandler {
  constructor() {
    // 延迟初始化，每次使用时检查
    this.currentFeature = null;
    this.pendingModals = new Map(); // 等待处理的弹框
  }

  // 懒加载获取 reporter
  get reporter () {
    if (!this._reporter) {
      this._reporter = window.enhancedReporter || new EnhancedTestReporter();
    }
    return this._reporter;
  }

  // 懒加载获取 aiAnalyzer
  get aiAnalyzer () {
    if (!this._aiAnalyzer) {
      this._aiAnalyzer = window.aiFormAnalyzer || new AIFormAnalyzer();
    }
    return this._aiAnalyzer;
  }

  /**
   * 智能填充复杂表单（主入口）
   */
  async fillComplexForm (formElement, options = {}) {
    console.log('[复杂表单] 开始智能填充表单...');

    try {
      // 1. 开始记录功能点
      this.currentFeature = this.reporter.recordFeatureTest({
        name: '表单填充',
        type: 'complex-form',
        description: `填充表单: ${formElement.id || formElement.className}`
      });

      // 确保 currentFeature 创建成功
      if (!this.currentFeature || !this.currentFeature.featureId) {
        console.error('[复杂表单] 创建功能点失败，使用临时ID');
        this.currentFeature = {
          featureId: 'temp_' + Date.now(),
          name: '表单填充',
          type: 'complex-form'
        };
      }

      console.log('[复杂表单] 功能点ID:', this.currentFeature.featureId);

      // 2. 使用 AI 深度分析表单
      const analysis = await this.analyzeFormWithAI(formElement);
      console.log('[复杂表单] AI 分析结果:', analysis);

      // 3. 按字段类型分组
      const fieldGroups = this.groupFieldsByType(analysis.fields);
      console.log('[复杂表单] 字段分组:', fieldGroups);

      // 4. 按顺序填充：普通输入框 → 下拉框 → 弹框选择器
      const results = {
        inputs: [],
        selects: [],
        modalSelects: [],
        errors: []
      };

      // 4.1 填充普通输入框
      if (fieldGroups.textInputs.length > 0) {
        console.log('[复杂表单] 步骤1: 填充普通输入框');
        for (const field of fieldGroups.textInputs) {
          const result = await this.fillTextInput(field);
          results.inputs.push(result);
          await this.delay(100);
        }
      }

      // 4.2 填充普通下拉框（不触发弹框的）
      if (fieldGroups.standardSelects.length > 0) {
        console.log('[复杂表单] 步骤2: 填充普通下拉框');
        for (const field of fieldGroups.standardSelects) {
          const result = await this.fillStandardSelect(field);
          results.selects.push(result);
          await this.delay(100);
        }
      }

      // 4.3 处理带弹框的选择器（红框可点击的）
      if (fieldGroups.modalSelects.length > 0) {
        console.log(`[复杂表单] 步骤3: 处理选择器 (共${fieldGroups.modalSelects.length}个)`);
        for (let i = 0; i < fieldGroups.modalSelects.length; i++) {
          const field = fieldGroups.modalSelects[i];
          console.log(`[复杂表单]   处理第 ${i + 1}/${fieldGroups.modalSelects.length} 个选择器`);

          try {
            const result = await this.fillModalSelect(field);
            results.modalSelects.push(result);

            // 如果成功或跳过，继续下一个；如果失败，也不要卡住
            if (result.success || result.skipped) {
              console.log(`[复杂表单]   ✅ 第 ${i + 1} 个处理完成`);
            } else {
              console.log(`[复杂表单]   ⚠️ 第 ${i + 1} 个处理失败，继续下一个`);
            }

            await this.delay(300);
          } catch (error) {
            console.error(`[复杂表单]   ❌ 第 ${i + 1} 个处理异常:`, error);
            results.modalSelects.push({
              field: field.name,
              success: false,
              error: error.message
            });
            await this.delay(300);
          }
        }
        console.log('[复杂表单] 步骤3完成');
      }

      // 5. 验证所有字段
      console.log('[复杂表单] 步骤4: 验证所有字段');
      const validation = await this.validateAllFields(formElement);

      if (!validation.allValid) {
        console.warn('[复杂表单] 验证失败，尝试修复...', validation.errors);
        // 尝试修复验证错误
        await this.fixValidationErrors(validation.errors);
      }

      // 6. 查找并点击保存按钮
      console.log('[复杂表单] 步骤5: 查找保存按钮');
      const saveButton = await this.findSaveButton(formElement);
      let saveResult = { success: false, message: '未找到保存按钮' }; // ✅ 初始化

      if (saveButton) {
        console.log('[复杂表单] 找到保存按钮，准备点击');
        saveResult = await this.clickSaveButton(saveButton); // ✅ 赋值而非声明
        results.saveButton = saveResult;
      }

      // 7. 更新功能点状态
      this.reporter.updateFeatureStatus(
        this.currentFeature.featureId,
        validation.allValid && saveResult.success ? 'passed' : 'failed',
        results
      );

      return {
        success: validation.allValid,
        results: results,
        validation: validation
      };

    } catch (error) {
      console.error('[复杂表单] 填充失败:', error);
      this.reporter.updateFeatureStatus(
        this.currentFeature.featureId,
        'failed',
        null,
        error.message
      );
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 使用 AI 深度分析表单
   */
  async analyzeFormWithAI (formElement) {
    const formHTML = formElement.outerHTML;

    // 提取表单中的所有字段信息
    const fields = [];
    const allInputs = formElement.querySelectorAll('input, textarea, select, [class*="select"], [class*="picker"]');

    allInputs.forEach(field => {
      if (field.type === 'hidden') return;

      const fieldInfo = {
        element: field,
        name: field.name || field.id || '',
        type: this.detectFieldType(field),
        label: this.getFieldLabel(field),
        placeholder: field.placeholder || field.getAttribute('placeholder') || '',
        required: field.required || field.getAttribute('aria-required') === 'true' || this.isRequiredField(field),
        currentValue: field.value || '',
        selector: this.generateSelector(field),
        validation: this.detectValidationRules(field)
      };

      fields.push(fieldInfo);
    });

    // 如果有 AI，让 AI 分析
    if (this.aiAnalyzer.qwenInstance) {
      const aiAnalysis = await this.aiAnalyzer.qwenInstance.request([{
        role: 'user',
        content: `分析这个表单并为每个字段生成合适的测试数据。

表单字段列表：
${JSON.stringify(fields.map(f => ({
          name: f.name,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder,
          required: f.required,
          validation: f.validation
        })), null, 2)}

要求：
1. 为每个字段生成符合其类型和验证规则的数据
2. 必填字段必须有值
3. 数据要真实可信
4. 考虑字段之间的关联性

返回JSON格式：
{
  "fields": [
    {
      "name": "字段名",
      "suggestedValue": "建议值",
      "reason": "为什么填这个值"
    }
  ]
}`
      }], {
        temperature: 0.3,
        maxTokens: 2000
      });

      if (aiAnalysis) {
        try {
          const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
          const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

          if (aiData && aiData.fields) {
            // 合并 AI 建议
            fields.forEach(field => {
              const aiSuggestion = aiData.fields.find(f => f.name === field.name);
              if (aiSuggestion) {
                field.suggestedValue = aiSuggestion.suggestedValue;
                field.reason = aiSuggestion.reason;
              }
            });
          }
        } catch (e) {
          console.warn('[复杂表单] AI 分析结果解析失败，使用规则生成');
        }
      }
    }

    // 如果没有 AI 建议，使用规则生成
    fields.forEach(field => {
      if (!field.suggestedValue) {
        field.suggestedValue = this.generateValueByRule(field);
        field.reason = '基于字段类型和验证规则生成';
      }
    });

    return { fields };
  }

  /**
   * 检测字段类型
   */
  detectFieldType (field) {
    const tagName = field.tagName.toLowerCase();
    const type = field.type || '';
    const className = field.className || '';
    const hasClickHandler = field.onclick || field.getAttribute('onclick');

    // 检测是否是弹框选择器（红框可点击的）
    if (className.includes('select') || className.includes('picker')) {
      // 检查是否只读且可点击
      if (field.readOnly || field.getAttribute('readonly') || hasClickHandler) {
        return 'modal-select'; // 弹框选择器
      }
    }

    // 检测输入框类型
    if (tagName === 'input') {
      if (type === 'text' || type === '') return 'text';
      if (type === 'email') return 'email';
      if (type === 'tel' || type === 'phone') return 'tel';
      if (type === 'number') return 'number';
      if (type === 'date') return 'date';
      if (type === 'time') return 'time';
      if (type === 'url') return 'url';
      if (type === 'password') return 'password';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
    }

    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'select') return 'select';

    return 'text'; // 默认
  }

  /**
   * 检测验证规则
   */
  detectValidationRules (field) {
    const rules = {
      required: field.required || field.getAttribute('aria-required') === 'true',
      pattern: field.pattern || field.getAttribute('pattern') || null,
      minLength: field.minLength || field.getAttribute('minlength') || null,
      maxLength: field.maxLength || field.getAttribute('maxlength') || null,
      min: field.min || field.getAttribute('min') || null,
      max: field.max || field.getAttribute('max') || null
    };

    // 检查 data 属性中的验证规则
    const dataRules = field.getAttribute('data-rules');
    if (dataRules) {
      try {
        Object.assign(rules, JSON.parse(dataRules));
      } catch (e) {
        // 忽略解析错误
      }
    }

    return rules;
  }

  /**
   * 判断是否为必填字段
   */
  isRequiredField (field) {
    // 检查父元素是否有必填标识
    const parent = field.closest('.form-item, .form-group, .field');
    if (parent) {
      const label = parent.querySelector('label');
      if (label && (label.textContent.includes('*') || label.classList.contains('required'))) {
        return true;
      }
    }
    return false;
  }

  /**
   * 按类型分组字段
   */
  groupFieldsByType (fields) {
    return {
      textInputs: fields.filter(f => ['text', 'email', 'tel', 'number', 'date', 'time', 'url', 'password', 'textarea'].includes(f.type)),
      standardSelects: fields.filter(f => f.type === 'select'),
      modalSelects: fields.filter(f => f.type === 'modal-select'),
      checkboxes: fields.filter(f => f.type === 'checkbox'),
      radios: fields.filter(f => f.type === 'radio')
    };
  }

  /**
   * 填充文本输入框
   */
  async fillTextInput (fieldInfo) {
    const { element, name, suggestedValue, label } = fieldInfo;

    console.log(`[复杂表单] 填充文本框: ${label} = "${suggestedValue}"`);

    // 确保currentFeature存在
    if (!this.currentFeature) {
      this.currentFeature = this.reporter.recordFeatureTest({
        name: '表单填充',
        type: 'input-field',
        description: `填充输入框: ${label}`
      });
    }

    // 记录元素测试
    const elementRecord = this.reporter.recordElementTest({
      type: 'input',
      text: label,
      selector: fieldInfo.selector,
      element: element
    }, this.currentFeature.featureId);

    this.reporter.recordFeatureStep(this.currentFeature.featureId, {
      action: 'fillInput',
      target: label,
      value: suggestedValue,
      success: true
    });

    try {
      // 聚焦
      element.focus();
      await this.delay(50);

      // 清空
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.delay(50);

      // 填充
      element.value = suggestedValue;

      // 触发各种事件确保验证
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));

      await this.delay(100);

      // 检查是否有验证错误
      const hasError = this.checkFieldValidation(element);

      this.reporter.updateElementResult(
        elementRecord.elementId,
        hasError ? 'failed' : 'passed',
        { value: suggestedValue, hasError }
      );

      return {
        field: name,
        label: label,
        value: suggestedValue,
        success: !hasError,
        error: hasError ? '验证失败' : null
      };

    } catch (error) {
      console.error(`[复杂表单] 填充文本框失败: ${label}`, error);
      this.reporter.updateElementResult(elementRecord.elementId, 'failed', null, error.message);
      return {
        field: name,
        label: label,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 填充普通下拉框
   */
  async fillStandardSelect (fieldInfo) {
    const { element, name, label, suggestedValue } = fieldInfo;

    console.log(`[复杂表单] 填充下拉框: ${label}`);

    // 确保currentFeature存在
    if (!this.currentFeature) {
      this.currentFeature = this.reporter.recordFeatureTest({
        name: '下拉框选择',
        type: 'select-field',
        description: `选择下拉框: ${label}`
      });
    }

    const elementRecord = this.reporter.recordElementTest({
      type: 'select',
      text: label,
      selector: fieldInfo.selector,
      element: element
    }, this.currentFeature.featureId);

    try {
      const options = Array.from(element.options);
      let selectedOption = null;

      // 1. 尝试匹配建议值
      if (suggestedValue) {
        selectedOption = options.find(opt =>
          opt.value === suggestedValue ||
          opt.text === suggestedValue ||
          opt.text.includes(suggestedValue)
        );
      }

      // 2. 选择第一个有效选项
      if (!selectedOption) {
        selectedOption = options.find(opt =>
          opt.value &&
          opt.value !== '' &&
          !opt.text.includes('请选择') &&
          !opt.text.includes('全部')
        );
      }

      if (selectedOption) {
        element.value = selectedOption.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));

        this.reporter.recordFeatureStep(this.currentFeature.featureId, {
          action: 'selectOption',
          target: label,
          value: selectedOption.text,
          success: true
        });

        this.reporter.updateElementResult(elementRecord.elementId, 'passed', {
          value: selectedOption.text
        });

        return {
          field: name,
          label: label,
          value: selectedOption.text,
          success: true
        };
      } else {
        throw new Error('没有可选项');
      }

    } catch (error) {
      console.error(`[复杂表单] 填充下拉框失败: ${label}`, error);
      this.reporter.updateElementResult(elementRecord.elementId, 'failed', null, error.message);
      return {
        field: name,
        label: label,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 处理弹框选择器（简化版：一次选择，立即返回）
   */
  async fillModalSelect (fieldInfo) {
    const { element, name, label } = fieldInfo;

    console.log(`[复杂表单] 处理选择器: ${label}`);

    // 确保currentFeature存在
    if (!this.currentFeature) {
      this.currentFeature = this.reporter.recordFeatureTest({
        name: '选择器填充',
        type: 'select',
        description: `处理选择器: ${label}`
      });
    }

    const elementRecord = this.reporter.recordElementTest({
      type: 'select',
      text: label,
      selector: fieldInfo.selector,
      element: element
    }, this.currentFeature.featureId);

    try {
      // 🎯 策略1: 原生 <select> - 直接选择第一个有效选项
      if (element.tagName === 'SELECT' && element.options && element.options.length > 0) {
        console.log(`[复杂表单]   原生SELECT，直接选择...`);
        const options = Array.from(element.options);

        // 查找第一个有效选项
        let selectedOption = options.find(opt =>
          opt.value &&
          opt.value !== '' &&
          !opt.disabled &&
          !opt.text.includes('请选择') &&
          !opt.text.includes('--')
        );

        // 如果没找到，选择索引1或索引0
        if (!selectedOption && options.length > 1) {
          selectedOption = options[1];
        } else if (!selectedOption && options.length > 0) {
          selectedOption = options[0];
        }

        if (selectedOption) {
          element.value = selectedOption.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));

          this.reporter.recordFeatureStep(this.currentFeature.featureId, {
            action: 'selectOption',
            target: label,
            value: selectedOption.text,
            success: true
          });

          this.reporter.updateElementResult(elementRecord.elementId, 'passed', {
            value: selectedOption.value,
            text: selectedOption.text
          });

          console.log(`[复杂表单]   ✅ 已选择: ${selectedOption.text}`);

          // 立即返回，不继续执行
          return {
            field: name,
            label: label,
            value: selectedOption.value,
            selectedText: selectedOption.text,
            success: true
          };
        }
      }

      // 🎯 策略2: 自定义下拉 - 点击展开，选择第一个
      console.log(`[复杂表单]   尝试自定义下拉...`);

      element.focus();
      await this.delay(100);
      element.click();
      await this.delay(600);

      // 查找下拉选项
      const dropdownSelectors = [
        '.el-select-dropdown__item:not(.is-disabled)',
        '.ant-select-item:not(.ant-select-item-option-disabled)',
        '.el-option:not(.is-disabled)',
        '[role="option"]:not([aria-disabled="true"])',
        'li.option:not(.disabled)',
        '.dropdown-item:not(.disabled)',
        '.select-option:not(.disabled)'
      ];

      for (const selector of dropdownSelectors) {
        const options = document.querySelectorAll(selector);
        if (options.length > 0) {
          console.log(`[复杂表单]   找到 ${options.length} 个选项`);

          // 找第一个可见的
          for (const option of options) {
            if (option.offsetParent !== null) {
              const text = option.textContent.trim();

              // 跳过占位符
              if (text && !text.includes('请选择') && !text.includes('--') && text !== '') {
                console.log(`[复杂表单]   点击选项: ${text}`);

                option.click();
                await this.delay(300);

                this.reporter.recordFeatureStep(this.currentFeature.featureId, {
                  action: 'selectDropdown',
                  target: label,
                  value: text,
                  success: true
                });

                this.reporter.updateElementResult(elementRecord.elementId, 'passed', {
                  text: text
                });

                console.log(`[复杂表单]   ✅ 已选择: ${text}`);

                // 立即返回，不继续
                return {
                  field: name,
                  label: label,
                  selectedText: text,
                  success: true
                };
              }
            }
          }

          // 如果这个选择器找到了选项但没选中，尝试下一个选择器
          break;
        }
      }

      // 所有策略都失败，标记为跳过
      console.log(`[复杂表单]   ⚠️ 无法选择，跳过`);

      this.reporter.updateElementResult(elementRecord.elementId, 'skipped', {
        reason: '未找到可选项'
      });

      // 返回失败，但不抛出异常
      return {
        field: name,
        label: label,
        success: false,
        skipped: true
      };

    } catch (error) {
      console.error(`[复杂表单] 选择器处理失败:`, error);

      this.reporter.updateElementResult(elementRecord.elementId, 'failed', null, error.message);

      // 返回失败
      return {
        field: name,
        label: label,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检测弹框
   */
  async detectModal () {
    const modalSelectors = [
      '.modal:not([style*="display: none"])',
      '.ant-modal:not(.ant-modal-hidden)',
      '.el-dialog:not([style*="display: none"])',
      '[role="dialog"]:not([style*="display: none"])',
      '.layui-layer:not([style*="display: none"])',
      '.dialog:not([style*="display: none"])'
    ];

    for (const selector of modalSelectors) {
      const modal = document.querySelector(selector);
      if (modal && modal.offsetParent !== null) {
        return modal;
      }
    }

    // 等待一会再试
    await this.delay(500);
    for (const selector of modalSelectors) {
      const modal = document.querySelector(selector);
      if (modal && modal.offsetParent !== null) {
        return modal;
      }
    }

    return null;
  }

  /**
   * 在弹框中选择一项
   */
  async selectFromModal (modal, fieldInfo) {
    try {
      // 1. 查找可选择的项（表格行、列表项等）
      const selectableItems = this.findSelectableItems(modal);

      if (selectableItems.length === 0) {
        return { success: false, error: '弹框中没有可选择的项' };
      }

      console.log(`[复杂表单]     找到 ${selectableItems.length} 个可选项`);

      // 2. 选择第一项（或根据 AI 建议选择）
      const itemToSelect = selectableItems[0];
      const selectedText = itemToSelect.textContent.trim();

      // 3. 点击选择
      itemToSelect.click();
      await this.delay(200);

      return {
        success: true,
        selectedText: selectedText
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 查找可选择的项
   */
  findSelectableItems (modal) {
    const items = [];

    // 1. 查找表格行中的选择按钮/单选框
    const tableRows = modal.querySelectorAll('tbody tr, .ant-table-row, .el-table__row');
    tableRows.forEach(row => {
      // 查找行中的选择按钮
      const selectBtn = row.querySelector('button:not([disabled]), .btn:not(.disabled), [class*="select"]:not([disabled])');
      if (selectBtn) {
        items.push(selectBtn);
        return;
      }

      // 查找单选框
      const radio = row.querySelector('input[type="radio"]:not([disabled])');
      if (radio) {
        items.push(radio);
        return;
      }

      // 查找可点击的行
      if (row.onclick || row.getAttribute('onclick')) {
        items.push(row);
      }
    });

    // 2. 查找列表项
    if (items.length === 0) {
      const listItems = modal.querySelectorAll('.list-item, .ant-list-item, .el-select-dropdown__item, li');
      listItems.forEach(item => {
        if (item.offsetParent !== null && !item.classList.contains('disabled')) {
          items.push(item);
        }
      });
    }

    return items;
  }

  /**
   * 关闭弹框（点击确定）
   */
  async closeModalWithConfirm (modal) {
    // 按优先级查找确定按钮（移除 :contains 伪类）
    const confirmSelectors = [
      'button.ant-btn-primary',
      'button.el-button--primary',
      'button[class*="confirm"]',
      'button[class*="ok"]',
      '.modal-footer button:first-child',
      '.ant-modal-footer button:first-child',
      '.el-dialog__footer button:first-child'
    ];

    for (const selector of confirmSelectors) {
      try {
        const btn = modal.querySelector(selector);
        if (btn && !btn.disabled && btn.offsetParent !== null) {
          console.log(`[复杂表单]     点击确定按钮: ${btn.textContent.trim()}`);
          btn.click();
          await this.delay(300);
          return true;
        }
      } catch (e) {
        console.log(`[复杂表单]     选择器错误: ${selector}`);
      }
    }

    // 如果没找到，尝试查找任何可见按钮
    const buttons = modal.querySelectorAll('button:not([disabled])');
    for (const btn of buttons) {
      if (btn.offsetParent !== null) {
        const text = btn.textContent.trim();
        if (text.includes('确定') || text.includes('确认') || text.includes('保存') || text.includes('OK')) {
          btn.click();
          await this.delay(300);
          return true;
        }
      }
    }

    throw new Error('未找到确定按钮');
  }

  /**
   * 验证所有字段
   */
  async validateAllFields (formElement) {
    const allInputs = formElement.querySelectorAll('input:not([type="hidden"]), textarea, select');
    const errors = [];
    let allValid = true;

    for (const input of allInputs) {
      if (input.offsetParent === null) continue; // 跳过隐藏

      const hasError = this.checkFieldValidation(input);
      if (hasError) {
        allValid = false;
        errors.push({
          element: input,
          name: input.name || input.id,
          label: this.getFieldLabel(input),
          error: '验证失败'
        });
      }
    }

    return { allValid, errors };
  }

  /**
   * 检查字段验证状态
   */
  checkFieldValidation (field) {
    // 1. 检查 CSS 类
    if (field.classList.contains('error') ||
      field.classList.contains('is-invalid') ||
      field.classList.contains('ng-invalid') ||
      field.classList.contains('ant-form-item-has-error')) {
      return true;
    }

    // 2. 检查 aria-invalid
    if (field.getAttribute('aria-invalid') === 'true') {
      return true;
    }

    // 3. 检查父元素的错误类
    const parent = field.closest('.form-item, .form-group, .ant-form-item, .el-form-item');
    if (parent) {
      if (parent.classList.contains('error') ||
        parent.classList.contains('has-error') ||
        parent.classList.contains('is-error') ||
        parent.querySelector('.error-message, .ant-form-explain, .el-form-item__error')) {
        return true;
      }
    }

    // 4. 检查浏览器原生验证
    if (field.validity && !field.validity.valid) {
      return true;
    }

    return false;
  }

  /**
   * 修复验证错误
   */
  async fixValidationErrors (errors) {
    for (const error of errors) {
      console.log(`[复杂表单] 尝试修复字段: ${error.label}`);

      const fieldInfo = {
        element: error.element,
        name: error.name,
        type: this.detectFieldType(error.element),
        label: error.label,
        validation: this.detectValidationRules(error.element)
      };

      // 重新生成值
      const newValue = this.generateValueByRule(fieldInfo);

      // 重新填充
      error.element.value = newValue;
      error.element.dispatchEvent(new Event('input', { bubbles: true }));
      error.element.dispatchEvent(new Event('change', { bubbles: true }));
      error.element.dispatchEvent(new Event('blur', { bubbles: true }));

      await this.delay(100);
    }
  }

  /**
   * 查找保存按钮
   */
  async findSaveButton (formElement) {
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button.submit',
      'button.save',
      'button.ant-btn-primary',
      'button.el-button--primary',
      'button[class*="submit"]',
      'button[class*="save"]'
    ];

    // 先在表单内查找
    for (const selector of buttonSelectors) {
      try {
        const btn = formElement.querySelector(selector);
        if (btn && !btn.disabled && btn.offsetParent !== null) {
          return btn;
        }
      } catch (e) {
        // 跳过无效选择器
      }
    }

    // 通过文本内容在表单内查找
    let buttons = formElement.querySelectorAll('button');
    const saveTexts = ['保存', '提交', '确定', 'Save', 'Submit', 'OK'];

    for (const btn of buttons) {
      if (!btn.disabled && btn.offsetParent !== null) {
        const text = btn.textContent.trim();
        if (saveTexts.some(t => text.includes(t))) {
          return btn;
        }
      }
    }

    // 在表单外查找（可能在 footer）
    for (const selector of buttonSelectors) {
      try {
        const btn = document.querySelector(selector);
        if (btn && !btn.disabled && btn.offsetParent !== null) {
          // 确保按钮在视图中且不是其他表单的
          const btnForm = btn.closest('form');
          if (!btnForm || btnForm === formElement) {
            return btn;
          }
        }
      } catch (e) {
        // 跳过无效选择器
      }
    }

    return null;
  }

  /**
   * 点击保存按钮并记录 API
   */
  async clickSaveButton (button) {
    console.log('[复杂表单] 点击保存按钮...');

    // 确保currentFeature存在
    if (!this.currentFeature) {
      this.currentFeature = this.reporter.recordFeatureTest({
        name: '保存表单',
        type: 'button-click',
        description: '点击保存按钮'
      });
    }

    const elementRecord = this.reporter.recordElementTest({
      type: 'button',
      text: '保存按钮',
      element: button
    }, this.currentFeature.featureId);

    this.reporter.recordFeatureStep(this.currentFeature.featureId, {
      action: 'clickSave',
      target: '保存按钮',
      success: true
    });

    try {
      // 清空 API 记录
      window.apiRequests = [];

      // 点击
      button.click();

      // 等待 API 响应
      await this.delay(2000);

      // 检查 API 调用
      const apiCalls = window.apiRequests || [];

      if (apiCalls.length > 0) {
        console.log(`[复杂表单] 捕获到 ${apiCalls.length} 个 API 调用`);

        apiCalls.forEach(api => {
          this.reporter.recordApiCall({
            method: api.method,
            url: api.url,
            status: api.status,
            statusText: api.statusText || '',
            duration: api.duration || 0,
            requestTime: api.requestTime,
            responseTime: api.responseTime
          }, elementRecord.elementId, this.currentFeature.featureId);
        });

        const hasError = apiCalls.some(api => api.status >= 400);

        this.reporter.updateElementResult(
          elementRecord.elementId,
          hasError ? 'failed' : 'passed',
          { apiCount: apiCalls.length, apis: apiCalls }
        );

        return {
          success: !hasError,
          apiCalls: apiCalls
        };
      } else {
        // 没有 API 调用，可能是前端验证或其他原因
        this.reporter.updateElementResult(elementRecord.elementId, 'passed', {
          message: '按钮已点击，但未捕获到 API 调用'
        });

        return {
          success: true,
          message: '按钮已点击'
        };
      }

    } catch (error) {
      console.error('[复杂表单] 点击保存按钮失败:', error);
      this.reporter.updateElementResult(elementRecord.elementId, 'failed', null, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 根据规则生成值
   */
  generateValueByRule (fieldInfo) {
    const { type, name, label, validation } = fieldInfo;
    const nameLower = (name || '').toLowerCase();
    const labelLower = (label || '').toLowerCase();

    // Email
    if (type === 'email' || nameLower.includes('email') || labelLower.includes('邮箱')) {
      return 'test@example.com';
    }

    // 电话
    if (type === 'tel' || nameLower.includes('phone') || nameLower.includes('tel') || labelLower.includes('电话') || labelLower.includes('手机')) {
      return '13800138000';
    }

    // 数字
    if (type === 'number') {
      const min = validation.min ? parseInt(validation.min) : 1;
      const max = validation.max ? parseInt(validation.max) : 100;
      return String(Math.floor((min + max) / 2));
    }

    // 日期
    if (type === 'date') {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    // 时间
    if (type === 'time') {
      return '12:00';
    }

    // URL
    if (type === 'url') {
      return 'https://example.com';
    }

    // 密码
    if (type === 'password') {
      return 'Test@123456';
    }

    // 文本 - 根据标签推断
    if (labelLower.includes('名称') || labelLower.includes('姓名') || nameLower.includes('name')) {
      return '测试用户';
    }

    if (labelLower.includes('编码') || labelLower.includes('编号') || nameLower.includes('code')) {
      return 'TEST' + Date.now().toString().slice(-6);
    }

    if (labelLower.includes('长度') || labelLower.includes('位数') || nameLower.includes('length')) {
      return '10';
    }

    if (labelLower.includes('备注') || labelLower.includes('说明') || nameLower.includes('remark')) {
      return '自动化测试备注';
    }

    // 默认文本
    if (validation.minLength) {
      const minLen = parseInt(validation.minLength);
      return '测试数据'.repeat(Math.ceil(minLen / 4)).substring(0, minLen);
    }

    return '自动化测试';
  }

  /**
   * 获取字段标签
   */
  getFieldLabel (field) {
    // 尝试多种方式获取标签
    const id = field.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent.trim().replace('*', '').trim();
    }

    const parent = field.closest('.form-item, .form-group, .ant-form-item, .el-form-item');
    if (parent) {
      const label = parent.querySelector('label, .label, .ant-form-item-label, .el-form-item__label');
      if (label) return label.textContent.trim().replace('*', '').trim();
    }

    const ariaLabel = field.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    return field.placeholder || field.name || field.id || '未知字段';
  }

  /**
   * 生成选择器
   */
  generateSelector (element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c && !c.includes('ng-') && !c.includes('is-'));
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  /**
   * 延迟
   */
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 全局实例
if (typeof window !== 'undefined') {
  window.complexFormHandler = new ComplexFormHandler();
}
