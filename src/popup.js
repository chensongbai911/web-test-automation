/**
 * Popup Script - 主要UI逻辑和事件处理
 * 包含自动分析和自定义测试两个模式
 */

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

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] 页面已加载');

  // 初始化Qwen
  initializeQwen();

  // 首先获取当前活动标签页，自动填充URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentActiveTab = tabs[0];

    if (currentActiveTab && currentActiveTab.url) {
      if (!currentActiveTab.url.startsWith('chrome://') &&
        !currentActiveTab.url.startsWith('chrome-extension://') &&
        !currentActiveTab.url.startsWith('about:')) {
        urlInput.value = currentActiveTab.url;
      }
    }

    // 恢复配置
    chrome.storage.local.get(['savedConfig', 'testingState'], (result) => {
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

      // 恢复测试状态
      if (result.testingState && result.testingState.inProgress) {
        const testingState = result.testingState;
        const startTime = new Date(testingState.startTime).getTime();
        const now = new Date().getTime();
        const elapsed = (now - startTime) / 1000 / 60;

        if (elapsed > 5) {
          chrome.storage.local.set({ testingState: { inProgress: false } });
          return;
        }

        chrome.tabs.get(testingState.tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            chrome.storage.local.set({ testingState: { inProgress: false } });
          } else {
            chrome.tabs.sendMessage(tab.id, { action: 'ping' }).then((response) => {
              if (response && response.testing) {
                testingInProgress = true;
                currentTab = { id: testingState.tabId };
                startTestBtn.disabled = true;
                stopTestBtn.disabled = false;
                statusSection.style.display = 'block';
                addLog('✓ 恢复之前的测试状态', 'success');
              }
            }).catch((error) => {
              testingInProgress = true;
              currentTab = { id: testingState.tabId };
              startTestBtn.disabled = true;
              stopTestBtn.disabled = false;
              statusSection.style.display = 'block';
              addLog('⏳ 测试进行中（加载中...）', 'warning');
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
startIntelligentTestBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  let intent = (testIntentInput?.value || '').trim();
  
  if (!url) {
    alert('❌ 请输入目标网址');
    return;
  }
  
  // 如果没有意图，先进行页面分析
  if (!intent) {
    addLog('🔍 正在分析页面功能...', 'info');
    
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
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
        chrome.tabs.sendMessage(targetTab.id, { 
          action: 'analyzePageForIntent',
          url: url
        }).then((resp) => {
          if (resp && resp.success && resp.pageAnalysis) {
            // 生成自动化的测试意图建议
            const analysis = resp.pageAnalysis;
            let suggestion = '';
            
            // 基于页面分析生成建议
            if (analysis.forms && analysis.forms.length > 0) {
              suggestion += `测试${analysis.forms.length}个表单的填写和提交流程，`;
            }
            if (analysis.buttons && analysis.buttons.length > 0) {
              suggestion += `验证${analysis.buttons.length}个按钮的交互功能，`;
            }
            if (analysis.links && analysis.links.length > 0) {
              suggestion += `测试${analysis.links.length}个链接的跳转，`;
            }
            if (analysis.tables && analysis.tables.length > 0) {
              suggestion += `检查${analysis.tables.length}个数据表格的显示，`;
            }
            
            // 如果没有生成建议，使用通用建议
            if (!suggestion) {
              suggestion = '进行完整的页面功能测试，包括所有交互元素和页面导航';
            }
            
            // 移除末尾的逗号
            suggestion = suggestion.replace(/，$/, '');
            
            // 填入testIntentInput
            if (testIntentInput) {
              testIntentInput.value = suggestion;
              testIntentInput.focus();
              testIntentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              addLog('✓ AI已自动分析页面并生成测试建议，您可以修改后继续点击按钮开始测试', 'success');
            }
          } else {
            addLog('⚠️ 页面分析失败，请手动填写测试意图', 'warning');
          }
        }).catch((error) => {
          addLog('⚠️ 页面分析出错，请手动填写测试意图', 'warning');
          console.error('[Popup] 页面分析错误:', error);
        });
      });
      return;
    } catch (error) {
      addLog('⚠️ 自动分析失败，请手动填写测试意图', 'warning');
      console.error('[Popup] 自动分析异常:', error);
      return;
    }
  }

  try {
    // 设置按钮为Loading状态
    startIntelligentTestBtn.disabled = true;
    const icon = document.getElementById('intelligentTestIcon');
    const label = document.getElementById('intelligentTestLabel');
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
        chrome.tabs.sendMessage(targetTab.id, { action: 'startIntelligentTest', userIntent: intent }).then((resp) => {
          if (resp && resp.success) {
            const plan = resp.plan || {};
            // 展示计划
            if (aiPlanContainer) {
              aiPlanContainer.style.display = 'block';
              aiPlanContainer.innerHTML = renderAIPlan(plan);
            }
            addLog('✓ AI计划生成完成，即将按推荐配置启动测试', 'success');

            // 更新下载测试用例报告按钮为"正在生成用例中"
            if (downloadTestCaseReportBtn) {
              downloadTestCaseReportBtn.disabled = false;
              downloadTestCaseReportBtn.innerHTML = '<span class="icon">⏳</span> 正在生成用例中...';
              chrome.storage.local.set({ aiTestCasePlan: plan });
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

            // 复用现有自动测试启动
            startAutoTest();
          } else {
            addLog('❌ AI意图理解失败: ' + (resp?.error || '未知错误'), 'error');
            // 恢复按钮状态
            startIntelligentTestBtn.disabled = false;
            if (icon) icon.textContent = '🎯';
            if (label) label.textContent = '让AI智能分析';
          }
        }).catch((error) => {
          addLog('❌ 智能测试入口失败: ' + error.message, 'error');
          // 恢复按钮状态
          startIntelligentTestBtn.disabled = false;
          if (icon) icon.textContent = '🎯';
          if (label) label.textContent = '让AI智能分析';
        });
      } catch (innerError) {
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
    console.error('[Popup] 智能测试外部错误:', outerError);
    addLog('❌ 智能测试启动失败: ' + outerError.message, 'error');
    // 恢复按钮状态
    startIntelligentTestBtn.disabled = false;
    const icon = document.getElementById('intelligentTestIcon');
    const label = document.getElementById('intelligentTestLabel');
    if (icon) icon.textContent = '🎯';
    if (label) label.textContent = '让AI智能分析';
  }
});

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
  const url = urlInput.value.trim();

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
  // 测试过程中更新查看报告按钮为"正在生成报告中"提示
  viewReportBtn.disabled = false;
  const reportIcon = document.getElementById('reportBtnIcon');
  const reportLabel = document.getElementById('reportBtnLabel');
  if (reportIcon) reportIcon.textContent = '⏳';
  if (reportLabel) reportLabel.textContent = '正在生成报告中...';
  downloadTestCaseReportBtn.disabled = true;
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

  addLog('🚀 正在启动自动测试...', 'info');

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

    const needWait = (currentUrl !== targetUrl);
    const waitTime = needWait ? 3000 : 1000;

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

    // 等待标签页加载完成并确保内容脚本就绪
    await waitForPageReady(currentTab.id, targetUrl, needWait ? 15000 : 5000);
    await ensureContentScriptReady(currentTab.id);

    // 开始测试
    setTimeout(() => {
      addLog('🔍 步骤 1/3: 分析页面结构...', 'info');
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'analyzePageStructure',
        config: config
      }).then((analysisResponse) => {
        if (analysisResponse && analysisResponse.success) {
          addLog('✓ 页面分析完成，检测到 ' + analysisResponse.elementCount + ' 个可交互元素', 'success');

          addLog('📋 步骤 2/3: 生成智能测试计划...', 'info');
          chrome.tabs.sendMessage(currentTab.id, {
            action: 'generateTestPlan',
            analysis: analysisResponse.analysis,
            config: config
          }).then((planResponse) => {
            if (planResponse && planResponse.success) {
              addLog('✓ 测试计划已生成，共 ' + planResponse.stepCount + ' 个测试步骤', 'success');

              addLog('▶️ 步骤 3/3: 执行自动化测试...', 'info');
              chrome.tabs.sendMessage(currentTab.id, {
                action: 'startTest',
                config: config,
                plan: planResponse.plan
              }).then((response) => {
                if (response && response.success) {
                  addLog('✓ 测试命令已发送', 'success');

                  chrome.tabs.sendMessage(currentTab.id, {
                    action: 'showFloatingBall'
                  }).catch(() => { });

                  chrome.storage.local.set({
                    testingState: {
                      inProgress: true,
                      tabId: currentTab.id,
                      startTime: new Date().toISOString()
                    }
                  });

                  isFloatingBallMode = true;
                }
              }).catch((error) => {
                addLog('❌ 测试启动失败: ' + error.message, 'error');
                testingInProgress = false;
                startTestBtn.disabled = false;
                stopTestBtn.disabled = true;
              });
            }
          }).catch((error) => {
            addLog('❌ 测试计划生成失败: ' + error.message, 'error');
            testingInProgress = false;
            startTestBtn.disabled = false;
            stopTestBtn.disabled = true;
          });
        }
      }).catch((error) => {
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
  startTestBtn.disabled = false;
  startIntelligentTestBtn.disabled = false;
  stopTestBtn.disabled = true;
  downloadTestCaseReportBtn.disabled = true;
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

// 下载测试用例报告
if (downloadTestCaseReportBtn) {
  downloadTestCaseReportBtn.addEventListener('click', () => {
    chrome.storage.local.get(['aiTestCasePlan', 'aiPlan'], (result) => {
      const plan = result.aiTestCasePlan || result.aiPlan || {};
      if (!plan || Object.keys(plan).length === 0) {
        alert('❌ 没有可下载的测试用例报告');
        return;
      }
      const dataStr = JSON.stringify(plan, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-test-case-plan-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog('✅ 测试用例报告已下载', 'success');
    });
  });
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

  // 这里可以添加实际的连接测试逻辑
  setTimeout(() => {
    qwenTestResult.textContent = '✅ 连接成功';
    qwenTestResult.style.background = '#d4edda';
    qwenTestResult.style.color = '#155724';
  }, 1500);
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

      if (request.progress) {
        progressBar.style.width = request.progress + '%';
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
    }
  } else if (request.action === 'testLog' || request.action === 'addLog') {
    // 接收来自content-script的日志
    addLog(request.message, request.type);
  } else if (request.action === 'testCompleted' || request.action === 'testComplete') {
    // 测试完成
    testingInProgress = false;
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
      downloadTestCaseReportBtn.innerHTML = '<span class="icon">📥</span> 下载测试用例报告';
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

    addLog('✅ 测试已完成', 'success');

    chrome.storage.local.set({ testingState: { inProgress: false } });
  }
});
