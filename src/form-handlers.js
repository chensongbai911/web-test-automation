// 表单控件处理器 - 提供高级的表单元素交互逻辑

/**
 * 下拉菜单选择处理器
 * 逐步打开、等待、验证、选择
 */
class SelectHandler {
  constructor() {
    this.maxWaitTime = 2000; // 最大等待时间（毫秒）
    this.stepDelay = 200; // 每步之间的延迟
  }

  /**
   * 逐步选择下拉菜单选项
   * @param {HTMLElement} selectElement - select元素或选择器样式的容器
   * @param {string} optionText - 要选择的选项文本（支持模糊匹配）
   * @returns {Promise<Object>} 选择结果
   */
  async selectOption (selectElement, optionText) {
    const result = {
      success: false,
      steps: [],
      error: null
    };

    try {
      // 1. 检查元素有效性
      if (!selectElement) {
        throw new Error('选择器元素为null');
      }
      result.steps.push('✓ 第1步: 验证元素有效性');

      // 2. 打开下拉菜单
      const isOpened = await this.openSelect(selectElement);
      if (!isOpened) {
        throw new Error('无法打开下拉菜单');
      }
      result.steps.push('✓ 第2步: 下拉菜单已打开');
      await this.delay(this.stepDelay);

      // 3. 等待并验证选项加载
      const options = await this.waitForOptions(selectElement);
      if (options.length === 0) {
        throw new Error('下拉菜单中没有可用选项');
      }
      result.steps.push(`✓ 第3步: 检测到${options.length}个选项`);

      // 4. 查找目标选项
      const targetOption = this.findOption(options, optionText);
      if (!targetOption) {
        throw new Error(`未找到包含"${optionText}"的选项`);
      }
      result.steps.push(`✓ 第4步: 找到目标选项`);

      // 5. 选择选项
      await this.clickOption(targetOption);
      result.steps.push('✓ 第5步: 已点击选项');
      await this.delay(this.stepDelay);

      // 6. 验证选中值
      const selectedValue = this.getSelectedValue(selectElement);
      if (!selectedValue.includes(optionText.trim())) {
        // 可能是异步更新，再等待一下
        await this.delay(500);
        const newValue = this.getSelectedValue(selectElement);
        if (!newValue.includes(optionText.trim())) {
          console.warn('[SelectHandler] 选项似乎没有正确选中:', selectedValue);
        }
      }
      result.steps.push(`✓ 第6步: 验证完成，选中值为: ${selectedValue}`);

      // 7. 触发change事件
      this.triggerChangeEvent(selectElement);
      result.steps.push('✓ 第7步: 已触发change事件');

      result.success = true;
      return result;

    } catch (error) {
      result.error = error.message;
      console.error('[SelectHandler] 选择失败:', error);
      return result;
    }
  }

  /**
   * 打开下拉菜单
   */
  async openSelect (selectElement) {
    try {
      // 原生select
      if (selectElement.tagName === 'SELECT') {
        selectElement.click();
        selectElement.focus();
        return true;
      }

      // 自定义下拉菜单（div-based）
      const toggleBtn = selectElement.querySelector('[role="button"], .select-trigger, .dropdown-toggle');
      if (toggleBtn) {
        toggleBtn.click();
        return true;
      }

      // 如果是容器，直接点击
      selectElement.click();
      selectElement.focus();
      return true;

    } catch (error) {
      console.error('[SelectHandler] 打开下拉菜单失败:', error);
      return false;
    }
  }

  /**
   * 等待选项加载
   */
  async waitForOptions (selectElement, timeout = this.maxWaitTime) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // 原生select
      if (selectElement.tagName === 'SELECT') {
        const options = selectElement.querySelectorAll('option:not([disabled])');
        if (options.length > 0) {
          return Array.from(options);
        }
      }

      // 自定义下拉菜单
      const menuOptions = selectElement.querySelectorAll('[role="option"], .option, li[class*="option"]');
      if (menuOptions.length > 0) {
        return Array.from(menuOptions);
      }

      // 等待后重试
      await this.delay(100);
    }

    return [];
  }

  /**
   * 查找目标选项
   */
  findOption (options, optionText) {
    const searchText = optionText.toLowerCase().trim();

    for (const option of options) {
      const text = option.textContent.toLowerCase().trim();
      if (text.includes(searchText) || searchText.includes(text)) {
        return option;
      }
    }

    return null;
  }

  /**
   * 点击选项
   */
  async clickOption (option) {
    option.click();
    option.dispatchEvent(new Event('click', { bubbles: true }));

    // 对于select option，需要改变父select的selectedIndex
    if (option.tagName === 'OPTION') {
      option.parentElement.value = option.value;
    }
  }

  /**
   * 获取选中值
   */
  getSelectedValue (selectElement) {
    // 原生select
    if (selectElement.tagName === 'SELECT') {
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      return selectedOption ? selectedOption.text : selectElement.value;
    }

    // 自定义下拉菜单
    const selectedText = selectElement.querySelector('[class*="selected"], [aria-selected="true"]');
    if (selectedText) {
      return selectedText.textContent;
    }

    return selectElement.textContent || selectElement.value || '';
  }

  /**
   * 触发change事件
   */
  triggerChangeEvent (selectElement) {
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    selectElement.dispatchEvent(new Event('input', { bubbles: true }));
    selectElement.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  /**
   * 延迟函数
   */
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 时间选择处理器
 * 支持原生HTML5日期选择器和各种日期组件库
 */
class DateTimeHandler {
  constructor() {
    this.maxWaitTime = 3000;
    this.stepDelay = 200;
  }

  /**
   * 选择日期
   * @param {HTMLElement} inputElement - 日期输入框
   * @param {string} dateString - 日期字符串，格式: YYYY-MM-DD
   */
  async selectDate (inputElement, dateString) {
    const result = {
      success: false,
      steps: [],
      error: null
    };

    try {
      // 1. 验证输入
      if (!this.isValidDateFormat(dateString)) {
        throw new Error(`无效的日期格式，应为YYYY-MM-DD: ${dateString}`);
      }
      result.steps.push('✓ 第1步: 日期格式验证通过');

      // 2. 尝试原生HTML5日期输入
      if (this.tryNativeInput(inputElement, dateString)) {
        result.steps.push('✓ 第2步: 使用原生HTML5输入');
        result.success = true;
        return result;
      }

      // 3. 打开日期选择器
      const pickerOpened = await this.openDatePicker(inputElement);
      if (!pickerOpened) {
        throw new Error('无法打开日期选择器');
      }
      result.steps.push('✓ 第3步: 日期选择器已打开');
      await this.delay(this.stepDelay);

      // 4. 解析日期
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // 5. 选择年份（如果需要）
      await this.selectYear(inputElement, year);
      result.steps.push(`✓ 第4步: 已选择年份 ${year}`);
      await this.delay(this.stepDelay);

      // 6. 选择月份（如果需要）
      await this.selectMonth(inputElement, month);
      result.steps.push(`✓ 第5步: 已选择月份 ${month}`);
      await this.delay(this.stepDelay);

      // 7. 选择日期
      const daySelected = await this.selectDay(inputElement, day);
      if (!daySelected) {
        throw new Error(`无法选择第${day}天`);
      }
      result.steps.push(`✓ 第6步: 已选择日期 ${day}`);
      await this.delay(this.stepDelay);

      // 8. 确认选择（如果有确认按钮）
      await this.confirmDateSelection(inputElement);
      result.steps.push('✓ 第7步: 已确认选择');

      // 9. 验证选中值
      const selectedDate = inputElement.value;
      result.steps.push(`✓ 第8步: 验证完成，选中日期为: ${selectedDate}`);

      // 10. 触发事件
      this.triggerDateChangeEvent(inputElement);
      result.steps.push('✓ 第9步: 已触发change事件');

      result.success = true;
      return result;

    } catch (error) {
      result.error = error.message;
      console.error('[DateTimeHandler] 日期选择失败:', error);
      return result;
    }
  }

  /**
   * 验证日期格式
   */
  isValidDateFormat (dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * 尝试使用原生HTML5输入
   */
  tryNativeInput (inputElement, dateString) {
    if (inputElement.type === 'date') {
      try {
        inputElement.value = dateString;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      } catch (error) {
        console.log('[DateTimeHandler] 原生输入失败:', error);
        return false;
      }
    }

    return false;
  }

  /**
   * 打开日期选择器
   */
  async openDatePicker (inputElement) {
    try {
      inputElement.click();
      inputElement.focus();

      // 等待日期选择器打开
      await this.waitForDatePicker(inputElement, this.maxWaitTime);
      return true;

    } catch (error) {
      console.error('[DateTimeHandler] 打开日期选择器失败:', error);
      return false;
    }
  }

  /**
   * 等待日期选择器出现
   */
  async waitForDatePicker (inputElement, timeout) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // 查找各种类型的日期选择器
      const pickers = document.querySelectorAll(
        '[role="dialog"][aria-label*="date"], .date-picker, .datepicker, .calendar, .ant-picker-dropdown'
      );

      if (pickers.length > 0 && pickers[pickers.length - 1].offsetParent !== null) {
        return;
      }

      await this.delay(100);
    }

    throw new Error('日期选择器未在预期时间内出现');
  }

  /**
   * 选择年份
   */
  async selectYear (inputElement, year) {
    // 查找年份选择器
    const yearBtn = document.querySelector('[aria-label*="year"], .year-selector, [class*="year"]');
    if (yearBtn) {
      yearBtn.click();
      await this.delay(200);

      // 查找并点击目标年份
      const yearOptions = document.querySelectorAll('[role="option"], li, .year-option');
      for (const option of yearOptions) {
        if (option.textContent.includes(year.toString())) {
          option.click();
          return;
        }
      }
    }
  }

  /**
   * 选择月份
   */
  async selectMonth (inputElement, month) {
    // 查找月份选择器
    const monthBtn = document.querySelector('[aria-label*="month"], .month-selector, [class*="month"]');
    if (monthBtn) {
      monthBtn.click();
      await this.delay(200);

      // 查找并点击目标月份
      const monthOptions = document.querySelectorAll('[role="option"], li, .month-option');
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const monthName = monthNames[month - 1];

      for (const option of monthOptions) {
        if (option.textContent.includes(monthName) || option.textContent.includes(month.toString())) {
          option.click();
          return;
        }
      }
    }
  }

  /**
   * 选择日期
   */
  async selectDay (inputElement, day) {
    const dayButtons = document.querySelectorAll(
      '[aria-label*="day"], [role="button"][class*="day"], [class*="date-cell"], .ant-picker-cell-in-view'
    );

    for (const btn of dayButtons) {
      const text = btn.textContent.trim();
      if (text === day.toString() || text.startsWith(day.toString() + ' ')) {
        btn.click();
        return true;
      }
    }

    return false;
  }

  /**
   * 确认日期选择
   */
  async confirmDateSelection (inputElement) {
    const confirmBtn = document.querySelector(
      '[aria-label*="confirm"], [aria-label*="确定"], .confirm-btn, .ant-picker-ok'
    );

    if (confirmBtn && confirmBtn.offsetParent !== null) {
      confirmBtn.click();
      await this.delay(300);
    }
  }

  /**
   * 触发日期改变事件
   */
  triggerDateChangeEvent (inputElement) {
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    inputElement.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  /**
   * 延迟函数
   */
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SelectHandler, DateTimeHandler };
}
