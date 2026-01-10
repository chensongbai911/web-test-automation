// 悬浮球和进度面板管理脚本

// 🔧 通过脚本注入的方式将代码注入到页面主上下文（避免Content Script上下文隔离）
(function () {
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
      // ⚠️ 注意：DOM容器由floating-ball-injector.js在Content Script上下文中注入
      // 这里只需要等待DOM准备好，然后绑定事件

      // 绑定事件（等待DOM准备好）
      this.waitForDOMAndBind();

      // 监听来自popup的消息
      this.setupMessageListener();
      // 默认不自动显示悬浮球，等待测试开始时显示
      // this.showBall(); // 注释掉自动显示
    }

    waitForDOMAndBind () {
      const checkDOM = () => {
        const ball = document.getElementById('floating-ball');
        if (ball) {
          console.log('[FloatingBall] ✅ DOM容器已就绪，绑定事件');
          this.bindEvents();
        } else {
          console.log('[FloatingBall] ⏳ 等待DOM容器...');
          setTimeout(checkDOM, 100);
        }
      };
      checkDOM();
    }

    injectFloatingBall () {
      // ⚠️ 此方法已废弃：DOM由floating-ball-injector.js在Content Script上下文中注入
      // 保留方法以避免代码中的调用出错
      console.warn('[FloatingBall] injectFloatingBall()已废弃，DOM由injector负责');
      return; // 直接返回
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
      // 打开插件弹窗（通过window事件发送到content script，再转发到background）
      console.log('[FloatingBall] 请求打开主弹窗');
      window.dispatchEvent(new CustomEvent('floatingBallToContent', {
        detail: { action: 'openPopup' }
      }));
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
        console.log('[FloatingBall] 请求继续测试');
        window.dispatchEvent(new CustomEvent('floatingBallToContent', {
          detail: { action: 'resumeTest' }
        }));
      } else {
        btn.textContent = '继续';
        console.log('[FloatingBall] 请求暂停测试');
        window.dispatchEvent(new CustomEvent('floatingBallToContent', {
          detail: { action: 'pauseTest' }
        }));
      }
    }

    openReport () {
      // 打开报告页面（通过window事件发送到content script）
      console.log('[FloatingBall] 请求打开测试报告');
      window.dispatchEvent(new CustomEvent('floatingBallToContent', {
        detail: { action: 'openReport' }
      }));
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
      // 🔧 此脚本通过<script>标签注入到页面主上下文，无法访问chrome API
      // 必须使用window事件监听，由floating-ball-injector.js转发消息
      console.log('[FloatingBall] 初始化消息监听器（页面主上下文）');

      // 页面主上下文 - 使用window事件监听
      window.addEventListener('floatingBallMessage', (event) => {
        const request = event.detail;
        console.log('[FloatingBall] 📨 收到事件:', request.action, request);

        try {
          switch (request.action) {
            case 'updateFloatingProgress':
              console.log('[FloatingBall] 更新进度:', request.data);
              this.updateProgress(request.data);
              break;
            case 'addFloatingLog':
              this.addLog(request.message, request.type);
              break;
            case 'testComplete':
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
            default:
              console.log('[FloatingBall] 未知操作:', request.action);
          }
        } catch (error) {
          console.error('[FloatingBall] 处理消息时出错:', error);
        }
      });

      // 兜底：支持通过 window.postMessage 的跨上下文通信
      window.addEventListener('message', (event) => {
        try {
          const data = event.data;
          if (!data || !data.__floatingBall) return;
          const action = data.action;
          console.log('[FloatingBall] 📨 postMessage事件:', action, data);
          switch (action) {
            case 'updateFloatingProgress':
              this.updateProgress(data.data || {});
              break;
            case 'addFloatingLog':
              this.addLog(data.message, data.type);
              break;
            case 'testComplete':
              this.setTestComplete();
              break;
            case 'updateFloatingStatus':
              this.updateStatus(data.status);
              break;
            case 'showFloatingBall':
              this.showBall();
              break;
            case 'hideFloatingBall':
              this.hideBall();
              break;
          }
        } catch (e) {
          console.log('[FloatingBall] postMessage处理错误:', e);
        }
      });

      console.log('[FloatingBall] ✅ 消息监听器已设置（使用window事件）');
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
