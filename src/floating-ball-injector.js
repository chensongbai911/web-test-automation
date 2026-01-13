// 🌍 浮动球注入器 - 将FloatingBall和CustomTestExecutor代码注入到页面主上下文
// 这个脚本在Content Script上下文中运行，负责：
// 1. 在Content Script上下文中创建DOM容器（可以使用manifest的CSS）
// 2. 将JS代码注入到页面主上下文（可以访问页面的window对象）

(function () {
  console.log('[FloatingBallInjector] 开始初始化...');

  // ============================================
  // 第1步：在Content Script上下文中注入DOM容器
  // ============================================
  function injectFloatingBallDOM () {
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

  // 2. 注入 FloatingBall（延迟确保依赖加载完成，并等待 DOM 就绪）
  setTimeout(() => {
    console.log('[FloatingBallInjector] 🚀 准备注入 FloatingBall 脚本...');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/floating-ball.js');
    script.type = 'text/javascript';

    script.onload = function () {
      console.log('[FloatingBallInjector] ✅ FloatingBall代码已注入到页面主上下文');
      console.log('[FloatingBallInjector] 📢 等待 floatingBallReady 事件...');
      this.remove();
    };

    script.onerror = function () {
      console.error('[FloatingBallInjector] ❌ FloatingBall代码注入失败');
    };

    (document.head || document.documentElement).appendChild(script);
  }, 300);

  // ============================================
  // 第3步：设置消息桥接 - 带消息队列机制
  // ============================================

  // 🔧 消息队列：如果浮球脚本还未加载，将消息先缓存
  let messageQueue = [];
  let isFloatingBallReady = false;

  // 当浮球脚本加载完成时，标记为就绪并发送缓存的消息
  window.addEventListener('floatingBallReady', () => {
    console.log('[FloatingBallInjector] 🎯 FloatingBall脚本已就绪');
    isFloatingBallReady = true;

    // 发送所有缓存的消息
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      console.log('[FloatingBallInjector] 📨 从队列发送缓存消息:', msg.action);
      window.dispatchEvent(new CustomEvent('floatingBallMessage', { detail: msg }));
    }
  });

  // 🔗 设置消息桥接：从Content Script转发chrome.runtime消息到页面主上下文
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[FloatingBallInjector] ========== 🔥 收到消息 ==========');
    console.log('[FloatingBallInjector] Action:', request.action);
    console.log('[FloatingBallInjector] FloatingBall就绪:', isFloatingBallReady);

    // 将chrome.runtime消息转发为window事件
    if (request.action && request.action.includes('Floating')) {
      if (isFloatingBallReady) {
        console.log('[FloatingBallInjector] 📨 直接转发消息到页面主上下文:', request.action);
        window.dispatchEvent(new CustomEvent('floatingBallMessage', { detail: request }));
      } else {
        console.log('[FloatingBallInjector] ⏳ FloatingBall未就绪，消息入队:', request.action);
        messageQueue.push(request);
      }
    }

    // 特殊处理：显示/隐藏悬浮球
    if (request.action === 'showFloatingBall' || request.action === 'hideFloatingBall') {
      if (isFloatingBallReady) {
        console.log('[FloatingBallInjector] 📨 直接转发消息:', request.action);
        window.dispatchEvent(new CustomEvent('floatingBallMessage', { detail: request }));
      } else {
        console.log('[FloatingBallInjector] ⏳ FloatingBall未就绪，消息入队:', request.action);
        messageQueue.push(request);
      }
    }

    // 补充：测试完成状态转发到页面主上下文（用于更新悬浮球UI）
    if (request.action === 'testComplete') {
      if (isFloatingBallReady) {
        console.log('[FloatingBallInjector] 📨 转发消息: testComplete');
        window.dispatchEvent(new CustomEvent('floatingBallMessage', { detail: request }));
      } else {
        console.log('[FloatingBallInjector] ⏳ testComplete消息入队');
        messageQueue.push(request);
      }
    }

    return true;
  });

  // 🔗 反向桥接：从页面主上下文转发消息到background（通过chrome.runtime）
  window.addEventListener('floatingBallToContent', (event) => {
    const request = event.detail;
    console.log('[FloatingBallInjector] 📤 从页面主上下文接收消息，转发到background:', request.action);

    // 转发到background
    chrome.runtime.sendMessage(request, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[FloatingBallInjector] 转发消息失败:', chrome.runtime.lastError);
      } else {
        console.log('[FloatingBallInjector] 消息已转发到background:', request.action);
      }
    });
  });

  console.log('[FloatingBallInjector] ✅ 初始化完成');
})();
