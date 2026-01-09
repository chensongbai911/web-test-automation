/**
 * 完整的测试流程诊断脚本
 * 用于诊断"开始测试"流程为什么没有生成报告数据
 */

console.log('%c[测试诊断] 开始完整流程诊断...', 'color: blue; font-size: 14px; font-weight: bold;');

// 诊断数据
const diagnosticData = {
  timestamp: new Date().toISOString(),
  pageUrl: window.location.href,
  checks: {}
};

// 1. 检查消息监听器是否正确注册
async function checkMessageListeners () {
  console.group('%c[测试诊断] 1. 检查消息监听器', 'color: cyan; font-weight: bold;');

  try {
    // 发送ping消息测试
    const response = await chrome.tabs.query({ active: true, currentWindow: true });
    if (response.length > 0) {
      const tabId = response[0].id;

      // 测试analyzePageStructure
      chrome.tabs.sendMessage(tabId, { action: 'analyzePageStructure', config: {} }, (resp) => {
        if (chrome.runtime.lastError) {
          console.error('❌ analyzePageStructure 失败:', chrome.runtime.lastError);
          diagnosticData.checks.analyzePageStructure = { status: 'failed', error: chrome.runtime.lastError.message };
        } else {
          console.log('✅ analyzePageStructure 成功:', resp);
          diagnosticData.checks.analyzePageStructure = { status: 'success', data: resp };
        }
      });

      // 测试generateTestPlan
      chrome.tabs.sendMessage(tabId, {
        action: 'generateTestPlan',
        analysis: { elements: [] },
        config: {}
      }, (resp) => {
        if (chrome.runtime.lastError) {
          console.error('❌ generateTestPlan 失败:', chrome.runtime.lastError);
          diagnosticData.checks.generateTestPlan = { status: 'failed', error: chrome.runtime.lastError.message };
        } else {
          console.log('✅ generateTestPlan 成功:', resp);
          diagnosticData.checks.generateTestPlan = { status: 'success', data: resp };
        }
      });
    }
  } catch (error) {
    console.error('❌ 错误:', error);
  }

  console.groupEnd();
}

// 2. 检查 Storage 中是否有测试数据
async function checkStorageData () {
  console.group('%c[测试诊断] 2. 检查 Storage 测试数据', 'color: green; font-weight: bold;');

  return new Promise(resolve => {
    chrome.storage.local.get(['testData', 'lastTestReport'], (result) => {
      if (result.testData) {
        console.log('✅ 找到 testData:', result.testData);
        diagnosticData.checks.testData = { status: 'found', data: result.testData };
      } else {
        console.log('❌ 未找到 testData');
        diagnosticData.checks.testData = { status: 'not_found' };
      }

      if (result.lastTestReport) {
        console.log('✅ 找到 lastTestReport:', result.lastTestReport);
        diagnosticData.checks.lastTestReport = {
          status: 'found',
          elementCount: result.lastTestReport.totalElements,
          successCount: result.lastTestReport.stats?.successCount
        };
      } else {
        console.log('❌ 未找到 lastTestReport');
        diagnosticData.checks.lastTestReport = { status: 'not_found' };
      }

      resolve();
    });
  });
}

// 3. 检查页面是否正确加载了content-script
async function checkContentScript () {
  console.group('%c[测试诊断] 3. 检查 content-script 加载', 'color: orange; font-weight: bold;');

  try {
    const response = await chrome.tabs.query({ active: true, currentWindow: true });
    if (response.length > 0) {
      const tabId = response[0].id;

      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (resp) => {
        if (chrome.runtime.lastError) {
          console.error('❌ content-script 未加载:', chrome.runtime.lastError);
          diagnosticData.checks.contentScript = { status: 'not_loaded', error: chrome.runtime.lastError.message };
        } else {
          console.log('✅ content-script 已加载:', resp);
          diagnosticData.checks.contentScript = { status: 'loaded', testing: resp.testing };
        }
      });
    }
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }

  console.groupEnd();
}

// 4. 检查页面是否有可交互元素
function checkPageElements () {
  console.group('%c[测试诊断] 4. 检查页面可交互元素', 'color: purple; font-weight: bold;');

  const elements = {
    buttons: document.querySelectorAll('button, a[role="button"], input[type="button"]').length,
    links: document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript:"])').length,
    inputs: document.querySelectorAll('input[type="text"], input[type="email"], textarea').length,
    total: 0
  };

  elements.total = elements.buttons + elements.links + elements.inputs;

  if (elements.total === 0) {
    console.warn('⚠️ 页面上没有找到可交互元素！这可能是测试无法运行的原因');
  } else {
    console.log('✅ 找到可交互元素:', elements);
  }

  diagnosticData.checks.pageElements = elements;
  console.groupEnd();
}

// 5. 检查 manifest.json 配置
async function checkManifest () {
  console.group('%c[测试诊断] 5. 检查扩展配置', 'color: red; font-weight: bold;');

  // 获取扩展信息
  const manifestUrl = chrome.runtime.getURL('manifest.json');
  console.log('Manifest URL:', manifestUrl);

  try {
    const response = await fetch(manifestUrl);
    const manifest = await response.json();

    console.log('✅ Manifest 已加载');
    console.log('  - permissions:', manifest.permissions);
    console.log('  - content_scripts:', manifest.content_scripts?.length);

    diagnosticData.checks.manifest = { status: 'loaded', version: manifest.version };
  } catch (error) {
    console.error('❌ 无法加载 Manifest:', error);
    diagnosticData.checks.manifest = { status: 'error', error: error.message };
  }

  console.groupEnd();
}

// 6. 运行完整诊断
async function runCompleteDiagnostics () {
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: blue;');
  console.log('%c完整诊断报告', 'color: blue; font-size: 16px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: blue;');

  await checkMessageListeners();
  await new Promise(resolve => setTimeout(resolve, 500));

  await checkStorageData();
  await new Promise(resolve => setTimeout(resolve, 500));

  await checkContentScript();
  await new Promise(resolve => setTimeout(resolve, 500));

  checkPageElements();

  await checkManifest();

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: blue;');
  console.log('%c诊断完成', 'color: blue; font-size: 14px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: blue;');
  console.log('完整诊断数据:', diagnosticData);

  return diagnosticData;
}

// 导出诊断工具
window.testDiagnostics = {
  runAll: runCompleteDiagnostics,
  checkMessageListeners,
  checkStorageData,
  checkContentScript,
  checkPageElements,
  checkManifest,
  getData: () => diagnosticData
};

console.log('%c[测试诊断] 工具已加载', 'color: green;');
console.log('使用: testDiagnostics.runAll() 运行完整诊断');
console.log('或使用: testDiagnostics.checkStorageData() 检查 Storage 数据');
