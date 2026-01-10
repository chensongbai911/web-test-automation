// 🌍 浮动球注入器 - 将FloatingBall和CustomTestExecutor代码注入到页面主上下文
// 这个脚本在Content Script上下文中运行，负责：
// 1. 在Content Script上下文中创建DOM容器（可以使用manifest的CSS）
// 2. 将JS代码注入到页面主上下文（可以访问页面的window对象）

(function () {
  console.log('[FloatingBallInjector] 开始初始化...');

  // ============================================
  // 第1步：在Content Script上下文中注入DOM容器
  // ============================================
  function injectFloatingBallDOM() {
    // 检查是否已经注入
    if (document.getElementById('floating-ball-container')) {
      console.log('[FloatingBallInjector] DOM容器已存在，跳过注入');
      return;
    }

    console.log('[FloatingBallInjector] 📦 在Content Script上下文中注入DOM容器...');

    // 创建容器（初始状态：隐藏）
    const container = document.createElement('div');
    container.id = 'floating-ball-container';
    container.className = 'floating-ball-container';
    container.style.display = 'none'; // 初始隐藏
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
        <div class="progress-panel-actions">
          <button id="open-main-popup" class="primary">打开主界面</button>
          <button id="view-report-btn" style="display:none;">📊 查看报告</button>
          <button id="pause-resume-btn">暂停</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    console.log('[FloatingBallInjector] ✅ DOM容器已注入到Content Script上下文');
  }

  // ============================================
  // 第2步：注入JS代码到页面主上下文
  // ============================================

  // 先注入DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFloatingBallDOM);
  } else {
    injectFloatingBallDOM();
  }

  // 然后注入JS代码到页面主上下文
  
  // 1. 注入 CustomTestExecutor
  const executorScript = document.createElement('script');
  executorScript.src = chrome.runtime.getURL('src/custom-test-executor.js');
  executorScript.type = 'text/javascript';
  
  executorScript.onload = function () {
    console.log('[FloatingBallInjector] ✅ CustomTestExecutor代码已注入到页面主上下文');
    this.remove();
  };
  
  executorScript.onerror = function () {
    console.error('[FloatingBallInjector] ❌ CustomTestExecutor代码注入失败');
  };
  
  (document.head || document.documentElement).appendChild(executorScript);

  // 2. 注入 FloatingBall（稍微延迟确保依赖加载完成）
  setTimeout(() => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/floating-ball.js');
    script.type = 'text/javascript';

    script.onload = function () {
      console.log('[FloatingBallInjector] ✅ FloatingBall代码已注入到页面主上下文');
      this.remove();
    };

    script.onerror = function () {
      console.error('[FloatingBallInjector] ❌ FloatingBall代码注入失败');
    };

    (document.head || document.documentElement).appendChild(script);
  }, 50);

  // ============================================
  // 第3步：设置消息桥接
  // ============================================
  
  // 🔗 设置消息桥接：从Content Script转发chrome.runtime消息到页面主上下文
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 将chrome.runtime消息转发为window事件
    if (request.action && request.action.includes('Floating')) {
      window.dispatchEvent(new CustomEvent('floatingBallMessage', {
        detail: request
      }));
      console.log('[FloatingBallInjector] 📨 转发消息到页面主上下文:', request.action);
    }

    // 特殊处理：显示/隐藏悬浮球
    if (request.action === 'showFloatingBall' || request.action === 'hideFloatingBall') {
      window.dispatchEvent(new CustomEvent('floatingBallMessage', {
        detail: request
      }));
      console.log('[FloatingBallInjector] 📨 转发消息:', request.action);
    }

    return true;
  });

  console.log('[FloatingBallInjector] ✅ 初始化完成');
})();
