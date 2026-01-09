// 获取DOM元素
const urlInput = document.getElementById('urlInput');
const startTestBtn = document.getElementById('startTestBtn');
const stopTestBtn = document.getElementById('stopTestBtn');
const viewReportBtn = document.getElementById('viewReportBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statusSection = document.getElementById('statusSection');
const logContainer = document.getElementById('logContainer');
const testedCount = document.getElementById('testedCount');
const successCount = document.getElementById('successCount');
const failureCount = document.getElementById('failureCount');
const apiErrorCount = document.getElementById('apiErrorCount');
const progressBar = document.getElementById('progressBar');

// 复选框
const testInteraction = document.getElementById('testInteraction');
const monitorAPI = document.getElementById('monitorAPI');
const captureScreenshot = document.getElementById('captureScreenshot');
const captureConsole = document.getElementById('captureConsole');
const testForms = document.getElementById('testForms');
const testLinks = document.getElementById('testLinks');

// 高级设置
const delayInput = document.getElementById('delayInput');
const maxElements = document.getElementById('maxElements');
const timeoutInput = document.getElementById('timeoutInput');

let testingInProgress = false;
let currentTab = null;
let isFloatingBallMode = false; // 标志：是否在悬浮球模式下

// 初始化Qwen
async function initializeQwen () {
  try {
    chrome.storage.local.get(['qwenApiKey'], (result) => {
      if (result.qwenApiKey) {
        // 注意：QwenIntegration在content-script中，popup中只是检查配置
        console.log('[Popup] Qwen API密钥已配置');
        // 不在popup中实例化QwenIntegration，因为它在content-script上下文中
      } else {
        console.log('[Popup] 未配置Qwen API密钥');
      }
    });
  } catch (error) {
    console.error('[Popup] Qwen初始化错误:', error);
    // 错误不应影响测试功能
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 初始化Qwen
  initializeQwen();

  // 首先获取当前活动标签页，自动填充URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentActiveTab = tabs[0];

    // 自动填充当前页面的URL
    if (currentActiveTab && currentActiveTab.url) {
      // 排除chrome://和chrome-extension://等特殊页面
      if (!currentActiveTab.url.startsWith('chrome://') &&
        !currentActiveTab.url.startsWith('chrome-extension://') &&
        !currentActiveTab.url.startsWith('about:')) {
        urlInput.value = currentActiveTab.url;
      }
    }

    // 从storage恢复配置和测试状态
    chrome.storage.local.get(['savedConfig', 'testingState'], (result) => {
      // 恢复配置
      if (result.savedConfig) {
        const config = result.savedConfig;
        testInteraction.checked = config.testInteraction !== false;
        monitorAPI.checked = config.monitorAPI !== false;
        captureScreenshot.checked = config.captureScreenshot !== false;
        captureConsole.checked = config.captureConsole !== false;
        testForms.checked = config.testForms !== false;
        testLinks.checked = config.testLinks !== false;
        delayInput.value = config.delay || 1200;
        maxElements.value = config.maxElements || 100;
        timeoutInput.value = config.timeout || 30;
      }

      // 恢复测试状态（需要严格验证）
      if (result.testingState && result.testingState.inProgress) {
        const testingState = result.testingState;
        console.log('[Popup] 检测到测试状态:', testingState);

        // 检查测试是否超时（如果超过5分钟，认为测试已失效）
        const startTime = new Date(testingState.startTime).getTime();
        const now = new Date().getTime();
        const elapsed = (now - startTime) / 1000 / 60; // 分钟

        if (elapsed > 5) {
          console.log('[Popup] 测试状态已过期（超过5分钟），清除状态');
          chrome.storage.local.set({
            testingState: { inProgress: false }
          });
          return;
        }

        // 检查测试标签页是否还存在且可访问
        console.log('[Popup] 检查标签页是否存在:', testingState.tabId);
        chrome.tabs.get(testingState.tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            // 标签页不存在，清除测试状态
            console.log('[Popup] 测试标签页不存在，清除状态');
            chrome.storage.local.set({
              testingState: { inProgress: false }
            });
          } else {
            // 标签页存在，但需要验证测试是否真的在运行
            // 尝试向content-script发送ping消息
            console.log('[Popup] 标签页存在，发送ping验证...');
            chrome.tabs.sendMessage(tab.id, { action: 'ping' }).then((response) => {
              if (response && response.testing) {
                // 测试确实在运行，恢复UI状态
                console.log('[Popup] ✓ 测试正在运行，恢复UI状态');
                testingInProgress = true;
                currentTab = { id: testingState.tabId };
                startTestBtn.disabled = true;
                stopTestBtn.disabled = false;
                statusSection.style.display = 'block';
                addLog('✓ 恢复之前的测试状态', 'success');
              } else {
                // ping响应但testing=false，说明测试未在运行
                console.log('[Popup] 测试未在运行（testing=false），清除状态');
                chrome.storage.local.set({
                  testingState: { inProgress: false }
                });
              }
            }).catch((error) => {
              // ping失败，但也不清除状态（content-script可能还在加载）
              console.log('[Popup] Ping失败（可能还在加载）:', error.message);
              // 恢复UI至测试进行中状态
              testingInProgress = true;
              currentTab = { id: testingState.tabId };
              startTestBtn.disabled = true;
              stopTestBtn.disabled = false;
              statusSection.style.display = 'block';
              addLog('⏳ 测试进行中（加载中...）', 'warning');
            });
          }
        });
      } else {
        console.log('[Popup] 无测试状态需要恢复');
      }
    });
  });
});

// 开始测试
startTestBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    alert('请输入网址');
    return;
  }

  try {
    new URL(url);
  } catch {
    alert('请输入有效的网址');
    return;
  }

  // 保存配置
  const config = {
    testInteraction: testInteraction.checked,
    monitorAPI: monitorAPI.checked,
    captureScreenshot: captureScreenshot.checked,
    captureConsole: captureConsole.checked,
    testForms: testForms.checked,
    testLinks: testLinks.checked,
    delay: parseInt(delayInput.value) || 1200,
    maxElements: parseInt(maxElements.value) || 100,
    timeout: parseInt(timeoutInput.value) || 30
  };
  chrome.storage.local.set({ savedConfig: config });

  testingInProgress = true;
  startTestBtn.disabled = true;
  startTestBtn.textContent = '⏳ 测试进行中...';
  stopTestBtn.disabled = false;
  viewReportBtn.disabled = true;
  statusSection.style.display = 'block';
  logContainer.innerHTML = '';

  // 注意：先不保存testingState，等测试真正开始后再保存
  // 避免误判测试状态

  // 智能判断是否需要新开标签页
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    let targetTab = null;

    // 标准化URL进行比较
    const normalizeUrl = (url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.origin + urlObj.pathname.replace(/\/$/, '');
      } catch {
        return url.replace(/\/$/, '');
      }
    };

    const targetUrl = normalizeUrl(url);
    const currentUrl = normalizeUrl(activeTab.url || '');

    // 判断当前页面是否就是目标网址
    if (currentUrl === targetUrl) {
      addLog('✓ 检测到当前页面就是目标网址，直接在当前页面测试', 'success');
      targetTab = activeTab;
      // 不刷新页面，直接在当前页面测试
      // chrome.tabs.reload(targetTab.id); // 已移除：不需要刷新
    } else {
      addLog('当前页面与目标网址不同，正在打开新标签页...', 'info');
      targetTab = await new Promise((resolve) => {
        chrome.tabs.create({ url: url }, (tab) => resolve(tab));
      });
    }

    currentTab = targetTab;

    // 注意：这里也不提前设置testingState
    // 等收到content-script的确认后再设置

    // 根据是否需要等待页面加载来决定延迟时间
    const needWait = (currentUrl !== targetUrl); // 新开标签页需要等待
    const waitTime = needWait ? 3000 : 1000; // 新标签页等3秒，当前页面等1秒

    if (needWait) {
      addLog('等待页面加载...', 'info');
    }

    // 初始化测试数据
    chrome.storage.local.set({
      testData: {
        url: url,
        startTime: new Date().toISOString(),
        buttons: [],
        apiRequests: [],
        errors: [],
        logs: [],
        config: config
      }
    });

    // 等待页面加载完成后开始测试
    setTimeout(() => {
      addLog('🚀 正在启动测试...', 'info');

      // 发送startTest消息，检查响应
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'startTest',
        config: config
      }).then((response) => {
        if (response && response.success) {
          addLog('✓ 测试命令已发送', 'success');

          // 发送showFloatingBall消息
          chrome.tabs.sendMessage(currentTab.id, {
            action: 'showFloatingBall'
          }).then(() => {
            addLog('🎯 已在目标页面启用悬浮球', 'info');
          }).catch(() => {
            // 忽略showFloatingBall的错误
          });

          // ✅ 关键修复：确认测试开始后，保存测试状态
          console.log('[Popup] 保存测试状态到storage，tabId:', currentTab.id);
          chrome.storage.local.set({
            testingState: {
              inProgress: true,
              tabId: currentTab.id,
              startTime: new Date().toISOString()
            }
          }, () => {
            console.log('[Popup] 测试状态已保存，准备关闭popup');
            // 确保storage写入完成后再关闭popup
            // 延迟2秒关闭，给用户看到日志的时间，也给content-script发送日志的时间
            setTimeout(() => {
              window.close();
            }, 2000);
          });
        } else {
          addLog('❌ 测试启动失败，请重试', 'error');
        }
      }).catch((error) => {
        addLog('❌ 无法连接到页面: ' + error.message, 'error');
        console.error('sendMessage error:', error);
        // 不关闭popup，让用户看到错误
      });
    }, waitTime); // 使用动态等待时间
  });
});

// 停止测试
stopTestBtn.addEventListener('click', () => {
  if (currentTab) {
    chrome.tabs.sendMessage(currentTab.id, { action: 'stopTest' }).catch(() => { });
    testingInProgress = false;
    stopTestBtn.disabled = true;
    startTestBtn.disabled = false;
    addLog('测试已停止', 'warning');

    // 清除测试状态
    chrome.storage.local.set({
      testingState: {
        inProgress: false
      }
    });
  }
});

// 查看报告
viewReportBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/report.html') });
});

// 添加日志
function addLog (message, type = 'info') {
  const logItem = document.createElement('div');
  logItem.className = `log-item ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  logItem.textContent = `[${timestamp}] ${message}`;
  logContainer.appendChild(logItem);
  logContainer.scrollTop = logContainer.scrollHeight;

  // 同时发送到悬浮球
  if (currentTab) {
    chrome.tabs.sendMessage(currentTab.id, {
      action: 'addFloatingLog',
      message: message,
      type: type
    }).catch((error) => {
      console.log('addFloatingLog failed:', error.message);
    });
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStatus') {
    testedCount.textContent = request.data.testedCount;
    successCount.textContent = request.data.successCount;
    failureCount.textContent = request.data.failureCount;
    apiErrorCount.textContent = request.data.apiErrorCount;
    updateProgressBar(request.data.testedCount, request.data.totalButtons);

    // 同时更新悬浮球
    if (currentTab) {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'updateFloatingProgress',
        data: {
          total: request.data.totalButtons,
          tested: request.data.testedCount,
          success: request.data.successCount,
          failed: request.data.failureCount,
          apiError: request.data.apiErrorCount
        }
      }).catch((error) => {
        console.log('updateFloatingProgress failed:', error.message);
      });
    }
  } else if (request.action === 'addLog') {
    addLog(request.message, request.type);
  } else if (request.action === 'testComplete') {
    testingInProgress = false;
    // 改变按钮文案为"重新测试"
    startTestBtn.textContent = '🔄 重新测试';
    startTestBtn.disabled = false;
    stopTestBtn.disabled = true;
    viewReportBtn.disabled = false;
    addLog('✅ 测试完成！已生成报告，请点击"查看报告"查看详细结果', 'success');
    console.log('[Popup] testComplete事件处理完成，按钮已启用');

    // 清除测试状态
    chrome.storage.local.set({
      testingState: {
        inProgress: false
      }
    });
  }
});

function updateProgressBar (tested, total) {
  if (total > 0) {
    const percentage = (tested / total) * 100;
    progressBar.style.width = percentage + '%';
  }
}

// 设置按钮事件 - 打开Qwen设置模态窗口
settingsBtn.addEventListener('click', () => {
  const qwenModal = document.getElementById('qwenModal');
  qwenModal.style.display = 'flex';

  // 加载已保存的API密钥
  chrome.storage.local.get(['qwenApiKey', 'qwenEnabled'], (result) => {
    if (result.qwenApiKey) {
      document.getElementById('qwenApiKeyInput').value = result.qwenApiKey;
    }
    if (result.qwenEnabled !== undefined) {
      document.getElementById('qwenEnabled').checked = result.qwenEnabled;
    } else {
      document.getElementById('qwenEnabled').checked = true;
    }
  });
});

// 关闭Qwen模态窗口
document.getElementById('closeQwenModal').addEventListener('click', () => {
  document.getElementById('qwenModal').style.display = 'none';
  document.getElementById('qwenTestResult').style.display = 'none';
});

// 点击模态背景关闭
document.getElementById('qwenModal').addEventListener('click', (event) => {
  if (event.target.id === 'qwenModal') {
    document.getElementById('qwenModal').style.display = 'none';
    document.getElementById('qwenTestResult').style.display = 'none';
  }
});

// 测试Qwen连接
document.getElementById('testQwenBtn').addEventListener('click', async () => {
  const apiKey = document.getElementById('qwenApiKeyInput').value.trim();
  const resultDiv = document.getElementById('qwenTestResult');

  if (!apiKey) {
    resultDiv.style.display = 'block';
    resultDiv.className = 'error';
    resultDiv.style.background = '#f8d7da';
    resultDiv.style.color = '#721c24';
    resultDiv.innerHTML = '❌ 错误：请输入 API 密钥';
    return;
  }

  resultDiv.style.display = 'block';
  resultDiv.style.background = '#d1ecf1';
  resultDiv.style.color = '#0c5460';
  resultDiv.innerHTML = '⏳ 正在测试连接...';

  try {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-max',
          messages: [{ role: 'user', content: '简要介绍一下你自己' }],
          max_tokens: 100,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      const reply = data.choices[0].message.content;
      resultDiv.style.background = '#d4edda';
      resultDiv.style.color = '#155724';
      resultDiv.innerHTML = `✅ 连接成功！<br><small>AI 回复：${reply}</small>`;
    } else {
      resultDiv.style.background = '#f8d7da';
      resultDiv.style.color = '#721c24';
      resultDiv.innerHTML = `❌ 连接失败：${data.message || data.error || '未知错误'}`;
    }
  } catch (error) {
    resultDiv.style.background = '#f8d7da';
    resultDiv.style.color = '#721c24';
    resultDiv.innerHTML = `❌ 网络错误：${error.message}`;
  }
});

// 保存Qwen配置
document.getElementById('saveQwenBtn').addEventListener('click', async () => {
  const apiKey = document.getElementById('qwenApiKeyInput').value.trim();
  const enabled = document.getElementById('qwenEnabled').checked;
  const resultDiv = document.getElementById('qwenTestResult');

  if (!apiKey) {
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#f8d7da';
    resultDiv.style.color = '#721c24';
    resultDiv.innerHTML = '❌ 错误：请输入 API 密钥';
    return;
  }

  // 保存到 Chrome Storage
  chrome.storage.local.set(
    {
      qwenApiKey: apiKey,
      qwenEnabled: enabled,
      qwenConfigSavedAt: new Date().toISOString(),
    },
    () => {
      resultDiv.style.display = 'block';
      resultDiv.style.background = '#d4edda';
      resultDiv.style.color = '#155724';
      resultDiv.innerHTML = `✅ 配置已保存！<br><small>密钥：${apiKey.substring(0, 15)}...（${enabled ? '已启用' : '已禁用'}）</small>`;

      // 3秒后关闭模态窗口
      setTimeout(() => {
        document.getElementById('qwenModal').style.display = 'none';
        document.getElementById('qwenTestResult').style.display = 'none';
        // 重新初始化Qwen
        initializeQwen();
        addLog('✓ Qwen配置已更新', 'success');
      }, 2000);
    }
  );
});

// 监听来自background的Qwen配置更新消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'qwenConfigUpdated') {
    // 重新初始化Qwen
    initializeQwen();
    addLog('✓ Qwen配置已更新', 'success');
  }
});
