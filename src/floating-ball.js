// 悬浮球和进度面板管理脚本

// 🔧 通过脚本注入的方式将代码注入到页面主上下文（避免Content Script上下文隔离）
(function() {
  'use strict';

class FloatingBallManager {
  constructor() {
    this.isVisible = false;
    this.isPanelOpen = false;
    this.isTestComplete = false; // 标记测试是否已完成
    this.currentProgress = 0;
    this.testStats = {
      total: 0,
      tested: 0,
      success: 0,
      failed: 0,
      apiError: 0
    };
    this.logs = [];
    this.init();
  }

  init () {
    console.log('[FloatingBall] 初始化悬浮球管理器');
    // 注入悬浮球HTML
    this.injectFloatingBall();
    // 监听来自popup的消息
    this.setupMessageListener();
    // 默认不自动显示悬浮球，等待测试开始时显示
    // this.showBall(); // 注释掉自动显示
  }

  injectFloatingBall () {
    // 检查是否已经注入
    if (document.getElementById('floating-ball-container')) {
      return;
    }

    // 创建容器
    const container = document.createElement('div');
    container.id = 'floating-ball-container';
    container.className = 'floating-ball-container';
    container.innerHTML = `
      <!-- 悬浮球 -->
      <div class="floating-ball" id="floating-ball">
        <div class="floating-ball-icon">📊</div>
        <div class="floating-ball-status testing" id="floating-ball-status">
          <span id="status-count">0</span>
        </div>
        <div class="floating-ball-tooltip">点击查看进度</div>
      </div>

      <!-- 进度面板 -->
      <div class="progress-panel" id="progress-panel">
        <!-- 头部 -->
        <div class="progress-panel-header">
          <h3>📊 测试进度</h3>
          <button class="progress-panel-close" id="panel-close">✕</button>
        </div>

        <!-- 内容 -->
        <div class="progress-panel-content">
          <!-- 统计卡片 -->
          <div class="progress-stats">
            <div class="stat-card success">
              <div class="label">成功</div>
              <div class="value" id="stat-success">0</div>
            </div>
            <div class="stat-card error">
              <div class="label">失败</div>
              <div class="value" id="stat-failed">0</div>
            </div>
            <div class="stat-card warning">
              <div class="label">错误</div>
              <div class="value" id="stat-error">0</div>
            </div>
            <div class="stat-card">
              <div class="label">总数</div>
              <div class="value" id="stat-total">0</div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-bar-container">
            <div class="progress-bar-label">
              <span>测试进度</span>
              <span id="progress-percent">0%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" id="progress-bar-fill"></div>
            </div>
          </div>

          <!-- 日志列表 -->
          <div class="log-list">
            <div class="log-list-header">
              <span>最近日志</span>
              <button id="clear-logs">清空</button>
            </div>
            <div class="log-items" id="log-items">
              <div class="log-item">等待测试开始...</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class=\"progress-panel-actions\">
          <button id=\"open-main-popup\" class=\"primary\">打开主界面</button>
          <button id=\"view-report-btn\" style=\"display:none;\">📊 查看报告</button>
          <button id=\"pause-resume-btn\">暂停</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // 加载CSS
    this.injectCSS();

    // 绑定事件
    this.bindEvents();
  }

  injectCSS () {
    // CSS已在manifest.json中声明，无需动态加载
    // content_scripts的css字段会自动注入样式
    console.log('[FloatingBall] CSS通过manifest自动注入，无需动态加载');
  }

  bindEvents () {
    // 悬浮球点击事件
    document.getElementById('floating-ball').addEventListener('click', () => {
      this.togglePanel();
    });

    // 关闭按钮
    document.getElementById('panel-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePanel();
    });

    // 清空日志
    document.getElementById('clear-logs').addEventListener('click', () => {
      this.clearLogs();
    });

    // 打开主界面
    document.getElementById('open-main-popup').addEventListener('click', () => {
      this.openMainPopup();
    });

    // 暂停/继续按钮
    document.getElementById('pause-resume-btn').addEventListener('click', (e) => {
      this.togglePause();
    });

    // 查看报告按钮
    document.getElementById('view-report-btn').addEventListener('click', () => {
      this.openReport();
    });

    // 点击panel外部关闭
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('progress-panel');
      const ball = document.getElementById('floating-ball');
      if (!panel.contains(e.target) && !ball.contains(e.target) && this.isPanelOpen) {
        this.closePanel();
      }
    });
  }

  togglePanel () {
    if (this.isPanelOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  openPanel () {
    const panel = document.getElementById('progress-panel');
    panel.classList.remove('hide');
    panel.classList.add('show');
    this.isPanelOpen = true;
  }

  closePanel () {
    const panel = document.getElementById('progress-panel');
    panel.classList.remove('show');
    panel.classList.add('hide');
    this.isPanelOpen = false;
    setTimeout(() => {
      panel.classList.remove('hide');
    }, 300);
  }

  updateProgress (data) {
    // 支持两种数据格式：
    // 1. 旧格式: { total, tested, success, failed, apiError }
    // 2. 新格式: { totalCases, passedCases, failedCases, totalSteps, passedSteps, failedSteps, current }

    if (data.totalCases !== undefined) {
      // 新格式（来自CustomTestExecutor）
      this.testStats = {
        total: data.totalCases || 0,
        tested: data.current || 0,
        success: data.passedCases || 0,
        failed: data.failedCases || 0,
        apiError: data.failedSteps || 0
      };
    } else {
      // 旧格式
      this.testStats = {
        total: data.total || 0,
        tested: data.tested || 0,
        success: data.success || 0,
        failed: data.failed || 0,
        apiError: data.apiError || 0
      };
    }

    // 更新统计卡片
    document.getElementById('stat-total').textContent = this.testStats.total;
    document.getElementById('stat-success').textContent = this.testStats.success;
    document.getElementById('stat-failed').textContent = this.testStats.failed;
    document.getElementById('stat-error').textContent = this.testStats.apiError;

    // 更新进度条
    const percent = this.testStats.total > 0
      ? Math.round((this.testStats.tested / this.testStats.total) * 100)
      : 0;
    this.currentProgress = percent;
    document.getElementById('progress-bar-fill').style.width = percent + '%';
    document.getElementById('progress-percent').textContent = percent + '%';

    // 更新悬浮球状态
    document.getElementById('status-count').textContent = this.testStats.tested;
  }

  addLog (message, type = 'info') {
    const item = {
      message,
      type,
      time: new Date().toLocaleTimeString('zh-CN')
    };
    this.logs.unshift(item);

    // 只保留最近50条
    if (this.logs.length > 50) {
      this.logs.pop();
    }

    this.updateLogDisplay();
  }

  updateLogDisplay () {
    const logItems = document.getElementById('log-items');

    if (this.logs.length === 0) {
      logItems.innerHTML = '<div class="log-item">等待测试开始...</div>';
      return;
    }

    const html = this.logs.map(log => `
      <div class="log-item ${log.type}">
        <span style="color: #999; font-size: 11px;">[${log.time}]</span>
        ${log.message}
      </div>
    `).join('');

    logItems.innerHTML = html;
  }

  clearLogs () {
    this.logs = [];
    this.updateLogDisplay();
  }

  updateStatus (status) {
    const statusEl = document.getElementById('floating-ball-status');
    statusEl.className = 'floating-ball-status ' + status;
  }

  setStatusMessage (message) {
    // 可选：在状态指示器显示消息
  }

  openMainPopup () {
    // 打开插件弹窗（通过background.js转发）
    chrome.runtime.sendMessage({
      action: 'openPopup'
    });
  }

  togglePause () {
    const btn = document.getElementById('pause-resume-btn');
    // 如果测试已完成，不允许暂停/继续
    if (this.isTestComplete) {
      return;
    }

    const isPaused = btn.textContent === '继续';

    if (isPaused) {
      btn.textContent = '暂停';
      chrome.runtime.sendMessage({ action: 'resumeTest' });
    } else {
      btn.textContent = '继续';
      chrome.runtime.sendMessage({ action: 'pauseTest' });
    }
  }

  openReport () {
    // 打开报告页面
    chrome.runtime.sendMessage({
      action: 'openReport'
    });
  }

  setTestComplete () {
    // 标记测试完成
    this.isTestComplete = true;

    // 更新暂停按钮文案为"🔄 重新测试"
    const pauseBtn = document.getElementById('pause-resume-btn');
    pauseBtn.textContent = '🔄 重新测试';
    pauseBtn.disabled = true;
    pauseBtn.style.opacity = '0.5';
    pauseBtn.style.cursor = 'not-allowed';

    // 显示"查看报告"按钮
    const reportBtn = document.getElementById('view-report-btn');
    reportBtn.style.display = 'inline-block';
    reportBtn.disabled = false;
    reportBtn.style.opacity = '1';
    reportBtn.style.cursor = 'pointer';

    // 更新悬浮球状态为完成
    const statusEl = document.getElementById('floating-ball-status');
    statusEl.className = 'floating-ball-status complete';

    console.log('[FloatingBall] 测试已完成，UI已更新');
  }

  setupMessageListener () {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'updateFloatingProgress':
          this.updateProgress(request.data);
          break;
        case 'addFloatingLog':
          this.addLog(request.message, request.type);
          break;
        case 'testComplete':
          // 测试完成，更新UI
          this.setTestComplete();
          break;
        case 'updateFloatingStatus':
          this.updateStatus(request.status);
          break;
        case 'showFloatingBall':
          this.showBall();
          break;
        case 'hideFloatingBall':
          this.hideBall();
          break;
      }
      sendResponse({ success: true });
    });
  }

  showBall () {
    const container = document.getElementById('floating-ball-container');
    if (container) {
      container.style.display = 'block';
      this.isVisible = true;
      console.log('[FloatingBall] ✅ 悬浮球已显示');
    } else {
      console.warn('[FloatingBall] ⚠️  悬浮球容器不存在，尝试重新注入');
      try {
        this.injectFloatingBall();
        const newContainer = document.getElementById('floating-ball-container');
        if (newContainer) {
          newContainer.style.display = 'block';
          this.isVisible = true;
          console.log('[FloatingBall] ✅ 悬浮球重新注入并显示成功');
        } else {
          console.error('[FloatingBall] ❌ 悬浮球重新注入后仍然找不到容器');
        }
      } catch (error) {
        console.error('[FloatingBall] ❌ 悬浮球重新注入失败:', error);
      }
    }
  }

  hideBall () {
    const container = document.getElementById('floating-ball-container');
    if (container) {
      container.style.display = 'none';
      this.isVisible = false;
    }
  }
}

// 🌍 将FloatingBallManager类暴露到全局作用域
window.FloatingBallManager = FloatingBallManager;

// 页面加载时初始化
if (document.readyState === 'loading') {
  console.log('[FloatingBall] 页面正在加载，等待DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    try {
      console.log('[FloatingBall] DOMContentLoaded触发，开始初始化FloatingBallManager');
      window.floatingBallManager = new FloatingBallManager();
      console.log('[FloatingBall] ✅ FloatingBallManager初始化成功');
    } catch (error) {
      console.error('[FloatingBall] ❌ FloatingBallManager初始化失败:', error);
      throw error;
    }
  });
} else {
  try {
    console.log('[FloatingBall] 页面已加载，立即初始化FloatingBallManager');
    window.floatingBallManager = new FloatingBallManager();
    console.log('[FloatingBall] ✅ FloatingBallManager初始化成功');
  } catch (error) {
    console.error('[FloatingBall] ❌ FloatingBallManager初始化失败:', error);
    throw error;
  }
}

})(); // 结束立即执行函数
