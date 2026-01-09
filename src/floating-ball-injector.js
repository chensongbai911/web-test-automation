// 🌍 浮动球注入器 - 将FloatingBall代码注入到页面主上下文
// 这个脚本在Content Script上下文中运行，负责将floating-ball.js注入到页面主上下文

(function () {
  console.log('[FloatingBallInjector] 准备注入FloatingBall到页面主上下文...');

  // 创建script标签，将floating-ball.js注入到页面
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('src/floating-ball.js');
  script.type = 'text/javascript';

  script.onload = function () {
    console.log('[FloatingBallInjector] ✅ FloatingBall代码已注入到页面主上下文');
    this.remove(); // 注入后移除script标签
  };

  script.onerror = function () {
    console.error('[FloatingBallInjector] ❌ FloatingBall代码注入失败');
  };

  // 尽早注入（在head或documentElement）
  (document.head || document.documentElement).appendChild(script);
  
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
  
  console.log('[FloatingBallInjector] ✅ 消息桥接已建立');
})();
