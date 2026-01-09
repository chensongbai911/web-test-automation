/**
 * 调试测试卡住问题的诊断脚本
 * 在控制台粘贴此代码并执行
 */

(function () {
  console.log('\n🔍 === 开始诊断测试卡住问题 ===\n');

  // 1. 检查全局状态
  console.log('📊 全局状态检查:');
  console.log('  window.testingState:', window.testingState);
  console.log('  window.isTestingInProgress:', window.isTestingInProgress);
  console.log('  window.currentTestIndex:', window.currentTestIndex);

  // 2. 检查测试工具
  console.log('\n🔧 工具初始化状态:');
  console.log('  enhancedReporter:', !!window.enhancedReporter);
  console.log('  aiFormAnalyzer:', !!window.aiFormAnalyzer);
  console.log('  complexFormHandler:', !!window.complexFormHandler);
  console.log('  aiTestOrchestrator:', !!window.aiTestOrchestrator);

  // 3. 检查页面元素
  console.log('\n📄 页面元素检查:');
  const forms = document.querySelectorAll('form');
  const buttons = document.querySelectorAll('button');
  const inputs = document.querySelectorAll('input, textarea, select');
  console.log('  表单数量:', forms.length);
  console.log('  按钮数量:', buttons.length);
  console.log('  输入框数量:', inputs.length);

  // 4. 检查是否有弹窗
  console.log('\n🪟 弹窗检查:');
  const modals = document.querySelectorAll('.modal, .el-dialog, .ant-modal, [role="dialog"]');
  console.log('  弹窗数量:', modals.length);
  if (modals.length > 0) {
    modals.forEach((modal, i) => {
      const visible = modal.offsetParent !== null;
      console.log(`  弹窗${i + 1}:`, visible ? '可见' : '隐藏', modal.className);
    });
  }

  // 5. 检查最后的测试报告
  console.log('\n📋 测试报告检查:');
  chrome.storage.local.get(['lastTestReport', 'testingInProgress'], (result) => {
    console.log('  testingInProgress:', result.testingInProgress);
    if (result.lastTestReport) {
      console.log('  最后测试时间:', result.lastTestReport.timestamp);
      console.log('  测试结果:', result.lastTestReport.results);
    } else {
      console.log('  无测试报告');
    }
  });

  // 6. 检查异步任务
  console.log('\n⏱️ 异步任务检查:');
  console.log('  setTimeout 队列:', 'Chrome不提供直接访问，请检查Network标签');
  console.log('  Promise 状态:', 'Chrome不提供直接访问，请检查调用栈');

  // 7. 检查控制台错误
  console.log('\n❌ 错误检查:');
  console.log('  请查看控制台是否有红色错误信息');
  console.log('  特别关注: ReferenceError, TypeError, Network errors');

  // 8. 检查 FloatingBall
  console.log('\n⚽ FloatingBall 状态:');
  const floatingBall = document.querySelector('.floating-ball');
  if (floatingBall) {
    console.log('  FloatingBall 存在:', true);
    console.log('  位置:', floatingBall.style.left, floatingBall.style.top);
    const menu = document.querySelector('.floating-ball-menu');
    console.log('  菜单显示:', menu && menu.classList.contains('show'));
  } else {
    console.log('  FloatingBall 不存在');
  }

  // 9. 尝试获取当前执行的测试
  console.log('\n🎯 当前测试信息:');
  if (window.enhancedReporter) {
    const sessions = window.enhancedReporter.testSessions;
    console.log('  测试会话数:', sessions?.size || 0);
    if (sessions && sessions.size > 0) {
      const lastSession = Array.from(sessions.values()).pop();
      console.log('  最后会话:', lastSession);
    }
  }

  // 10. 提供建议
  console.log('\n💡 诊断建议:');
  console.log('  1. 如果 testingInProgress = true，说明测试正在执行');
  console.log('  2. 如果有弹窗显示，可能在等待用户操作');
  console.log('  3. 如果控制台有错误，优先解决错误');
  console.log('  4. 如果 Network 标签有挂起的请求，可能在等待API响应');
  console.log('  5. 如果以上都没有，可能是代码死循环或无限等待');

  console.log('\n✅ 诊断完成！请根据上述信息分析问题。\n');

  // 11. 提供紧急停止功能
  console.log('🚨 紧急停止测试（如果需要）:');
  console.log('  执行: window.testingState = "stopped"; window.isTestingInProgress = false;');

})();
