// 内容脚本 - 在页面上下文中运行
console.log('[Web测试工具] Content script已加载');

// 初始化全局处理器（等待其他脚本加载完成）
setTimeout(() => {
  try {
    // 🤖 初始化AI测试编排器（优先）
    if (typeof AITestOrchestrator !== 'undefined') {
      window.aiTestOrchestrator = window.aiTestOrchestrator || new AITestOrchestrator();
      console.log('[Web测试工具] ✅ AI测试编排器已初始化 - 智能模式启用');
    }

    // 初始化增强报告器
    if (typeof EnhancedTestReporter !== 'undefined') {
      window.enhancedReporter = window.enhancedReporter || new EnhancedTestReporter();
      console.log('[Web测试工具] 增强报告器已初始化');
    }

    // 初始化AI表单分析器
    if (typeof AIFormAnalyzer !== 'undefined') {
      window.aiFormAnalyzer = window.aiFormAnalyzer || new AIFormAnalyzer();
      console.log('[Web测试工具] AI表单分析器已初始化');
    }

    // 初始化复杂表单处理器
    if (typeof ComplexFormHandler !== 'undefined') {
      window.complexFormHandler = window.complexFormHandler || new ComplexFormHandler();
      console.log('[Web测试工具] 复杂表单处理器已初始化');
    } else {
      console.warn('[Web测试工具] ComplexFormHandler类未找到');
    }

    // 🎯 如果AI编排器可用，显示增强功能提示
    if (window.aiTestOrchestrator && window.aiTestOrchestrator.qwen) {
      console.log('%c🚀 AI增强功能已激活！', 'color: #4CAF50; font-size: 14px; font-weight: bold');
      console.log('%c  ✓ 智能测试策略生成', 'color: #2196F3');
      console.log('%c  ✓ 动态元素智能定位', 'color: #2196F3');
      console.log('%c  ✓ 异常自动诊断修复', 'color: #2196F3');
      console.log('%c  ✓ 智能测试数据生成', 'color: #2196F3');
      console.log('%c  ✓ 测试结果深度分析', 'color: #2196F3');
    }
  } catch (err) {
    console.error('[Web测试工具] 初始化处理器失败:', err);
  }
}, 100);

let testConfig = {};
let testActive = false;
let originalUrl = null; // 保存原始URL用于回退
let testStartDomain = null; // 测试开始的域名
let testedUrls = new Set(); // 记录已测试过的URL，防止重复

let testStats = {
  testedCount: 0,
  successCount: 0,
  failureCount: 0,
  apiErrorCount: 0,
  totalButtons: 0
};

// 提取主域名（一级域名）
function getBaseDomain (url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // 提取一级域名（如baidu.com）
    const parts = hostname.split('.');
    if (parts.length > 1) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch {
    return null;
  }
}

// 检查URL是否在同一级域名下
function isSameDomain (url1, url2) {
  const domain1 = getBaseDomain(url1);
  const domain2 = getBaseDomain(url2);
  return domain1 && domain2 && domain1 === domain2;
}

// 检查是否已测试过该URL
function isUrlAlreadyTested (url) {
  return testedUrls.has(url);
}

// 添加已测试的URL
function addTestedUrl (url) {
  testedUrls.add(url);
}

// 保存原始fetch和XMLHttpRequest
const originalFetch = window.fetch;
const originalXHR = window.XMLHttpRequest;
let apiRequests = [];

// 拦截fetch请求
window.fetch = function (...args) {
  const request = {
    type: 'fetch',
    method: args[1]?.method || 'GET',
    url: args[0],
    timestamp: new Date().toISOString(),
    status: null,
    error: null
  };

  return originalFetch.apply(this, args)
    .then(response => {
      request.status = response.status;
      apiRequests.push(request);
      if (testConfig.monitorAPI) {
        notifyPopup('addLog', `API请求: ${request.method} ${request.url} - ${response.status}`, 'info');
      }
      return response;
    })
    .catch(error => {
      request.error = error.message;
      apiRequests.push(request);
      notifyPopup('addLog', `API错误: ${request.method} ${request.url} - ${error.message}`, 'error');
      testStats.apiErrorCount++;
      throw error;
    });
};

// 拦截XMLHttpRequest
const XHROpen = originalXHR.prototype.open;
originalXHR.prototype.open = function (method, url, ...rest) {
  this._testMethod = method;
  this._testUrl = url;
  return XHROpen.apply(this, [method, url, ...rest]);
};

const XHRSend = originalXHR.prototype.send;
originalXHR.prototype.send = function (...args) {
  const request = {
    type: 'xhr',
    method: this._testMethod || 'GET',
    url: this._testUrl,
    timestamp: new Date().toISOString(),
    status: null,
    error: null
  };

  this.addEventListener('load', () => {
    request.status = this.status;
    apiRequests.push(request);
    if (testConfig.monitorAPI) {
      notifyPopup('addLog', `XHR请求: ${request.method} ${request.url} - ${this.status}`, 'info');
    }
  });

  this.addEventListener('error', () => {
    request.error = 'XHR Error';
    apiRequests.push(request);
    notifyPopup('addLog', `XHR错误: ${request.method} ${request.url}`, 'error');
    testStats.apiErrorCount++;
  });

  return XHRSend.apply(this, args);
};

// 通知popup（如果popup已关闭则忽略错误）
function notifyPopup (action, message, type = 'info') {
  // 优先使用悬浮球显示日志
  if (action === 'addLog' && window.floatingBallManager) {
    console.log('[通知] 悬浮球日志:', message);
    window.floatingBallManager.addLog(message, type);
  }

  // 尝试发送到popup（可能已关闭）- 静默失败
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: action,
      message: message,
      type: type
    }, (response) => {
      // 静默处理错误
      if (chrome.runtime.lastError) {
        // Popup已关闭是正常的
      }
    });
  }
}

// 通知悬浮球
function notifyFloatingBall (action, data) {
  try {
    if (window.floatingBallManager) {
      switch (action) {
        case 'updateProgress':
          window.floatingBallManager.updateProgress(data);
          break;
        case 'addLog':
          window.floatingBallManager.addLog(data.message, data.type);
          break;
        case 'updateStatus':
          window.floatingBallManager.updateStatus(data);
          break;
        case 'testComplete':
          window.floatingBallManager.setTestComplete();
          break;
      }
    }
  } catch (e) {
    console.log('无法通知悬浮球:', e);
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Web测试工具] 收到消息:', request.action);

  if (request.action === 'ping') {
    // 响应ping消息，告知当前测试状态
    sendResponse({ success: true, testing: testActive });
  } else if (request.action === 'analyzePageStructure') {
    // 🆕 分析页面结构，提取所有可交互元素
    console.log('[Web测试工具] 开始分析页面结构...');
    testConfig = request.config;

    try {
      const elements = getInteractiveElements();
      const analysis = {
        pageTitle: document.title,
        pageUrl: window.location.href,
        elementCount: elements.length,
        elements: elements.map(el => ({
          type: el.type,
          text: el.text,
          selector: el.selector
        }))
      };

      console.log('[Web测试工具] 页面分析完成，检测到 ' + elements.length + ' 个元素');
      sendResponse({
        success: true,
        analysis: analysis,
        elementCount: elements.length
      });
    } catch (error) {
      console.error('[Web测试工具] 页面分析失败:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  } else if (request.action === 'generateTestPlan') {
    // 🆕 生成测试计划
    console.log('[Web测试工具] 开始生成测试计划...');

    try {
      const analysis = request.analysis;
      // 简单的测试计划：按顺序测试所有元素
      const testPlan = {
        steps: (analysis.elements || []).map((el, index) => ({
          stepId: index + 1,
          action: el.type === 'input' ? 'fill' : el.type === 'link' ? 'navigate' : 'click',
          target: el.selector,
          description: `测试${el.type}：${el.text}`
        }))
      };

      console.log('[Web测试工具] 测试计划已生成，共 ' + testPlan.steps.length + ' 个步骤');
      const estimatedSeconds = testPlan.steps.length * (testConfig.delay || 1200) / 1000;

      sendResponse({
        success: true,
        plan: testPlan,
        stepCount: testPlan.steps.length,
        estimatedDuration: Math.round(estimatedSeconds)
      });
    } catch (error) {
      console.error('[Web测试工具] 测试计划生成失败:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  } else if (request.action === 'executeCustomTestCases') {
    // 🆕 执行自定义测试用例
    console.log('[Web测试工具] 开始执行自定义测试用例...');

    (async () => {
      try {
        const testCases = request.testCases;

        if (!window.CustomTestExecutor) {
          throw new Error('CustomTestExecutor 未加载');
        }

        const executor = new window.CustomTestExecutor();
        const results = await executor.executeTestCases(testCases);

        // 保存测试结果到Chrome storage
        chrome.storage.local.set({
          lastTestReport: {
            type: 'custom',
            testName: testCases.testName,
            targetUrl: testCases.targetUrl,
            results: results,
            timestamp: new Date().toISOString()
          }
        });

        // 发送完成消息
        chrome.runtime.sendMessage({
          action: 'testCompleted',
          results: results
        }).catch(() => { });

        console.log('[Web测试工具] ✅ 自定义测试用例执行完成');
        sendResponse({ success: true, results: results });
      } catch (error) {
        console.error('[Web测试工具] 自定义测试执行失败:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // 异步响应
  } else if (request.action === 'startTest') {
    console.log('[Web测试工具] 收到startTest消息，配置:', request.config);
    testConfig = request.config;

    // 🔑 关键修复：立即响应popup，说明测试已启动
    // 然后在后台异步执行测试
    sendResponse({ success: true });

    // 异步执行测试（不等待）
    startAutomatedTest().catch(err => {
      console.error('[Web测试工具] 测试执行出错:', err);
      notifyPopup('addLog', `❌ 测试出错: ${err.message}`, 'error');
    });
  } else if (request.action === 'stopTest') {
    testActive = false;
    sendResponse({ success: true });
  } else if (request.action === 'showFloatingBall') {
    if (window.floatingBallManager) {
      window.floatingBallManager.showBall();
    }
    sendResponse({ success: true });
  } else if (request.action === 'hideFloatingBall') {
    if (window.floatingBallManager) {
      window.floatingBallManager.hideBall();
    }
    sendResponse({ success: true });
  } else if (request.action === 'pauseTest') {
    testActive = false;
    notifyPopup('addLog', '⏸ 测试已暂停', 'warning');
    sendResponse({ success: true });
  } else if (request.action === 'resumeTest') {
    testActive = true;
    notifyPopup('addLog', '▶ 测试已继续', 'info');
    sendResponse({ success: true });
  }

  return true; // 保持消息通道开启，支持异步响应
});

// 获取所有可交互的元素
function getInteractiveElements () {
  const elements = [];
  const maxElements = testConfig.maxElements || 100;

  // 获取所有按钮（如果启用）
  if (testConfig.testInteraction !== false) {
    document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]').forEach(el => {
      if (elements.length >= maxElements) return;
      if (el.offsetParent !== null && el.offsetWidth > 0 && el.offsetHeight > 0) {
        elements.push({
          element: el,
          type: 'button',
          text: el.textContent.trim().substring(0, 50) || el.value || 'Button',
          selector: getElementSelector(el)
        });
      }
    });
  }

  // 获取所有链接（如果启用，只保留同域名链接）
  if (testConfig.testLinks !== false) {
    document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript:"])').forEach(el => {
      if (elements.length >= maxElements) return;
      if (el.offsetParent !== null && el.offsetWidth > 0 && el.offsetHeight > 0) {
        const href = el.href;
        const isRelativeLink = href.startsWith('/') || !href.includes('://');
        const isSameDomainLink = href.includes('://') ? isSameDomain(href, window.location.href) : true;

        // 只添加同域名的链接，且未测试过
        if ((isRelativeLink || isSameDomainLink) && !isUrlAlreadyTested(href)) {
          elements.push({
            element: el,
            type: 'link',
            text: el.textContent.trim().substring(0, 50) || el.href,
            url: href,
            selector: getElementSelector(el)
          });
        }
      }
    });
  }

  // 获取所有表单输入（如果启用）
  if (testConfig.testForms !== false) {
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], textarea, select').forEach(el => {
      if (elements.length >= maxElements) return;
      if (el.offsetParent !== null && el.offsetWidth > 0 && el.offsetHeight > 0) {
        elements.push({
          element: el,
          type: 'input',
          text: el.placeholder || el.name || el.id || 'Input Field',
          selector: getElementSelector(el)
        });
      }
    });
  }

  return elements;
}

// 获取元素选择器
function getElementSelector (element) {
  if (element.id) return `#${element.id}`;

  let path = [];
  while (element.parentElement) {
    let index = Array.from(element.parentElement.children).indexOf(element);
    let tagName = element.tagName.toLowerCase();
    path.unshift(`${tagName}[${index}]`);
    element = element.parentElement;
  }
  return path.join(' > ');
}

// 自动滚动页面以加载所有内容
async function scrollPageToBottom () {
  notifyPopup('addLog', '🔄 正在自动滚动页面，加载所有内容...', 'info');

  return new Promise((resolve) => {
    let totalHeight = 0;
    const distance = 300; // 每次滚动距离
    const delayTime = 400; // 每次滚动延迟

    const timer = setInterval(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      window.scrollBy(0, distance);
      totalHeight += distance;

      // 触发懒加载图片
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => {
        if (img.getBoundingClientRect().top < window.innerHeight + 1000) {
          img.loading = 'eager';
        }
      });

      // 到达底部
      if (totalHeight >= scrollHeight || window.innerHeight + window.scrollY >= scrollHeight - 100) {
        clearInterval(timer);
        notifyPopup('addLog', '✓ 已滚动到页面底部', 'success');
        // 滚动回顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          notifyPopup('addLog', '✓ 已返回页面顶部，准备开始测试', 'success');
          resolve();
        }, 800);
      }
    }, delayTime);

    // 最多滚动30秒
    setTimeout(() => {
      clearInterval(timer);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(resolve, 500);
    }, 30000);
  });
}

// AI增强的弹框识别（如果Qwen可用）
async function aiIdentifyModalCloseButton (modal) {
  try {
    // 检查是否有Qwen实例
    const apiKey = await new Promise(resolve => {
      chrome.storage.local.get(['qwenApiKey'], result => {
        resolve(result.qwenApiKey || null);
      });
    });

    if (!apiKey || typeof QwenIntegration === 'undefined') {
      return null;
    }

    const qwen = new QwenIntegration(apiKey);
    const modalHTML = modal.outerHTML;
    const context = {
      currentAction: '测试点击后弹出',
      modalType: modal.className || 'unknown'
    };

    notifyPopup('addLog', '  🤖 启用AI智能识别弹框...', 'info');
    const aiResult = await qwen.identifyModalCloseButton(modalHTML, context);

    if (aiResult && aiResult.closeButtons && aiResult.closeButtons.length > 0) {
      notifyPopup('addLog', `  🎯 AI识别到 ${aiResult.closeButtons.length} 个关闭按钮`, 'success');
      return aiResult;
    }

    return null;
  } catch (error) {
    console.error('[AI弹框识别] 错误:', error);
    return null;
  }
}

// 检测并处理弹框/模态框
async function checkAndHandleModal () {
  try {
    await delay(200); // 等待弹框出现

    // 查找各种可能的模态框（扩展选择器）
    const modalSelectors = [
      // Bootstrap模态框
      '.modal.show', '.modal.in', '.modal-dialog', '.modal.fade.show',
      // Ant Design
      '.ant-modal', '.ant-modal-wrap',
      // Element UI
      '.el-dialog', '.el-dialog__wrapper',
      // Layui
      '.layui-layer', '.layui-layer-dialog',
      // 通用
      '[role="dialog"]', '[role="alertdialog"]',
      '.popup', '.dialog', '.overlay', '.dialog-wrapper',
      // React/Vue组件
      '.ReactModal__Content', '.MuiDialog-root',
      // 自定义常见类名
      '[class*="dialog"]', '[class*="modal"]', '[class*="popup"]',
      // iView/ViewUI
      '.ivu-modal', '.ivu-modal-wrap'
    ];

    let modal = null;
    let modalType = '';

    for (const selector of modalSelectors) {
      const found = document.querySelector(selector);
      if (found && found.offsetParent !== null) {
        // 检查是否真的可见（有时display:none但offsetParent不为null）
        const style = window.getComputedStyle(found);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          modal = found;
          modalType = selector;
          break;
        }
      }
    }

    if (!modal) {
      return false;
    }

    notifyPopup('addLog', `  🔍 检测到弹框 (${modalType})，准备处理...`, 'info');

    // 🤖 尝试使用AI识别弹框关闭按钮
    let aiResult = null;
    try {
      aiResult = await aiIdentifyModalCloseButton(modal);
      if (aiResult && aiResult.closeButtons && aiResult.closeButtons.length > 0) {
        // 按AI推荐的优先级尝试关闭
        for (const btnInfo of aiResult.closeButtons) {
          const aiBtn = modal.querySelector(btnInfo.selector);
          if (aiBtn && aiBtn.offsetParent !== null && !aiBtn.disabled) {
            notifyPopup('addLog', `  🤖 AI推荐: ${btnInfo.type} (${btnInfo.location}) - ${btnInfo.reason}`, 'info');
            aiBtn.click();
            await delay(500);

            // 验证关闭
            const stillVisible = modal.offsetParent !== null && window.getComputedStyle(modal).display !== 'none';
            if (!stillVisible) {
              notifyPopup('addLog', '  ✅ AI识别成功！弹框已关闭', 'success');
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.log('[AI识别] 跳过AI识别，使用传统方法');
    }

    // 查找弹框内的表单
    const modalForm = modal.querySelector('form');
    if (modalForm) {
      notifyPopup('addLog', '  📝 弹框中检测到表单，自动填充...', 'info');

      // 确保复杂表单处理器已初始化
      if (!window.complexFormHandler && typeof ComplexFormHandler !== 'undefined') {
        window.complexFormHandler = new ComplexFormHandler();
        console.log('[Web测试工具] 临时初始化复杂表单处理器');
      }

      // 🎯 使用复杂表单处理器（支持弹框选择、验证等）
      if (window.complexFormHandler) {
        try {
          const result = await window.complexFormHandler.fillComplexForm(modalForm);
          if (result.success) {
            notifyPopup('addLog', '  ✅ 复杂表单填充成功', 'success');
            return true; // 复杂表单处理器会自动点击保存按钮
          } else {
            notifyPopup('addLog', `  ⚠️ 表单填充有问题: ${result.error || '未知错误'}`, 'warning');
          }
        } catch (err) {
          notifyPopup('addLog', `  ⚠️ 复杂表单处理失败，使用基础填充: ${err.message}`, 'warning');
          // 降级到基础填充
          const formFiller = new FormAutoFiller();
          await formFiller.fillForm(modalForm);
        }
      } else {
        // 基础填充
        const formFiller = new FormAutoFiller();
        await formFiller.fillForm(modalForm);
      }

      await delay(500);

      // 查找提交按钮
      const submitBtn = modalForm.querySelector('button[type="submit"], .submit, .confirm, .ok, [class*="submit"], [class*="confirm"]');
      if (submitBtn && submitBtn.offsetParent !== null) {
        notifyPopup('addLog', '  ✓ 点击表单提交按钮...', 'info');
        submitBtn.click();
        await delay(800);
        return true;
      }
    }

    // 查找关闭/确认按钮（优先级排序）
    const closeSelectors = [
      // 明确的关闭按钮（最高优先级）
      'button[aria-label="Close"]', 'button[aria-label="关闭"]',
      '.ant-modal-close', '.ant-modal-close-x',
      '.el-dialog__close', '.el-dialog__headerbtn',
      '.layui-layer-close', '.layui-layer-ico',
      '.ivu-modal-close',
      // 通用关闭按钮
      '.close', '.btn-close', '.icon-close',
      '.modal-close', '.dialog-close', '.popup-close',
      // 按类名包含关闭
      '[class*="close-btn"]', '[class*="btn-close"]',
      '[class*="icon-close"]', '[class*="close-icon"]',
      // 右上角X按钮（SVG图标）
      'button:has(svg[class*="close"])', 'button:has(.icon-close)',
      // 取消按钮（次要优先级）
      '[class*="cancel"]', 'button[class*="cancel"]'
    ];

    for (const selector of closeSelectors) {
      const closeBtn = modal.querySelector(selector);
      if (closeBtn && closeBtn.offsetParent !== null && !closeBtn.disabled) {
        const style = window.getComputedStyle(closeBtn);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          const btnText = closeBtn.textContent.trim() || closeBtn.getAttribute('aria-label') || closeBtn.className || '关闭';
          notifyPopup('addLog', `  ✓ 点击弹框关闭按钮: ${btnText.substring(0, 30)}`, 'info');
          closeBtn.click();
          await delay(500);

          // 验证弹框是否已关闭
          await delay(300);
          const stillVisible = modal.offsetParent !== null && window.getComputedStyle(modal).display !== 'none';
          if (stillVisible) {
            notifyPopup('addLog', '  ⚠ 弹框未关闭，尝试其他方法...', 'warning');
            continue; // 尝试下一个选择器
          }

          notifyPopup('addLog', '  ✓ 弹框已成功关闭', 'success');
          return true;
        }
      }
    }

    // 如果没找到特定的关闭按钮，智能查找所有按钮
    notifyPopup('addLog', '  🔍 未找到标准关闭按钮，智能搜索中...', 'info');

    const allButtons = modal.querySelectorAll('button, a.btn, span[role="button"], div[role="button"]');
    const buttonCandidates = [];

    for (const btn of allButtons) {
      const text = btn.textContent.trim().toLowerCase();
      const classList = Array.from(btn.classList).join(' ').toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

      let priority = 0;
      let buttonText = btn.textContent.trim();

      // 按钮优先级评分（确定/确认按钮提高优先级，因为很多弹框只有确定按钮）
      if (text.includes('关闭') || text.includes('close')) priority += 10;
      if (text.includes('确定') || text.includes('ok') || text.includes('确认') || text.includes('知道了') || text.includes('好的')) priority += 9;
      if (text.includes('取消') || text.includes('cancel')) priority += 8;
      if (classList.includes('close') || classList.includes('cancel')) priority += 5;
      if (classList.includes('primary') || classList.includes('confirm')) priority += 4;
      if (ariaLabel.includes('close') || ariaLabel.includes('关闭')) priority += 10;      // 检查按钮位置（右上角或底部的按钮优先级更高）
      const rect = btn.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      const isTopRight = (rect.right > modalRect.right - 100) && (rect.top < modalRect.top + 100);
      const isBottom = rect.bottom > modalRect.bottom - 100;

      if (isTopRight) priority += 15; // 右上角X按钮
      if (isBottom) priority += 5;    // 底部按钮

      if (priority > 0 && btn.offsetParent !== null && !btn.disabled) {
        const style = window.getComputedStyle(btn);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          buttonCandidates.push({ btn, priority, text: buttonText });
        }
      }
    }

    // 按优先级排序
    buttonCandidates.sort((a, b) => b.priority - a.priority);

    // 🎯 增强弹框关闭逻辑 - 支持多个位置的关闭
    for (const candidate of buttonCandidates) {
      notifyPopup('addLog', `  ✓ 点击弹框按钮: ${candidate.text || '(按钮)'} [优先级:${candidate.priority}]`, 'info');
      try {
        candidate.btn.click();
      } catch (e) {
        console.log('[Web测试工具] 点击按钮异常:', e);
      }
      await delay(500);

      // 检查弹框是否关闭
      await delay(300);
      const stillVisible = modal.offsetParent !== null && window.getComputedStyle(modal).display !== 'none';
      if (!stillVisible) {
        notifyPopup('addLog', '  ✓ 弹框已成功关闭', 'success');
        return true;
      }
    }    // 🎯 尝试点击弹框外的遮罩层来关闭弹框（某些框架支持）
    notifyPopup('addLog', '  🔍 尝试通过点击遮罩层关闭弹框...', 'info');
    const backdropSelectors = ['.ant-modal-mask', '.ant-modal-wrap', '.el-dialog__wrapper', '.layui-layer-shade', '.modal-backdrop'];
    for (const selector of backdropSelectors) {
      const backdrop = document.querySelector(selector);
      if (backdrop && backdrop.offsetParent !== null) {
        // 在遮罩层边缘点击（不是中心，避免点到内容）
        const rect = backdrop.getBoundingClientRect();
        const clickX = rect.left + 10; // 靠近左边
        const clickY = rect.top + 10;  // 靠近顶部
        const clickElement = document.elementFromPoint(clickX, clickY);

        if (clickElement && clickElement !== modal) {
          try {
            clickElement.click?.();
            await delay(300);
            const stillVisible = modal.offsetParent !== null && window.getComputedStyle(modal).display !== 'none';
            if (!stillVisible) {
              notifyPopup('addLog', '  ✓ 通过点击遮罩层关闭弹框', 'success');
              return true;
            }
          } catch (e) {
            console.log('[Web测试工具] 点击遮罩层失败:', e);
          }
        }
      }
    }

    // 强制隐藏弹框和所有可能的遮罩层
    if (modal) {
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
      modal.style.opacity = '0';

      // 移除所有可能的遮罩层选择器
      const backdropSelectors = [
        '.modal-backdrop', '.modal-mask',
        '.ant-modal-mask', '.ant-modal-wrap',
        '.el-dialog__wrapper',
        '.layui-layer-shade',
        '.ivu-modal-mask',
        '.overlay', '.mask', '.backdrop',
        '[class*="mask"]', '[class*="backdrop"]', '[class*="overlay"]'
      ];

      for (const selector of backdropSelectors) {
        const backdrops = document.querySelectorAll(selector);
        backdrops.forEach(backdrop => {
          backdrop.style.display = 'none';
          backdrop.style.visibility = 'hidden';
          backdrop.style.opacity = '0';
        });
      }

      // 恢复body滚动（有些弹框会禁用body滚动）
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = '';

      notifyPopup('addLog', '  ✓ 已强制关闭弹框和遮罩层', 'success');
    }

    await delay(500);
    return true; // 改为true，表示已处理

  } catch (e) {
    console.error('处理弹框出错:', e);
    return false;
  }
}

// 滚动元素到可见区域并高亮显示
async function scrollToElement (element) {
  return new Promise((resolve) => {
    // 滚动到元素位置
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // 高亮显示正在测试的元素
    const originalOutline = element.style.outline;
    const originalBackground = element.style.backgroundColor;
    const originalBoxShadow = element.style.boxShadow;

    element.style.outline = '3px solid #ff6b6b';
    element.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';
    element.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.5)';

    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.backgroundColor = originalBackground;
      element.style.boxShadow = originalBoxShadow;
      resolve();
    }, 400);
  });
}

// 执行交互测试
async function performInteraction (item, index, total) {
  try {
    const { element, type, text } = item;

    // 滚动到元素并高亮显示
    await scrollToElement(element);
    notifyPopup('addLog', `[${index + 1}/${total}] 📍 测试 ${type}: ${text}`, 'info');

    let actionSuccess = false;
    let actionError = null;
    const startTime = Date.now();

    if (type === 'button') {
      try {
        // 清除之前的API请求
        apiRequests = [];

        // 模拟真实用户点击
        element.focus();
        await delay(100);
        element.click();
        await delay(500);

        // 检测弹框
        const modalDetected = await checkAndHandleModal();

        // 🆕 检测是否出现了表单（可能是新增/编辑表单）
        await delay(500);
        const forms = document.querySelectorAll('form:not([style*="display: none"])');
        let formProcessed = false;

        if (forms.length > 0) {
          for (const form of forms) {
            // 检查表单是否可见且有输入字段
            if (form.offsetParent !== null) {
              const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select, [class*="select"], [class*="picker"]');
              if (inputs.length > 0) {
                notifyPopup('addLog', `  📝 检测到表单 (${inputs.length}个字段)，准备填充...`, 'info');

                // 确保复杂表单处理器已初始化
                if (!window.complexFormHandler && typeof ComplexFormHandler !== 'undefined') {
                  window.complexFormHandler = new ComplexFormHandler();
                  console.log('[Web测试工具] 临时初始化复杂表单处理器');
                }

                // 使用复杂表单处理器
                if (window.complexFormHandler) {
                  try {
                    const formResult = await window.complexFormHandler.fillComplexForm(form);
                    if (formResult.success) {
                      notifyPopup('addLog', `  ✅ 表单填充并保存成功`, 'success');
                      formProcessed = true;
                    } else {
                      notifyPopup('addLog', `  ⚠️ 表单填充遇到问题: ${formResult.error || '未知'}`, 'warning');
                    }
                  } catch (err) {
                    console.error('[Web测试工具] 表单处理异常:', err);
                    notifyPopup('addLog', `  ⚠️ 表单处理失败: ${err.message}`, 'warning');
                  }
                } else {
                  notifyPopup('addLog', `  ⚠️ 复杂表单处理器未加载，跳过表单`, 'warning');
                }

                break; // 只处理第一个可见表单
              }
            }
          }
        }

        // 检查API响应
        await delay(testConfig.delay || 1200);

        if (apiRequests.length > 0) {
          const failedRequests = apiRequests.filter(r => r.status && r.status >= 400);
          if (failedRequests.length > 0) {
            actionError = `API错误: ${failedRequests.map(r => r.status).join(', ')}`;
            testStats.apiErrorCount += failedRequests.length;
          } else {
            actionSuccess = true;
            const modalInfo = modalDetected ? ' (检测到弹框)' : '';
            const formInfo = formProcessed ? ' + 表单已填充' : '';
            notifyPopup('addLog', `  ✓ 按钮点击成功，API响应正常${modalInfo}${formInfo}`, 'success');
          }
        } else {
          actionSuccess = true;
          const modalInfo = modalDetected ? ' (检测到弹框)' : '';
          const formInfo = formProcessed ? ' + 表单已填充' : '';
          notifyPopup('addLog', `  ✓ 按钮点击成功${modalInfo}${formInfo}`, 'success');
        }
      } catch (e) {
        actionError = e.message;
      }
    } else if (type === 'link') {
      try {
        const href = element.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          const absoluteHref = new URL(href, window.location.href).href;

          if (isSameDomain(absoluteHref, testStartDomain)) {
            element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            await delay(100);
            element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));

            addTestedUrl(absoluteHref);
            actionSuccess = true;
            const pathDisplay = absoluteHref.replace(window.location.origin, '').substring(0, 40);
            notifyPopup('addLog', `  ✓ 链接验证: ${pathDisplay}...`, 'success');
          } else {
            actionError = '跨域链接，已过滤';
          }
        } else {
          actionError = '无效链接';
        }
        await delay(testConfig.delay || 1200);
      } catch (e) {
        actionError = e.message;
      }
    } else if (type === 'input') {
      try {
        if (element.tagName === 'TEXTAREA') {
          const testText = '自动化测试\n多行文本';
          element.focus();
          await delay(100);
          element.value = testText;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.blur();
          actionSuccess = true;
          notifyPopup('addLog', `  ✓ 文本域输入成功`, 'success');
        } else if (element.tagName === 'SELECT') {
          if (element.options.length > 1) {
            element.focus();
            await delay(100);
            element.selectedIndex = 1;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.blur();
            actionSuccess = true;
            notifyPopup('addLog', `  ✓ 下拉选择: ${element.options[1].text}`, 'success');
          }
        } else {
          const inputType = element.type || 'text';
          let testValue = '自动化测试';

          switch (inputType.toLowerCase()) {
            case 'email': testValue = 'test@example.com'; break;
            case 'tel': testValue = '13800138000'; break;
            case 'password': testValue = 'Test123456'; break;
            case 'number': testValue = '123'; break;
            default: testValue = '自动化测试';
          }

          element.focus();
          await delay(100);
          element.value = testValue;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.blur();
          actionSuccess = true;
          notifyPopup('addLog', `  ✓ 输入成功 (${inputType})`, 'success');
        }
        await delay(testConfig.delay || 1200);
      } catch (e) {
        actionError = e.message;
      }
    }

    // 更新统计
    testStats.testedCount++;
    if (actionSuccess) {
      testStats.successCount++;
    } else {
      testStats.failureCount++;
      const msg = actionError ? `  ✗ 失败: ${actionError}` : `  ✗ 操作失败`;
      notifyPopup('addLog', msg, 'error');
    }

    // 记录元素的测试结果和时间
    // 使用item而不是elements[index]，因为item直接包含元素信息
    if (item && item.element) {
      try {
        item.actionSuccess = actionSuccess;
        item.actionError = actionError;
        item.testedAt = new Date().toISOString();
        item.duration = Date.now() - startTime;
      } catch (e) {
        console.log('[Web测试工具] 记录元素结果时出错:', e);
      }
    }

    updateStatus();

  } catch (error) {
    console.error('交互测试出错:', error);
    testStats.failureCount++;
    testStats.testedCount++;
    notifyPopup('addLog', `  ✗ 错误: ${error.message}`, 'error');
    updateStatus();
  }
}

// 更新状态
function updateStatus () {
  try {
    const statusData = {
      testedCount: testStats.testedCount,
      successCount: testStats.successCount,
      failureCount: testStats.failureCount,
      apiErrorCount: testStats.apiErrorCount,
      totalButtons: testStats.totalButtons
    };

    chrome.runtime.sendMessage({
      action: 'updateStatus',
      data: statusData
    });

    // 同时更新悬浮球
    notifyFloatingBall('updateProgress', {
      total: testStats.totalButtons,
      tested: testStats.testedCount,
      success: testStats.successCount,
      failed: testStats.failureCount,
      apiError: testStats.apiErrorCount
    });
  } catch (e) {
    console.log('无法发送状态:', e);
  }
}

// 延迟函数
function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取HTTP状态码文本
function getStatusText (status) {
  const statusMap = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return statusMap[status] || `HTTP ${status}`;
}

// 保存测试报告（增强版）
function saveTestReport (stats, elements, apiRequests) {
  try {
    // 计算测试持续时间
    const testDuration = Date.now() - (window.testStartTime || Date.now());

    // 统计API请求状态
    const apiStats = {
      total: apiRequests.length,
      success: apiRequests.filter(r => r.status >= 200 && r.status < 300).length,
      clientError: apiRequests.filter(r => r.status >= 400 && r.status < 500).length,
      serverError: apiRequests.filter(r => r.status >= 500).length,
      failed: apiRequests.filter(r => r.error).length
    };

    // 统计元素类型分布
    const elementTypes = {};
    elements.forEach(el => {
      elementTypes[el.type] = (elementTypes[el.type] || 0) + 1;
    });

    const testReport = {
      url: originalUrl,
      timestamp: new Date().toISOString(),
      duration: Math.round(testDuration / 1000), // 秒
      totalElements: elements.length,
      stats: {
        testedCount: stats.testedCount,
        successCount: stats.successCount,
        failureCount: stats.failureCount,
        apiErrorCount: stats.apiErrorCount,
        successRate: stats.testedCount > 0 ? ((stats.successCount / stats.testedCount) * 100).toFixed(1) : 0
      },
      elementTypes: elementTypes,
      apiStats: apiStats,
      elements: elements.map((el, index) => ({
        index: index + 1,
        type: el.type,
        text: el.text.substring(0, 100),
        selector: el.selector,
        status: el.actionSuccess ? 'success' : (el.actionError ? 'failed' : 'skipped'),
        error: el.actionError || null,
        testedAt: el.testedAt || null
      })),
      apiRequests: apiRequests.map((req, index) => ({
        index: index + 1,
        type: req.type,
        method: req.method,
        url: req.url,
        timestamp: req.timestamp,
        status: req.status,
        statusText: getStatusText(req.status),
        error: req.error,
        duration: req.duration || null
      })),
      pageInfo: {
        title: document.title,
        domain: window.location.hostname,
        path: window.location.pathname
      }
    };

    // 保存到chrome storage
    chrome.storage.local.set({ lastTestReport: testReport }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Web测试工具] 保存报告失败:', chrome.runtime.lastError);
      } else {
        console.log('[Web测试工具] 报告已保存到storage');
      }
    });
  } catch (error) {
    console.error('[Web测试工具] 保存报告出错:', error);
  }
}

// 开始自动化测试
async function startAutomatedTest () {
  // 🔴 DEBUG: 立即输出日志，确保函数被调用
  console.log('========== [CRITICAL] startAutomatedTest被调用 ==========');
  console.log('[Web测试工具] testActive设置为true');

  try {
    console.log('[Web测试工具] ⏱️  startAutomatedTest开始执行');
    testActive = true;
    testedUrls.clear();
    originalUrl = window.location.href;
    testStartDomain = getBaseDomain(originalUrl);

    // 记录测试开始时间
    window.testStartTime = Date.now();

    testStats = {
      testedCount: 0,
      successCount: 0,
      failureCount: 0,
      apiErrorCount: 0,
      totalButtons: 0
    };

    console.log('[Web测试工具] 📤 发送初始日志到popup');
    notifyPopup('addLog', `✓ 测试已开始！`, 'success');
    notifyPopup('addLog', `📄 页面: ${originalUrl}`, 'info');

    chrome.runtime.sendMessage({
      action: 'testStarted',
      tabId: null
    }).catch(() => { });

    notifyPopup('addLog', `📄 页面加载完成`, 'info');
    notifyPopup('addLog', `🔒 测试域名: ${testStartDomain}`, 'success');
    notifyPopup('addLog', '🚀 开始自动化测试流程...', 'info');

    // 第一步：表单检测
    if (testConfig.testForms !== false) {
      try {
        console.log('[Web测试工具] 第一步：开始检测表单');
        notifyPopup('addLog', '📝 检测页面中的表单...', 'info');
        const formFiller = new FormAutoFiller();
        console.log('[Web测试工具] FormAutoFiller已创建');

        const formInfo = formFiller.detectForms();
        console.log('[Web测试工具] detectForms返回:', formInfo);

        if (formInfo && formInfo.count > 0) {
          notifyPopup('addLog', `✓ 检测到 ${formInfo.count} 个表单`, 'success');
          const formResults = await formFiller.processAllForms();
          console.log('[Web测试工具] processAllForms返回:', formResults);
          notifyPopup('addLog', `📊 表单已处理`, 'info');
          testStats.testedCount += formResults.forms.length;
          await delay(3000);
        } else {
          console.log('[Web测试工具] 未检测到表单');
          notifyPopup('addLog', '⚠ 页面没有表单', 'warning');
        }
      } catch (formError) {
        console.error('[Web测试工具] 表单处理出错:', formError);
        notifyPopup('addLog', `⚠ 表单处理错误: ${formError.message}`, 'warning');
      }
    }

    // 第二步：滚动
    try {
      console.log('[Web测试工具] 第二步：开始滚动页面');
      notifyPopup('addLog', '📜 正在滚动页面...', 'info');
      await scrollPageToBottom();
      console.log('[Web测试工具] 页面滚动完成');
    } catch (scrollError) {
      console.error('[Web测试工具] 页面滚动出错:', scrollError);
    }

    // 第三步：获取元素
    try {
      console.log('[Web测试工具] 第三步：开始识别元素');
      notifyPopup('addLog', '🔍 正在识别可交互元素...', 'info');
      const elements = getInteractiveElements();
      console.log('[Web测试工具] 获取到元素数量:', elements.length);
      testStats.totalButtons = elements.length;

      if (elements.length === 0) {
        console.log('[Web测试工具] 没有找到元素');
        notifyPopup('addLog', '⚠ 未找到可交互元素', 'warning');

        // 保存空报告
        saveTestReport(testStats, [], apiRequests);

        notifyPopup('testComplete', 'Test Complete', 'success');
        notifyFloatingBall('testComplete', {});
        return;
      }

      // 去重
      const uniqueElements = [];
      const seenSelectors = new Set();
      for (const elem of elements) {
        const key = `${elem.type}_${elem.selector}`;
        if (!seenSelectors.has(key)) {
          uniqueElements.push(elem);
          seenSelectors.add(key);
        }
      }

      console.log('[Web测试工具] 去重后元素数量:', uniqueElements.length);
      notifyPopup('addLog', `✓ 找到 ${uniqueElements.length} 个元素`, 'success');
      notifyPopup('addLog', `🧪 准备开始测试...`, 'info');
      updateStatus();

      // 第四步：测试元素
      console.log('[Web测试工具] 第四步：开始测试元素');
      for (let i = 0; i < uniqueElements.length && testActive; i++) {
        try {
          console.log(`[Web测试工具] 测试元素 ${i + 1}/${uniqueElements.length}`);
          await performInteraction(uniqueElements[i], i, uniqueElements.length);
          await delay(testConfig.delay || 1200);
        } catch (elemError) {
          console.error(`[Web测试工具] 元素 ${i} 测试失败:`, elemError);
          testStats.failureCount++;
          testStats.testedCount++;
        }
      }

      console.log('[Web测试工具] 所有元素测试完成');
      notifyPopup('addLog', `✓ 测试完成`, 'success');

      // 保存测试报告
      saveTestReport(testStats, uniqueElements, apiRequests);

      notifyPopup('testComplete', 'Test Complete', 'success');
      notifyFloatingBall('testComplete', {});

    } catch (elemError) {
      console.error('[Web测试工具] 元素识别出错:', elemError);
      notifyPopup('addLog', `❌ 元素识别错误: ${elemError.message}`, 'error');
    }

  } catch (error) {
    console.error('[Web测试工具] startAutomatedTest主错误:', error);
    notifyPopup('addLog', `❌ 测试出错: ${error.message}`, 'error');
    notifyPopup('testComplete', 'Test Failed', 'error');
    notifyFloatingBall('testComplete', {});
  } finally {
    testActive = false;
    console.log('[Web测试工具] startAutomatedTest执行完成');
  }
}

// 监听页面卸载（刷新或关闭）
window.addEventListener('beforeunload', () => {
  console.log('[Web测试工具] 页面即将刷新或关闭，停止测试');
  testActive = false;

  // 隐藏悬浮球
  if (window.floatingBallManager) {
    window.floatingBallManager.hideBall();
  }

  // 通知background清除测试状态
  chrome.runtime.sendMessage({
    action: 'clearTestState'
  }).catch(() => { });
});

// 页面加载完成后检查是否需要清除旧的悬浮球
window.addEventListener('load', () => {
  // 如果不是在测试状态，确保悬浮球被隐藏
  if (!testActive && window.floatingBallManager) {
    window.floatingBallManager.hideBall();
  }
});

console.log('[Web测试工具] Content script初始化完成');
