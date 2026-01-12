// Background Service Worker
console.log('Background service worker started');

import CrossPageTestCoordinator from './cross-page-test-coordinator.js';

const crossPageCoordinator = new CrossPageTestCoordinator();

let testingTabId = null;
let testingStarted = false; // 标记测试是否已经真正开始

// 监听来自popup/内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action);

  if (request.action === 'updateStatus') {
    // 转发消息给popup
    chrome.runtime.sendMessage({
      action: 'updateStatus',
      data: request.data
    }).catch(() => { });
  } else if (request.action === 'updateTestStats') {
    // 转发测试统计消息给popup
    console.log('Background forwarding updateTestStats:', request);
    chrome.runtime.sendMessage({
      action: 'updateTestStats',
      testedCount: request.testedCount,
      successCount: request.successCount,
      failureCount: request.failureCount,
      apiErrorCount: request.apiErrorCount,
      progress: request.progress,
      step: request.step
    }).catch(() => { });
  } else if (request.action === 'addLog') {
    // 转发日志消息给popup
    console.log('Background forwarding addLog:', request.message);
    chrome.runtime.sendMessage({
      action: 'addLog',
      message: request.message,
      type: request.type
    }).catch(() => { });
  } else if (request.action === 'testComplete') {
    // 转发测试完成消息给popup
    chrome.runtime.sendMessage({
      action: 'testComplete'
    }).catch(() => { });
  } else if (request.action === 'clearTestState') {
    // 清除测试状态
    console.log('收到清除测试状态请求');
    testingTabId = null;
    testingStarted = false;
    crossPageCoordinator.stopTestSession();
    chrome.storage.local.set({
      testingState: {
        inProgress: false
      }
    });
  } else if (request.action === 'testStarted') {
    // 测试真正开始了
    console.log('测试已开始，标记testingStarted=true, tabId:', sender.tab?.id);
    testingStarted = true;
    testingTabId = sender.tab?.id || request.tabId;

    // 启用跨页面会话（读取已保存配置，如果有）
    try {
      const tabUrl = sender.tab?.url;
      chrome.storage.local.get(['savedConfig'], (result) => {
        crossPageCoordinator.startTestSession({
          startUrl: tabUrl,
          config: result.savedConfig || null,
          tabId: testingTabId,
          testObjective: '自动化功能测试'
        });
      });
    } catch { }
  } else if (request.action === 'openPopup') {
    // 打开popup界面
    chrome.action.openPopup().catch(() => {
      // 如果openPopup不支持，尝试打开一个新标签页显示类似的界面
      console.log('openPopup not supported, fallback to tab');
    });
  } else if (request.action === 'pauseTest') {
    // 暂停测试
    if (testingTabId) {
      chrome.tabs.sendMessage(testingTabId, {
        action: 'pauseTest'
      }).catch(() => { });
    }
  } else if (request.action === 'resumeTest') {
    // 恢复测试
    if (testingTabId) {
      chrome.tabs.sendMessage(testingTabId, {
        action: 'resumeTest'
      }).catch(() => { });
    }
  } else if (request.action === 'openReport') {
    // 打开报告页面
    chrome.tabs.create({ url: chrome.runtime.getURL('src/report.html') });
  } else if (request.action === 'startCrossPageTest') {
    // 从popup显式启动跨页面测试
    crossPageCoordinator.startTestSession({
      startUrl: request.url,
      config: request.config,
      tabId: request.tabId,
      testObjective: request.objective || '自动化功能测试'
    });
    testingTabId = request.tabId;
    testingStarted = true;
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'stopCrossPageTest') {
    crossPageCoordinator.stopTestSession();
    testingStarted = false;
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'getCrossPageStatus') {
    sendResponse({ success: true, status: crossPageCoordinator.getStatus() });
    return true;
  } else if (request.action === 'pageNavigationDetected') {
    // 来自内容脚本的导航提示
    crossPageCoordinator.handlePageNavigation({
      fromUrl: request.fromUrl,
      toUrl: request.toUrl,
      trigger: request.trigger,
      tabId: sender.tab?.id || testingTabId
    });
    sendResponse({ success: true });
    return true;
  }

  sendResponse({ received: true });
});

// 监听tab更新（刷新页面）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 只有在测试真正开始后，页面刷新才清除状态
  if (changeInfo.status === 'loading' && tabId === testingTabId && testingStarted) {
    console.log('测试进行中，页面被刷新，清除测试状态');
    testingTabId = null;
    testingStarted = false;
    // 清除测试状态
    chrome.storage.local.set({
      testingState: {
        inProgress: false
      }
    });
  }
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded:', tab.url);
  }
});

// 监听tab关闭
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === testingTabId) {
    console.log('测试标签页已关闭，清除测试状态');
    testingTabId = null;
    testingStarted = false;
    // 清除测试状态
    chrome.storage.local.set({
      testingState: {
        inProgress: false
      }
    });
  }
});
