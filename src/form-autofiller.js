// 表单自动填充和多步骤表单处理模块

class FormAutoFiller {
  constructor() {
    this.formDetected = false;
    this.currentStep = 1;
    this.totalSteps = 1;
    this.formHistory = [];
    this.selectHandler = new SelectHandler();
    this.dateTimeHandler = new DateTimeHandler();
    this.testData = {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'Test@12345',
      phone: '13800138000',
      name: '张三测试',
      address: '北京市朝阳区测试路1号',
      company: '测试公司',
      url: 'https://example.com',
      date: this.getFormattedDate(),
      content: '这是自动化测试输入的内容。用于测试表单功能。支持多类型字段。'
    };
  }

  getFormattedDate () {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 检测页面上的表单
  detectForms () {
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
      return null;
    }

    const formInfo = {
      count: forms.length,
      forms: []
    };

    forms.forEach((form, index) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      formInfo.forms.push({
        index,
        id: form.id,
        name: form.name,
        method: form.method,
        action: form.action,
        inputCount: inputs.length,
        hasSubmit: !!form.querySelector('button[type="submit"], input[type="submit"]'),
        isMultiStep: this.isMultiStepForm(form)
      });
    });

    this.formDetected = formInfo.count > 0;
    this.totalSteps = formInfo.forms.length;
    return formInfo;
  }

  // 判断是否为多步骤表单
  isMultiStepForm (form) {
    const nextBtn = form.querySelector('button.next, button[data-step="next"], .next-btn, [role="button"][aria-label*="下一步"]');
    const steps = document.querySelectorAll('.step, .form-step, [role="progressbar"]');
    return (nextBtn && nextBtn.offsetParent !== null) || steps.length > 0;
  }

  // 填充单个表单
  async fillForm (formElement) {
    const inputs = formElement.querySelectorAll('input:not([type="hidden"]), textarea, select');
    const results = [];

    for (const input of inputs) {
      if (!input.offsetParent) continue; // 跳过隐藏元素

      try {
        const result = await this.fillInput(input);
        results.push(result);
        await this.delay(100); // 逐个填充，间隔100ms
      } catch (error) {
        results.push({
          element: input.name || input.id,
          success: false,
          error: error.message
        });
      }
    }

    // ✅ 新增：填充后进行校验
    const validationResult = await this.validateFormFields(formElement, inputs);

    return {
      fillResults: results,
      validationResults: validationResult,
      allValid: validationResult.allFieldsValid
    };
  }

  // 填充单个输入字段
  async fillInput (input) {
    const type = input.type || 'text';
    const name = (input.name || input.id || '').toLowerCase();
    let value = '';

    // 根据类型和名称选择合适的测试数据
    if (type === 'email' || name.includes('email')) {
      value = this.testData.email;
    } else if (type === 'password' || name.includes('password') || name.includes('pwd')) {
      value = this.testData.password;
    } else if (type === 'tel' || name.includes('phone') || name.includes('tel')) {
      value = this.testData.phone;
    } else if (type === 'url' || name.includes('url') || name.includes('website')) {
      value = this.testData.url;
    } else if (type === 'date') {
      value = this.testData.date;
    } else if (name.includes('name') || name.includes('username') || name.includes('user')) {
      value = this.testData.username;
    } else if (name.includes('address') || name.includes('location')) {
      value = this.testData.address;
    } else if (name.includes('company') || name.includes('organization')) {
      value = this.testData.company;
    } else if (input.tagName === 'TEXTAREA' || type === 'text' && name.includes('content') || name.includes('message') || name.includes('description')) {
      value = this.testData.content;
    } else {
      value = this.testData[name] || '测试数据';
    }

    // 填充值
    if (input.tagName === 'SELECT') {
      // ✅ 新增：使用SelectHandler逐步选择下拉菜单
      try {
        // 获取第一个非禁用选项的文本
        const options = input.querySelectorAll('option:not([disabled])');
        if (options.length > 1) {
          const targetOption = options[1].textContent;
          const selectResult = await this.selectHandler.selectOption(input, targetOption);
          console.log('[FormAutoFiller] 下拉菜单选择结果:', selectResult);
        }
      } catch (error) {
        console.error('[FormAutoFiller] 下拉菜单选择失败:', error);
        // 降级处理：直接赋值
        const options = input.querySelectorAll('option');
        if (options.length > 1) {
          input.selectedIndex = 1;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    } else if (type === 'date') {
      // ✅ 新增：使用DateTimeHandler逐步选择日期
      try {
        const dateResult = await this.dateTimeHandler.selectDate(input, value);
        console.log('[FormAutoFiller] 日期选择结果:', dateResult);
      } catch (error) {
        console.error('[FormAutoFiller] 日期选择失败:', error);
        // 降级处理：直接赋值
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (input.tagName === 'TEXTAREA') {
      // 文本域：逐字符输入
      input.focus();
      input.value = '';
      for (let char of value) {
        input.value += char;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.delay(30);
      }
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      input.blur();
    } else {
      // 普通输入框：逐字符输入模拟用户打字
      input.focus();
      input.value = '';
      for (let char of value) {
        input.value += char;
        // 触发多个事件，确保表单字段值确实改变
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        await this.delay(30);
      }
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      input.blur();
    }

    return {
      element: input.name || input.id || input.type,
      type,
      value,
      success: true
    };
  }

  // ✅ 新增：表单字段验证方法
  async validateFormFields (formElement, inputs) {
    const validationResults = {
      fields: [],
      allFieldsValid: true,
      errors: []
    };

    for (const input of inputs) {
      if (!input.offsetParent) continue; // 跳过隐藏元素

      const fieldValidation = await this.validateSingleField(input);
      validationResults.fields.push(fieldValidation);

      if (!fieldValidation.valid) {
        validationResults.allFieldsValid = false;
        validationResults.errors.push({
          field: input.name || input.id,
          error: fieldValidation.error
        });
      }
    }

    // 等待验证完成
    await this.delay(200);

    // 检查是否有错误提示
    const errorIndicators = formElement.querySelectorAll('[class*="error"], [aria-invalid="true"], .invalid');
    if (errorIndicators.length > 0) {
      console.warn('[FormAutoFiller] 检测到表单错误提示:', errorIndicators.length);
      validationResults.allFieldsValid = false;
    }

    return validationResults;
  }

  // ✅ 新增：单个字段验证
  async validateSingleField (input) {
    const fieldName = input.name || input.id || input.type;
    const type = input.type || 'text';
    const value = input.value;

    // 1. 检查必填字段
    if (input.required && !value) {
      return {
        field: fieldName,
        valid: false,
        error: '必填字段为空'
      };
    }

    // 2. 检查格式验证
    const formatValid = this.validateFieldFormat(input, value);
    if (!formatValid.valid) {
      return {
        field: fieldName,
        valid: false,
        error: formatValid.error
      };
    }

    // 3. 触发change事件激活浏览器验证
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await this.delay(100);

    // 4. 检查是否有错误类名或属性
    const hasErrorClass = input.classList.contains('error') ||
      input.classList.contains('is-invalid') ||
      input.classList.contains('ng-invalid');
    const hasAriaInvalid = input.getAttribute('aria-invalid') === 'true';

    if (hasErrorClass || hasAriaInvalid) {
      return {
        field: fieldName,
        valid: false,
        error: '字段验证未通过'
      };
    }

    return {
      field: fieldName,
      valid: true,
      error: null
    };
  }

  // ✅ 新增：字段格式验证
  validateFieldFormat (input, value) {
    const type = input.type || 'text';
    const name = (input.name || input.id || '').toLowerCase();

    // 邮箱格式
    if (type === 'email' || name.includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, error: '邮箱格式不正确' };
      }
    }

    // 电话格式
    if (type === 'tel' || name.includes('phone') || name.includes('tel')) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (value && !phoneRegex.test(value)) {
        return { valid: false, error: '电话号码格式不正确' };
      }
    }

    // URL格式
    if (type === 'url' || name.includes('url') || name.includes('website')) {
      try {
        new URL(value);
      } catch {
        return { valid: false, error: 'URL格式不正确' };
      }
    }

    // 日期格式
    if (type === 'date') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { valid: false, error: '日期格式不正确' };
      }
    }

    // 数字字段
    if (type === 'number') {
      if (isNaN(value)) {
        return { valid: false, error: '必须输入数字' };
      }

      // 检查最小值和最大值
      if (input.min && parseFloat(value) < parseFloat(input.min)) {
        return { valid: false, error: `值不能小于${input.min}` };
      }
      if (input.max && parseFloat(value) > parseFloat(input.max)) {
        return { valid: false, error: `值不能大于${input.max}` };
      }
    }

    // 检查字符串长度
    if (input.minLength && value.length < input.minLength) {
      return { valid: false, error: `最少输入${input.minLength}个字符` };
    }
    if (input.maxLength && value.length > input.maxLength) {
      return { valid: false, error: `最多输入${input.maxLength}个字符` };
    }

    return { valid: true, error: null };
  }

  // 查找并点击提交按钮
  findAndClickSubmit (formElement) {
    // 首先通过类型和常见类名查找
    const submitButtons = formElement.querySelectorAll(
      'button[type="submit"], input[type="submit"], button:not([type]), .submit-btn, [role="button"][aria-label*="提交"], [role="button"][aria-label*="确定"], button[class*="submit"], button[class*="Submit"]'
    );

    for (const btn of submitButtons) {
      if (btn.offsetParent !== null && !btn.disabled) {
        return btn;
      }
    }

    // 如果没找到，遍历所有按钮检查文本内容
    const allButtons = formElement.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('提交') || text.includes('submit') || text.includes('确定') ||
        text.includes('确认') || text.includes('ok') || text.includes('保存') || text.includes('save')) {
        if (btn.offsetParent !== null && !btn.disabled) {
          return btn;
        }
      }
    }

    return null;
  }

  // 查找下一步按钮（多步骤表单）
  findNextButton (formElement) {
    // 首先通过特定的类名和属性查找
    const nextButtons = formElement.querySelectorAll(
      'button.next, button[data-step="next"], .next-btn, [role="button"][aria-label*="下一步"], button[class*="next"], button[class*="Next"]'
    );

    for (const btn of nextButtons) {
      if (btn.offsetParent !== null && !btn.disabled) {
        return btn;
      }
    }

    // 如果没找到，遍历所有按钮检查文本内容
    const allButtons = formElement.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('下一步') || text.includes('next') || text.includes('继续') || text.includes('continue')) {
        if (btn.offsetParent !== null && !btn.disabled) {
          return btn;
        }
      }
    }

    return null;
  }

  // 处理多步骤表单
  async processMultiStepForm (formElement) {
    const steps = [];
    let currentStep = 1;
    const maxSteps = 10; // 防止无限循环

    while (currentStep <= maxSteps) {
      try {
        // 填充当前步骤的表单
        const fillResult = await this.fillForm(formElement);

        // ✅ 新增：检查校验结果
        if (!fillResult.allValid) {
          console.warn(`[FormAutoFiller] 第${currentStep}步校验未通过:`, fillResult.validationResults.errors);
          steps.push({
            step: currentStep,
            filled: fillResult,
            valid: false,
            errors: fillResult.validationResults.errors
          });
          break; // 校验失败，停止处理
        }

        steps.push({
          step: currentStep,
          filled: fillResult,
          valid: true
        });

        // 查找下一步按钮
        const nextBtn = this.findNextButton(formElement);
        if (!nextBtn) {
          // 没有下一步，尝试点击提交
          const submitBtn = this.findAndClickSubmit(formElement);
          if (submitBtn) {
            steps.push({
              step: currentStep,
              action: 'submit',
              success: true
            });
            submitBtn.click();
          }
          break;
        }

        // 点击下一步
        nextBtn.click();
        steps.push({
          step: currentStep,
          action: 'nextStep',
          success: true
        });

        await this.delay(800); // 等待页面更新
        currentStep++;

      } catch (error) {
        steps.push({
          step: currentStep,
          error: error.message
        });
        break;
      }
    }

    return {
      isMultiStep: true,
      totalSteps: currentStep,
      steps
    };
  }

  // 处理单步骤表单
  async processSingleStepForm (formElement) {
    const fillResult = await this.fillForm(formElement);
    await this.delay(300); // 等待填充完成

    // ✅ 新增：检查校验结果，只有通过才提交
    if (!fillResult.allValid) {
      console.warn('[FormAutoFiller] 表单校验未通过，错误:', fillResult.validationResults.errors);
      return {
        isMultiStep: false,
        filled: fillResult,
        submitted: false,
        valid: false,
        errors: fillResult.validationResults.errors,
        submitButton: null
      };
    }

    const submitBtn = this.findAndClickSubmit(formElement);
    if (submitBtn) {
      console.log('[FormAutoFiller] 表单校验通过，点击提交按钮:', submitBtn.textContent);
      submitBtn.click();
      await this.delay(800); // 等待提交处理
    }

    return {
      isMultiStep: false,
      filled: fillResult,
      submitted: !!submitBtn,
      valid: true,
      submitButton: submitBtn?.textContent || 'Submit'
    };
  }

  // 主处理函数：检测并处理表单
  async processAllForms () {
    const formInfo = this.detectForms();
    if (!formInfo) {
      return null;
    }

    const results = {
      totalForms: formInfo.count,
      forms: []
    };

    const forms = document.querySelectorAll('form');
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      try {
        let result;
        if (this.isMultiStepForm(form)) {
          result = await this.processMultiStepForm(form);
        } else {
          result = await this.processSingleStepForm(form);
        }
        results.forms.push(result);
        await this.delay(1000); // 表单间隔1秒
      } catch (error) {
        results.forms.push({
          error: error.message
        });
      }
    }

    return results;
  }

  // 延迟函数
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检测表单提交事件
  setupFormListener () {
    document.addEventListener('submit', (e) => {
      // 可选：拦截提交，用于测试
      console.log('[FormAutoFiller] 检测到表单提交:', e.target);
    }, true);
  }
}

// 导出
window.FormAutoFiller = FormAutoFiller;
