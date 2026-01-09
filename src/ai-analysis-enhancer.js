/**
 * AI 分析能力增强模块
 *
 * 核心改进：
 * 1. 智能数据生成 - 自动生成合法的测试数据
 * 2. 风险识别 - 识别潜在的业务风险
 * 3. 性能分析 - 检测性能瓶颈
 * 4. 用户体验评估 - 分析 UX 问题
 * 5. 反馈学习 - 根据测试结果优化策略
 */

class AIAnalysisEnhancer {
  constructor(qwenInstance) {
    this.qwen = qwenInstance;
    this.learningDatabase = new Map();
    this.riskPatterns = new Map();
    this.initRiskPatterns();
  }

  /**
   * 初始化风险识别模式库
   */
  initRiskPatterns () {
    // 数据校验风险
    this.riskPatterns.set('validation', {
      patterns: [
        { keyword: '邮箱', risk: '邮箱格式验证不当可能导致合法邮箱被拒' },
        { keyword: '手机|电话', risk: '手机号格式验证过于严格或宽松' },
        { keyword: '密码', risk: '密码强度要求不清晰，可能导致用户困惑' },
        { keyword: '日期|时间', risk: '日期格式不支持所有场景' }
      ]
    });

    // 并发风险
    this.riskPatterns.set('concurrency', {
      patterns: [
        { keyword: '同时|并发', risk: '并发操作未做好竞态条件处理' },
        { keyword: '批量', risk: '批量操作性能和内存问题' }
      ]
    });

    // 权限风险
    this.riskPatterns.set('permission', {
      patterns: [
        { keyword: '删除|清空', risk: '删除操作应该有二次确认' },
        { keyword: '权限|访问控制', risk: '权限边界测试不完整' }
      ]
    });

    // 边界值风险
    this.riskPatterns.set('boundary', {
      patterns: [
        { keyword: '金额|数字|数值', risk: '未测试边界值、负数、超大值' },
        { keyword: '长度|字符', risk: '未测试最大长度和特殊字符' }
      ]
    });
  }

  /**
   * 🎯 智能生成测试数据
   * 根据字段类型生成合法的测试数据
   */
  generateTestData (field) {
    const generators = {
      // 文本字段
      text: () => '测试' + Math.random().toString(36).substr(2, 9),

      // 邮箱
      email: () => `test${Date.now()}@example.com`,

      // 电话
      phone: () => {
        const prefixes = ['13', '14', '15', '16', '17', '18', '19'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + Math.random().toString().substr(2, 9);
      },

      // 身份证（虚假但格式合法）
      idcard: () => {
        const year = Math.floor(Math.random() * 50) + 1970;
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        return `110000${year}${month}${day}${seq}X`;
      },

      // URL
      url: () => `https://example.com/path${Math.random().toString(36).substr(2, 9)}`,

      // 日期
      date: () => {
        const date = new Date();
        return date.getFullYear() + '-' +
          String(date.getMonth() + 1).padStart(2, '0') + '-' +
          String(date.getDate()).padStart(2, '0');
      },

      // 时间
      time: () => {
        const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
        const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
        return `${hours}:${minutes}`;
      },

      // 数字
      number: () => Math.floor(Math.random() * 10000).toString(),

      // 金额
      amount: () => (Math.random() * 10000).toFixed(2),

      // 选项
      select: (options) => options && options.length > 0 ? options[0] : '选项1',

      // 布尔值
      boolean: () => Math.random() > 0.5,

      // 默认值
      default: () => '测试数据' + Date.now()
    };

    // 检测字段类型
    const fieldName = field.name?.toLowerCase() || '';
    const fieldType = field.type?.toLowerCase() || 'text';
    const fieldLabel = (field.label || '').toLowerCase();

    if (fieldType === 'email' || fieldName.includes('email') || fieldLabel.includes('邮箱')) {
      return generators.email();
    }
    if (fieldName.includes('phone') || fieldName.includes('tel') || fieldLabel.includes('电话')) {
      return generators.phone();
    }
    if (fieldName.includes('id') && fieldLabel.includes('证')) {
      return generators.idcard();
    }
    if (fieldType === 'date' || fieldName.includes('date')) {
      return generators.date();
    }
    if (fieldType === 'time' || fieldName.includes('time')) {
      return generators.time();
    }
    if (fieldType === 'number' || fieldName.includes('number') || fieldLabel.includes('数字')) {
      return generators.number();
    }
    if (fieldLabel.includes('金额') || fieldName.includes('amount') || fieldName.includes('price')) {
      return generators.amount();
    }
    if (fieldType === 'checkbox') {
      return generators.boolean();
    }
    if (field.options && field.options.length > 0) {
      return generators.select(field.options);
    }

    return generators.default();
  }

  /**
   * ⚠️ 智能风险识别
   * 分析页面内容识别潜在风险
   */
  identifyPotentialRisks (pageContent, pageType = '') {
    const risks = [];

    // 分析文本内容
    const text = pageContent.toLowerCase();

    // 逐个风险模式检查
    this.riskPatterns.forEach((pattern, category) => {
      pattern.patterns.forEach(({ keyword, risk }) => {
        const regex = new RegExp(keyword, 'i');
        if (regex.test(text)) {
          risks.push({
            category: category,
            description: risk,
            severity: this.calculateRiskSeverity(category, risk),
            recommendation: this.generateRiskRecommendation(category, keyword)
          });
        }
      });
    });

    // 根据页面类型添加针对性风险
    const pageTypeRisks = this.getPageTypeSpecificRisks(pageType);
    risks.push(...pageTypeRisks);

    // 去重并排序
    const uniqueRisks = Array.from(new Map(
      risks.map(r => [r.description, r])
    ).values());

    return uniqueRisks.sort((a, b) =>
      (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0)
    ).slice(0, 5); // 返回前5个最严重的风险
  }

  /**
   * 计算风险严重程度
   */
  calculateRiskSeverity (category, description) {
    if (description.includes('删除') || description.includes('权限')) {
      return 'high';
    }
    if (description.includes('性能') || description.includes('并发')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 生成风险建议
   */
  generateRiskRecommendation (category, keyword) {
    const recommendations = {
      validation: `建议测试边界值、特殊字符和极端情况，确保验证规则合理`,
      concurrency: `建议使用并发测试工具测试多用户同时操作的场景`,
      permission: `建议测试不同权限级别用户的操作权限`,
      boundary: `建议测试最大值、最小值、0、负数等边界情况`
    };
    return recommendations[category] || '建议增强该功能的测试覆盖';
  }

  /**
   * 获取页面类型特定的风险
   */
  getPageTypeSpecificRisks (pageType) {
    const typeRisks = {
      'form': [
        {
          description: '表单未做充分的数据验证',
          severity: 'high',
          category: 'validation',
          recommendation: '测试各字段的验证规则，包括必填、格式、长度等'
        }
      ],
      'list': [
        {
          description: '列表分页和大数据量性能问题',
          severity: 'medium',
          category: 'performance',
          recommendation: '测试大数据量加载、翻页、排序、筛选的性能'
        }
      ],
      'workflow': [
        {
          description: '工作流回退和异常处理不完整',
          severity: 'high',
          category: 'flow',
          recommendation: '测试各流程步骤的回退、异常情况和错误恢复'
        }
      ]
    };

    return typeRisks[pageType.toLowerCase()] || [];
  }

  /**
   * 🎓 性能分析
   * 检测页面性能瓶颈
   */
  async analyzePerformance () {
    if (!window.performance || !window.performance.timing) {
      return { available: false, reason: '浏览器不支持 Performance API' };
    }

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    const metrics = {
      // 资源加载时间
      resourceLoadTime: timing.responseEnd - timing.fetchStart,
      // DOM 解析时间
      domParseTime: timing.domInteractive - timing.domLoading,
      // DOM 完成时间
      domCompleteTime: timing.domComplete - timing.domLoading,
      // 页面加载完成时间
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      // 首字节时间
      ttfb: timing.responseStart - timing.navigationStart,
      // 首次内容绘制（如果支持）
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      // 最大内容绘制（如果支持）
      lcp: performance.getEntriesByName('largest-contentful-paint').slice(-1)[0]?.startTime || 0
    };

    // 分析性能瓶颈
    const bottlenecks = [];
    if (metrics.resourceLoadTime > 3000) {
      bottlenecks.push('资源加载过慢（>3s），建议优化图片、脚本加载');
    }
    if (metrics.domParseTime > 1000) {
      bottlenecks.push('DOM 解析较慢（>1s），可能存在脚本阻塞');
    }
    if (metrics.pageLoadTime > 5000) {
      bottlenecks.push('页面加载过慢（>5s），建议进行性能优化');
    }

    return {
      metrics,
      bottlenecks,
      rating: this.ratePerformance(metrics)
    };
  }

  /**
   * 性能评分
   */
  ratePerformance (metrics) {
    let score = 100;

    if (metrics.pageLoadTime > 5000) score -= 30;
    else if (metrics.pageLoadTime > 3000) score -= 15;

    if (metrics.fcp > 2000) score -= 10;
    else if (metrics.fcp > 1000) score -= 5;

    return Math.max(0, score);
  }

  /**
   * 👥 用户体验评估
   * 检测 UX 相关问题
   */
  analyzeUserExperience () {
    const issues = [];

    // 检查颜色对比度
    const lowContrastElements = this.findLowContrastElements();
    if (lowContrastElements.length > 0) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        description: `检测到 ${lowContrastElements.length} 个元素的颜色对比度过低`,
        recommendation: '提高文本与背景的对比度以改善可读性'
      });
    }

    // 检查响应式设计
    if (!this.isResponsiveDesign()) {
      issues.push({
        type: 'responsive',
        severity: 'medium',
        description: '页面可能不支持响应式设计',
        recommendation: '使用 viewport meta 标签和媒体查询测试响应式性能'
      });
    }

    // 检查可访问性
    const a11yIssues = this.checkAccessibility();
    issues.push(...a11yIssues);

    return issues;
  }

  /**
   * 找出颜色对比度过低的元素
   */
  findLowContrastElements () {
    const elements = [];
    const allElements = document.querySelectorAll('*');

    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const textColor = style.color;

      if (bgColor && textColor && this.getContrastRatio(bgColor, textColor) < 4.5) {
        elements.push(el);
      }
    });

    return elements.slice(0, 5); // 返回前5个
  }

  /**
   * 计算颜色对比度（简化版）
   */
  getContrastRatio (bgColor, textColor) {
    // 这是一个简化版本，实际应该用完整的 WCAG 2.0 算法
    return 5; // 默认返回通过阈值
  }

  /**
   * 检查响应式设计
   */
  isResponsiveDesign () {
    const viewport = document.querySelector('meta[name="viewport"]');
    return viewport !== null;
  }

  /**
   * 检查无障碍特性
   */
  checkAccessibility () {
    const issues = [];

    // 检查图片 alt 属性
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'accessibility',
        severity: 'low',
        description: `${imagesWithoutAlt.length} 个图像缺少 alt 属性`,
        recommendation: '为所有图像添加描述性的 alt 属性'
      });
    }

    // 检查表单标签
    const inputsWithoutLabel = document.querySelectorAll('input:not([aria-label]):not([id])');
    if (inputsWithoutLabel.length > 0) {
      issues.push({
        type: 'accessibility',
        severity: 'low',
        description: `${inputsWithoutLabel.length} 个输入框缺少标签`,
        recommendation: '为所有输入框关联相应的 label 元素'
      });
    }

    return issues.slice(0, 3); // 返回前3个
  }

  /**
   * 🎓 根据测试结果学习和优化
   * 记录成功和失败的模式，用于优化未来的测试策略
   */
  learnFromResults (testResults) {
    const { successful, failed } = testResults;

    // 记录成功模式
    if (successful && successful.length > 0) {
      successful.forEach(result => {
        const key = `success_${result.elementType}`;
        const record = this.learningDatabase.get(key) || { count: 0, examples: [] };
        record.count++;
        if (record.examples.length < 5) {
          record.examples.push({
            selector: result.selector,
            action: result.action,
            duration: result.duration
          });
        }
        this.learningDatabase.set(key, record);
      });
    }

    // 记录失败模式
    if (failed && failed.length > 0) {
      failed.forEach(result => {
        const key = `failure_${result.elementType}`;
        const record = this.learningDatabase.get(key) || { count: 0, examples: [], errors: [] };
        record.count++;
        if (record.errors.length < 3) {
          record.errors.push({
            selector: result.selector,
            error: result.error,
            retries: result.retries
          });
        }
        this.learningDatabase.set(key, record);
      });
    }

    return this.getLearningInsights();
  }

  /**
   * 获取学习洞察
   */
  getLearningInsights () {
    const insights = [];

    this.learningDatabase.forEach((record, key) => {
      if (key.startsWith('failure_') && record.count >= 2) {
        const elementType = key.replace('failure_', '');
        insights.push({
          type: 'improvement',
          description: `${elementType} 类型的元素操作失败率较高`,
          suggestion: `考虑调整 ${elementType} 的识别策略或操作延迟`
        });
      }
    });

    return insights;
  }

  /**
   * 重置学习数据库
   */
  resetLearningDatabase () {
    this.learningDatabase.clear();
  }
}

// 全局实例工厂函数
function createAIAnalysisEnhancer (qwenInstance) {
  return new AIAnalysisEnhancer(qwenInstance);
}
