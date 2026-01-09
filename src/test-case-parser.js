/**
 * 测试用例解析器 v2.0
 * 用于解析和验证用户上传的JSON格式测试用例文档
 */

class TestCaseParser {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.parsedData = null;
  }

  /**
   * 解析测试用例文档
   * @param {string} fileContent - 文件内容（JSON字符串）
   * @returns {object} - { success: boolean, data: object, errors: array, warnings: array }
   */
  parse (fileContent) {
    this.errors = [];
    this.warnings = [];
    this.parsedData = null;

    try {
      // 1. 解析JSON
      const parsed = JSON.parse(fileContent);

      // 2. 验证整体结构
      this._validateStructure(parsed);

      if (this.errors.length > 0) {
        return {
          success: false,
          data: null,
          errors: this.errors,
          warnings: this.warnings
        };
      }

      // 3. 验证详细内容
      this._validateContent(parsed);

      // 4. 规范化数据
      this.parsedData = this._normalizeData(parsed);

      return {
        success: this.errors.length === 0,
        data: this.parsedData,
        errors: this.errors,
        warnings: this.warnings
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.errors.push(`JSON 格式错误: ${error.message}`);
      } else {
        this.errors.push(`解析失败: ${error.message}`);
      }

      return {
        success: false,
        data: null,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * 验证整体结构
   */
  _validateStructure (data) {
    // 检查顶级字段
    if (typeof data !== 'object' || data === null) {
      this.errors.push('根元素必须是一个对象');
      return;
    }

    // 检查必需字段
    const requiredFields = ['version', 'testName', 'targetUrl', 'testCases'];
    requiredFields.forEach(field => {
      if (!(field in data)) {
        this.errors.push(`缺少必需字段: ${field}`);
      }
    });

    // 检查版本
    if (data.version && typeof data.version !== 'string') {
      this.errors.push('version 必须是字符串');
    }

    // 检查测试名称
    if (data.testName && typeof data.testName !== 'string') {
      this.errors.push('testName 必须是字符串');
    }

    // 检查URL格式
    if (data.targetUrl) {
      if (typeof data.targetUrl !== 'string') {
        this.errors.push('targetUrl 必须是字符串');
      } else if (!this._isValidUrl(data.targetUrl)) {
        this.errors.push(`targetUrl 格式无效: ${data.targetUrl}`);
      }
    }

    // 检查testCases是否为数组
    if (data.testCases) {
      if (!Array.isArray(data.testCases)) {
        this.errors.push('testCases 必须是一个数组');
      } else if (data.testCases.length === 0) {
        this.warnings.push('testCases 数组为空，将没有测试用例执行');
      } else if (data.testCases.length > 100) {
        this.errors.push('testCases 数量不能超过100个');
      }
    }
  }

  /**
   * 验证详细内容
   */
  _validateContent (data) {
    // 验证配置对象
    if (data.config && typeof data.config === 'object') {
      this._validateConfig(data.config);
    }

    // 验证每个测试用例
    if (Array.isArray(data.testCases)) {
      data.testCases.forEach((testCase, index) => {
        this._validateTestCase(testCase, index);
      });
    }
  }

  /**
   * 验证配置对象
   */
  _validateConfig (config) {
    const validConfigKeys = ['timeout', 'retryCount', 'screenshot', 'stopOnFailure'];

    Object.keys(config).forEach(key => {
      if (!validConfigKeys.includes(key)) {
        this.warnings.push(`配置中存在未知字段: ${key}`);
      }
    });

    if ('timeout' in config) {
      if (typeof config.timeout !== 'number' || config.timeout <= 0) {
        this.errors.push('config.timeout 必须是正数');
      } else if (config.timeout > 300) {
        this.warnings.push('timeout 设置过长（>300秒），可能影响测试体验');
      }
    }

    if ('retryCount' in config) {
      if (typeof config.retryCount !== 'number' || config.retryCount < 0) {
        this.errors.push('config.retryCount 必须是非负整数');
      }
    }
  }

  /**
   * 验证单个测试用例
   */
  _validateTestCase (testCase, index) {
    const prefix = `testCases[${index}]`;

    // 检查是否为对象
    if (typeof testCase !== 'object' || testCase === null) {
      this.errors.push(`${prefix} 必须是对象`);
      return;
    }

    // 检查必需字段
    if (!testCase.id) {
      this.errors.push(`${prefix}.id 缺失`);
    } else if (typeof testCase.id !== 'string') {
      this.errors.push(`${prefix}.id 必须是字符串`);
    }

    if (!testCase.name) {
      this.errors.push(`${prefix}.name 缺失`);
    } else if (typeof testCase.name !== 'string') {
      this.errors.push(`${prefix}.name 必须是字符串`);
    }

    // 检查steps
    if (!testCase.steps) {
      this.errors.push(`${prefix}.steps 缺失`);
    } else if (!Array.isArray(testCase.steps)) {
      this.errors.push(`${prefix}.steps 必须是数组`);
    } else if (testCase.steps.length === 0) {
      this.errors.push(`${prefix}.steps 数组为空，用例无步骤`);
    } else if (testCase.steps.length > 500) {
      this.errors.push(`${prefix}.steps 步骤数超过500`);
    } else {
      // 验证每个步骤
      testCase.steps.forEach((step, stepIndex) => {
        this._validateStep(step, `${prefix}.steps[${stepIndex}]`);
      });
    }

    // 检查可选字段
    if ('enabled' in testCase && typeof testCase.enabled !== 'boolean') {
      this.errors.push(`${prefix}.enabled 必须是布尔值`);
    }

    if ('timeout' in testCase && (typeof testCase.timeout !== 'number' || testCase.timeout <= 0)) {
      this.errors.push(`${prefix}.timeout 必须是正数`);
    }
  }

  /**
   * 验证单个步骤
   */
  _validateStep (step, prefix) {
    if (typeof step !== 'object' || step === null) {
      this.errors.push(`${prefix} 必须是对象`);
      return;
    }

    if (!step.type) {
      this.errors.push(`${prefix}.type 缺失`);
      return;
    }

    if (typeof step.type !== 'string') {
      this.errors.push(`${prefix}.type 必须是字符串`);
      return;
    }

    const validTypes = [
      'click', 'input', 'select', 'hover', 'wait', 'waitForElement',
      'screenshot', 'verify', 'scroll', 'switchFrame', 'execute'
    ];

    if (!validTypes.includes(step.type)) {
      this.errors.push(`${prefix}.type 无效: "${step.type}"`);
      return;
    }

    // 根据类型验证步骤
    switch (step.type) {
      case 'click':
      case 'hover':
      case 'switchFrame':
        if (!step.selector) {
          this.errors.push(`${prefix} 缺少 selector`);
        }
        break;

      case 'input':
        if (!step.selector) {
          this.errors.push(`${prefix} 缺少 selector`);
        }
        if (!step.value) {
          this.warnings.push(`${prefix} value 为空，将输入空字符串`);
        }
        break;

      case 'select':
        if (!step.selector) {
          this.errors.push(`${prefix} 缺少 selector`);
        }
        if (!step.value) {
          this.errors.push(`${prefix} 缺少 value`);
        }
        break;

      case 'wait':
        if (!step.duration || typeof step.duration !== 'number' || step.duration <= 0) {
          this.errors.push(`${prefix} duration 必须是正数`);
        }
        break;

      case 'waitForElement':
        if (!step.selector) {
          this.errors.push(`${prefix} 缺少 selector`);
        }
        if (step.timeout && (typeof step.timeout !== 'number' || step.timeout <= 0)) {
          this.errors.push(`${prefix} timeout 必须是正数`);
        }
        break;

      case 'verify':
        if (!step.verifyType) {
          this.errors.push(`${prefix} 缺少 verifyType`);
        } else {
          this._validateVerify(step, prefix);
        }
        break;

      case 'scroll':
        if (!step.direction) {
          this.errors.push(`${prefix} 缺少 direction`);
        } else if (!['up', 'down', 'left', 'right'].includes(step.direction)) {
          this.errors.push(`${prefix} direction 无效: "${step.direction}"`);
        }
        if (!step.amount || typeof step.amount !== 'number' || step.amount <= 0) {
          this.errors.push(`${prefix} amount 必须是正数`);
        }
        break;

      case 'execute':
        if (!step.script) {
          this.errors.push(`${prefix} 缺少 script`);
        }
        break;
    }
  }

  /**
   * 验证verify步骤
   */
  _validateVerify (step, prefix) {
    const validVerifyTypes = [
      'elementExists', 'elementNotExists', 'elementVisible', 'elementHidden',
      'textContains', 'textEquals', 'attributeEquals', 'urlContains', 'urlEquals',
      'textVisible', 'elementCount'
    ];

    if (!validVerifyTypes.includes(step.verifyType)) {
      this.errors.push(`${prefix} verifyType 无效: "${step.verifyType}"`);
      return;
    }

    const requiresSelector = [
      'elementExists', 'elementNotExists', 'elementVisible', 'elementHidden',
      'textContains', 'textEquals', 'attributeEquals', 'elementCount'
    ];

    if (requiresSelector.includes(step.verifyType) && !step.selector) {
      this.errors.push(`${prefix} 需要 selector`);
    }

    const requiresExpected = ['textContains', 'textEquals', 'attributeEquals', 'urlContains', 'urlEquals', 'elementCount'];
    if (requiresExpected.includes(step.verifyType) && !step.expected) {
      this.errors.push(`${prefix} 需要 expected`);
    }

    if (step.verifyType === 'textVisible' && !step.text) {
      this.errors.push(`${prefix} 需要 text`);
    }

    if (step.verifyType === 'attributeEquals' && !step.attribute) {
      this.errors.push(`${prefix} 需要 attribute`);
    }
  }

  /**
   * 规范化数据
   */
  _normalizeData (data) {
    const normalized = {
      version: data.version || '1.0',
      testName: data.testName,
      description: data.description || '',
      targetUrl: data.targetUrl,
      config: {
        timeout: 30,
        retryCount: 1,
        screenshot: true,
        stopOnFailure: false,
        ...data.config
      },
      testCases: (data.testCases || []).map(tc => ({
        id: tc.id,
        name: tc.name,
        description: tc.description || '',
        enabled: tc.enabled !== false,
        timeout: tc.timeout || data.config?.timeout || 30,
        steps: (tc.steps || []).map(step => ({
          ...step,
          description: step.description || step.type
        }))
      }))
    };

    return normalized;
  }

  /**
   * 获取统计信息
   */
  getStatistics (data) {
    if (!data || !data.testCases) return null;

    const enabledCases = data.testCases.filter(tc => tc.enabled);
    const totalSteps = data.testCases.reduce((sum, tc) => sum + tc.steps.length, 0);
    const verifySteps = data.testCases.reduce((sum, tc) => {
      return sum + tc.steps.filter(s => s.type === 'verify').length;
    }, 0);

    return {
      totalCases: data.testCases.length,
      enabledCases: enabledCases.length,
      totalSteps: totalSteps,
      verifySteps: verifySteps,
      estimatedDuration: this._estimateDuration(data)
    };
  }

  /**
   * 估算测试持续时间
   */
  _estimateDuration (data) {
    if (!data || !data.testCases) return 0;

    let duration = 0;

    data.testCases.forEach(tc => {
      tc.steps.forEach(step => {
        switch (step.type) {
          case 'click':
          case 'input':
          case 'select':
          case 'hover':
            duration += 800; // 毫秒
            break;
          case 'wait':
          case 'waitForElement':
            duration += step.duration || step.timeout || 2000;
            break;
          case 'verify':
            duration += 200;
            break;
          case 'screenshot':
            duration += 300;
            break;
          case 'scroll':
            duration += 400;
            break;
          case 'execute':
            duration += 300;
            break;
        }

        // 添加afterWait时间
        if (step.waitAfter) {
          duration += step.waitAfter;
        }
      });
    });

    return Math.ceil(duration / 1000); // 转换为秒
  }

  /**
   * 验证URL格式
   */
  _isValidUrl (url) {
    try {
      new URL(url);
      return /^https?:\/\//.test(url);
    } catch {
      return false;
    }
  }

  /**
   * 生成错误报告
   */
  generateReport (parseResult) {
    const report = {
      status: parseResult.success ? 'SUCCESS' : 'FAILED',
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: parseResult.errors.length,
        totalWarnings: parseResult.warnings.length
      }
    };

    if (parseResult.errors.length > 0) {
      report.errors = parseResult.errors;
    }

    if (parseResult.warnings.length > 0) {
      report.warnings = parseResult.warnings;
    }

    if (parseResult.data) {
      report.statistics = this.getStatistics(parseResult.data);
      report.testName = parseResult.data.testName;
      report.targetUrl = parseResult.data.targetUrl;
    }

    return report;
  }
}

// 导出到window对象
if (typeof window !== 'undefined') {
  window.TestCaseParser = TestCaseParser;
}

// 如果是Node.js环境，导出为module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestCaseParser;
}
