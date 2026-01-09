/**
 * 自定义测试用例执行器
 * 用于执行用户上传的自定义测试用例
 */

class CustomTestExecutor {
  constructor() {
    this.currentTestCase = null;
    this.currentStepIndex = 0;
    this.results = {
      testCases: [],
      stats: {
        totalCases: 0,
        passedCases: 0,
        failedCases: 0,
        totalSteps: 0,
        passedSteps: 0,
        failedSteps: 0,
        startTime: new Date().toISOString(),
        endTime: null
      }
    };
  }

  /**
   * 执行测试用例集合
   */
  async executeTestCases (testCases) {
    console.log('[CustomTestExecutor] 开始执行测试套件:', testCases.testName);
    this.results.stats.totalCases = testCases.testCases.length;

    // 执行每个测试用例
    for (let caseIndex = 0; caseIndex < testCases.testCases.length; caseIndex++) {
      const testCase = testCases.testCases[caseIndex];

      // 跳过禁用的测试用例
      if (!testCase.enabled) {
        console.log(`[CustomTestExecutor] 跳过禁用的测试用例: ${testCase.id}`);
        continue;
      }

      this.currentTestCase = testCase;
      this.currentStepIndex = 0;

      const caseResult = {
        id: testCase.id,
        name: testCase.name,
        description: testCase.description,
        status: 'passed',
        startTime: new Date().toISOString(),
        endTime: null,
        steps: [],
        errors: []
      };

      try {
        await this.executeTestCase(testCase);
        caseResult.status = 'passed';
        this.results.stats.passedCases++;
      } catch (error) {
        caseResult.status = 'failed';
        caseResult.errors.push(error.message);
        this.results.stats.failedCases++;
      }

      caseResult.endTime = new Date().toISOString();
      this.results.testCases.push(caseResult);

      // 发送进度更新
      this.sendProgressUpdate();
    }

    this.results.stats.endTime = new Date().toISOString();
    return this.results;
  }

  /**
   * 执行单个测试用例
   */
  async executeTestCase (testCase) {
    console.log(`[CustomTestExecutor] 执行测试用例: ${testCase.id} - ${testCase.name}`);

    for (let i = 0; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];
      this.currentStepIndex = i;

      const stepResult = {
        index: i,
        type: step.type,
        description: step.description,
        status: 'passed',
        error: null,
        duration: 0
      };

      const startTime = Date.now();

      try {
        await this.executeStep(step);
        stepResult.status = 'passed';
        this.results.stats.passedSteps++;
      } catch (error) {
        stepResult.status = 'failed';
        stepResult.error = error.message;
        this.results.stats.failedSteps++;

        // 如果配置了stopOnFailure，则停止测试
        if (testCase.stopOnFailure) {
          throw new Error(`测试用例中止: ${error.message}`);
        }
      }

      stepResult.duration = Date.now() - startTime;
      this.results.testCases[this.results.testCases.length - 1].steps.push(stepResult);

      this.results.stats.totalSteps++;
    }
  }

  /**
   * 执行单个步骤
   */
  async executeStep (step) {
    console.log(`[CustomTestExecutor] 执行步骤: ${step.type} - ${step.description}`);

    switch (step.type) {
      case 'click':
        return this.stepClick(step);
      case 'input':
        return this.stepInput(step);
      case 'select':
        return this.stepSelect(step);
      case 'hover':
        return this.stepHover(step);
      case 'wait':
        return this.stepWait(step);
      case 'waitForElement':
        return this.stepWaitForElement(step);
      case 'screenshot':
        return this.stepScreenshot(step);
      case 'verify':
        return this.stepVerify(step);
      case 'scroll':
        return this.stepScroll(step);
      case 'switchFrame':
        return this.stepSwitchFrame(step);
      case 'execute':
        return this.stepExecute(step);
      default:
        throw new Error(`未知的步骤类型: ${step.type}`);
    }
  }

  /**
   * 点击元素
   */
  async stepClick (step) {
    const element = document.querySelector(step.selector);
    if (!element) {
      throw new Error(`找不到元素: ${step.selector}`);
    }

    element.click();

    if (step.waitAfter) {
      await this.wait(step.waitAfter);
    } else {
      await this.wait(500);
    }
  }

  /**
   * 输入文本
   */
  async stepInput (step) {
    const element = document.querySelector(step.selector);
    if (!element) {
      throw new Error(`找不到元素: ${step.selector}`);
    }

    if (step.clearFirst) {
      element.value = '';
    }

    element.focus();
    element.value = step.value || '';

    // 触发input事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    await this.wait(300);
  }

  /**
   * 选择下拉框
   */
  async stepSelect (step) {
    const element = document.querySelector(step.selector);
    if (!element) {
      throw new Error(`找不到元素: ${step.selector}`);
    }

    if (element.tagName === 'SELECT') {
      // 标准的select元素
      element.value = step.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // 可能是自定义的下拉框，尝试查找选项
      const option = Array.from(element.querySelectorAll('[role="option"], option'))
        .find(opt => opt.textContent === step.value || opt.value === step.value);

      if (option) {
        option.click();
      } else {
        throw new Error(`找不到选项: ${step.value}`);
      }
    }

    await this.wait(500);
  }

  /**
   * 鼠标悬停
   */
  async stepHover (step) {
    const element = document.querySelector(step.selector);
    if (!element) {
      throw new Error(`找不到元素: ${step.selector}`);
    }

    const event = new MouseEvent('mouseover', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);

    if (step.waitAfter) {
      await this.wait(step.waitAfter);
    } else {
      await this.wait(1000);
    }
  }

  /**
   * 等待指定时间
   */
  async stepWait (step) {
    await this.wait(step.duration);
  }

  /**
   * 等待元素出现
   */
  async stepWaitForElement (step) {
    const timeout = step.timeout || 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(step.selector);
      if (element && element.offsetParent !== null) {
        return;
      }
      await this.wait(100);
    }

    throw new Error(`元素未在 ${timeout}ms 内出现: ${step.selector}`);
  }

  /**
   * 截图
   */
  async stepScreenshot (step) {
    // 截图功能需要特殊权限，这里仅记录
    console.log(`[CustomTestExecutor] 截图: ${step.filename}`);
    // 实际截图功能可以通过content-script扩展实现
    await this.wait(300);
  }

  /**
   * 验证（断言）
   */
  async stepVerify (step) {
    const verifyType = step.verifyType;

    switch (verifyType) {
      case 'elementExists':
        if (!document.querySelector(step.selector)) {
          throw new Error(`验证失败: 元素不存在: ${step.selector}`);
        }
        break;

      case 'elementNotExists':
        if (document.querySelector(step.selector)) {
          throw new Error(`验证失败: 元素存在: ${step.selector}`);
        }
        break;

      case 'elementVisible':
        {
          const element = document.querySelector(step.selector);
          if (!element || element.offsetParent === null) {
            throw new Error(`验证失败: 元素不可见: ${step.selector}`);
          }
        }
        break;

      case 'elementHidden':
        {
          const element = document.querySelector(step.selector);
          if (element && element.offsetParent !== null) {
            throw new Error(`验证失败: 元素可见: ${step.selector}`);
          }
        }
        break;

      case 'textContains':
        {
          const element = document.querySelector(step.selector);
          if (!element || !element.textContent.includes(step.expected)) {
            throw new Error(`验证失败: 文本不包含 "${step.expected}"`);
          }
        }
        break;

      case 'textEquals':
        {
          const element = document.querySelector(step.selector);
          if (!element || element.textContent.trim() !== step.expected.trim()) {
            throw new Error(`验证失败: 文本不相等，期望 "${step.expected}"，实际 "${element.textContent}"`);
          }
        }
        break;

      case 'attributeEquals':
        {
          const element = document.querySelector(step.selector);
          if (!element || element.getAttribute(step.attribute) !== step.expected) {
            throw new Error(`验证失败: 属性 ${step.attribute} 不等于 "${step.expected}"`);
          }
        }
        break;

      case 'urlContains':
        if (!window.location.href.includes(step.expected)) {
          throw new Error(`验证失败: URL 不包含 "${step.expected}"`);
        }
        break;

      case 'urlEquals':
        if (window.location.href !== step.expected) {
          throw new Error(`验证失败: URL 不相等，期望 "${step.expected}"，实际 "${window.location.href}"`);
        }
        break;

      case 'textVisible':
        {
          const found = Array.from(document.querySelectorAll('*'))
            .some(el => el.textContent.includes(step.text) && el.offsetParent !== null);

          if (!found) {
            throw new Error(`验证失败: 文本不可见: "${step.text}"`);
          }
        }
        break;

      case 'elementCount':
        {
          const count = document.querySelectorAll(step.selector).length;
          if (count !== parseInt(step.expected)) {
            throw new Error(`验证失败: 元素数量不等于 ${step.expected}，实际 ${count}`);
          }
        }
        break;

      default:
        throw new Error(`未知的验证类型: ${verifyType}`);
    }
  }

  /**
   * 滚动
   */
  async stepScroll (step) {
    const amount = step.amount || 0;

    switch (step.direction) {
      case 'up':
        window.scrollBy(0, -amount);
        break;
      case 'down':
        window.scrollBy(0, amount);
        break;
      case 'left':
        window.scrollBy(-amount, 0);
        break;
      case 'right':
        window.scrollBy(amount, 0);
        break;
    }

    await this.wait(500);
  }

  /**
   * 切换iframe
   */
  async stepSwitchFrame (step) {
    const frame = document.querySelector(step.selector);
    if (!frame) {
      throw new Error(`找不到iframe: ${step.selector}`);
    }

    // 注意: 内容脚本无法直接访问iframe内容，这是浏览器安全限制
    console.warn('[CustomTestExecutor] 警告: iframe切换可能受限于浏览器安全策略');
    await this.wait(500);
  }

  /**
   * 执行JavaScript
   */
  async stepExecute (step) {
    try {
      const result = eval(`(${step.script})`);
      console.log('[CustomTestExecutor] 脚本执行结果:', result);
      await this.wait(300);
    } catch (error) {
      throw new Error(`JavaScript执行错误: ${error.message}`);
    }
  }

  /**
   * 等待函数
   */
  wait (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 发送进度更新到popup
   */
  sendProgressUpdate () {
    const stats = this.results.stats;
    const total = stats.totalCases || 1;
    const progress = Math.round((this.results.testCases.length / total) * 100);

    chrome.runtime.sendMessage({
      action: 'updateTestStats',
      testedCount: this.results.testCases.length,
      successCount: stats.passedCases,
      failureCount: stats.failedCases,
      apiErrorCount: stats.failedSteps,
      progress: progress
    }).catch(() => {
      // popup可能已关闭
    });
  }

  /**
   * 获取测试结果
   */
  getResults () {
    return this.results;
  }
}

// 导出到window
if (typeof window !== 'undefined') {
  window.CustomTestExecutor = CustomTestExecutor;
}
