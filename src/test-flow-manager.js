/**
 * 测试流程管理器 - 统一管理"分析→规划→执行→报告"完整流程
 *
 * 核心流程：
 * 1. 前置分析阶段 - 启动测试前自动分析页面
 * 2. 动态规划阶段 - 根据分析结果生成测试计划
 * 3. 实时执行阶段 - 按计划执行并实时反馈
 * 4. 后处理阶段 - 生成报告并建议优化
 */

class TestFlowManager {
  constructor() {
    this.state = {
      currentPhase: 'idle', // idle -> analyzing -> planning -> executing -> reporting
      pageAnalysis: null,
      testPlan: null,
      testResults: null,
      executionStats: {
        startTime: null,
        endTime: null,
        totalElements: 0,
        testedElements: 0,
        successElements: 0,
        failedElements: 0,
        apiCalls: 0,
        apiErrors: 0
      }
    };
    this.listeners = new Map();
    this.qwen = null;
  }

  /**
   * 初始化管理器
   */
  async init (qwenApiKey) {
    if (qwenApiKey && typeof QwenIntegration !== 'undefined') {
      this.qwen = new QwenIntegration(qwenApiKey);
      console.log('[流程管理器] ✅ Qwen 已就绪');
    } else {
      console.log('[流程管理器] ⚠️ Qwen 未配置');
    }
  }

  /**
   * 注册事件监听器
   */
  on (event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 触发事件
   */
  emit (event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[流程管理器] 事件 ${event} 处理失败:`, error);
        }
      });
    }
  }

  /**
   * 🔵 第一阶段：前置分析 - 在测试前自动分析页面
   */
  async analyzePageBeforeTest (pageContext) {
    console.log('[流程管理器] 🔍 进入前置分析阶段...');
    this.setPhase('analyzing');
    this.emit('phase-change', 'analyzing');

    try {
      const analysis = {
        url: pageContext.url,
        title: pageContext.title,
        timestamp: new Date().toISOString(),
        pageType: null,
        businessContext: null,
        complexity: 'unknown',
        estimatedDuration: null,
        elements: pageContext.elements || {},
        warnings: [],
        recommendations: []
      };

      // 如果 Qwen 可用，进行智能分析
      if (this.qwen) {
        console.log('[流程管理器] 🤖 使用 AI 进行智能分析...');
        const aiAnalysis = await this.qwen.analyzePage(
          pageContext.html,
          { url: pageContext.url, title: pageContext.title }
        );

        if (aiAnalysis) {
          try {
            const parsed = JSON.parse(aiAnalysis);
            analysis.pageType = parsed.pageType;
            analysis.businessContext = parsed.businessContext;
            analysis.complexity = parsed.complexity || 'moderate';
            analysis.estimatedDuration = parsed.estimatedDuration || 60;
            analysis.recommendations = parsed.recommendations || [];
            analysis.warnings = parsed.warnings || [];
          } catch (e) {
            console.warn('[流程管理器] AI 分析结果解析失败:', e);
            // 使用规则引擎进行基础分析
            this.performBasicAnalysis(analysis, pageContext);
          }
        }
      } else {
        // 使用规则引擎进行基础分析
        this.performBasicAnalysis(analysis, pageContext);
      }

      this.state.pageAnalysis = analysis;
      this.emit('analysis-complete', analysis);
      return analysis;
    } catch (error) {
      console.error('[流程管理器] 分析失败:', error);
      this.emit('analysis-error', error);
      throw error;
    }
  }

  /**
   * 基础分析规则引擎
   */
  performBasicAnalysis (analysis, pageContext) {
    const elements = pageContext.elements || {};

    // 计算复杂度
    const totalElements = Object.values(elements).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    if (totalElements > 50) {
      analysis.complexity = 'complex';
      analysis.estimatedDuration = 120;
    } else if (totalElements > 20) {
      analysis.complexity = 'moderate';
      analysis.estimatedDuration = 60;
    } else {
      analysis.complexity = 'simple';
      analysis.estimatedDuration = 30;
    }

    // 检测页面类型
    if (elements.forms && elements.forms.length > 0) {
      analysis.pageType = '表单页面';
    } else if (elements.tables && elements.tables.length > 0) {
      analysis.pageType = '列表页面';
    } else if (elements.buttons && elements.buttons.length > 10) {
      analysis.pageType = '功能操作页面';
    } else {
      analysis.pageType = '内容展示页面';
    }

    // 生成建议
    if (elements.modals && elements.modals.length > 0) {
      analysis.recommendations.push('页面包含弹框，建议仔细测试弹框交互');
    }
    if (totalElements > 100) {
      analysis.warnings.push('页面元素众多，建议将测试分批进行');
    }
  }

  /**
   * 🟢 第二阶段：动态规划 - 根据分析生成测试计划
   */
  async generateTestPlan (analysis, testConfig) {
    console.log('[流程管理器] 📋 进入规划阶段...');
    this.setPhase('planning');
    this.emit('phase-change', 'planning');

    try {
      const plan = {
        timestamp: new Date().toISOString(),
        analysis: analysis,
        configuration: testConfig,
        strategy: null,
        steps: [],
        priorityGroups: [],
        estimatedDuration: analysis.estimatedDuration || 60,
        riskAssessment: null
      };

      if (this.qwen) {
        console.log('[流程管理器] 🤖 使用 AI 生成智能测试计划...');
        const aiPlan = await this.qwen.generateSmartTestPlan({
          url: analysis.url,
          title: analysis.title,
          pageType: analysis.pageType,
          businessContext: analysis.businessContext,
          complexity: analysis.complexity,
          elements: analysis.elements
        });

        if (aiPlan) {
          try {
            const parsed = JSON.parse(aiPlan);
            plan.strategy = parsed.testStrategy;
            plan.steps = parsed.testSteps || [];
            plan.riskAssessment = parsed.potentialIssues;
            // 优先级分组
            plan.priorityGroups = this.groupByPriority(plan.steps);
          } catch (e) {
            console.warn('[流程管理器] AI 计划解析失败:', e);
            plan.steps = this.generateBasicPlan(analysis, testConfig);
          }
        }
      } else {
        plan.steps = this.generateBasicPlan(analysis, testConfig);
      }

      this.state.testPlan = plan;
      this.emit('plan-complete', plan);
      return plan;
    } catch (error) {
      console.error('[流程管理器] 计划生成失败:', error);
      this.emit('plan-error', error);
      throw error;
    }
  }

  /**
   * 生成基础测试计划
   */
  generateBasicPlan (analysis, testConfig) {
    const steps = [];
    const elements = analysis.elements || {};

    // 按类型和优先级生成步骤
    const order = ['forms', 'buttons', 'links', 'selects', 'inputs'];

    let stepId = 1;
    for (const type of order) {
      if (elements[type] && Array.isArray(elements[type])) {
        elements[type].forEach((element, index) => {
          steps.push({
            stepId: stepId++,
            action: this.getActionForType(type),
            target: element.text || element.value || element.name || `${type} #${index}`,
            type: type,
            priority: this.calculatePriority(type, index),
            expectedResult: `${type} 操作应该成功并记录结果`
          });
        });
      }
    }

    return steps;
  }

  /**
   * 获取元素类型对应的操作
   */
  getActionForType (type) {
    const actions = {
      buttons: 'click',
      links: 'navigate',
      forms: 'fill-and-submit',
      selects: 'select',
      inputs: 'fill'
    };
    return actions[type] || 'interact';
  }

  /**
   * 计算优先级
   */
  calculatePriority (type, index) {
    const typePriority = {
      forms: 9,
      buttons: 8,
      selects: 7,
      inputs: 6,
      links: 5
    };
    return (typePriority[type] || 5) - Math.min(index * 0.1, 2);
  }

  /**
   * 按优先级分组
   */
  groupByPriority (steps) {
    const groups = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    steps.forEach(step => {
      const priority = step.priority || 5;
      if (priority >= 8) {
        groups.critical.push(step);
      } else if (priority >= 6) {
        groups.high.push(step);
      } else if (priority >= 4) {
        groups.medium.push(step);
      } else {
        groups.low.push(step);
      }
    });

    return groups;
  }

  /**
   * 🔴 第三阶段：执行前准备 - 通知测试执行器
   */
  async prepareForExecution (testPlan) {
    console.log('[流程管理器] ⚙️ 准备执行...');
    this.setPhase('executing');
    this.emit('phase-change', 'executing');

    this.state.executionStats.startTime = Date.now();
    this.state.executionStats.totalElements = testPlan.steps.length;

    this.emit('execution-start', {
      plan: testPlan,
      estimatedDuration: testPlan.estimatedDuration
    });
  }

  /**
   * 更新执行进度
   */
  updateExecutionProgress (progress) {
    this.state.executionStats.testedElements = progress.testedCount || 0;
    this.state.executionStats.successElements = progress.successCount || 0;
    this.state.executionStats.failedElements = progress.failureCount || 0;
    this.state.executionStats.apiCalls = progress.apiCount || 0;
    this.state.executionStats.apiErrors = progress.apiErrorCount || 0;

    this.emit('execution-progress', {
      stats: this.state.executionStats,
      progress: progress
    });
  }

  /**
   * 🟡 第四阶段：执行完成 - 生成报告并优化建议
   */
  async finalizeAndReport (testResults) {
    console.log('[流程管理器] 📊 进入报告阶段...');
    this.setPhase('reporting');
    this.emit('phase-change', 'reporting');

    this.state.executionStats.endTime = Date.now();
    const duration = (this.state.executionStats.endTime - this.state.executionStats.startTime) / 1000;

    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          duration: duration,
          totalElements: this.state.executionStats.totalElements,
          testedElements: this.state.executionStats.testedElements,
          successRate: this.state.executionStats.testedElements > 0
            ? (this.state.executionStats.successElements / this.state.executionStats.testedElements * 100).toFixed(2) + '%'
            : '0%',
          failedElements: this.state.executionStats.failedElements,
          apiCalls: this.state.executionStats.apiCalls,
          apiErrors: this.state.executionStats.apiErrors
        },
        analysis: this.state.pageAnalysis,
        plan: this.state.testPlan,
        results: testResults,
        recommendations: [],
        nextSteps: []
      };

      // 如果 Qwen 可用，生成 AI 优化建议
      if (this.qwen) {
        console.log('[流程管理器] 🤖 生成 AI 优化建议...');
        const aiRecommendations = await this.qwen.analyzeTestResults(report);
        if (aiRecommendations) {
          try {
            const parsed = JSON.parse(aiRecommendations);
            report.recommendations = parsed.recommendations || [];
            report.nextSteps = parsed.nextSteps || [];
          } catch (e) {
            console.warn('[流程管理器] AI 建议解析失败');
          }
        }
      }

      // 生成基础建议
      if (report.recommendations.length === 0) {
        report.recommendations = this.generateBasicRecommendations(report);
      }

      this.state.testResults = report;
      this.setPhase('completed');
      this.emit('report-complete', report);
      return report;
    } catch (error) {
      console.error('[流程管理器] 报告生成失败:', error);
      this.emit('report-error', error);
      throw error;
    }
  }

  /**
   * 生成基础建议
   */
  generateBasicRecommendations (report) {
    const recommendations = [];
    const successRate = parseFloat(report.summary.successRate);

    if (successRate < 80) {
      recommendations.push('成功率较低，建议检查页面结构或测试配置');
    }
    if (report.summary.apiErrors > 0) {
      recommendations.push(`检测到 ${report.summary.apiErrors} 个 API 错误，建议检查后端服务`);
    }
    if (report.summary.duration > (this.state.testPlan?.estimatedDuration || 60) * 1.5) {
      recommendations.push('测试耗时超出预期，建议优化测试间隔或页面性能');
    }

    return recommendations;
  }

  /**
   * 设置当前阶段
   */
  setPhase (phase) {
    this.state.currentPhase = phase;
  }

  /**
   * 获取当前状态
   */
  getState () {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * 重置状态
   */
  reset () {
    this.state = {
      currentPhase: 'idle',
      pageAnalysis: null,
      testPlan: null,
      testResults: null,
      executionStats: {
        startTime: null,
        endTime: null,
        totalElements: 0,
        testedElements: 0,
        successElements: 0,
        failedElements: 0,
        apiCalls: 0,
        apiErrors: 0
      }
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestFlowManager;
}
