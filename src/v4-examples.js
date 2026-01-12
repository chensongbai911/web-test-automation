/**
 * 智能化流程导向测试系统 v4.0 - 集成示例
 *
 * 这个文件演示如何集成所有的v4.0核心模块
 * 展示完整的测试流程和最佳实践
 */

// ============================================================================
// 示例1: 基础使用 - 启动智能化测试
// ============================================================================

async function example1_basicUsage () {
  console.log('示例1: 基础使用 - 启动智能化测试\n');

  // 第1步: 获取API密钥
  const qwenApiKey = 'your-qwen-api-key'; // 从配置获取

  // 第2步: 创建测试指挥中心
  const commander = new AITestCommander(qwenApiKey);

  // 第3步: 启动测试
  try {
    const report = await commander.startIntelligentTesting(
      window.location.href,
      '完整测试这个页面的所有功能'
    );

    // 第4步: 查看报告
    console.log('✅ 测试完成！');
    console.log('总功能数:', report.summary.totalFeatures);
    console.log('通过:', report.summary.passedFeatures);
    console.log('失败:', report.summary.failedFeatures);
    console.log('成功率:', report.summary.successRate);
    console.log('\nAI分析:', report.aiInsights);

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// ============================================================================
// 示例2: 状态监听 - 实时跟踪测试过程
// ============================================================================

async function example2_stateListening () {
  console.log('示例2: 状态监听 - 实时跟踪测试过程\n');

  const commander = new AITestCommander('your-api-key');
  const context = commander.contextEngine;

  // 监听弹框打开
  context.onStateChange((event, data, ctx) => {
    switch (event) {
      case 'modal_opened':
        console.log('🎭 弹框已打开:', data.title);
        console.log('  关闭按钮:', data.closeButtons.length, '个');
        break;

      case 'modal_closed':
        console.log('✅ 弹框已关闭');
        break;

      case 'loading_started':
        console.log('⏳ 页面加载中...');
        break;

      case 'loading_completed':
        console.log('✅ 加载完成');
        break;

      case 'task_started':
        console.log('📝 任务开始:', data.name);
        break;

      case 'task_completed':
        console.log('✅ 任务完成:', data.name, `(${data.duration}ms)`);
        break;
    }
  });

  // 启动测试
  await commander.startIntelligentTesting(window.location.href, '开始测试');
}

// ============================================================================
// 示例3: 自定义功能和流程
// ============================================================================

async function example3_customFeatureAndFlow () {
  console.log('示例3: 自定义功能和流程\n');

  const commander = new AITestCommander('your-api-key');
  const orchestrator = commander.flowOrchestrator;
  const context = commander.contextEngine;

  // 定义自定义功能
  const customFeature = {
    id: 'feature_add_user',
    name: '添加新用户',
    description: '打开添加用户弹框，填写用户信息，保存用户',
    userStory: '作为管理员，我想添加新用户，以便管理员工信息',
    priority: 10,
    triggerElement: '#btn-add-user', // 按钮ID或CSS选择器
    expectedFlow: [
      '点击"添加用户"按钮',
      '弹框打开显示表单',
      '填写用户名、邮箱、部门',
      '点击"保存"按钮',
      '弹框关闭',
      '新用户出现在列表中'
    ],
    completionCriteria: '弹框关闭，用户列表已更新'
  };

  try {
    // 生成流程
    console.log('📋 生成流程...');
    const flow = await orchestrator.generateTestFlow(customFeature);

    console.log(`✅ 流程生成完成，共${flow.steps.length}个步骤:`);
    flow.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.action}: ${step.description}`);
    });

    // 执行流程
    console.log('\n▶️ 执行流程...');
    const result = await orchestrator.executeFlow(flow, context);

    if (result.success) {
      console.log(`✅ 流程执行成功！(${(result.duration / 1000).toFixed(2)}s)`);
      console.log(`   完成步骤: ${result.completedSteps}/${result.totalSteps}`);
    } else {
      console.log('❌ 流程执行失败:', result.error);
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

// ============================================================================
// 示例4: 批量测试功能
// ============================================================================

async function example4_bulkTesting () {
  console.log('示例4: 批量测试功能\n');

  const commander = new AITestCommander('your-api-key');

  // 定义多个功能
  const features = [
    {
      id: 'add_user',
      name: '添加用户',
      description: '添加新用户到系统',
      triggerElement: '#btn-add',
      expectedFlow: ['打开弹框', '填写信息', '保存'],
      completionCriteria: '用户已保存'
    },
    {
      id: 'edit_user',
      name: '编辑用户',
      description: '编辑现有用户信息',
      triggerElement: '.btn-edit',
      expectedFlow: ['选择用户', '打开编辑弹框', '修改信息', '保存'],
      completionCriteria: '信息已更新'
    },
    {
      id: 'delete_user',
      name: '删除用户',
      description: '从系统中删除用户',
      triggerElement: '.btn-delete',
      expectedFlow: ['选择用户', '点击删除', '确认删除'],
      completionCriteria: '用户已删除'
    },
    {
      id: 'search_user',
      name: '搜索用户',
      description: '按名称搜索用户',
      triggerElement: '#search-input',
      expectedFlow: ['输入搜索词', '点击搜索', '显示结果'],
      completionCriteria: '搜索结果显示'
    }
  ];

  const orchestrator = commander.flowOrchestrator;
  const context = commander.contextEngine;

  const results = [];

  // 依次测试每个功能
  for (const feature of features) {
    console.log(`\n🎯 测试功能: ${feature.name}`);

    try {
      // 生成流程
      const flow = await orchestrator.generateTestFlow(feature);

      // 执行流程
      const result = await orchestrator.executeFlow(flow, context);

      results.push({
        featureName: feature.name,
        success: result.success,
        duration: result.duration,
        steps: result.completedSteps,
        error: result.error
      });

      console.log(result.success ? '✅ 成功' : `❌ 失败: ${result.error}`);

    } catch (error) {
      results.push({
        featureName: feature.name,
        success: false,
        error: error.message
      });
      console.log('❌ 异常:', error.message);
    }

    // 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 汇总结果
  console.log('\n\n📊 测试汇总:');
  console.log('============================================');
  const passed = results.filter(r => r.success).length;
  console.log(`总数: ${results.length}`);
  console.log(`通过: ${passed} (${(passed / results.length * 100).toFixed(1)}%)`);
  console.log(`失败: ${results.length - passed}`);
  console.log('============================================');

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.featureName}`);
  });
}

// ============================================================================
// 示例5: 获取和导出测试报告
// ============================================================================

async function example5_getAndExportReport () {
  console.log('示例5: 获取和导出测试报告\n');

  const commander = new AITestCommander('your-api-key');

  // 启动测试
  await commander.startIntelligentTesting(window.location.href, '测试');

  const recorder = commander.featureRecorder;

  // 获取完整报告
  console.log('📊 获取完整报告...');
  const fullReport = recorder.getFullReport();

  console.log('报告摘要:');
  console.log('- 功能总数:', fullReport.summary.totalFeatures);
  console.log('- 通过:', fullReport.summary.passedFeatures);
  console.log('- 失败:', fullReport.summary.failedFeatures);
  console.log('- 错误:', fullReport.summary.error);
  console.log('- 成功率:', fullReport.summary.successRate);
  console.log('- 总耗时:', fullReport.summary.totalDuration);

  // 获取关键指标
  console.log('\n📈 关键指标:');
  const metrics = recorder.getKeyMetrics();
  if (metrics) {
    console.log('- 平均耗时:', metrics.averageDuration);
    console.log('- 平均步骤数:', metrics.averageSteps);
    console.log('- 平均操作数:', metrics.averageOperations);
    console.log('- 总操作数:', metrics.totalOperations);
    console.log('- 总错误数:', metrics.totalErrors);
    console.log('- 总断言数:', metrics.totalAssertions);
  }

  // 导出为JSON
  console.log('\n💾 导出为JSON...');
  const json = recorder.exportAsJSON();
  downloadFile(json, 'test-report.json', 'application/json');

  // 导出为HTML
  console.log('💾 导出为HTML...');
  const html = recorder.exportAsHTML();
  downloadFile(html, 'test-report.html', 'text/html');

  console.log('✅ 报告已导出');
}

// ============================================================================
// 示例6: 高级状态管理和上下文使用
// ============================================================================

async function example6_advancedContextManagement () {
  console.log('示例6: 高级状态管理和上下文使用\n');

  const commander = new AITestCommander('your-api-key');
  const context = commander.contextEngine;

  // 自动监听并记录所有状态变化
  const stateChangeLog = [];

  context.onStateChange((event, data, ctx) => {
    stateChangeLog.push({
      timestamp: new Date().toISOString(),
      event: event,
      pageState: ctx.pageState,
      hasModals: ctx.hasOpenModals,
      pendingActions: ctx.pendingActionsCount
    });
  });

  // 推送自定义任务
  context.pushTask({
    name: '自定义测试任务',
    type: 'custom',
    description: '这是一个自定义任务'
  });

  // 添加任务步骤
  context.addTaskStep({
    type: 'action',
    description: '执行操作1'
  });

  context.addTaskStep({
    type: 'assertion',
    description: '验证结果1'
  });

  // 等待特定条件
  try {
    await Promise.race([
      context.waitForModalOpen(5000),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('未在5秒内打开弹框')), 5000)
      )
    ]);

    console.log('✅ 弹框已打开');

    // 获取当前上下文
    const currentContext = context.getContext();
    console.log('当前上下文:', currentContext);

    // 等待弹框关闭
    await context.waitForModalClose(5000);
    console.log('✅ 弹框已关闭');

  } catch (error) {
    console.log('⚠️', error.message);
  }

  // 完成任务
  context.completeTask({
    success: true,
    message: '任务完成'
  });

  // 查看状态变化日志
  console.log('\n📋 状态变化日志:');
  stateChangeLog.forEach(log => {
    console.log(`${log.timestamp} - ${log.event} (页面状态: ${log.pageState})`);
  });
}

// ============================================================================
// 示例7: 错误处理和恢复
// ============================================================================

async function example7_errorHandlingAndRecovery () {
  console.log('示例7: 错误处理和恢复\n');

  const commander = new AITestCommander('your-api-key');
  const orchestrator = commander.flowOrchestrator;
  const context = commander.contextEngine;

  // 定义可能失败的功能
  const riskFeature = {
    name: '风险功能测试',
    description: '测试可能失败的操作',
    triggerElement: '#risky-button',
    expectedFlow: ['点击', '等待', '验证'],
    completionCriteria: '完成'
  };

  let retryCount = 0;
  const maxRetries = 3;
  let success = false;

  while (retryCount < maxRetries && !success) {
    try {
      console.log(`\n⏱️ 尝试 #${retryCount + 1}...`);

      const flow = await orchestrator.generateTestFlow(riskFeature);
      const result = await orchestrator.executeFlow(flow, context);

      if (result.success) {
        console.log('✅ 成功！');
        success = true;
      } else {
        console.log('❌ 失败:', result.error);
        retryCount++;

        if (retryCount < maxRetries) {
          console.log(`⏳ 等待后重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 重置状态
          context.reset();
        }
      }

    } catch (error) {
      console.error('❌ 异常:', error.message);
      retryCount++;

      if (retryCount < maxRetries) {
        console.log(`⏳ 等待后重试...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        context.reset();
      }
    }
  }

  if (!success) {
    console.log(`\n❌ 在${maxRetries}次尝试后仍然失败`);
  }
}

// ============================================================================
// 示例8: 完整的端到端测试流程
// ============================================================================

async function example8_completeE2ETestFlow () {
  console.log('示例8: 完整的端到端测试流程\n');

  try {
    // 初始化
    console.log('🚀 初始化测试系统...');
    const commander = new AITestCommander('your-api-key');

    // 启动测试
    console.log('📖 启动智能化测试...');
    const report = await commander.startIntelligentTesting(
      window.location.href,
      '完整端到端测试'
    );

    // 分析结果
    console.log('\n📊 测试结果分析:');
    console.log('====================================');
    console.log('总功能数:', report.summary.totalFeatures);
    console.log('✅ 通过:', report.summary.passedFeatures);
    console.log('❌ 失败:', report.summary.failedFeatures);
    console.log('⚠️ 错误:', report.summary.error);
    console.log('成功率:', report.summary.successRate);
    console.log('====================================');

    // 详细分析
    if (report.aiInsights) {
      console.log('\n🤖 AI分析结果:');
      console.log('质量得分:', report.aiInsights.qualityScore);
      console.log('质量等级:', report.aiInsights.qualityLevel);
      console.log('概述:', report.aiInsights.qualitySummary);

      if (report.aiInsights.failureAnalysis.length > 0) {
        console.log('\n失败分析:');
        report.aiInsights.failureAnalysis.forEach(analysis => {
          console.log(`- ${analysis.feature}`);
          console.log(`  原因: ${analysis.possibleCause}`);
          console.log(`  建议: ${analysis.recommendation}`);
        });
      }

      if (report.aiInsights.riskAreas.length > 0) {
        console.log('\n风险区域:');
        report.aiInsights.riskAreas.forEach(risk => {
          console.log(`- ${risk.area} (${risk.severity})`);
          console.log(`  ${risk.risk}`);
        });
      }

      if (report.aiInsights.keyImprovements.length > 0) {
        console.log('\n改进建议:');
        report.aiInsights.keyImprovements.forEach((imp, i) => {
          console.log(`${i + 1}. ${imp}`);
        });
      }
    }

    // 导出报告
    console.log('\n💾 导出测试报告...');
    const html = commander.featureRecorder.exportAsHTML();
    downloadFile(html, 'e2e-test-report.html', 'text/html');

    console.log('\n✅ 完整端到端测试流程完成！');

  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 下载文件
 */
function downloadFile (content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * 延迟执行
 */
function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 显示通知
 */
function showNotification (message, type = 'info') {
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  console.log(`%c${message}`, `color: ${colors[type] || colors.info}; font-weight: bold;`);
}

// ============================================================================
// 使用说明
// ============================================================================

/*

如何使用这些示例:

1. 在浏览器控制台中运行:
   await example1_basicUsage();

2. 或在你的代码中调用:
   <button onclick="example1_basicUsage()">启动测试</button>

3. 每个示例都是独立的，可以单独使用

4. 实际使用时，替换 'your-api-key' 为真实的Qwen API密钥

*/

// ============================================================================
// 导出（如果在模块化环境中）
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    example1_basicUsage,
    example2_stateListening,
    example3_customFeatureAndFlow,
    example4_bulkTesting,
    example5_getAndExportReport,
    example6_advancedContextManagement,
    example7_errorHandlingAndRecovery,
    example8_completeE2ETestFlow
  };
}
