/**
 * AI 智能表单分析器
 * 使用 Qwen 大模型深度分析表单结构，智能填充数据
 */

class AIFormAnalyzer {
  constructor() {
    this.qwenInstance = null;
    this.analysisCache = new Map();
    this.initQwen();
  }

  /**
   * 初始化 Qwen 实例
   */
  async initQwen () {
    try {
      const config = await new Promise(resolve => {
        chrome.storage.local.get(['qwenApiKey', 'qwenEnabled'], resolve);
      });

      if (config.qwenApiKey && config.qwenEnabled && typeof QwenIntegration !== 'undefined') {
        this.qwenInstance = new QwenIntegration(config.qwenApiKey);
        console.log('[AI表单分析] Qwen 已初始化');
      } else {
        console.log('[AI表单分析] Qwen 未配置或未启用，将使用基础规则');
      }
    } catch (error) {
      console.error('[AI表单分析] Qwen 初始化失败:', error);
    }
  }

  /**
   * 深度分析整个页面和表单结构
   */
  async analyzePageAndForms (pageContext = {}) {
    console.log('[AI表单分析] 开始分析页面...');

    // 收集页面信息
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
      forms: this.extractFormsInfo(),
      tables: this.extractTablesInfo(),
      modals: this.extractModalsInfo()
    };

    // 如果有 AI，使用 AI 分析
    if (this.qwenInstance) {
      return await this.aiAnalyzePage(pageInfo);
    }

    // 否则使用规则分析
    return this.ruleBasedAnalysis(pageInfo);
  }

  /**
   * 使用 AI 分析页面
   */
  async aiAnalyzePage (pageInfo) {
    const cacheKey = pageInfo.url + '_' + pageInfo.forms.length;
    if (this.analysisCache.has(cacheKey)) {
      console.log('[AI表单分析] 使用缓存结果');
      return this.analysisCache.get(cacheKey);
    }

    const prompt = `你是一个专业的Web自动化测试专家。请仔细分析这个页面并提供详细的操作建议。

**页面信息：**
- URL: ${pageInfo.url}
- 标题: ${pageInfo.title}
- 表单数量: ${pageInfo.forms.length}
- 表格数量: ${pageInfo.tables.length}
- 弹框数量: ${pageInfo.modals.length}

**表单详情：**
${JSON.stringify(pageInfo.forms, null, 2)}

**表格详情：**
${JSON.stringify(pageInfo.tables, null, 2)}

**弹框详情：**
${JSON.stringify(pageInfo.modals, null, 2)}

请以JSON格式返回分析结果（必须是有效的JSON）：
{
  "pageType": "页面类型（如：数据管理、表单提交、列表查询等）",
  "businessPurpose": "业务目的简述",
  "recommendedActions": [
    {
      "action": "操作类型（fillForm/selectTableRow/confirmModal等）",
      "target": "目标元素描述",
      "priority": 1-10,
      "reason": "为什么推荐此操作"
    }
  ],
  "formFillingStrategy": {
    "forms": [
      {
        "formId": "表单标识",
        "fields": [
          {
            "fieldName": "字段名",
            "fieldType": "字段类型",
            "fieldLabel": "字段标签",
            "suggestedValue": "建议填充的值",
            "valueReason": "为什么填充这个值",
            "isRequired": true/false
          }
        ]
      }
    ]
  },
  "tableOperations": [
    {
      "tableId": "表格标识",
      "operation": "select/edit/delete",
      "rowSelector": "如何选择行（first/last/random/specific）",
      "reason": "操作原因"
    }
  ],
  "modalHandling": [
    {
      "modalType": "弹框类型",
      "primaryAction": "主要操作按钮（确定/取消/关闭）",
      "priority": "按钮优先级（1最高）",
      "reason": "为什么选择这个按钮"
    }
  ],
  "risks": ["可能的风险1", "可能的风险2"],
  "suggestions": ["建议1", "建议2"]
}

请确保返回的是有效的JSON格式，不要包含任何额外的文字说明。`;

    try {
      const result = await this.qwenInstance.request([{
        role: 'user',
        content: prompt
      }], {
        temperature: 0.3,
        maxTokens: 4000
      });

      if (!result) {
        console.warn('[AI表单分析] AI 分析失败，使用规则分析');
        return this.ruleBasedAnalysis(pageInfo);
      }

      // 提取 JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[AI表单分析] 无法提取 JSON，使用规则分析');
        return this.ruleBasedAnalysis(pageInfo);
      }

      const analysis = JSON.parse(jsonMatch[0]);
      console.log('[AI表单分析] AI 分析完成:', analysis);

      // 缓存结果
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('[AI表单分析] AI 分析异常:', error);
      return this.ruleBasedAnalysis(pageInfo);
    }
  }

  /**
   * 基于规则的分析（fallback）
   */
  ruleBasedAnalysis (pageInfo) {
    const analysis = {
      pageType: '通用页面',
      businessPurpose: '数据管理和交互',
      recommendedActions: [],
      formFillingStrategy: { forms: [] },
      tableOperations: [],
      modalHandling: [],
      risks: [],
      suggestions: []
    };

    // 分析表单
    pageInfo.forms.forEach(form => {
      const formStrategy = {
        formId: form.id || form.index,
        fields: []
      };

      form.fields.forEach(field => {
        formStrategy.fields.push({
          fieldName: field.name,
          fieldType: field.type,
          fieldLabel: field.label,
          suggestedValue: this.getSuggestedValueByType(field),
          valueReason: '基于字段类型和名称推断',
          isRequired: field.required
        });
      });

      analysis.formFillingStrategy.forms.push(formStrategy);
      analysis.recommendedActions.push({
        action: 'fillForm',
        target: `表单 ${form.id || form.index}`,
        priority: 8,
        reason: '检测到可填充表单'
      });
    });

    // 分析表格
    pageInfo.tables.forEach((table, index) => {
      if (table.hasActionButtons) {
        analysis.tableOperations.push({
          tableId: `table_${index}`,
          operation: 'select',
          rowSelector: 'first',
          reason: '表格有操作按钮，选择第一行测试'
        });
        analysis.recommendedActions.push({
          action: 'selectTableRow',
          target: `表格 ${index}`,
          priority: 7,
          reason: '表格有可交互元素'
        });
      }
    });

    // 分析弹框
    pageInfo.modals.forEach((modal, index) => {
      analysis.modalHandling.push({
        modalType: modal.type || '通用弹框',
        primaryAction: '确定',
        priority: 1,
        reason: '确定按钮通常是主要操作'
      });
    });

    return analysis;
  }

  /**
   * 提取表单信息
   */
  extractFormsInfo () {
    const forms = [];
    document.querySelectorAll('form, [role="form"], .form, .ant-form, .el-form').forEach((form, index) => {
      const fields = [];

      form.querySelectorAll('input, textarea, select, [role="combobox"], [role="textbox"]').forEach(field => {
        if (field.type === 'hidden') return;

        const label = this.getFieldLabel(field);
        const placeholder = field.placeholder || field.getAttribute('aria-placeholder') || '';

        fields.push({
          name: field.name || field.id || `field_${fields.length}`,
          type: field.type || field.tagName.toLowerCase(),
          label: label,
          placeholder: placeholder,
          required: field.required || field.getAttribute('aria-required') === 'true',
          selector: this.getElementSelector(field)
        });
      });

      if (fields.length > 0) {
        forms.push({
          index: index,
          id: form.id || `form_${index}`,
          className: form.className,
          fields: fields,
          hasSubmit: !!form.querySelector('button[type="submit"], input[type="submit"], .submit-btn, .ant-btn-primary')
        });
      }
    });

    return forms;
  }

  /**
   * 提取表格信息
   */
  extractTablesInfo () {
    const tables = [];
    document.querySelectorAll('table, .ant-table, .el-table, [role="grid"]').forEach((table, index) => {
      const rows = table.querySelectorAll('tr, .ant-table-row, .el-table__row, [role="row"]');
      const actionButtons = table.querySelectorAll('button, .ant-btn, .el-button, [role="button"]');
      const checkboxes = table.querySelectorAll('input[type="checkbox"], input[type="radio"], .ant-checkbox, .el-checkbox');

      tables.push({
        index: index,
        id: table.id || `table_${index}`,
        rowCount: rows.length,
        hasActionButtons: actionButtons.length > 0,
        hasCheckboxes: checkboxes.length > 0,
        hasSelection: checkboxes.length > 0,
        selector: this.getElementSelector(table)
      });
    });

    return tables;
  }

  /**
   * 提取弹框信息
   */
  extractModalsInfo () {
    const modals = [];
    document.querySelectorAll('.modal, .ant-modal, .el-dialog, [role="dialog"], [role="alertdialog"]').forEach((modal, index) => {
      if (!modal.offsetParent && modal.style.display !== 'flex') return; // 跳过隐藏的

      const confirmBtn = modal.querySelector('[class*="confirm"], [class*="ok"], .ant-btn-primary, .el-button--primary');
      const cancelBtn = modal.querySelector('[class*="cancel"], [class*="close"], .ant-btn-default');
      const formInModal = modal.querySelector('form, .ant-form, .el-form');
      const tableInModal = modal.querySelector('table, .ant-table, .el-table');

      modals.push({
        index: index,
        type: formInModal ? '表单弹框' : (tableInModal ? '表格弹框' : '通用弹框'),
        hasConfirm: !!confirmBtn,
        hasCancel: !!cancelBtn,
        hasForm: !!formInModal,
        hasTable: !!tableInModal,
        selector: this.getElementSelector(modal)
      });
    });

    return modals;
  }

  /**
   * 获取字段标签
   */
  getFieldLabel (field) {
    // 1. 查找 label 标签
    const labelFor = document.querySelector(`label[for="${field.id}"]`);
    if (labelFor) return labelFor.textContent.trim();

    // 2. 查找父元素中的 label
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent.replace(field.value, '').trim();

    // 3. 查找前面的文本节点
    const prevSibling = field.previousElementSibling;
    if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.className.includes('label'))) {
      return prevSibling.textContent.trim();
    }

    // 4. 使用 aria-label
    const ariaLabel = field.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // 5. 使用 placeholder
    return field.placeholder || field.name || field.id || '未知字段';
  }

  /**
   * 获取元素选择器
   */
  getElementSelector (element) {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c && !c.includes('ng-') && !c.includes('is-'));
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  /**
   * 根据类型获取建议值
   */
  getSuggestedValueByType (field) {
    const name = (field.name || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    const type = field.type;

    // 邮箱
    if (type === 'email' || name.includes('email') || label.includes('邮箱')) {
      return 'test@example.com';
    }

    // 电话
    if (type === 'tel' || name.includes('phone') || name.includes('tel') || label.includes('电话') || label.includes('手机')) {
      return '13800138000';
    }

    // 网址
    if (type === 'url' || name.includes('url') || name.includes('website') || label.includes('网址')) {
      return 'https://example.com';
    }

    // 日期
    if (type === 'date' || name.includes('date') || label.includes('日期')) {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    // 时间
    if (type === 'time' || name.includes('time') || label.includes('时间')) {
      return '12:00';
    }

    // 数字
    if (type === 'number' || name.includes('age') || name.includes('count') || label.includes('数量') || label.includes('年龄')) {
      return '10';
    }

    // 密码
    if (type === 'password' || name.includes('password') || name.includes('pwd') || label.includes('密码')) {
      return 'Test@123456';
    }

    // 用户名
    if (name.includes('username') || name.includes('account') || label.includes('用户名') || label.includes('账号')) {
      return 'testuser123';
    }

    // 姓名
    if (name.includes('name') || label.includes('姓名') || label.includes('名称')) {
      return '测试用户';
    }

    // 地址
    if (name.includes('address') || label.includes('地址')) {
      return '北京市朝阳区测试路1号';
    }

    // 公司
    if (name.includes('company') || label.includes('公司')) {
      return '测试公司';
    }

    // 默认文本
    return '自动化测试数据';
  }

  /**
   * 智能填充表单（基于 AI 分析结果）
   */
  async smartFillForm (formElement, analysisResult) {
    const formId = formElement.id || Array.from(document.querySelectorAll('form')).indexOf(formElement);
    const formStrategy = analysisResult.formFillingStrategy.forms.find(f =>
      f.formId == formId || f.formId.includes(formId)
    );

    if (!formStrategy) {
      console.warn('[AI表单分析] 未找到表单填充策略，使用默认方式');
      return await this.defaultFillForm(formElement);
    }

    console.log('[AI表单分析] 使用 AI 策略填充表单:', formStrategy);

    const results = [];
    for (const fieldStrategy of formStrategy.fields) {
      try {
        const field = formElement.querySelector(`[name="${fieldStrategy.fieldName}"], #${fieldStrategy.fieldName}`);
        if (!field) {
          console.warn('[AI表单分析] 未找到字段:', fieldStrategy.fieldName);
          continue;
        }

        const result = await this.fillFieldWithStrategy(field, fieldStrategy);
        results.push(result);
        await this.delay(150);
      } catch (error) {
        console.error('[AI表单分析] 填充字段失败:', fieldStrategy.fieldName, error);
        results.push({
          field: fieldStrategy.fieldName,
          success: false,
          error: error.message
        });
      }
    }

    return { results, strategy: formStrategy };
  }

  /**
   * 使用策略填充单个字段
   */
  async fillFieldWithStrategy (field, strategy) {
    const value = strategy.suggestedValue;
    const fieldType = field.type || field.tagName.toLowerCase();

    console.log(`[AI表单分析] 填充 ${strategy.fieldLabel}: "${value}" (${strategy.valueReason})`);

    // 根据字段类型填充
    if (fieldType === 'select' || field.tagName === 'SELECT') {
      return await this.fillSelect(field, value);
    } else if (fieldType === 'checkbox') {
      field.checked = true;
      field.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (fieldType === 'radio') {
      field.checked = true;
      field.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (fieldType === 'textarea' || field.tagName === 'TEXTAREA') {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // 普通输入框
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return {
      field: strategy.fieldName,
      success: true,
      value: value,
      reason: strategy.valueReason
    };
  }

  /**
   * 填充下拉框
   */
  async fillSelect (selectElement, preferredValue = null) {
    const options = Array.from(selectElement.options);
    if (options.length === 0) return { success: false, error: '没有可选项' };

    let selectedOption = null;

    // 如果有首选值，尝试匹配
    if (preferredValue) {
      selectedOption = options.find(opt =>
        opt.value === preferredValue ||
        opt.text === preferredValue ||
        opt.text.includes(preferredValue)
      );
    }

    // 否则选择第一个非空选项
    if (!selectedOption) {
      selectedOption = options.find(opt => opt.value && opt.value !== '' && opt.value !== '请选择');
    }

    if (selectedOption) {
      selectElement.value = selectedOption.value;
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, value: selectedOption.text };
    }

    return { success: false, error: '没有合适的选项' };
  }

  /**
   * 默认填充方式（无 AI 时）
   */
  async defaultFillForm (formElement) {
    // 使用现有的 FormAutoFiller 逻辑
    const formFiller = new FormAutoFiller();
    return await formFiller.fillForm(formElement);
  }

  /**
   * 延迟工具
   */
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 全局实例
if (typeof window !== 'undefined') {
  window.aiFormAnalyzer = new AIFormAnalyzer();
}
