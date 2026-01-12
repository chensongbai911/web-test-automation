/**
 * E2E场景流水追踪器
 * 记录用户操作路径、决策点、时间线，用于生成详细的E2E报告
 */

class E2EScenarioTracker {
  constructor() {
    this.scenario = {
      startTime: Date.now(),
      steps: [],
      decisions: [],
      summary: {
        totalSteps: 0,
        successSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        criticalFailures: 0,
        duration: 0
      }
    };
  }

  /**
   * 记录一个操作步骤
   * @param {Object} step - 步骤信息
   * @param {string} step.action - 操作类型 (click, input, select, navigate 等)
   * @param {string} step.target - 目标元素描述
   * @param {string} step.framework - UI框架 (element-plus, ant-design-vue 等)
   * @param {string} step.componentType - 组件类型 (select, datepicker, button 等)
   * @param {boolean} step.success - 是否成功
   * @param {string} step.error - 错误信息（如果有）
   * @param {*} step.beforeValue - 交互前的值
   * @param {*} step.afterValue - 交互后的值
   * @param {number} step.duration - 操作耗时（毫秒）
   * @param {Array} step.apiCalls - 触发的API调用列表
   */
  recordStep(step) {
    const record = {
      id: this.scenario.steps.length + 1,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.scenario.startTime,
      action: step.action || 'unknown',
      target: step.target || '',
      framework: step.framework || null,
      componentType: step.componentType || null,
      success: step.success !== undefined ? step.success : true,
      error: step.error || null,
      beforeValue: step.beforeValue !== undefined ? step.beforeValue : null,
      afterValue: step.afterValue !== undefined ? step.afterValue : null,
      valueChanged: step.beforeValue !== step.afterValue,
      duration: step.duration || 0,
      apiCalls: step.apiCalls || [],
      screenshot: step.screenshot || null, // 可选：步骤截图
      notes: step.notes || ''
    };

    this.scenario.steps.push(record);

    // 更新统计
    this.scenario.summary.totalSteps++;
    if (record.success) {
      this.scenario.summary.successSteps++;
    } else {
      this.scenario.summary.failedSteps++;
      if (this.isStepCritical(record)) {
        this.scenario.summary.criticalFailures++;
      }
    }

    return record;
  }

  /**
   * 记录一个决策点（AI决策或测试策略调整）
   * @param {Object} decision - 决策信息
   */
  recordDecision(decision) {
    const decisionRecord = {
      id: this.scenario.decisions.length + 1,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.scenario.startTime,
      type: decision.type || 'strategy', // strategy, heal, skip, continue
      reason: decision.reason || '',
      action: decision.action || '',
      context: decision.context || {},
      result: decision.result || null
    };

    this.scenario.decisions.push(decisionRecord);
    return decisionRecord;
  }

  /**
   * 判断步骤是否为关键失败
   * @private
   */
  isStepCritical(step) {
    const criticalActions = ['navigate', 'submit', 'login'];
    return criticalActions.includes(step.action);
  }

  /**
   * 获取完整场景数据
   */
  getScenario() {
    this.scenario.summary.duration = Date.now() - this.scenario.startTime;
    return { ...this.scenario };
  }

  /**
   * 获取按类型分组的步骤
   */
  getStepsByType() {
    const grouped = {};
    this.scenario.steps.forEach(step => {
      const type = step.componentType || step.action;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(step);
    });
    return grouped;
  }

  /**
   * 获取按框架分组的步骤
   */
  getStepsByFramework() {
    const grouped = {};
    this.scenario.steps
      .filter(s => s.framework)
      .forEach(step => {
        const fw = step.framework;
        if (!grouped[fw]) grouped[fw] = [];
        grouped[fw].push(step);
      });
    return grouped;
  }

  /**
   * 生成关键路径（失败和关键步骤）
   */
  generateCriticalPath() {
    return this.scenario.steps.filter(step => {
      return !step.success || this.isStepCritical(step);
    });
  }

  /**
   * 获取操作耗时分析
   */
  getPerformanceAnalysis() {
    if (this.scenario.steps.length === 0) {
      return { avgDuration: 0, maxDuration: 0, minDuration: 0, total: 0 };
    }

    const durations = this.scenario.steps.map(s => s.duration);
    const total = durations.reduce((a, b) => a + b, 0);
    const avg = total / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    return { avgDuration: Math.round(avg), maxDuration: max, minDuration: min, total };
  }

  /**
   * 获取API调用统计
   */
  getAPIStats() {
    const stats = {
      totalCalls: 0,
      byMethod: {},
      byStatus: {},
      failures: []
    };

    this.scenario.steps.forEach(step => {
      if (step.apiCalls && Array.isArray(step.apiCalls)) {
        step.apiCalls.forEach(api => {
          stats.totalCalls++;
          const method = api.method || 'UNKNOWN';
          stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;

          const status = api.status || 'unknown';
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

          if (api.status && api.status >= 400) {
            stats.failures.push({
              method,
              url: api.url,
              status: api.status,
              stepId: step.id
            });
          }
        });
      }
    });

    return stats;
  }

  /**
   * 生成场景总结（用于报告）
   */
  generateSummary() {
    const scenario = this.getScenario();
    const perf = this.getPerformanceAnalysis();
    const apiStats = this.getAPIStats();
    const criticalPath = this.generateCriticalPath();

    return {
      metadata: {
        startTime: new Date(scenario.startTime).toISOString(),
        duration: Math.round(scenario.summary.duration / 1000) + 's',
        totalSteps: scenario.summary.totalSteps,
        successRate: scenario.summary.totalSteps > 0
          ? ((scenario.summary.successSteps / scenario.summary.totalSteps) * 100).toFixed(1) + '%'
          : '0%'
      },
      summary: scenario.summary,
      performance: perf,
      apiStats: apiStats,
      criticalPath: criticalPath,
      steps: scenario.steps,
      decisions: scenario.decisions
    };
  }

  /**
   * 重置场景
   */
  reset() {
    this.scenario = {
      startTime: Date.now(),
      steps: [],
      decisions: [],
      summary: {
        totalSteps: 0,
        successSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        criticalFailures: 0,
        duration: 0
      }
    };
  }
}

// 导出全局实例
window.e2eTracker = window.e2eTracker || new E2EScenarioTracker();

// 记录日志
console.log('[E2E追踪器] E2EScenarioTracker已初始化');
