/**
 * 功能级测试记录器 (Feature Recorder)
 * 版本: v4.0
 * 核心职责：
 * 1. 功能级数据收集
 * 2. 操作路径记录
 * 3. 测试结果聚合
 * 4. 报告生成
 */

class FeatureRecorder {
  constructor() {
    this.features = new Map(); // 功能记录，key是功能ID
    this.operations = []; // 所有操作记录
    this.startTime = null;
    this.endTime = null;

    this.logger = this.createLogger('[功能记录器]');
  }

  /**
   * 开始记录功能测试
   */
  startFeature (featureInfo) {
    const featureId = featureInfo.id;

    const feature = {
      id: featureId,
      name: featureInfo.name,
      description: featureInfo.description || '',
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      status: 'in-progress',
      steps: [],
      operations: [],
      screenshots: [],
      errors: [],
      assertions: [],
      result: null
    };

    this.features.set(featureId, feature);

    if (!this.startTime) {
      this.startTime = Date.now();
    }

    this.logger.log(`📝 开始记录功能: ${feature.name}`);

    return feature;
  }

  /**
   * 添加功能测试步骤
   */
  addStep (featureId, step) {
    const feature = this.features.get(featureId);

    if (!feature) {
      this.logger.warn(`⚠️ 未找到功能: ${featureId}`);
      return;
    }

    const stepRecord = {
      stepId: feature.steps.length + 1,
      timestamp: Date.now(),
      action: step.action,
      description: step.description,
      target: step.target,
      status: step.status || 'executed',
      duration: step.duration || 0,
      screenshot: step.screenshot || null,
      result: step.result || null,
      error: step.error || null
    };

    feature.steps.push(stepRecord);
  }

  /**
   * 记录操作
   */
  recordOperation (featureId, operation) {
    const feature = this.features.get(featureId);

    if (!feature) {
      this.logger.warn(`⚠️ 未找到功能: ${featureId}`);
      return;
    }

    const operationRecord = {
      operationId: this.operations.length + 1,
      featureId: featureId,
      timestamp: Date.now(),
      type: operation.type, // click, input, select, submit, wait, etc.
      description: operation.description,
      element: operation.element || null,
      value: operation.value || null,
      result: operation.result || 'success',
      error: operation.error || null,
      duration: operation.duration || 0
    };

    feature.operations.push(operationRecord);
    this.operations.push(operationRecord);
  }

  /**
   * 添加截图
   */
  addScreenshot (featureId, screenshot) {
    const feature = this.features.get(featureId);

    if (!feature) {
      this.logger.warn(`⚠️ 未找到功能: ${featureId}`);
      return;
    }

    feature.screenshots.push({
      timestamp: Date.now(),
      dataUrl: screenshot,
      description: `步骤 ${feature.steps.length}`
    });
  }

  /**
   * 记录错误
   */
  recordError (featureId, error) {
    const feature = this.features.get(featureId);

    if (!feature) {
      this.logger.warn(`⚠️ 未找到功能: ${featureId}`);
      return;
    }

    feature.errors.push({
      timestamp: Date.now(),
      message: error.message || String(error),
      stack: error.stack || '',
      type: error.name || 'Error',
      step: feature.steps.length
    });
  }

  /**
   * 记录断言
   */
  recordAssertion (featureId, assertion) {
    const feature = this.features.get(featureId);

    if (!feature) {
      this.logger.warn(`⚠️ 未找到功能: ${featureId}`);
      return;
    }

    feature.assertions.push({
      timestamp: Date.now(),
      description: assertion.description,
      expected: assertion.expected,
      actual: assertion.actual,
      passed: assertion.passed,
      message: assertion.message || ''
    });
  }

  /**
   * 完成功能测试
   */
  completeFeature (featureId, result) {
    const feature = this.features.get(featureId);

    if (!feature) {
      this.logger.warn(`⚠️ 未找到功能: ${featureId}`);
      return;
    }

    feature.endTime = Date.now();
    feature.duration = feature.endTime - feature.startTime;
    feature.status = result.success ? 'passed' : (result.error ? 'failed' : 'completed');
    feature.result = result;

    // 计算断言结果
    if (feature.assertions.length > 0) {
      const passedAssertions = feature.assertions.filter(a => a.passed).length;
      feature.assertionStats = {
        total: feature.assertions.length,
        passed: passedAssertions,
        failed: feature.assertions.length - passedAssertions,
        passRate: ((passedAssertions / feature.assertions.length) * 100).toFixed(2) + '%'
      };
    }

    this.endTime = Date.now();

    const statusIcon = feature.status === 'passed' ? '✅' : '❌';
    const durationSec = (feature.duration / 1000).toFixed(2);
    this.logger.log(`${statusIcon} 功能完成: ${feature.name} (${durationSec}s)`);
  }

  /**
   * 获取功能记录
   */
  getFeatureRecord (featureId) {
    return this.features.get(featureId) || null;
  }

  /**
   * 获取所有功能记录
   */
  getAllFeatures () {
    return Array.from(this.features.values());
  }

  /**
   * 获取完整报告
   */
  getFullReport () {
    const features = this.getAllFeatures();
    const totalDuration = this.endTime ? (this.endTime - this.startTime) : 0;

    const passed = features.filter(f => f.status === 'passed').length;
    const failed = features.filter(f => f.status === 'failed').length;
    const completed = features.filter(f => f.status === 'completed').length;
    const inProgress = features.filter(f => f.status === 'in-progress').length;

    // 计算操作统计
    const operationStats = {
      total: this.operations.length,
      byType: {}
    };

    for (const op of this.operations) {
      if (!operationStats.byType[op.type]) {
        operationStats.byType[op.type] = 0;
      }
      operationStats.byType[op.type]++;
    }

    // 计算总断言数
    let totalAssertions = 0;
    let passedAssertions = 0;

    for (const feature of features) {
      if (feature.assertions) {
        totalAssertions += feature.assertions.length;
        passedAssertions += feature.assertions.filter(a => a.passed).length;
      }
    }

    const report = {
      summary: {
        sessionStartTime: new Date(this.startTime || Date.now()).toISOString(),
        sessionDuration: ((totalDuration || 0) / 1000).toFixed(2) + '秒',
        totalFeatures: features.length,
        passedFeatures: passed,
        failedFeatures: failed,
        completedFeatures: completed,
        inProgressFeatures: inProgress,
        successRate: features.length > 0 ? ((passed / features.length) * 100).toFixed(2) + '%' : 'N/A'
      },

      operationStats: operationStats,

      assertionStats: {
        total: totalAssertions,
        passed: passedAssertions,
        failed: totalAssertions - passedAssertions,
        passRate: totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(2) + '%' : 'N/A'
      },

      features: features.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        duration: (f.duration / 1000).toFixed(2) + '秒',
        stepCount: f.steps.length,
        operationCount: f.operations.length,
        assertionCount: f.assertions.length,
        errorCount: f.errors.length,
        screenshotCount: f.screenshots.length,
        assertionStats: f.assertionStats || null,
        startTime: new Date(f.startTime).toISOString(),
        endTime: f.endTime ? new Date(f.endTime).toISOString() : null
      })),

      details: {
        features: features.map(f => this.generateFeatureDetail(f)),
        operations: this.generateOperationsSummary(),
        errors: this.generateErrorsSummary()
      }
    };

    return report;
  }

  /**
   * 生成功能详情
   */
  generateFeatureDetail (feature) {
    return {
      id: feature.id,
      name: feature.name,
      description: feature.description,
      status: feature.status,
      duration: (feature.duration / 1000).toFixed(2),

      steps: feature.steps.map(s => ({
        stepId: s.stepId,
        action: s.action,
        description: s.description,
        target: s.target,
        status: s.status,
        duration: s.duration,
        error: s.error
      })),

      operations: feature.operations.map(o => ({
        type: o.type,
        description: o.description,
        result: o.result,
        error: o.error
      })),

      assertions: feature.assertions.map(a => ({
        description: a.description,
        expected: a.expected,
        actual: a.actual,
        passed: a.passed,
        message: a.message
      })),

      errors: feature.errors.map(e => ({
        message: e.message,
        type: e.type,
        step: e.step
      })),

      screenshotCount: feature.screenshots.length
    };
  }

  /**
   * 生成操作汇总
   */
  generateOperationsSummary () {
    const summary = {
      total: this.operations.length,
      byType: {},
      byStatus: {
        success: 0,
        error: 0,
        warning: 0
      }
    };

    for (const op of this.operations) {
      // 按类型统计
      if (!summary.byType[op.type]) {
        summary.byType[op.type] = [];
      }
      summary.byType[op.type].push({
        description: op.description,
        result: op.result,
        duration: op.duration
      });

      // 按状态统计
      if (op.result === 'success') {
        summary.byStatus.success++;
      } else if (op.error) {
        summary.byStatus.error++;
      } else {
        summary.byStatus.warning++;
      }
    }

    return summary;
  }

  /**
   * 生成错误汇总
   */
  generateErrorsSummary () {
    const errors = [];

    for (const feature of this.features.values()) {
      if (feature.errors && feature.errors.length > 0) {
        for (const error of feature.errors) {
          errors.push({
            feature: feature.name,
            featureId: feature.id,
            message: error.message,
            type: error.type,
            step: error.step,
            timestamp: new Date(error.timestamp).toISOString()
          });
        }
      }
    }

    return errors;
  }

  /**
   * 获取关键指标
   */
  getKeyMetrics () {
    const features = this.getAllFeatures();
    const completedFeatures = features.filter(f => f.status !== 'in-progress');

    if (completedFeatures.length === 0) {
      return null;
    }

    const avgDuration = completedFeatures.reduce((sum, f) => sum + f.duration, 0) / completedFeatures.length;
    const avgSteps = completedFeatures.reduce((sum, f) => sum + f.steps.length, 0) / completedFeatures.length;
    const avgOperations = completedFeatures.reduce((sum, f) => sum + f.operations.length, 0) / completedFeatures.length;

    const passed = completedFeatures.filter(f => f.status === 'passed').length;
    const failed = completedFeatures.filter(f => f.status === 'failed').length;

    return {
      totalFeatures: completedFeatures.length,
      passedFeatures: passed,
      failedFeatures: failed,
      passRate: ((passed / completedFeatures.length) * 100).toFixed(2) + '%',

      averageDuration: (avgDuration / 1000).toFixed(2) + '秒',
      averageSteps: avgSteps.toFixed(1),
      averageOperations: avgOperations.toFixed(1),

      totalOperations: this.operations.length,

      totalErrors: Array.from(this.features.values()).reduce((sum, f) => sum + (f.errors?.length || 0), 0),

      totalAssertions: Array.from(this.features.values()).reduce((sum, f) => sum + (f.assertions?.length || 0), 0)
    };
  }

  /**
   * 导出报告为JSON
   */
  exportAsJSON () {
    return JSON.stringify(this.getFullReport(), null, 2);
  }

  /**
   * 导出报告为HTML
   */
  exportAsHTML () {
    const report = this.getFullReport();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>功能级测试报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f8f9fa; color: #333; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #dee2e6; }
    td { padding: 12px; border-bottom: 1px solid #dee2e6; }
    tr:hover { background-color: #f8f9fa; }
    .passed { color: #28a745; font-weight: bold; }
    .failed { color: #dc3545; font-weight: bold; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .metric { display: inline-block; margin-right: 30px; }
  </style>
</head>
<body>
  <h1>功能级测试报告</h1>

  <div class="summary">
    <h2>测试概览</h2>
    <div class="metric"><strong>总功能数：</strong> ${report.summary.totalFeatures}</div>
    <div class="metric"><strong>通过：</strong> <span class="passed">${report.summary.passedFeatures}</span></div>
    <div class="metric"><strong>失败：</strong> <span class="failed">${report.summary.failedFeatures}</span></div>
    <div class="metric"><strong>成功率：</strong> <strong>${report.summary.successRate}</strong></div>
    <div class="metric"><strong>总耗时：</strong> ${report.summary.sessionDuration}</div>
  </div>

  <h2>功能测试结果</h2>
  <table>
    <tr>
      <th>功能名称</th>
      <th>描述</th>
      <th>状态</th>
      <th>耗时</th>
      <th>步骤</th>
      <th>断言</th>
      <th>错误</th>
    </tr>
    ${report.features.map(f => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td>${f.description}</td>
      <td><span class="${f.status === 'passed' ? 'passed' : 'failed'}">${f.status}</span></td>
      <td>${f.duration}</td>
      <td>${f.stepCount}</td>
      <td>${f.assertionCount}</td>
      <td>${f.errorCount}</td>
    </tr>
    `).join('')}
  </table>

  <h2>操作统计</h2>
  <div class="summary">
    <div class="metric"><strong>总操作数：</strong> ${report.operationStats.total}</div>
    ${Object.entries(report.operationStats.byType).map(([type, count]) =>
      `<div class="metric"><strong>${type}：</strong> ${count}</div>`
    ).join('')}
  </div>

  <h2>断言统计</h2>
  <div class="summary">
    <div class="metric"><strong>总断言数：</strong> ${report.assertionStats.total}</div>
    <div class="metric"><strong>通过：</strong> <span class="passed">${report.assertionStats.passed}</span></div>
    <div class="metric"><strong>失败：</strong> <span class="failed">${report.assertionStats.failed}</span></div>
    <div class="metric"><strong>成功率：</strong> <strong>${report.assertionStats.passRate}</strong></div>
  </div>
</body>
</html>
    `;
    return html;
  }

  /**
   * 清空所有记录
   */
  clear () {
    this.features.clear();
    this.operations = [];
    this.startTime = null;
    this.endTime = null;
    this.logger.log('🗑️ 所有记录已清空');
  }

  /**
   * 辅助方法
   */
  createLogger (prefix) {
    return {
      log: (msg) => console.log(`${prefix} ${msg}`),
      warn: (msg) => console.warn(`${prefix} ${msg}`),
      error: (msg, error) => console.error(`${prefix} ${msg}`, error || '')
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeatureRecorder;
}
