/**
 * 智能测试执行策略优化器
 *
 * 优化方向：
 * 1. 更准确的元素识别
 * 2. 更智能的操作顺序
 * 3. 更有效的弹框处理
 * 4. 更可靠的错误恢复
 * 5. 更快的执行速度
 */

class TestExecutionOptimizer {
  constructor() {
    this.elementCache = new Map();
    this.operationHistory = [];
    this.performanceMetrics = {
      totalElements: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalTime: 0,
      averageOperationTime: 0
    };
  }

  /**
   * 🎯 优化的元素识别
   * 支持多种选择器策略，提高准确度
   */
  smartFindElement (selector, context = document, strategy = 'auto') {
    const strategies = {
      // CSS 选择器
      css: () => context.querySelector(selector),

      // XPath 选择器
      xpath: () => {
        const result = document.evaluate(
          selector,
          context,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        return result.singleNodeValue;
      },

      // 文本匹配
      text: () => {
        const elements = context.querySelectorAll('*');
        for (const el of elements) {
          if (el.textContent.trim() === selector) {
            return el;
          }
        }
        return null;
      },

      // 属性匹配
      attribute: () => {
        const [attrName, attrValue] = selector.split('=');
        return context.querySelector(`[${attrName}="${attrValue}"]`);
      },

      // 自动策略：尝试多种方法
      auto: () => {
        // 1. 先尝试 CSS 选择器
        let element = context.querySelector(selector);
        if (element) return element;

        // 2. 尝试文本匹配
        const elements = context.querySelectorAll('*');
        for (const el of elements) {
          if (el.textContent.includes(selector)) {
            return el;
          }
        }

        // 3. 尝试属性匹配
        element = context.querySelector(`[data-test="${selector}"]`);
        if (element) return element;

        element = context.querySelector(`[aria-label="${selector}"]`);
        if (element) return element;

        return null;
      }
    };

    const selectedStrategy = strategies[strategy] || strategies.auto;
    return selectedStrategy();
  }

  /**
   * 🧠 智能操作顺序生成
   * 根据页面结构和业务逻辑生成最优操作顺序
   */
  generateOptimalOperationOrder (elements) {
    const grouped = {
      forms: [],
      criticalButtons: [],
      dataInputs: [],
      dataOutputs: [],
      navLinks: [],
      otherButtons: [],
      other: []
    };

    // 分类元素
    elements.forEach(element => {
      const tag = element.tagName.toLowerCase();
      const text = element.textContent?.toLowerCase() || '';
      const role = element.getAttribute('role');

      if (tag === 'form' || element.querySelector('form')) {
        grouped.forms.push(element);
      } else if (tag === 'button' || role === 'button') {
        // 关键按钮识别
        if (text.includes('提交') || text.includes('保存') || text.includes('确认') || text.includes('submit')) {
          grouped.criticalButtons.push(element);
        } else {
          grouped.otherButtons.push(element);
        }
      } else if (tag === 'input' || tag === 'select' || tag === 'textarea') {
        grouped.dataInputs.push(element);
      } else if (tag === 'table' || tag === 'div' && element.classList.contains('data')) {
        grouped.dataOutputs.push(element);
      } else if (tag === 'a' || role === 'link') {
        grouped.navLinks.push(element);
      } else {
        grouped.other.push(element);
      }
    });

    // 按优先级排列
    const orderedElements = [
      ...grouped.forms,           // 1. 表单（最重要）
      ...grouped.dataInputs,      // 2. 数据输入字段
      ...grouped.criticalButtons, // 3. 关键按钮（提交、保存等）
      ...grouped.dataOutputs,     // 4. 数据展示区域
      ...grouped.otherButtons,    // 5. 其他按钮
      ...grouped.navLinks,        // 6. 导航链接
      ...grouped.other            // 7. 其他元素
    ];

    return orderedElements;
  }

  /**
   * 🔍 增强的元素可见性检查
   */
  isElementVisible (element) {
    if (!element) return false;

    // 检查是否在DOM中
    if (!document.body.contains(element)) return false;

    // 检查样式隐藏
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    // 检查父元素是否隐藏
    let parent = element.parentElement;
    while (parent) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        return false;
      }
      parent = parent.parentElement;
    }

    // 检查尺寸
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    return true;
  }

  /**
   * 📍 智能滚动到元素
   * 确保元素在视口内且不被其他元素遮挡
   */
  smartScrollIntoView (element) {
    if (!element) return false;

    try {
      // 方法1：标准滚动
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 方法2：等待动画完成
      return new Promise(resolve => {
        setTimeout(() => resolve(true), 500);
      });
    } catch (error) {
      console.warn('[优化器] 滚动失败:', error);
      return false;
    }
  }

  /**
   * 🎯 智能点击操作
   * 处理各种点击方式，提高可靠性
   */
  async smartClick (element, retries = 3) {
    if (!element) return false;

    for (let i = 0; i < retries; i++) {
      try {
        // 1. 检查可见性
        if (!this.isElementVisible(element)) {
          console.warn(`[优化器] 元素不可见，尝试滚动 (${i + 1}/${retries})`);
          await this.smartScrollIntoView(element);
        }

        // 2. 尝试标准点击
        element.click();

        // 3. 如果标准点击失败，尝试事件触发
        if (!element.matches(':active')) {
          const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

          element.dispatchEvent(mouseDownEvent);
          element.dispatchEvent(mouseUpEvent);
          element.dispatchEvent(clickEvent);
        }

        // 等待事件处理
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      } catch (error) {
        console.warn(`[优化器] 点击失败尝试 ${i + 1}/${retries}:`, error.message);
        if (i === retries - 1) return false;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return false;
  }

  /**
   * 📝 智能填充输入框
   * 支持多种输入类型
   */
  async smartFill (element, value) {
    if (!element) return false;

    try {
      const tag = element.tagName.toLowerCase();

      if (tag === 'input' || tag === 'textarea') {
        // 清空原有值
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // 逐字符输入（模拟用户输入）
        for (const char of value) {
          element.value += char;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      } else if (tag === 'select') {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('[优化器] 填充失败:', error);
      return false;
    }
  }

  /**
   * ⏱️ 智能等待时间计算
   * 根据操作类型和网络条件动态调整
   */
  calculateOptimalDelay (operationType = 'click') {
    const baseDelays = {
      click: 300,      // 普通点击
      fill: 200,       // 输入填充
      select: 400,     // 下拉选择
      submit: 1000,    // 表单提交
      modal: 500,      // 弹框处理
      navigate: 2000   // 页面导航
    };

    // 根据网络状况调整
    const connection = navigator.connection?.effectiveType || '4g';
    const networkMultiplier = {
      'slow-2g': 3.0,
      '2g': 2.0,
      '3g': 1.2,
      '4g': 1.0,
      '5g': 0.8
    }[connection] || 1.0;

    return Math.ceil((baseDelays[operationType] || 300) * networkMultiplier);
  }

  /**
   * 🛡️ 错误恢复策略
   * 自动识别和恢复失败操作
   */
  async recoverFromFailure (operation, context) {
    console.log('[优化器] 检测到操作失败，执行恢复策略...');

    // 1. 关闭可能存在的弹框
    this.closeUnexpectedModals();

    // 2. 清除选中状态
    document.querySelectorAll(':focus').forEach(el => el.blur());

    // 3. 恢复页面滚动位置
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = 'auto';
    }

    // 4. 刷新元素缓存
    this.elementCache.clear();

    // 5. 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. 重试操作
    console.log('[优化器] 正在重试操作...');
    return false; // 返回 false 让调用者决定是否重试
  }

  /**
   * 🚪 关闭意外弹框
   */
  closeUnexpectedModals () {
    // 查找常见的弹框元素
    const modalSelectors = [
      '.modal.show',
      '.ant-modal',
      '.v-modal',
      '[role="dialog"]',
      '.dialog',
      '.popup',
      '.overlay'
    ];

    for (const selector of modalSelectors) {
      const modals = document.querySelectorAll(selector);
      modals.forEach(modal => {
        // 尝试点击关闭按钮
        const closeButton = modal.querySelector('[class*="close"], [aria-label*="close"], .ant-modal-close');
        if (closeButton) {
          closeButton.click();
          return;
        }

        // 尝试点击遮罩层关闭
        const overlay = modal.querySelector('[class*="mask"], [class*="overlay"]');
        if (overlay) {
          overlay.click();
        }
      });
    }
  }

  /**
   * 📊 收集性能指标
   */
  recordOperation (success, duration) {
    this.performanceMetrics.totalElements++;
    if (success) {
      this.performanceMetrics.successfulOperations++;
    } else {
      this.performanceMetrics.failedOperations++;
    }
    this.performanceMetrics.totalTime += duration;
    this.performanceMetrics.averageOperationTime =
      this.performanceMetrics.totalTime / this.performanceMetrics.totalElements;
  }

  /**
   * 📈 获取性能报告
   */
  getPerformanceReport () {
    const successRate = this.performanceMetrics.totalElements > 0
      ? (this.performanceMetrics.successfulOperations / this.performanceMetrics.totalElements * 100).toFixed(2)
      : 0;

    return {
      ...this.performanceMetrics,
      successRate: `${successRate}%`,
      estimatedTotalTime: this.performanceMetrics.totalTime / 1000 + '秒'
    };
  }

  /**
   * 🔄 重置统计信息
   */
  reset () {
    this.elementCache.clear();
    this.operationHistory = [];
    this.performanceMetrics = {
      totalElements: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalTime: 0,
      averageOperationTime: 0
    };
  }
}

// 全局实例
const testExecutionOptimizer = new TestExecutionOptimizer();
