// 跨页面表单管理器（内容脚本侧可用）
class CrossPageFormManager {
  constructor() {
    this.formDataContext = {
      sessionId: null,
      capturedData: new Map(),
      generatedData: new Map(),
      fieldMapping: new Map()
    };
  }

  capturePageData () {
    const data = {};
    try {
      document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.value && !(el.type || '').includes('password')) {
          const fieldName = el.name || el.id || el.placeholder || `${el.tagName.toLowerCase()}_${Math.random().toString(36).slice(2, 6)}`;
          data[fieldName] = {
            value: el.value,
            type: el.type,
            label: this.findFieldLabel(el)
          };
        }
      });

      document.querySelectorAll('[data-id], [data-order], .user-id, .order-number').forEach(el => {
        const key = el.dataset.id || el.dataset.order || el.className || 'page_data';
        data[key] = (el.textContent || '').trim();
      });
    } catch { }
    return data;
  }

  async identifyFieldSemantics (fieldInfo) {
    try {
      if (!window.aiTestOrchestrator?.qwen) return null;
      const prompt = `识别表单字段语义：\n字段名:${fieldInfo.name}\n标签:${fieldInfo.label}\n类型:${fieldInfo.type}\n占位符:${fieldInfo.placeholder}\n返回JSON: {"semantic":"...","dataSource":"..."}`;
      const res = await window.aiTestOrchestrator.qwen.request([{ role: 'user', content: prompt }]);
      return JSON.parse(res.content || '{}');
    } catch { return null; }
  }

  async smartFillForm (formElement) {
    const fields = formElement.querySelectorAll('input, select, textarea');
    for (const field of fields) {
      if (field.type === 'hidden' || field.readOnly) continue;
      const semantic = await this.identifyFieldSemantics({
        name: field.name,
        label: this.findFieldLabel(field),
        type: field.type,
        placeholder: field.placeholder
      });
      if (semantic && semantic.dataSource) {
        const valueObj = this.formDataContext.capturedData.get(semantic.dataSource);
        const value = typeof valueObj === 'object' ? valueObj?.value : valueObj;
        if (value) {
          this.fillField(field, value);
          continue;
        }
      }
      const generatedValue = await this.generateFieldData(field, semantic);
      this.fillField(field, generatedValue);
    }
    return true;
  }

  async generateFieldData (field, semantic) {
    const type = (field.type || '').toLowerCase();
    if (type === 'email') return `test_${Date.now()}@example.com`;
    if (type === 'tel') return '13800138000';
    if (type === 'password') return 'Test123456';
    if (type === 'number') return '123';
    return '自动化测试';
  }

  findFieldLabel (field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) return (label.textContent || '').trim();
    const parentLabel = field.closest('label');
    if (parentLabel) return (parentLabel.textContent || '').trim();
    return '';
  }

  fillField (field, value) {
    try {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    } catch { }
  }
}

// 挂载到全局以便内容脚本调用
if (typeof window !== 'undefined') {
  window.CrossPageFormManager = CrossPageFormManager;
}
