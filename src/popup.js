/**
 * Popup Script - 主要UI逻辑和事件处理
 * 包含自动分析和自定义测试两个模式
 */

// ⚠️ 最早的日志 - 不依赖任何初始化
window.console = window.console || {};
window.console.log = window.console.log || function () { };

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║         [Popup] popup.js 文件加载开始                    ║');
console.log('║         时间:', new Date().toLocaleString());
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

// =============================================
// 全局变量和DOM元素获取
// =============================================

// 标签页相关
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const manualTab = document.getElementById('manual-tab');
const customTab = document.getElementById('custom-tab');

// 自动分析模式的DOM
const urlInput = document.getElementById('urlInput');
const startTestBtn = document.getElementById('startTestBtn');
const startIntelligentTestBtn = document.getElementById('startIntelligentTestBtn');

console.log('[Popup] DOM元素获取结果:');
console.log('[Popup] - urlInput:', urlInput);
console.log('[Popup] - startTestBtn:', startTestBtn);
console.log('[Popup] - startIntelligentTestBtn:', startIntelligentTestBtn);

// 全局加载提示（用于多阶段进度显示）
const globalLoadingOverlay = document.getElementById('globalLoadingOverlay');
const globalLoadingEmoji = document.getElementById('globalLoadingEmoji');
const globalLoadingTitle = document.getElementById('globalLoadingTitle');
const globalLoadingText = document.getElementById('globalLoadingText');
const globalLoadingProgressBar = document.getElementById('globalLoadingProgressBar');
const globalLoadingPercent = document.getElementById('globalLoadingPercent');

/**
 * 显示全局进度加载提示
 * @param {Object} options - 配置对象
 *   - title: 标题（如"正在分析意图"）
 *   - text: 详细文本（如"正在分析页面..."）
 *   - emoji: 图标（默认⏳）
 *   - percent: 进度百分比（0-100）
 */
function showGlobalLoading (options = {}) {
  if (!globalLoadingOverlay) return;
  const {
    title = '正在处理中...',
    text = '请稍候...',
    emoji = '⏳',
    percent = 0
  } = options;

  if (globalLoadingEmoji) globalLoadingEmoji.textContent = emoji;
  if (globalLoadingTitle) globalLoadingTitle.textContent = title;
  if (globalLoadingText) globalLoadingText.textContent = text;
  if (globalLoadingProgressBar) globalLoadingProgressBar.style.width = Math.min(100, percent) + '%';
  if (globalLoadingPercent) globalLoadingPercent.textContent = Math.min(100, percent);

  globalLoadingOverlay.style.display = 'flex';
}

/**
 * 更新全局进度加载提示
 * @param {Object} updates - 更新字段（同showGlobalLoading）
 */
function updateGlobalLoading (updates = {}) {
  if (!globalLoadingOverlay || globalLoadingOverlay.style.display === 'none') return;

  const {
    title,
    text,
    emoji,
    percent
  } = updates;

  if (emoji !== undefined && globalLoadingEmoji) globalLoadingEmoji.textContent = emoji;
  if (title !== undefined && globalLoadingTitle) globalLoadingTitle.textContent = title;
  if (text !== undefined && globalLoadingText) globalLoadingText.textContent = text;
  if (percent !== undefined && globalLoadingProgressBar) globalLoadingProgressBar.style.width = Math.min(100, percent) + '%';
  if (percent !== undefined && globalLoadingPercent) globalLoadingPercent.textContent = Math.min(100, percent);
}

/**
 * 隐藏全局进度加载提示
 */
function hideGlobalLoading () {
  if (!globalLoadingOverlay) return;
  globalLoadingOverlay.style.display = 'none';
}

// 确保悬浮球显示（含重试），用于弹窗恢复测试状态时的兜底召回
function sendShowBallWithRetry (tabId, options = {}) {
  const maxRetries = options.maxRetries || 5;
  const retryInterval = options.retryInterval || 300;
  let retries = 0;

  const tryShow = () => {
    chrome.tabs.sendMessage(tabId, { action: 'showFloatingBall' }).then(() => {
      console.log('[Popup] ✅ 悬浮球显示命令已执行');
      if (options.silent !== true) {
        addLog('✨ 悬浮球已显示在页面右下角', 'success');
      }
    }).catch((err) => {
      retries++;
      console.warn(`[Popup] showFloatingBall 失败，准备重试 ${retries}/${maxRetries}:`, err && err.message);
      if (retries < maxRetries) {
        setTimeout(tryShow, retryInterval);
      } else {
        console.warn('[Popup] showFloatingBall 重试次数用尽，停止重试');
      }
    });
  };

  // 首次尝试延迟 300ms，确保 floating-ball-injector 成功注入
  setTimeout(tryShow, 300);
}
const stopTestBtn = document.getElementById('stopTestBtn');
const viewReportBtn = document.getElementById('viewReportBtn');
const settingsBtn = document.getElementById('settingsBtn');
// 新增：测试设置弹窗相关元素
const openTestSettingsBtn = document.getElementById('openTestSettingsBtn');
const testSettingsModal = document.getElementById('testSettingsModal');
const closeTestSettingsModal = document.getElementById('closeTestSettingsModal');
const closeTestSettingsBtn = document.getElementById('closeTestSettingsBtn');
const saveTestSettingsBtn = document.getElementById('saveTestSettingsBtn');
// 新增：测试用例报告下载按钮
const downloadTestCaseReportBtn = document.getElementById('downloadTestCaseReportBtn');

const statusSection = document.getElementById('statusSection');
let logContainer = document.getElementById('logContainer');
let testedCount = document.getElementById('testedCount');
let successCount = document.getElementById('successCount');
let failureCount = document.getElementById('failureCount');
let apiErrorCount = document.getElementById('apiErrorCount');
let progressBar = document.getElementById('progressBar');
let aiPlanContainer = document.getElementById('aiPlanContainer');
const testIntentInput = document.getElementById('testIntentInput');

// 自定义测试模式的DOM
const uploadBox = document.getElementById('uploadBox');
const testCaseFile = document.getElementById('testCaseFile');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileStats = document.getElementById('fileStats');
const fileErrors = document.getElementById('fileErrors');
const clearFileBtn = document.getElementById('clearFileBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');

// 配置复选框
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

// Qwen设置相关
const qwenModal = document.getElementById('qwenModal');
const closeQwenModal = document.getElementById('closeQwenModal');
const qwenApiKeyInput = document.getElementById('qwenApiKeyInput');
const qwenEnabled = document.getElementById('qwenEnabled');
const saveQwenBtn = document.getElementById('saveQwenBtn');
const testQwenBtn = document.getElementById('testQwenBtn');
const qwenTestResult = document.getElementById('qwenTestResult');

// 状态变量
let testingInProgress = false;
let currentTab = null;
let testingMode = 'auto'; // 'auto' or 'custom'
let uploadedTestCases = null;
let isFloatingBallMode = false;

// =============================================
// 标签页切换逻辑
// =============================================

tabBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tab = e.target.dataset.tab;

    // 移除所有active类
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    // 添加active类到选中的标签
    e.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');

    // 根据标签页改变测试模式
    testingMode = tab === 'manual' ? 'auto' : 'custom';

    // 更新开始按钮文本（统一为快速模式/自定义执行）
    if (testingMode === 'auto') {
      startTestBtn.innerHTML = '<span class="icon">⚙️</span> 使用快速模式';
    } else {
      startTestBtn.innerHTML = uploadedTestCases ? '<span class="icon">▶</span> 执行测试' : '<span class="icon">▶</span> 开始测试';
    }
  });
});

// =============================================
// 文件上传逻辑
// =============================================

// 点击上传框打开文件选择
uploadBox.addEventListener('click', () => {
  testCaseFile.click();
});

// 文件选择处理
testCaseFile.addEventListener('change', handleFileSelect);

// 拖放处理
uploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
  uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadBox.classList.remove('dragover');

  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      processFile(file);
    } else {
      showFileError('❌ 请选择 JSON 文件');
    }
  }
});

// 清除文件按钮
clearFileBtn.addEventListener('click', () => {
  testCaseFile.value = '';
  uploadedTestCases = null;
  fileInfo.style.display = 'none';
  uploadBox.style.display = 'block';
});

// 下载模板按钮
downloadTemplateBtn.addEventListener('click', (e) => {
  e.preventDefault();
  downloadTestTemplate();
});

/**
 * 处理文件选择
 */
function handleFileSelect (e) {
  const file = e.target.files[0];
  if (file) {
    processFile(file);
  }
}

/**
 * 处理文件内容
 */
function processFile (file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target.result;

      // 使用TestCaseParser解析文件
      const parser = new TestCaseParser();
      const result = parser.parse(content);

      if (result.success) {
        uploadedTestCases = result.data;
        displayFileSuccess(file, result);
      } else {
        displayFileErrors(file, result);
      }
    } catch (error) {
      showFileError(`❌ 文件处理失败: ${error.message}`);
    }
  };

  reader.onerror = () => {
    showFileError('❌ 文件读取失败');
  };

  reader.readAsText(file);
}

/**
 * 显示文件成功信息
 */
function displayFileSuccess (file, parseResult) {
  uploadBox.style.display = 'none';
  fileInfo.style.display = 'block';
  fileErrors.style.display = 'none';

  // 显示文件名
  fileName.textContent = `✅ ${file.name} (${formatFileSize(file.size)})`;

  // 显示统计信息
  const stats = parseResult.data ? new TestCaseParser().getStatistics(parseResult.data) : {};
  fileStats.innerHTML = `
    <div>📋 测试套件: ${parseResult.data.testName}</div>
    <div>🎯 目标URL: ${parseResult.data.targetUrl}</div>
    <div>📝 测试用例: ${stats.totalCases} 个</div>
    <div>✓ 启用用例: ${stats.enabledCases} 个</div>
    <div>🔧 总步骤数: ${stats.totalSteps} 步</div>
    <div>✔️ 验证步骤: ${stats.verifySteps} 个</div>
    <div>⏱️ 预计耗时: 约 ${stats.estimatedDuration} 秒</div>
  `;

  // 显示警告信息
  if (parseResult.warnings.length > 0) {
    fileErrors.classList.remove('error');
    fileErrors.style.display = 'block';
    fileErrors.innerHTML = `
      <strong>⚠️ 警告信息:</strong>
      <ul>${parseResult.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
    `;
  }
}

/**
 * 显示文件错误信息
 */
function displayFileErrors (file, parseResult) {
  uploadBox.style.display = 'none';
  fileInfo.style.display = 'block';
  fileErrors.style.display = 'block';
  fileErrors.classList.add('error');

  // 显示文件名
  fileName.textContent = `❌ ${file.name} (${formatFileSize(file.size)})`;

  // 显示错误信息
  fileErrors.innerHTML = `
    <strong>❌ 验证失败 (${parseResult.errors.length} 个错误):</strong>
    <ul>${parseResult.errors.slice(0, 10).map(err => `<li>${err}</li>`).join('')}
    ${parseResult.errors.length > 10 ? `<li>... 还有 ${parseResult.errors.length - 10} 个错误</li>` : ''}
    </ul>
  `;

  uploadedTestCases = null;
}

/**
 * 显示文件错误
 */
function showFileError (message) {
  uploadBox.style.display = 'block';
  fileInfo.style.display = 'none';
  fileInfo.innerHTML = `
    <div style="padding: 10px; background: #f8d7da; border-radius: 4px; color: #721c24;">
      ${message}
    </div>
  `;
  setTimeout(() => {
    fileInfo.style.display = 'none';
  }, 3000);
}

/**
 * 下载测试模板
 */
function downloadTestTemplate () {
  const template = {
    version: '1.0',
    testName: '示例测试套件',
    description: '这是一个示例测试套件，请根据实际需求修改',
    targetUrl: 'https://example.com',
    config: {
      timeout: 30,
      retryCount: 2,
      screenshot: true,
      stopOnFailure: false
    },
    testCases: [
      {
        id: 'TC001',
        name: '页面加载测试',
        description: '验证页面是否正常加载',
        enabled: true,
        steps: [
          {
            type: 'verify',
            verifyType: 'elementExists',
            selector: 'body',
            description: '验证页面加载完成'
          }
        ]
      },
      {
        id: 'TC002',
        name: '按钮点击测试',
        description: '测试页面上的按钮是否可点击',
        enabled: true,
        steps: [
          {
            type: 'click',
            selector: 'button',
            description: '点击第一个按钮',
            waitAfter: 1000
          },
          {
            type: 'verify',
            verifyType: 'elementExists',
            selector: 'body',
            description: '验证点击后页面仍然可用'
          }
        ]
      }
    ]
  };

  const dataStr = JSON.stringify(template, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'test-case-template.json';
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 格式化文件大小
 */
function formatFileSize (bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// =============================================
// 初始化
// =============================================

console.log('[Popup] 注册 DOMContentLoaded 事件监听器...');

document.addEventListener('DOMContentLoaded', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  [Popup] DOMContentLoaded 事件已触发！现在初始化...      ║');
  console.log('║  时间:', new Date().toLocaleString());
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  // 初始化Qwen
  initializeQwen();

  // 首先获取当前活动标签页，自动填充URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('[Popup] 🔥 tabs.query 回调执行');
    console.log('[Popup] 查询到的标签页:', tabs);

    if (chrome.runtime.lastError) {
      console.error('[Popup] ❌ tabs.query 错误:', chrome.runtime.lastError);
    }

    const currentActiveTab = tabs && tabs[0];

    if (currentActiveTab && currentActiveTab.url) {
      const url = currentActiveTab.url;
      console.log('[Popup] 当前标签页URL:', url);

      // 排除chrome内部页面
      if (!url.startsWith('chrome://') &&
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('edge://') &&
        !url.startsWith('about:')) {
        console.log('[Popup] 自动填充URL到输入框:', url);
        urlInput.value = url;
      } else {
        console.log('[Popup] 跳过chrome内部页面，不自动填充');
      }
    } else {
      console.log('[Popup] 未找到当前标签页或URL');
    }

    // 恢复配置
    console.log('[Popup] 🔥 准备调用 storage.local.get');
    chrome.storage.local.get(['savedConfig', 'testingState'], (result) => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  📊 当前存储状态快照（Popup 打开时）                    ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('testingState:', JSON.stringify(result.testingState, null, 2));
      console.log('savedConfig:', result.savedConfig ? '已配置' : '未配置');
      console.log('');
      console.log('[Popup] 🔥 storage.get 回调执行！');
      console.log('[Popup] result:', result);

      if (chrome.runtime.lastError) {
        console.error('[Popup] ❌ storage.get 错误:', chrome.runtime.lastError);
        return;
      }

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

      // 恢复测试统计数据
      console.log('[Popup] 检查 testStats:', result.testStats);
      if (result.testStats) {
        const stats = result.testStats;
        console.log('[Popup] 🔥 检测到保存的测试统计数据:', stats);

        // 🔥 关键修复：如果 statusSection 还没显示，需要先创建它
        // 这样才能恢复 testedCount 等元素
        if (!testedCount || !successCount || !failureCount || !apiErrorCount) {
          console.log('[Popup] 🔥 statusSection 还未创建，先创建它来恢复数据');
          statusSection.style.display = 'block';
          statusSection.innerHTML = `
            <h3>测试状态</h3>
            <div class="status-bar">
              <div class="progress-bar" id="progressBar"></div>
            </div>
            <div class="status-info">
              <p>已测试项目: <span id="testedCount">0</span></p>
              <p>成功: <span id="successCount">0</span></p>
              <p>失败: <span id="failureCount">0</span></p>
              <p>验证失败: <span id="apiErrorCount">0</span></p>
            </div>
            <div class="log-area">
              <div id="logContainer" class="log-container"></div>
            </div>
          `;

          // 重新获取 DOM 元素
          testedCount = document.getElementById('testedCount');
          successCount = document.getElementById('successCount');
          failureCount = document.getElementById('failureCount');
          apiErrorCount = document.getElementById('apiErrorCount');
          progressBar = document.getElementById('progressBar');
          logContainer = document.getElementById('logContainer');
        }

        // 现在恢复数据
        if (testedCount) testedCount.textContent = stats.testedCount || 0;
        if (successCount) successCount.textContent = stats.successCount || 0;
        if (failureCount) failureCount.textContent = stats.failureCount || 0;
        if (apiErrorCount) apiErrorCount.textContent = stats.apiErrorCount || 0;
        if (progressBar && stats.progress) {
          progressBar.style.width = stats.progress + '%';
        }
        console.log('[Popup] ✅ 测试统计数据已恢复:', stats);

        // 🔥 恢复日志
        chrome.storage.local.get(['testLogs'], (logResult) => {
          if (logResult.testLogs && logResult.testLogs.length > 0) {
            console.log('[Popup] 🔥 恢复保存的日志:', logResult.testLogs.length, '条');
            logResult.testLogs.forEach(log => {
              if (logContainer) {
                const logEntry = document.createElement('div');
                logEntry.className = `log-entry log-${log.type}`;
                logEntry.style.padding = '8px';
                logEntry.style.marginBottom = '4px';
                logEntry.style.borderRadius = '4px';
                logEntry.style.fontSize = '12px';
                logEntry.style.wordBreak = 'break-all';

                switch (log.type) {
                  case 'success':
                    logEntry.style.background = '#d4edda';
                    logEntry.style.color = '#155724';
                    break;
                  case 'error':
                    logEntry.style.background = '#f8d7da';
                    logEntry.style.color = '#721c24';
                    break;
                  case 'warning':
                    logEntry.style.background = '#fff3cd';
                    logEntry.style.color = '#856404';
                    break;
                  default:
                    logEntry.style.background = '#e2e3e5';
                    logEntry.style.color = '#383d41';
                }
                logEntry.textContent = log.message;
                logContainer.appendChild(logEntry);
              }
            });
            console.log('[Popup] ✅ 日志已恢复');
          }
        });
      }

      // 恢复测试状态
      console.log('[Popup] 检查 testingState:', result.testingState);
      if (result.testingState && result.testingState.inProgress) {
        const testingState = result.testingState;
        console.log('[Popup] 🔥🔥🔥 检测到进行中的测试！');
        console.log('[Popup] testingState 详情:', testingState);

        // 💡 显示用户友好的恢复提示
        if (statusSection) {
          const restoreHint = document.createElement('div');
          restoreHint.style.cssText = 'background:#e3f2fd;color:#1565c0;padding:10px;border-radius:6px;margin-bottom:10px;font-size:13px;';
          restoreHint.innerHTML = '🔄 <strong>正在恢复测试会话...</strong> 测试仍在后台进行中';
          statusSection.insertBefore(restoreHint, statusSection.firstChild);
          setTimeout(() => restoreHint.remove(), 3000);
        }

        const startTime = new Date(testingState.startTime).getTime();
        const now = new Date().getTime();
        const elapsed = (now - startTime) / 1000 / 60;

        if (elapsed > 5) {
          console.log('[Popup] 测试已超过5分钟，清除状态');
          chrome.storage.local.set({ testingState: { inProgress: false } });
          return;
        }

        // 恢复URL
        if (testingState.url && urlInput) {
          console.log('[Popup] 恢复URL:', testingState.url);
          urlInput.value = testingState.url;
        }

        // 如果没有保存 tabId，先恢复UI，并尝试通过URL找回标签页
        if (!testingState.tabId) {
          console.warn('[Popup] ⚠️ testingState.tabId 为空，先恢复UI并尝试通过URL找回标签页');

          // 构建并显示状态区域 DOM
          statusSection.innerHTML = `
            <h3>测试状态</h3>
            <div class="status-bar">
              <div class="progress-bar" id="progressBar"></div>
            </div>
            <div class="status-info">
              <p>已测试项目: <span id="testedCount">0</span></p>
              <p>成功: <span id="successCount">0</span></p>
              <p>失败: <span id="failureCount">0</span></p>
              <p>验证失败: <span id="apiErrorCount">0</span></p>
            </div>
            <div class="log-area">
              <div id="logContainer" class="log-container"></div>
            </div>
          `;
          statusSection.style.display = 'block';

          // 重新获取 DOM 引用并恢复统计数据
          testedCount = document.getElementById('testedCount');
          successCount = document.getElementById('successCount');
          failureCount = document.getElementById('failureCount');
          apiErrorCount = document.getElementById('apiErrorCount');
          progressBar = document.getElementById('progressBar');
          logContainer = document.getElementById('logContainer');

          chrome.storage.local.get(['testStats'], (statsResult) => {
            if (statsResult.testStats) {
              const stats = statsResult.testStats;
              console.log('[Popup] 恢复统计数据(无tabId场景):', stats);
              if (testedCount) testedCount.textContent = stats.testedCount || 0;
              if (successCount) successCount.textContent = stats.successCount || 0;
              if (failureCount) failureCount.textContent = stats.failureCount || 0;
              if (apiErrorCount) apiErrorCount.textContent = stats.apiErrorCount || 0;
              if (progressBar && stats.progress) {
                progressBar.style.width = stats.progress + '%';
              }
            }
          });

          // 提示正在恢复并加载历史日志
          addLog('⏳ 测试进行中（尝试恢复标签页）', 'warning');
          chrome.storage.local.get(['testLogs'], (logResult) => {
            if (logResult.testLogs && logResult.testLogs.length > 0) {
              logResult.testLogs.forEach(log => {
                if (logContainer) {
                  const el = document.createElement('div');
                  el.className = `log-entry log-${log.type}`;
                  el.textContent = log.message;
                  logContainer.appendChild(el);
                }
              });
            }
          });

          // 尝试通过URL找到对应标签页
          try {
            chrome.tabs.query({}, (tabs) => {
              const match = tabs.find(t => t.url && (t.url === testingState.url || t.url.startsWith(testingState.url)));
              if (match) {
                console.log('[Popup] ✅ 通过URL找到标签页:', match.id);
                currentTab = { id: match.id };
                chrome.storage.local.set({
                  testingState: {
                    inProgress: true,
                    mode: testingState.mode,
                    url: testingState.url,
                    config: testingState.config,
                    startTime: testingState.startTime,
                    tabId: match.id
                  }
                });

                // 召回悬浮球（含重试）
                addLog('✨ 正在召回悬浮球...', 'info');
                sendShowBallWithRetry(match.id);
              } else {
                console.warn('[Popup] 未找到与URL匹配的标签页');
              }
            });
          } catch (e) {
            console.warn('[Popup] 查找标签页失败:', e);
          }

          // 已处理该路径，避免继续执行 tabs.get(null)
          return;
        }

        console.log('[Popup] 准备调用 chrome.tabs.get，tabId:', testingState.tabId);
        chrome.tabs.get(testingState.tabId, (tab) => {
          console.log('[Popup] 🔥 chrome.tabs.get 回调执行');
          console.log('[Popup] tab:', tab);
          if (chrome.runtime.lastError) {
            console.error('[Popup] ❌ tabs.get 错误:', chrome.runtime.lastError);
          }

          if (chrome.runtime.lastError || !tab) {
            console.log('[Popup] 测试标签页已关闭，清除状态');
            chrome.storage.local.set({ testingState: { inProgress: false } });
          } else {
            console.log('[Popup] 标签页存在，发送ping消息到tab:', tab.id);
            chrome.tabs.sendMessage(tab.id, { action: 'ping' }).then((response) => {
              console.log('[Popup] ping 响应:', response);
              if (response && response.testing) {
                console.log('[Popup] ✅ 测试仍在进行中，恢复所有UI状态');
                // 完整恢复测试状态
                testingInProgress = true;
                currentTab = { id: testingState.tabId };
                startTestBtn.disabled = true;
                startIntelligentTestBtn.disabled = true;
                stopTestBtn.disabled = false;

                // 恢复报告按钮状态
                viewReportBtn.disabled = false;
                const reportIcon = document.getElementById('reportBtnIcon');
                const reportLabel = document.getElementById('reportBtnLabel');
                if (reportIcon) reportIcon.textContent = '⏳';
                if (reportLabel) reportLabel.textContent = '测试进行中...';

                // 恢复智能测试按钮状态
                const icon = document.getElementById('intelligentTestIcon');
                const label = document.getElementById('intelligentTestLabel');
                if (icon) icon.textContent = '⏳';
                if (label) label.textContent = '测试进行中...';

                // 恢复测试用例报告按钮
                if (downloadTestCaseReportBtn) {
                  downloadTestCaseReportBtn.disabled = false;
                  downloadTestCaseReportBtn.innerHTML = '<span class="icon">⏳</span> 生成中...';
                }

                // 🔥 先创建 statusSection 的 DOM 结构
                statusSection.innerHTML = `
                  <h3>测试状态</h3>
                  <div class="status-bar">
                    <div class="progress-bar" id="progressBar"></div>
                  </div>
                  <div class="status-info">
                    <p>已测试项目: <span id="testedCount">0</span></p>
                    <p>成功: <span id="successCount">0</span></p>
                    <p>失败: <span id="failureCount">0</span></p>
                    <p>验证失败: <span id="apiErrorCount">0</span></p>
                  </div>
                  <div class="log-area">
                    <div id="logContainer" class="log-container"></div>
                  </div>
                `;
                statusSection.style.display = 'block';

                // 重新获取 DOM 元素引用
                testedCount = document.getElementById('testedCount');
                successCount = document.getElementById('successCount');
                failureCount = document.getElementById('failureCount');
                apiErrorCount = document.getElementById('apiErrorCount');
                progressBar = document.getElementById('progressBar');
                logContainer = document.getElementById('logContainer');

                // 🔥 现在恢复统计数据
                chrome.storage.local.get(['testStats'], (statsResult) => {
                  if (statsResult.testStats) {
                    const stats = statsResult.testStats;
                    console.log('[Popup] 恢复统计数据:', stats);
                    if (testedCount) testedCount.textContent = stats.testedCount || 0;
                    if (successCount) successCount.textContent = stats.successCount || 0;
                    if (failureCount) failureCount.textContent = stats.failureCount || 0;
                    if (apiErrorCount) apiErrorCount.textContent = stats.apiErrorCount || 0;
                    if (progressBar && stats.progress) {
                      progressBar.style.width = stats.progress + '%';
                    }
                  }
                });

                addLog('✓ 恢复之前的测试状态', 'success');
                const elapsedSec = Math.floor((now - startTime) / 1000);
                addLog(`📊 测试已运行 ${elapsedSec} 秒`, 'info');

                // 兜底：弹窗恢复时自动召回悬浮球（含重试）
                sendShowBallWithRetry(testingState.tabId);
              }
            }).catch((error) => {
              console.warn('[Popup] ⚠️ ping 失败（测试可能仍在后台运行）:', error);
              // 即使ping失败，也恢复UI状态（测试可能仍在后台运行）
              console.log('[Popup] 即使ping失败也恢复UI状态');
              testingInProgress = true;
              currentTab = { id: testingState.tabId };
              startTestBtn.disabled = true;
              startIntelligentTestBtn.disabled = true;
              stopTestBtn.disabled = false;

              viewReportBtn.disabled = false;
              const reportIcon = document.getElementById('reportBtnIcon');
              const reportLabel = document.getElementById('reportBtnLabel');
              if (reportIcon) reportIcon.textContent = '⏳';
              if (reportLabel) reportLabel.textContent = '测试进行中...';

              if (downloadTestCaseReportBtn) {
                downloadTestCaseReportBtn.disabled = false;
                downloadTestCaseReportBtn.innerHTML = '<span class="icon">⏳</span> 生成中...';
              }

              // 🔥 先创建 statusSection 的 DOM 结构
              statusSection.innerHTML = `
                <h3>测试状态</h3>
                <div class="status-bar">
                  <div class="progress-bar" id="progressBar"></div>
                </div>
                <div class="status-info">
                  <p>已测试项目: <span id="testedCount">0</span></p>
                  <p>成功: <span id="successCount">0</span></p>
                  <p>失败: <span id="failureCount">0</span></p>
                  <p>验证失败: <span id="apiErrorCount">0</span></p>
                </div>
                <div class="log-area">
                  <div id="logContainer" class="log-container"></div>
                </div>
              `;
              statusSection.style.display = 'block';

              // 重新获取 DOM 元素引用
              testedCount = document.getElementById('testedCount');
              successCount = document.getElementById('successCount');
              failureCount = document.getElementById('failureCount');
              apiErrorCount = document.getElementById('apiErrorCount');
              progressBar = document.getElementById('progressBar');
              logContainer = document.getElementById('logContainer');

              // 🔥 恢复统计数据
              chrome.storage.local.get(['testStats'], (statsResult) => {
                if (statsResult.testStats) {
                  const stats = statsResult.testStats;
                  console.log('[Popup] 恢复统计数据:', stats);
                  if (testedCount) testedCount.textContent = stats.testedCount || 0;
                  if (successCount) successCount.textContent = stats.successCount || 0;
                  if (failureCount) failureCount.textContent = stats.failureCount || 0;
                  if (apiErrorCount) apiErrorCount.textContent = stats.apiErrorCount || 0;
                  if (progressBar && stats.progress) {
                    progressBar.style.width = stats.progress + '%';
                  }
                }
              });

              addLog('⏳ 测试进行中（加载中...）', 'warning');

              // 兜底：即使ping失败也尝试召回悬浮球（含重试）
              sendShowBallWithRetry(testingState.tabId);

              // 🔥 恢复之前保存的日志
              chrome.storage.local.get(['testLogs'], (logResult) => {
                if (logResult.testLogs && logResult.testLogs.length > 0) {
                  console.log('[Popup] 🔥 恢复保存的日志:', logResult.testLogs.length, '条');
                  logResult.testLogs.forEach(log => {
                    // 直接添加到 logContainer，而不调用 addLog（避免重复保存）
                    if (logContainer) {
                      const logEntry = document.createElement('div');
                      logEntry.className = `log-entry log-${log.type}`;
                      logEntry.style.padding = '8px';
                      logEntry.style.marginBottom = '4px';
                      logEntry.style.borderRadius = '4px';
                      logEntry.style.fontSize = '12px';
                      logEntry.style.wordBreak = 'break-all';

                      switch (log.type) {
                        case 'success':
                          logEntry.style.background = '#d4edda';
                          logEntry.style.color = '#155724';
                          break;
                        case 'error':
                          logEntry.style.background = '#f8d7da';
                          logEntry.style.color = '#721c24';
                          break;
                        case 'warning':
                          logEntry.style.background = '#fff3cd';
                          logEntry.style.color = '#856404';
                          break;
                        default:
                          logEntry.style.background = '#e2e3e5';
                          logEntry.style.color = '#383d41';
                      }
                      logEntry.textContent = log.message;
                      logContainer.appendChild(logEntry);
                    }
                  });
                }
              });
            });
          }
        });
      }
    });
  });
});

// =============================================
// Qwen初始化
// =============================================

async function initializeQwen () {
  try {
    chrome.storage.local.get(['qwenApiKey'], (result) => {
      if (result.qwenApiKey) {
        console.log('[Popup] Qwen API密钥已配置');
      } else {
        console.log('[Popup] 未配置Qwen API密钥');
      }
    });
  } catch (error) {
    console.error('[Popup] Qwen初始化错误:', error);
  }
}

// =============================================
// 开始测试按钮逻辑
// =============================================

startTestBtn.addEventListener('click', async () => {
  if (testingMode === 'auto') {
    // 快速模式：直接按当前配置启动自动测试
    startAutoTest();
  } else {
    // 自定义测试模式
    if (!uploadedTestCases) {
      alert('❌ 请先上传测试用例文件');
      return;
    }
    startCustomTest();
  }
});

// 智能测试入口
console.log('[Popup] 准备绑定AI智能分析按钮事件...');
console.log('[Popup] startIntelligentTestBtn元素:', startIntelligentTestBtn);

if (!startIntelligentTestBtn) {
  console.error('[Popup] ❌ startIntelligentTestBtn元素未找到！');
} else {
  console.log('[Popup] ✅ startIntelligentTestBtn元素已找到，绑定点击事件');
}

startIntelligentTestBtn.addEventListener('click', async () => {
  console.log('[Popup] ========== AI智能分析按钮被点击 ==========');

  const url = urlInput.value.trim();
  let intent = (testIntentInput?.value || '').trim();

  console.log('[Popup] URL:', url);
  console.log('[Popup] Intent:', intent);

  if (!url) {
    alert('❌ 请输入目标网址');
    return;
  }

  // 如果没有意图，先进行页面分析
  if (!intent) {
    console.log('[Popup] Intent为空，进入页面分析流程');

    // 🔍 先检查扩展上下文是否有效
    if (!chrome.runtime || !chrome.runtime.id) {
      alert('⚠️ 扩展上下文已失效，需要重新加载\n\n请按以下步骤操作：\n1. 打开 chrome://extensions/\n2. 找到"Web功能自动化测试工具"\n3. 点击"重新加载"按钮\n4. 关闭此页面并重新打开');
      return;
    }

    addLog('🔍 正在分析页面功能...', 'info');
    // 显示主界面加载提示
    showGlobalLoading({
      title: '正在分析意图',
      text: '🔍 正在分析页面并生成意图...',
      emoji: '🔍',
      percent: 25
    });

    try {
      console.log('[Popup] 准备查询当前标签页...');
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        console.log('[Popup] tabs.query回调执行，tabs:', tabs);

        try {
          const activeTab = tabs[0];
          let targetTab = activeTab;

          // 检查是否需要打开新标签页
          if (!activeTab.url || !activeTab.url.startsWith(url)) {
            targetTab = await new Promise((resolve) => {
              chrome.tabs.create({ url }, (tab) => resolve(tab));
            });
            await waitForPageReady(targetTab.id, url, 15000);
            await ensureContentScriptReady(targetTab.id);
          }

          // 发送分析页面命令
          updateGlobalLoading({ percent: 50, text: '正在提取页面结构...' });
          console.log('[Popup] 准备发送analyzePageForIntent消息到tab:', targetTab.id);

          chrome.tabs.sendMessage(targetTab.id, {
            action: 'analyzePageForIntent',
            url: url
          }, (resp) => {
            console.log('[Popup] analyzePageForIntent回调执行');
            console.log('[Popup] Response:', resp);
            console.log('[Popup] lastError:', chrome.runtime.lastError);

            // 检查runtime错误
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message || '';
              console.error('[Popup] analyzePageForIntent错误:', errorMsg);
              hideGlobalLoading();
              if (errorMsg.includes('context invalidated') || errorMsg.includes('Extension context')) {
                alert('⚠️ 扩展上下文已失效\n\n请重新加载扩展：\n1. 打开 chrome://extensions/\n2. 找到本扩展\n3. 点击"重新加载"\n4. 关闭页面重新打开');
              } else {
                addLog('⚠️ 页面分析失败: ' + errorMsg, 'warning');
              }
              return;
            }

            if (resp && resp.success && resp.pageAnalysis) {
              // 优先使用内容脚本生成的高质量摘要
              let suggestion = (resp.intentSuggestion || '').trim();
              const analysis = resp.pageAnalysis;

              // 若无摘要，基于结构化分析生成更全面的建议
              if (!suggestion) {
                const parts = [];
                if (Array.isArray(analysis.forms) && analysis.forms.length) {
                  const requiredSum = analysis.forms.reduce((a, b) => a + (b.requiredCount || 0), 0);
                  parts.push(`测试${analysis.forms.length}个表单（必填${requiredSum}项，含校验与提交）`);
                }
                if (Array.isArray(analysis.buttons)) parts.push(`验证${analysis.buttons.length}个按钮交互与弹框处理`);
                if (Array.isArray(analysis.links)) parts.push(`测试${analysis.links.length}个链接的同域跳转与导航`);
                if (Array.isArray(analysis.tables) && analysis.tables.length) parts.push(`检查${analysis.tables.length}个表格的分页/排序/搜索与数据渲染`);
                const ui = analysis.uiComponents || {};
                const compTotal = Object.values(ui).reduce((a, b) => a + (b || 0), 0);
                if (compTotal) parts.push('覆盖选择器/日期/级联/复选/单选/开关、标签页/折叠面板');
                if (analysis.charts?.canvasCount) parts.push('验证图表渲染与画布存在');
                if (Array.isArray(analysis.iframes) && analysis.iframes.length) parts.push(`处理${analysis.iframes.length}个iframe嵌入内容`);
                if (analysis.hasAuthFlow) parts.push('校验登录/注册相关流程与错误提示');
                if (analysis.hasFileUpload) parts.push('测试文件上传与大小/类型校验');
                parts.push('校验页面导航与接口响应、可访问性（alt/label/ARIA）');
                suggestion = parts.join('，').replace(/，$/, '');
              }

              // 填充意图文本框
              if (testIntentInput) {
                testIntentInput.value = suggestion || '进行完整的页面功能测试，包括所有交互元素和页面导航';
              }

              // 更新加载提示为完成
              updateGlobalLoading({ percent: 100, text: '✅ 意图生成完成，即将开始测试...' });
              addLog('✓ AI已自动分析页面并生成测试建议，即将自动开始测试', 'success');

              // 🎯 自动继续执行测试，不需要用户再次点击
              setTimeout(() => {
                hideGlobalLoading();
                // 设置意图并立即开始测试
                const generatedIntent = testIntentInput?.value || suggestion || '自动化功能测试';
                console.log('[Popup] 自动启动智能测试，意图:', generatedIntent);

                // 直接调用智能测试流程（跳过分析阶段）
                startIntelligentTestWithIntent(url, generatedIntent);
              }, 800);
            } else {
              hideGlobalLoading();
              addLog('⚠️ 页面分析失败，请手动填写测试意图', 'warning');
            }
          });
        } catch (error) {
          hideGlobalLoading();
          addLog('⚠️ 自动分析失败，请手动填写测试意图', 'warning');
          console.error('[Popup] 自动分析异常:', error);
        }
      });
      return;
    } catch (error) {
      hideGlobalLoading();
      addLog('⚠️ 自动分析失败，请手动填写测试意图', 'warning');
      console.error('[Popup] 外层自动分析异常:', error);
      return;
    }
  }

  // 执行智能测试（有意图的情况）
  startIntelligentTestWithIntent(url, intent);
});

// 🎯 独立的智能测试执行函数
async function startIntelligentTestWithIntent (url, intent) {
  const icon = document.getElementById('intelligentTestIcon');
  const label = document.getElementById('intelligentTestLabel');

  try {
    // 🔍 检查扩展上下文是否有效
    if (!chrome.runtime || !chrome.runtime.id) {
      alert('⚠️ 扩展上下文已失效，需要重新加载\n\n请按以下步骤操作：\n1. 打开 chrome://extensions/\n2. 找到"Web功能自动化测试工具"\n3. 点击"重新加载"按钮\n4. 关闭此页面并重新打开');
      return;
    }

    // 设置按钮为Loading状态
    startIntelligentTestBtn.disabled = true;
    if (icon) icon.textContent = '⏳';
    if (label) label.textContent = '正在分析中...';

    // 先打开/定位到目标页
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        const activeTab = tabs[0];
        let targetTab = activeTab;
        if (!activeTab.url || !activeTab.url.startsWith(url)) {
          addLog('正在打开目标页面用于智能分析...', 'info');
          targetTab = await new Promise((resolve) => {
            chrome.tabs.create({ url }, (tab) => resolve(tab));
          });
          await waitForPageReady(targetTab.id, url, 15000);
          await ensureContentScriptReady(targetTab.id);
        }

        addLog('🤖 正在理解测试意图并生成计划...', 'info');
        // 显示生成计划进度
        showGlobalLoading({
          title: '正在生成测试计划',
          text: '🤖 AI正在理解意图并生成测试策略...',
          emoji: '🤖',
          percent: 30
        });

        // 使用回调方式以正确检测runtime错误
        chrome.tabs.sendMessage(targetTab.id, { action: 'startIntelligentTest', userIntent: intent }, (resp) => {
          // 首先检查runtime错误
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message || '';
            console.error('[Popup] startIntelligentTest runtime error:', errorMsg);
            hideGlobalLoading();

            if (errorMsg.includes('context invalidated') || errorMsg.includes('Extension context')) {
              alert('⚠️ 扩展上下文已失效\n\n请重新加载扩展：\n1. 打开 chrome://extensions/\n2. 找到本扩展\n3. 点击"重新加载"\n4. 关闭页面重新打开');
            } else {
              alert('⚠️ 消息发送失败: ' + errorMsg);
            }

            // 恢复按钮状态
            startIntelligentTestBtn.disabled = false;
            if (icon) icon.textContent = '🎯';
            if (label) label.textContent = '让AI智能分析';
            return;
          }

          // 检查响应
          if (!resp) {
            console.error('[Popup] startIntelligentTest 无响应');
            hideGlobalLoading();
            alert('⚠️ 未收到响应，请检查content script是否正常加载');
            startIntelligentTestBtn.disabled = false;
            if (icon) icon.textContent = '🎯';
            if (label) label.textContent = '让AI智能分析';
            return;
          }

          if (resp && resp.success) {
            console.log('[Popup] ✅ 收到AI计划响应:', resp);
            const plan = resp.plan || {};
            console.log('[Popup] AI计划内容:', plan);

            // 更新进度
            updateGlobalLoading({ percent: 70, text: '正在保存计划配置...' });

            // 展示计划
            if (aiPlanContainer) {
              aiPlanContainer.style.display = 'block';
              aiPlanContainer.innerHTML = renderAIPlan(plan);
            }
            addLog('✓ AI计划生成完成，即将按推荐配置启动测试', 'success');

            // 🔥 更新下载测试用例报告按钮为"查看测试用例报告"（可点击）
            if (downloadTestCaseReportBtn) {
              downloadTestCaseReportBtn.disabled = false;
              downloadTestCaseReportBtn.innerHTML = '<span class="icon">📥</span> 查看测试用例报告';
              downloadTestCaseReportBtn.style.background = '#4CAF50'; // 绿色表示已就绪
              downloadTestCaseReportBtn.style.cursor = 'pointer';

              // 保存AI测试用例计划
              chrome.storage.local.set({ aiTestCasePlan: plan });
              console.log('[Popup] ✅ 测试用例报告按钮已更新为可查看状态');
            }

            // 保存AI计划以供报告页展示
            chrome.storage.local.set({ aiPlan: plan });

            // 将推荐配置映射到现有配置
            const rc = plan.recommendedConfig || {};
            const config = {
              testInteraction: rc.testButtons !== false,
              monitorAPI: true,
              captureScreenshot: captureScreenshot.checked,
              captureConsole: captureConsole.checked,
              testForms: rc.testForms !== false,
              testLinks: rc.testLinks !== false,
              delay: parseInt(rc.delay || delayInput.value) || 1200,
              maxElements: parseInt(rc.maxElements || maxElements.value) || 100,
              timeout: parseInt(rc.timeout || timeoutInput.value) || 30
            };

            // 保存与启动常规流程
            chrome.storage.local.set({ savedConfig: config });
            urlInput.value = url; // 保持一致

            // 更新进度为开始执行测试
            updateGlobalLoading({
              title: '正在执行测试',
              percent: 90,
              text: '⚙️ 测试策略已生成，正在启动自动化测试...',
              emoji: '⚙️'
            });

            console.log('[Popup] ========== 准备调用 startAutoTest() ==========');
            console.log('[Popup] 配置:', config);
            console.log('[Popup] URL:', url);

            // 确保URL已填充到输入框（startAutoTest从这里读取）
            urlInput.value = url;

            // 🔥 保存测试状态（关闭popup后可恢复）- 先保存但 tabId 将由 startAutoTest 填充
            const intentStartTime = new Date().toISOString();
            chrome.storage.local.set({
              testingState: {
                inProgress: true,
                mode: 'intelligent',
                url: url,
                intent: intent,
                config: config,
                startTime: intentStartTime,
                tabId: null  // 将由 startAutoTest 更新
              }
            }, () => {
              console.log('[Popup] ✅ 智能测试状态已保存（tabId 将稍后更新）');
              // 确保状态保存完成后再调用 startAutoTest
              console.log('[Popup] 开始调用 startAutoTest()');
              startAutoTest();
            });
          } else {
            hideGlobalLoading();
            const errorMsg = resp?.error || '未知错误';
            console.error('[Popup] startIntelligentTest failed:', errorMsg);
            addLog('❌ AI意图理解失败: ' + errorMsg, 'error');
            alert('⚠️ AI意图理解失败\n\n错误：' + errorMsg + '\n\n请检查：\n1. Qwen API配置是否正确\n2. 网络连接是否正常\n3. Console中的详细错误信息');
            // 恢复按钮状态
            startIntelligentTestBtn.disabled = false;
            if (icon) icon.textContent = '🎯';
            if (label) label.textContent = '让AI智能分析';
          }
        });
      } catch (innerError) {
        hideGlobalLoading();
        console.error('[Popup] 智能测试内部错误:', innerError);
        addLog('❌ 智能分析执行出错: ' + innerError.message, 'error');
        // 恢复按钮状态
        startIntelligentTestBtn.disabled = false;
        const icon = document.getElementById('intelligentTestIcon');
        const label = document.getElementById('intelligentTestLabel');
        if (icon) icon.textContent = '🎯';
        if (label) label.textContent = '让AI智能分析';
      }
    });
  } catch (outerError) {
    hideGlobalLoading();
    console.error('[Popup] 智能测试外部错误:', outerError);
    addLog('❌ 智能测试启动失败: ' + outerError.message, 'error');
    // 恢复按钮状态
    startIntelligentTestBtn.disabled = false;
    const icon = document.getElementById('intelligentTestIcon');
    const label = document.getElementById('intelligentTestLabel');
    if (icon) icon.textContent = '🎯';
    if (label) label.textContent = '让AI智能分析';
  }
}

function renderAIPlan (plan) {
  try {
    const goal = plan?.intentAnalysis?.userGoal || '—';
    const scope = plan?.intentAnalysis?.testScope || '—';
    const areas = plan?.testStrategy?.testAreas || [];
    const recs = plan?.aiInsights?.recommendations || [];
    return `
    <div style="background:#f0f9ff;border-left:4px solid #0066cc;padding:10px;border-radius:6px;">
      <div style="font-weight:600;color:#0066cc;">🤖 AI测试计划</div>
      <div style="margin-top:6px;color:#333;">目标：${goal}</div>
      <div style="color:#333;">范围：${scope}</div>
      <div style="margin-top:6px;color:#333;">重点区域：${areas.map(a => a.area).join('，') || '—'}</div>
      ${recs.length ? `<div style="margin-top:6px;color:#555;">建议：${recs.slice(0, 3).join('；')}</div>` : ''}
    </div>`;
  } catch { return ''; }
}

/**
 * 开始自动测试
 */
async function startAutoTest () {
  console.log('[Popup] ========== startAutoTest() 已调用 ==========');
  const url = urlInput.value.trim();
  console.log('[Popup] 测试URL:', url);

  if (!url) {
    alert('❌ 请输入目标网址');
    return;
  }

  // 构建配置
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

  // 保存配置
  chrome.storage.local.set({ savedConfig: config });

  testingInProgress = true;
  startTestBtn.disabled = true;
  startIntelligentTestBtn.disabled = true;
  stopTestBtn.disabled = false;

  // 🔥 启动状态保活定时器
  startStateKeepAlive();

  // 🔥 保存当前测试意图（如果有）
  const currentIntent = testIntentInput?.value || '';
  if (currentIntent) {
    chrome.storage.local.set({ lastTestIntent: currentIntent });
  }  // 测试过程中更新查看报告按钮为"正在生成报告中"提示
  viewReportBtn.disabled = false;
  const reportIcon = document.getElementById('reportBtnIcon');
  const reportLabel = document.getElementById('reportBtnLabel');
  if (reportIcon) reportIcon.textContent = '⏳';
  if (reportLabel) reportLabel.textContent = '正在生成报告中...';

  // 🔥 不禁用测试用例报告按钮！它已经有AI计划可查看
  // downloadTestCaseReportBtn.disabled = true; // 删除这一行
  console.log('[Popup] ⚠️ 测试用例报告按钮保持可用状态');

  // 🔥 注意：不在此处保存 testingState，等待获取 tab 后再保存（含 tabId）
  statusSection.style.display = 'block';
  statusSection.innerHTML = `
    <h3>测试状态</h3>
    <div class="status-bar">
      <div class="progress-bar" id="progressBar"></div>
    </div>
    <div class="status-info">
      <p>已测试项目: <span id="testedCount">0</span></p>
      <p>成功: <span id="successCount">0</span></p>
      <p>失败: <span id="failureCount">0</span></p>
      <p>验证失败: <span id="apiErrorCount">0</span></p>
    </div>
    <div class="log-area">
      <div id="logContainer" class="log-container"></div>
    </div>
  `;

  // 重新获取元素引用
  testedCount = document.getElementById('testedCount');
  successCount = document.getElementById('successCount');
  failureCount = document.getElementById('failureCount');
  apiErrorCount = document.getElementById('apiErrorCount');
  progressBar = document.getElementById('progressBar');
  logContainer = document.getElementById('logContainer');

  // 🔥 在创建 DOM 元素后，尝试恢复之前保存的统计数据（如果存在）
  chrome.storage.local.get(['testStats'], (result) => {
    if (result.testStats) {
      console.log('[Popup] 🔥 检测到之前保存的统计数据，正在恢复...');
      const stats = result.testStats;
      if (testedCount) testedCount.textContent = stats.testedCount || 0;
      if (successCount) successCount.textContent = stats.successCount || 0;
      if (failureCount) failureCount.textContent = stats.failureCount || 0;
      if (apiErrorCount) apiErrorCount.textContent = stats.apiErrorCount || 0;
      if (progressBar && stats.progress) {
        progressBar.style.width = stats.progress + '%';
      }
      console.log('[Popup] ✅ 统计数据已恢复:', stats);
    }
  });

  addLog('🚀 正在启动自动测试...', 'info');

  // 显示执行阶段的加载提示（若尚未显示）
  if (globalLoadingOverlay && globalLoadingOverlay.style.display === 'none') {
    showGlobalLoading({
      title: '正在执行测试',
      text: '🚀 自动化测试进行中，请稍候...',
      emoji: '🚀',
      percent: 10
    });
  }

  // 打开或导航到目标网址
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];

    // 标准化URL
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

    let targetTab;

    if (currentUrl === targetUrl) {
      addLog('✓ 检测到当前页面就是目标网址，直接在当前页面测试', 'success');
      targetTab = activeTab;
    } else {
      addLog('当前页面与目标网址不同，正在打开新标签页...', 'info');
      targetTab = await new Promise((resolve) => {
        chrome.tabs.create({ url: url }, (tab) => resolve(tab));
      });
    }

    currentTab = targetTab;

    // 🔥🔥🔥 立即保存 tabId 到测试状态（关键！确保状态可被恢复）
    // 优先读取已有的 startTime（如果是恢复测试），否则创建新的
    console.log('[Popup] 🔥 准备保存测试状态...');
    const existingState = await new Promise(resolve => {
      chrome.storage.local.get(['testingState'], r => resolve(r.testingState));
    });

    const startTime = (existingState && existingState.startTime) || new Date().toISOString();
    console.log('[Popup] 🔥 立即保存测试状态（含tabId）:', currentTab.id);
    await new Promise((resolve) => {
      chrome.storage.local.set({
        testingState: {
          inProgress: true,
          mode: testingMode || 'auto',
          url: url,
          config: config,
          startTime: startTime,
          tabId: currentTab.id
        }
      }, () => {
        console.log('[Popup] ✅ 测试状态已保存（含tabId）');
        console.log('');
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║  💾 测试状态已保存到 chrome.storage.local              ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('testingState: {');
        console.log('  inProgress: true,');
        console.log('  mode: "auto",');
        console.log('  url:', url);
        console.log('  tabId:', currentTab.id);
        console.log('  startTime:', startTime);
        console.log('}');
        console.log('');
        resolve();
      });
    });

    // 通知 background 测试已开始
    chrome.runtime.sendMessage({
      action: 'testStarted',
      tabId: currentTab.id,
      url: url
    }).catch(() => { });

    const needWait = (currentUrl !== targetUrl);
    const waitTime = needWait ? 3000 : 1000;

    if (needWait) {
      addLog('等待页面加载...', 'info');
    }

    // 初始化测试数据
    chrome.storage.local.set({
      testData: {
        url: url,
        startTime: startTime,
        buttons: [],
        apiRequests: [],
        errors: [],
        logs: [],
        config: config
      }
    });

    // 等待标签页加载完成并确保内容脚本就绪
    await waitForPageReady(currentTab.id, targetUrl, needWait ? 15000 : 5000);
    await ensureContentScriptReady(currentTab.id);

    // 🔥 立即显示悬浮球（在测试开始前）
    console.log('[Popup] ========== 🔥 立即显示悬浮球 ==========');
    console.log('[Popup] currentTab.id:', currentTab.id);
    console.log('[Popup] currentTab.url:', currentTab.url);

    try {
      const ballResult = await chrome.tabs.sendMessage(currentTab.id, {
        action: 'showFloatingBall'
      });
      console.log('[Popup] ✅ 悬浮球显示命令发送成功，响应:', ballResult);
    } catch (err) {
      console.error('[Popup] ❌ 悬浮球显示失败:', err);
      console.error('[Popup] 错误详情:', err.message);
      if (chrome.runtime.lastError) {
        console.error('[Popup] runtime.lastError:', chrome.runtime.lastError);
      }
      addLog('⚠️ 悬浮球显示失败，但测试继续...', 'warning');
    }

    // 开始测试
    setTimeout(() => {
      addLog('🔍 步骤 1/3: 分析页面结构...', 'info');
      console.log('[Popup] ========== 发送analyzePageStructure消息 ==========');
      console.log('[Popup] TabID:', currentTab.id);
      console.log('[Popup] Config:', config);
      console.log('[Popup] 准备调用 chrome.tabs.sendMessage...');

      chrome.tabs.sendMessage(currentTab.id, {
        action: 'analyzePageStructure',
        config: config
      }).then((analysisResponse) => {
        console.log('[Popup] ========== 🔥 收到analyzePageStructure响应 ==========');
        console.log('[Popup] Response:', analysisResponse);
        console.log('[Popup] Response.success:', analysisResponse?.success);
        console.log('[Popup] Response.elementCount:', analysisResponse?.elementCount);

        if (analysisResponse && analysisResponse.success) {
          addLog('✓ 页面分析完成，检测到 ' + analysisResponse.elementCount + ' 个可交互元素', 'success');

          addLog('📋 步骤 2/3: 生成智能测试计划...', 'info');
          console.log('[Popup] ========== 发送generateTestPlan消息 ==========');

          chrome.tabs.sendMessage(currentTab.id, {
            action: 'generateTestPlan',
            analysis: analysisResponse.analysis,
            config: config
          }).then((planResponse) => {
            console.log('[Popup] ========== 收到generateTestPlan响应 ==========');
            console.log('[Popup] Response:', planResponse);

            if (planResponse && planResponse.success) {
              addLog('✓ 测试计划已生成，共 ' + planResponse.stepCount + ' 个测试步骤', 'success');

              addLog('▶️ 步骤 3/3: 执行自动化测试...', 'info');
              console.log('[Popup] ========== 发送startTest消息 ==========');

              chrome.tabs.sendMessage(currentTab.id, {
                action: 'startTest',
                config: config,
                plan: planResponse.plan
              }).then((response) => {
                console.log('[Popup] ========== 收到startTest响应 ==========');
                console.log('[Popup] Response:', response);

                if (response && response.success) {
                  addLog('✓ 测试命令已发送', 'success');

                  console.log('[Popup] ========== 使用重试机制显示悬浮球 ==========');
                  sendShowBallWithRetry(currentTab.id, { maxRetries: 5, retryInterval: 300, silent: false });

                  isFloatingBallMode = true;
                }
              }).catch((error) => {
                console.error('[Popup] ❌ startTest失败:', error);
                console.error('[Popup] chrome.runtime.lastError:', chrome.runtime.lastError);
                addLog('❌ 测试启动失败: ' + error.message, 'error');
                testingInProgress = false;
                startTestBtn.disabled = false;
                stopTestBtn.disabled = true;
              });
            }
          }).catch((error) => {
            console.error('[Popup] ❌ generateTestPlan失败:', error);
            console.error('[Popup] chrome.runtime.lastError:', chrome.runtime.lastError);
            addLog('❌ 测试计划生成失败: ' + error.message, 'error');
            testingInProgress = false;
            startTestBtn.disabled = false;
            stopTestBtn.disabled = true;
          });
        }
      }).catch((error) => {
        console.error('[Popup] ❌ analyzePageStructure失败:', error);
        console.error('[Popup] chrome.runtime.lastError:', chrome.runtime.lastError);
        addLog('❌ 页面分析失败: ' + error.message, 'error');
        testingInProgress = false;
        startTestBtn.disabled = false;
        stopTestBtn.disabled = true;
      });
    }, 200);
  });
}

/**
 * 开始自定义测试
 */
async function startCustomTest () {
  addLog('🚀 正在启动自定义测试...', 'info');
  addLog(`📋 测试套件: ${uploadedTestCases.testName}`, 'info');
  addLog(`🎯 目标URL: ${uploadedTestCases.targetUrl}`, 'info');

  testingInProgress = true;
  startTestBtn.disabled = true;
  stopTestBtn.disabled = false;
  statusSection.style.display = 'block';
  statusSection.innerHTML = `
    <h3>测试状态</h3>
    <div class="status-bar">
      <div class="progress-bar" id="progressBar"></div>
    </div>
    <div class="status-info">
      <p>已测试步骤: <span id="testedCount">0</span></p>
      <p>通过: <span id="successCount">0</span></p>
      <p>失败: <span id="failureCount">0</span></p>
      <p>警告: <span id="apiErrorCount">0</span></p>
    </div>
    <div class="log-area">
      <div id="logContainer" class="log-container"></div>
    </div>
  `;

  // 重新获取元素引用
  testedCount = document.getElementById('testedCount');
  successCount = document.getElementById('successCount');
  failureCount = document.getElementById('failureCount');
  apiErrorCount = document.getElementById('apiErrorCount');
  progressBar = document.getElementById('progressBar');
  logContainer = document.getElementById('logContainer');

  // 打开或导航到目标网址
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    const targetUrl = uploadedTestCases.targetUrl;

    let targetTab;

    if (activeTab.url === targetUrl || activeTab.url.startsWith(targetUrl)) {
      addLog('✓ 在当前标签页执行测试', 'success');
      targetTab = activeTab;
    } else {
      addLog('正在打开新标签页...', 'info');
      targetTab = await new Promise((resolve) => {
        chrome.tabs.create({ url: targetUrl }, (tab) => resolve(tab));
      });
    }

    currentTab = targetTab;

    // 保存测试用例到storage，等待content-script读取
    chrome.storage.local.set({
      customTestCases: uploadedTestCases,
      customTestState: {
        inProgress: true,
        tabId: currentTab.id,
        startTime: new Date().toISOString(),
        executedSteps: 0,
        passedSteps: 0,
        failedSteps: 0
      }
    });

    // 等待页面加载并确保内容脚本就绪
    await waitForPageReady(currentTab.id, targetUrl, 15000);
    await ensureContentScriptReady(currentTab.id);

    setTimeout(() => {
      addLog('▶️ 开始执行自定义测试用例...', 'info');
      console.log('[Popup] 准备发送executeCustomTestCases消息到tab:', currentTab.id);
      console.log('[Popup] 测试用例数据:', uploadedTestCases);

      chrome.tabs.sendMessage(currentTab.id, {
        action: 'executeCustomTestCases',
        testCases: uploadedTestCases
      }).then((response) => {
        console.log('[Popup] ✅ 收到content-script响应:', response);
        if (response && response.success) {
          addLog('✓ 测试执行命令已发送', 'success');

          // 使用延迟和重试机制确保悬浮球显示
          let retries = 0;
          const maxRetries = 5;
          const retryInterval = 300; // 300ms间隔

          const sendShowBallMessage = () => {
            chrome.tabs.sendMessage(currentTab.id, {
              action: 'showFloatingBall'
            }).then(() => {
              addLog('✓ 悬浮球已显示', 'success');
            }).catch((error) => {
              retries++;
              if (retries < maxRetries) {
                console.log(`[Popup] showFloatingBall 重试 ${retries}/${maxRetries}...`);
                setTimeout(sendShowBallMessage, retryInterval);
              } else {
                console.warn('[Popup] showFloatingBall 重试次数已达上限');
              }
            });
          };

          // 首次发送延迟200ms，确保页面内容脚本已就绪
          setTimeout(sendShowBallMessage, 200);
        }
      }).catch((error) => {
        console.error('[Popup] ❌ 发送executeCustomTestCases消息失败:', error);
        addLog('❌ 测试执行失败: ' + error.message, 'error');
        testingInProgress = false;
        startTestBtn.disabled = false;
        stopTestBtn.disabled = true;
      });
    }, 200);
  });
}

// ==========================
// 辅助：等待标签页加载完成
// ==========================
async function waitForPageReady (tabId, expectedUrl, timeoutMs = 10000) {
  const start = Date.now();

  return new Promise((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    };

    const onUpdated = (updatedTabId, info, tab) => {
      if (updatedTabId !== tabId) return;
      if (info.status === 'complete' || info.status === 'loading') {
        // 简单校验URL是否匹配目标域
        if (!expectedUrl || (tab && tab.url && tab.url.startsWith(expectedUrl))) {
          finish();
        }
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);

    // 兜底：轮询+超时
    const interval = setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        finish();
        return;
      }
      chrome.tabs.get(tabId, (tab) => {
        if (!tab) return;
        if (tab.status === 'complete') {
          clearInterval(interval);
          finish();
        }
      });
    }, 300);
  });
}

// ==========================
// 辅助：确保内容脚本已就绪
// ==========================
async function ensureContentScriptReady (tabId, maxRetries = 40, delayMs = 300) {

  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      if (res && res.success !== undefined) {
        return true;
      }
    } catch (e) {
      // 忽略，继续重试
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  // 到此仍未就绪也不阻塞：让后续逻辑继续，内容脚本通常会随后加载
  return false;
}

// =============================================
// 停止测试按钮
// =============================================

stopTestBtn.addEventListener('click', () => {
  if (!currentTab) return;

  chrome.tabs.sendMessage(currentTab.id, { action: 'stopTest' }).catch(() => { });

  testingInProgress = false;

  // 🔥 停止状态保活定时器
  stopStateKeepAlive();

  startTestBtn.disabled = false;
  startIntelligentTestBtn.disabled = false;
  stopTestBtn.disabled = true;
  // 🔥 不禁用下载按钮！停止测试后用户应该能查看已生成的报告
  // downloadTestCaseReportBtn.disabled = true;
  addLog('⏹️ 测试已停止', 'warning');

  chrome.storage.local.set({ testingState: { inProgress: false } });
});

// =============================================
// 查看报告按钮
// =============================================

viewReportBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/report.html') });
});

// 测试设置弹窗：打开/关闭/保存
if (openTestSettingsBtn) {
  openTestSettingsBtn.addEventListener('click', () => {
    if (testSettingsModal) testSettingsModal.style.display = 'flex';
  });
}
if (closeTestSettingsModal) {
  closeTestSettingsModal.addEventListener('click', () => {
    if (testSettingsModal) testSettingsModal.style.display = 'none';
  });
}
if (closeTestSettingsBtn) {
  closeTestSettingsBtn.addEventListener('click', () => {
    if (testSettingsModal) testSettingsModal.style.display = 'none';
  });
}
if (saveTestSettingsBtn) {
  saveTestSettingsBtn.addEventListener('click', () => {
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
    chrome.storage.local.set({ savedConfig: config }, () => {
      addLog('✅ 测试配置已保存', 'success');
      if (testSettingsModal) testSettingsModal.style.display = 'none';
    });
  });
}

// 查看/下载测试用例报告
if (downloadTestCaseReportBtn) {
  downloadTestCaseReportBtn.addEventListener('click', () => {
    chrome.storage.local.get(['aiTestCasePlan', 'aiPlan'], (result) => {
      const plan = result.aiTestCasePlan || result.aiPlan || {};
      if (!plan || Object.keys(plan).length === 0) {
        alert('❌ 没有可用的测试用例报告\n\n请先点击"AI智能分析"生成测试计划');
        return;
      }

      // 🔥 在新标签页中打开格式化的报告页面
      const reportHtml = generateTestCaseReportHTML(plan);
      const blob = new Blob([reportHtml], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);

      chrome.tabs.create({ url: url }, (tab) => {
        // 延迟释放URL，确保页面加载完成
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      });

      addLog('✅ 测试用例报告已在新标签页打开', 'success');
    });
  });
}

// 生成测试用例报告HTML
function generateTestCaseReportHTML (plan) {
  const intentAnalysis = plan.intentAnalysis || {};
  const testStrategy = plan.testStrategy || {};
  const aiInsights = plan.aiInsights || {};

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI测试用例报告 - ${new Date().toLocaleString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header .subtitle {
      font-size: 1.1em;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 40px;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 5px solid #667eea;
    }
    .section h2 {
      color: #667eea;
      font-size: 1.8em;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section h3 {
      color: #495057;
      font-size: 1.3em;
      margin: 20px 0 10px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .info-item .label {
      font-weight: 600;
      color: #667eea;
      margin-bottom: 5px;
    }
    .info-item .value {
      color: #495057;
    }
    .test-area {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-area h4 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 1.2em;
    }
    .step-list {
      list-style: none;
      padding-left: 0;
    }
    .step-list li {
      padding: 10px;
      margin: 8px 0;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }
    .recommendation {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
    }
    .risk {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
    }
    .download-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #667eea;
      color: white;
      padding: 15px 30px;
      border-radius: 50px;
      border: none;
      font-size: 1.1em;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s;
    }
    .download-btn:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(118, 75, 162, 0.4);
    }
    .tag {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      margin: 5px 5px 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 AI智能测试用例报告</h1>
      <div class="subtitle">生成时间: ${new Date().toLocaleString()}</div>
    </div>

    <div class="content">
      <!-- 意图分析 -->
      <div class="section">
        <h2>🎯 测试意图分析</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">用户目标</div>
            <div class="value">${intentAnalysis.userGoal || '未指定'}</div>
          </div>
          <div class="info-item">
            <div class="label">测试范围</div>
            <div class="value">${intentAnalysis.testScope || '未指定'}</div>
          </div>
          <div class="info-item">
            <div class="label">描述</div>
            <div class="value">${intentAnalysis.description || '无'}</div>
          </div>
        </div>
        ${intentAnalysis.focusAreas && intentAnalysis.focusAreas.length ? `
        <h3>重点关注领域</h3>
        <div>
          ${intentAnalysis.focusAreas.map(area => `<span class="tag">${area}</span>`).join('')}
        </div>
        ` : ''}
      </div>

      <!-- 测试策略 -->
      <div class="section">
        <h2>📋 测试策略</h2>
        ${testStrategy.testAreas && testStrategy.testAreas.length ? testStrategy.testAreas.map(area => `
        <div class="test-area">
          <h4>📌 ${area.area}</h4>
          <p><strong>描述：</strong>${area.description || '无'}</p>
          ${area.steps && area.steps.length ? `
          <p><strong>测试步骤：</strong></p>
          <ul class="step-list">
            ${area.steps.map(step => `<li>${step}</li>`).join('')}
          </ul>
          ` : ''}
        </div>
        `).join('') : '<p>无测试区域数据</p>'}
      </div>

      <!-- AI洞察 -->
      <div class="section">
        <h2>💡 AI洞察建议</h2>
        ${aiInsights.potentialRisks && aiInsights.potentialRisks.length ? `
        <h3>⚠️ 潜在风险</h3>
        ${aiInsights.potentialRisks.map(risk => `
        <div class="risk">
          <strong>风险：</strong>${risk}
        </div>
        `).join('')}
        ` : ''}

        ${aiInsights.recommendations && aiInsights.recommendations.length ? `
        <h3>💡 优化建议</h3>
        ${aiInsights.recommendations.map(rec => `
        <div class="recommendation">
          ${rec}
        </div>
        `).join('')}
        ` : ''}

        ${aiInsights.tips && aiInsights.tips.length ? `
        <h3>📝 测试技巧</h3>
        <ul class="step-list">
          ${aiInsights.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
        ` : ''}
      </div>

      <!-- 推荐配置 -->
      ${plan.recommendedConfig ? `
      <div class="section">
        <h2>⚙️ 推荐测试配置</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">延迟时间</div>
            <div class="value">${plan.recommendedConfig.delay || 1200} ms</div>
          </div>
          <div class="info-item">
            <div class="label">最大元素数</div>
            <div class="value">${plan.recommendedConfig.maxElements || 100}</div>
          </div>
          <div class="info-item">
            <div class="label">超时时间</div>
            <div class="value">${plan.recommendedConfig.timeout || 30} 秒</div>
          </div>
          <div class="info-item">
            <div class="label">测试表单</div>
            <div class="value">${plan.recommendedConfig.testForms !== false ? '✅ 是' : '❌ 否'}</div>
          </div>
          <div class="info-item">
            <div class="label">测试链接</div>
            <div class="value">${plan.recommendedConfig.testLinks !== false ? '✅ 是' : '❌ 否'}</div>
          </div>
          <div class="info-item">
            <div class="label">测试按钮</div>
            <div class="value">${plan.recommendedConfig.testButtons !== false ? '✅ 是' : '❌ 否'}</div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  </div>

  <button class="download-btn" onclick="downloadJSON()">
    📥 下载JSON报告
  </button>

  <script>
    function downloadJSON() {
      const plan = ${JSON.stringify(plan)};
      const dataStr = JSON.stringify(plan, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ai-test-case-plan-' + Date.now() + '.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;
}

// =============================================
// 设置按钮
// =============================================

settingsBtn.addEventListener('click', () => {
  qwenModal.style.display = 'flex';

  chrome.storage.local.get(['qwenApiKey', 'qwenEnabled'], (result) => {
    if (result.qwenApiKey) {
      qwenApiKeyInput.value = result.qwenApiKey;
    }
    if (result.qwenEnabled !== undefined) {
      qwenEnabled.checked = result.qwenEnabled;
    }
  });
});

closeQwenModal.addEventListener('click', () => {
  qwenModal.style.display = 'none';
});

saveQwenBtn.addEventListener('click', () => {
  const apiKey = qwenApiKeyInput.value.trim();
  const enabled = qwenEnabled.checked;

  if (!apiKey) {
    alert('❌ 请输入 API 密钥');
    return;
  }

  chrome.storage.local.set({
    qwenApiKey: apiKey,
    qwenEnabled: enabled
  });

  alert('✅ 配置已保存');
  qwenModal.style.display = 'none';
});

testQwenBtn.addEventListener('click', async () => {
  const apiKey = qwenApiKeyInput.value.trim();

  if (!apiKey) {
    qwenTestResult.style.display = 'block';
    qwenTestResult.textContent = '❌ 请先输入 API 密钥';
    qwenTestResult.style.background = '#f8d7da';
    qwenTestResult.style.color = '#721c24';
    return;
  }

  qwenTestResult.style.display = 'block';
  qwenTestResult.textContent = '⏳ 正在测试连接...';
  qwenTestResult.style.background = '#fff3cd';
  qwenTestResult.style.color = '#856404';

  try {
    const [tab] = await new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'testQwenConnection', apiKey });
    if (resp && resp.success) {
      qwenTestResult.textContent = '✅ 连接成功';
      qwenTestResult.style.background = '#d4edda';
      qwenTestResult.style.color = '#155724';
    } else {
      qwenTestResult.textContent = `❌ 连接失败：${resp?.message || '未知错误'}`;
      qwenTestResult.style.background = '#f8d7da';
      qwenTestResult.style.color = '#721c24';
    }
  } catch (e) {
    qwenTestResult.textContent = `❌ 连接异常：${e.message || '未知异常'}`;
    qwenTestResult.style.background = '#f8d7da';
    qwenTestResult.style.color = '#721c24';
  }
});

// =============================================
// 日志记录函数
// =============================================

function addLog (message, type = 'info') {
  console.log(`[Popup] ${message}`);

  if (!logContainer) return;

  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.style.padding = '8px';
  logEntry.style.marginBottom = '4px';
  logEntry.style.borderRadius = '4px';
  logEntry.style.fontSize = '12px';
  logEntry.style.wordBreak = 'break-all';

  switch (type) {
    case 'success':
      logEntry.style.background = '#d4edda';
      logEntry.style.color = '#155724';
      break;
    case 'error':
      logEntry.style.background = '#f8d7da';
      logEntry.style.color = '#721c24';
      break;
    case 'warning':
      logEntry.style.background = '#fff3cd';
      logEntry.style.color = '#856404';
      break;
    default:
      logEntry.style.background = '#e2e3e5';
      logEntry.style.color = '#383d41';
  }

  logEntry.textContent = message;
  logContainer.appendChild(logEntry);

  // 自动滚动到底部
  logContainer.parentElement.scrollTop = logContainer.parentElement.scrollHeight;

  // 🔥 保存日志到 storage，确保关闭 popup 后仍能看到日志
  chrome.storage.local.get(['testLogs'], (result) => {
    let logs = result.testLogs || [];
    // 限制日志数量，最多保留 100 条
    if (logs.length >= 100) {
      logs.shift();
    }
    logs.push({ message, type, timestamp: new Date().toLocaleTimeString() });
    chrome.storage.local.set({ testLogs: logs });
  });
}

// =============================================
// 消息监听 (从content-script接收消息)
// =============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateTestStats') {
    // 更新测试统计信息
    if (testedCount && successCount && failureCount && apiErrorCount && progressBar) {
      testedCount.textContent = request.testedCount || 0;
      successCount.textContent = request.successCount || 0;
      failureCount.textContent = request.failureCount || 0;
      apiErrorCount.textContent = request.apiErrorCount || 0;

      // 🔥 保存测试统计数据到 storage，确保关闭 popup 后仍能恢复
      chrome.storage.local.set({
        testStats: {
          testedCount: request.testedCount || 0,
          successCount: request.successCount || 0,
          failureCount: request.failureCount || 0,
          apiErrorCount: request.apiErrorCount || 0,
          progress: request.progress || 0
        }
      });

      if (request.progress) {
        progressBar.style.width = request.progress + '%';
        // 同步更新全局加载提示进度（若显示中）
        if (globalLoadingOverlay && globalLoadingOverlay.style.display !== 'none') {
          updateGlobalLoading({
            percent: Math.min(90, 10 + request.progress * 0.8),
            text: `⚙️ 已测试: ${request.testedCount || 0} 项，成功: ${request.successCount || 0} 项`
          });
        }
      }
    }
  } else if (request.action === 'updateStatus') {
    // 来自content-script的状态更新（经background转发）
    const d = request.data || {};
    if (testedCount && successCount && failureCount && apiErrorCount && progressBar) {
      testedCount.textContent = d.testedCount || 0;
      successCount.textContent = d.successCount || 0;
      failureCount.textContent = d.failureCount || 0;
      apiErrorCount.textContent = d.apiErrorCount || 0;
      const total = d.totalButtons || 0;
      const pct = total > 0 ? Math.round((d.testedCount || 0) / total * 100) : 0;
      progressBar.style.width = pct + '%';

      // 🔥 保存测试统计数据到 storage，确保关闭 popup 后仍能恢复
      chrome.storage.local.set({
        testStats: {
          testedCount: d.testedCount || 0,
          successCount: d.successCount || 0,
          failureCount: d.failureCount || 0,
          apiErrorCount: d.apiErrorCount || 0,
          progress: pct || 0
        }
      }, () => {
        console.log('[Popup] 💾 testStats 已保存:', {
          testedCount: d.testedCount,
          successCount: d.successCount,
          failureCount: d.failureCount,
          progress: pct
        });
      });

      // 同步更新全局加载提示进度（若显示中）
      if (globalLoadingOverlay && globalLoadingOverlay.style.display !== 'none') {
        updateGlobalLoading({
          percent: Math.min(90, 10 + pct * 0.8),
          text: `⚙️ 已测试: ${d.testedCount || 0} 项，成功: ${d.successCount || 0} 项`
        });
      }
    }
  } else if (request.action === 'testLog' || request.action === 'addLog') {
    // 接收来自content-script的日志
    addLog(request.message, request.type);
  } else if (request.action === 'testCompleted' || request.action === 'testComplete') {
    // 测试完成 - 关闭加载提示
    hideGlobalLoading();

    testingInProgress = false;

    // 🔥 停止状态保活定时器
    stopStateKeepAlive();

    // 🔔 发送桌面通知
    chrome.storage.local.get(['testStats'], (statsResult) => {
      const stats = statsResult.testStats || {};
      const successCount = stats.successCount || 0;
      const failureCount = stats.failureCount || 0;
      const testedCount = stats.testedCount || 0;

      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('images/icon-128.png'),
        title: '✅ 测试完成',
        message: `总计: ${testedCount} 项 | ✅ 成功: ${successCount} | ❌ 失败: ${failureCount}`,
        priority: 2
      });

      console.log('[Popup] 🔔 测试完成通知已发送');
    });

    startTestBtn.disabled = false;
    startIntelligentTestBtn.disabled = false;
    stopTestBtn.disabled = true;
    viewReportBtn.disabled = false;

    // 恢复"让AI智能分析"按钮状态
    const iconEl = document.getElementById('intelligentTestIcon');
    const labelEl = document.getElementById('intelligentTestLabel');
    if (iconEl) iconEl.textContent = '🎯';
    if (labelEl) labelEl.textContent = '让AI智能分析';

    // 更新下载测试用例报告按钮为完成状态
    if (downloadTestCaseReportBtn) {
      downloadTestCaseReportBtn.disabled = false;
      downloadTestCaseReportBtn.innerHTML = '<span class="icon">📥</span> 下载测试用例报告';
      console.log('[Popup] ✅ 测试用例报告按钮已更新为可下载状态');
    }
    // 恢复"查看报告"按钮状态
    const reportIcon = document.getElementById('reportBtnIcon');
    const reportLabel = document.getElementById('reportBtnLabel');
    if (reportIcon) reportIcon.textContent = '📊';
    if (reportLabel) reportLabel.textContent = '查看报告';

    // 修改主界面按钮文案为“再次测试”
    try {
      startTestBtn.innerHTML = '<span class="icon">🔄</span> 再次测试';
    } catch { }

    addLog('✅ 测试已完成，可查看报告', 'success');

    // 清除测试状态，标记为已完成
    chrome.storage.local.set({
      testingState: {
        inProgress: false,
        completed: true,
        completedAt: new Date().toISOString()
      }
    });
  }
});

// =============================================
// 🔥 定时保存测试状态（防止弹窗关闭导致状态丢失）
// =============================================
let stateKeepAliveTimer = null;

function startStateKeepAlive () {
  // 清除旧的定时器
  if (stateKeepAliveTimer) {
    clearInterval(stateKeepAliveTimer);
  }

  console.log('[Popup] 🔥 启动状态保活定时器（每2秒刷新一次）');

  // 每2秒刷新一次状态
  let healthCheckCount = 0;
  stateKeepAliveTimer = setInterval(() => {
    healthCheckCount++;
    if (testingInProgress && currentTab) {
      chrome.storage.local.get(['testingState'], (result) => {
        const existing = result.testingState || {};
        chrome.storage.local.set({
          testingState: {
            ...existing,
            inProgress: true,
            tabId: currentTab.id,
            lastUpdate: new Date().toISOString(),
            healthCheck: healthCheckCount
          }
        }, () => {
          console.log('[Popup] ♻️ 状态已刷新（保活, 第' + healthCheckCount + '次）');
        });
      });
    } else if (!testingInProgress) {
      console.log('[Popup] ℹ️ 测试未进行中，停止刷新');
      stopStateKeepAlive();
    }
  }, 2000);
}

function stopStateKeepAlive () {
  if (stateKeepAliveTimer) {
    console.log('[Popup] 🛑 停止状态保活定时器');
    clearInterval(stateKeepAliveTimer);
    stateKeepAliveTimer = null;
  }
}

// 🔥 popup 关闭时的最后保存尝试（使用 unload 而非 beforeunload）
window.addEventListener('unload', () => {
  console.log('[Popup] ⚠️ 弹窗正在卸载，最后一次保存状态...');

  stopStateKeepAlive();

  if (testingInProgress && currentTab) {
    console.log('[Popup] 🔥 检测到测试进行中，同步保存状态');
    // 使用同步的方式保存（尽管异步，但会尽力完成）
    chrome.storage.local.set({
      testingState: {
        inProgress: true,
        mode: testingMode || 'auto',
        url: urlInput?.value || '',
        tabId: currentTab.id,
        startTime: new Date().toISOString()
      }
    });
  }
});
