/**
 * Web测试自动化工具 - Qwen集成实例
 * 展示如何在实际测试中使用Qwen的AI功能
 */

/**
 * 实例1：智能分析页面并自动填充表单
 */
async function example1_SmartFormFilling () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) return;

  console.log('=== 实例1：智能表单填充 ===');

  // 获取页面HTML
  const pageHTML = document.documentElement.outerHTML;

  // 使用Qwen分析页面
  const analysis = await qwen.analyzePage(pageHTML, {
    url: window.location.href,
    title: document.title
  });

  if (!analysis) {
    console.log('页面分析失败');
    return;
  }

  console.log('页面分析结果:', analysis);

  // 对于找到的每个表单，生成智能测试数据
  if (analysis.forms && analysis.forms.length > 0) {
    const form = analysis.forms[0];

    for (const field of form.fields) {
      // 为每个字段生成智能测试数据
      const testData = await qwen.generateTestData(field, {
        formType: form.type,
        businessContext: analysis.businessContext
      });

      console.log(`字段 "${field.name}" 的测试数据:`, testData);

      // 在这里可以使用testData填充表单
      // formFiller.fillField(field.name, testData);
    }
  }
}

/**
 * 实例2：智能错误诊断和恢复
 */
async function example2_ErrorRecovery () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) return;

  console.log('=== 实例2：智能错误恢复 ===');

  // 模拟一个错误
  const errorInfo = {
    message: 'Element not clickable at point (100, 200)',
    type: 'interaction_error',
    element: '<button id="submit" disabled>Submit</button>',
    action: 'click',
    pageState: '页面处于加载状态'
  };

  // 使用Qwen诊断错误
  const diagnosis = await qwen.diagnoseAndRecover(errorInfo);

  if (!diagnosis) {
    console.log('错误诊断失败');
    return;
  }

  console.log('错误诊断结果:', diagnosis);
  console.log('建议的恢复措施:', diagnosis.recoveryMeasures);

  // 根据诊断结果执行恢复
  if (diagnosis.recoveryMeasures && diagnosis.recoveryMeasures.length > 0) {
    const measure = diagnosis.recoveryMeasures[0];
    console.log(`执行恢复措施: ${measure.measure}`);
    // 这里可以执行具体的恢复操作
  }
}

/**
 * 实例3：为元素生成鲁棒的选择器
 */
async function example3_RobustSelectors () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) return;

  console.log('=== 实例3：生成鲁棒选择器 ===');

  // 假设这是一个登录按钮
  const loginButton = document.querySelector('button[type="submit"]');

  if (!loginButton) {
    console.log('未找到登录按钮');
    return;
  }

  // 使用Qwen生成多个选择器
  const selectors = await qwen.generateRobustSelectors(loginButton, {
    pageType: '登录表单',
    isPrimary: true
  });

  if (!selectors) {
    console.log('选择器生成失败');
    return;
  }

  console.log('生成的选择器:', selectors.selectors);
  console.log('推荐使用:', selectors.selectors[0].selector);

  // 使用最稳定的选择器
  const primarySelector = selectors.selectors[0].selector;
  const element = document.querySelector(primarySelector);
  console.log('使用选择器成功找到元素:', !!element);
}

/**
 * 实例4：将自然语言转换为测试脚本
 */
async function example4_NaturalLanguageToScript () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) return;

  console.log('=== 实例4：自然语言转脚本 ===');

  // 用自然语言描述测试流程
  const instruction = '在搜索框输入"iPhone"，点击搜索按钮，等待结果加载，然后点击第一个商品';

  // 使用Qwen生成测试脚本
  const script = await qwen.generateTestScript(instruction);

  if (!script) {
    console.log('脚本生成失败');
    return;
  }

  console.log('生成的测试脚本:', script);
  console.log('测试步骤:', script.steps);
  console.log('验证方式:', script.verifications);
  console.log('错误处理:', script.errorHandlers);
}

/**
 * 实例5：分析测试结果并生成建议
 */
async function example5_ResultAnalysis () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) return;

  console.log('=== 实例5：智能报告分析 ===');

  // 模拟测试结果
  const testResults = {
    url: 'https://example.com/login',
    startTime: new Date('2024-01-09T10:00:00'),
    endTime: new Date('2024-01-09T10:05:00'),
    totalElements: 15,
    testedElements: 15,
    successCount: 13,
    failureCount: 2,
    apiErrorCount: 0,
    apiRequests: [
      { method: 'GET', url: '/api/login', status: 200, duration: 150 },
      { method: 'POST', url: '/api/auth', status: 200, duration: 200 },
      { method: 'GET', url: '/api/user', status: 200, duration: 100 }
    ],
    errors: [
      '按钮A：网络超时',
      '链接B：404未找到'
    ]
  };

  // 使用Qwen分析结果
  const analysis = await qwen.analyzeTestResults(testResults);

  if (!analysis) {
    console.log('结果分析失败');
    return;
  }

  console.log('分析结果:', analysis);
  console.log('总体评价:', analysis.summary);
  console.log('发现的问题:', analysis.issues);
  console.log('改进建议:', analysis.improvements);
}

/**
 * 实例6：理解业务流程
 */
async function example6_BusinessLogicUnderstanding () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) return;

  console.log('=== 实例6：业务流程理解 ===');

  // 描述业务流程
  const flowDescription = `
    电商购物流程：
    1. 用户搜索商品
    2. 浏览搜索结果
    3. 点击商品进入详情页
    4. 查看商品信息和评价
    5. 选择商品规格
    6. 加入购物车
    7. 前往结算
    8. 选择收货地址
    9. 选择配送方式
    10. 选择支付方式
    11. 确认订单
    12. 支付
  `;

  // 使用Qwen理解业务流程
  const understanding = await qwen.understandBusinessLogic(flowDescription, {
    pageType: '电商平台',
    userType: '普通用户'
  });

  if (!understanding) {
    console.log('流程分析失败');
    return;
  }

  console.log('业务流程分析:', understanding);
  console.log('关键步骤:', understanding.keySteps);
  console.log('测试场景:', understanding.testScenarios);
  console.log('风险点:', understanding.risks);
}

/**
 * 实例7：综合使用 - 完整的智能化测试流程
 */
async function example7_ComprehensiveSmartTesting () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) {
    console.log('Qwen未配置');
    return;
  }

  console.log('=== 实例7：综合智能化测试 ===');

  try {
    // 第1步：分析页面
    console.log('🔍 分析页面结构...');
    const pageAnalysis = await qwen.analyzePage(document.documentElement.outerHTML, {
      url: window.location.href,
      title: document.title
    });

    if (!pageAnalysis) throw new Error('页面分析失败');
    console.log('✓ 页面分析完成');

    // 第2步：生成智能测试数据
    console.log('📝 生成智能测试数据...');
    const smartTestData = {};
    if (pageAnalysis.forms && pageAnalysis.forms.length > 0) {
      const form = pageAnalysis.forms[0];
      for (const field of form.fields) {
        const data = await qwen.generateTestData(field, {
          formType: form.type,
          businessContext: pageAnalysis.businessContext
        });
        smartTestData[field.name] = data;
      }
    }
    console.log('✓ 测试数据生成完成');

    // 第3步：执行测试（这里省略具体实现）
    console.log('🧪 执行测试...');
    // const results = await performTest(smartTestData);
    console.log('✓ 测试执行完成');

    // 第4步：分析结果
    console.log('📊 分析测试结果...');
    // const analysis = await qwen.analyzeTestResults(results);
    console.log('✓ 结果分析完成');

    console.log('✅ 智能化测试流程完成！');

  } catch (error) {
    console.error('❌ 智能化测试失败:', error);
  }
}

/**
 * 实例8：使用通用聊天接口提问
 */
async function example8_GeneralChat () {
  const qwen = getQwenInstance(apiKey);
  if (!qwen || !qwen.enabled) return;

  console.log('=== 实例8：通用聊天接口 ===');

  // 可以用来提任何问题
  const message = '这个网站的登录表单最常见的安全问题有哪些？';

  const response = await qwen.chat(message, []);

  console.log('用户提问:', message);
  console.log('Qwen回答:', response);
}

/**
 * 工具函数：获取或创建Qwen实例
 */
function initQwenForExamples () {
  // 这会从chrome storage获取已保存的API密钥
  chrome.storage.local.get(['qwenApiKey'], (result) => {
    if (result.qwenApiKey) {
      console.log('✓ Qwen已初始化');
      return getQwenInstance(result.qwenApiKey);
    } else {
      console.log('⚠ Qwen未配置，请在设置中配置API密钥');
      return null;
    }
  });
}

// 导出示例函数供外部调用
window.QwenExamples = {
  example1: example1_SmartFormFilling,
  example2: example2_ErrorRecovery,
  example3: example3_RobustSelectors,
  example4: example4_NaturalLanguageToScript,
  example5: example5_ResultAnalysis,
  example6: example6_BusinessLogicUnderstanding,
  example7: example7_ComprehensiveSmartTesting,
  example8: example8_GeneralChat
};

console.log('✓ Qwen示例已加载');
console.log('调用示例：QwenExamples.example1()');
