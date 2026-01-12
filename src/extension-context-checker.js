// 扩展上下文检测工具
// 提供扩展上下文有效性检查和自动恢复机制

class ExtensionContextChecker {
  constructor() {
    this.contextInvalidNotified = false; // 避免重复通知
    this.checkInterval = null;
  }

  /**
   * 检查扩展上下文是否有效
   * @returns {boolean} true表示有效，false表示失效
   */
  isContextValid () {
    try {
      // 检查chrome.runtime是否存在且有效
      return chrome.runtime && chrome.runtime.id !== undefined;
    } catch (e) {
      return false;
    }
  }

  /**
   * 安全地发送消息，自动处理context失效
   * @param {object} message - 要发送的消息
   * @param {function} callback - 可选的回调函数
   * @returns {Promise} - 返回Promise以支持async/await
   */
  safeSendMessage (message, callback) {
    return new Promise((resolve, reject) => {
      // 先检查context是否有效
      if (!this.isContextValid()) {
        console.error('[ExtensionContextChecker] 扩展上下文已失效');
        this.notifyContextInvalidated();
        reject(new Error('Extension context invalidated'));
        return;
      }

      try {
        chrome.runtime.sendMessage(message, (response) => {
          // 检查是否有错误
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message || '';
            console.error('[ExtensionContextChecker] 消息发送错误:', errorMsg);

            // 检查是否是context失效错误
            if (errorMsg.includes('context invalidated') || errorMsg.includes('Extension context')) {
              this.notifyContextInvalidated();
              reject(new Error('Extension context invalidated'));
              return;
            }

            // 其他错误（如popup关闭）可以忽略
            reject(new Error(errorMsg));
            return;
          }

          // 成功
          if (callback) callback(response);
          resolve(response);
        });
      } catch (e) {
        console.error('[ExtensionContextChecker] 发送消息异常:', e);
        reject(e);
      }
    });
  }

  /**
   * 通知用户扩展上下文已失效
   */
  notifyContextInvalidated () {
    // 避免重复通知
    if (this.contextInvalidNotified) {
      return;
    }
    this.contextInvalidNotified = true;

    console.error('⚠️ 扩展上下文已失效，请重新加载扩展');

    // 显示页面通知（如果在content script中）
    if (typeof window !== 'undefined' && window.document) {
      this.showReloadNotification();
    }

    // 尝试通过postMessage通知（如果有悬浮球）
    try {
      window.postMessage({
        __floatingBall: true,
        action: 'addFloatingLog',
        data: {
          message: '⚠️ 扩展需要重新加载，请刷新页面',
          type: 'error'
        }
      }, '*');
    } catch (e) {
      // 忽略
    }
  }

  /**
   * 在页面上显示重新加载提示
   */
  showReloadNotification () {
    // 创建提示框
    const notification = document.createElement('div');
    notification.id = 'extension-context-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        max-width: 380px;
        animation: slideInRight 0.4s ease-out;
      ">
        <div style="display: flex; align-items: start; gap: 12px;">
          <span style="font-size: 28px;">⚠️</span>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">
              扩展需要重新加载
            </div>
            <div style="font-size: 13px; opacity: 0.95; line-height: 1.5; margin-bottom: 16px;">
              检测到扩展上下文已失效。请按以下步骤操作：
            </div>
            <ol style="font-size: 13px; opacity: 0.9; margin: 0; padding-left: 18px; line-height: 1.8;">
              <li>打开 <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">chrome://extensions/</code></li>
              <li>找到"Web功能自动化测试工具"</li>
              <li>点击"重新加载"按钮</li>
              <li>刷新此页面</li>
            </ol>
            <button id="close-notification-btn" style="
              margin-top: 16px;
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              我知道了
            </button>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            opacity: 0.7;
            line-height: 1;
          " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
            ×
          </button>
        </div>
      </div>
      <style>
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // 绑定关闭按钮事件
    const closeBtn = document.getElementById('close-notification-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        notification.remove();
      });
    }

    // 10秒后自动隐藏
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutRight 0.4s ease-in';
        setTimeout(() => notification.remove(), 400);
      }
    }, 10000);
  }

  /**
   * 启动定期检查
   * @param {number} interval - 检查间隔（毫秒）
   */
  startPeriodicCheck (interval = 5000) {
    if (this.checkInterval) {
      return; // 已经在运行
    }

    this.checkInterval = setInterval(() => {
      if (!this.isContextValid()) {
        console.error('[ExtensionContextChecker] ⚠️ 定期检查发现context已失效');
        this.notifyContextInvalidated();
        this.stopPeriodicCheck();
      }
    }, interval);

    console.log('[ExtensionContextChecker] 已启动定期检查，间隔:', interval, 'ms');
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck () {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[ExtensionContextChecker] 已停止定期检查');
    }
  }

  /**
   * 重置通知状态
   */
  resetNotificationState () {
    this.contextInvalidNotified = false;
  }
}

// 导出单例
if (typeof window !== 'undefined') {
  window.ExtensionContextChecker = ExtensionContextChecker;
  window.extensionContextChecker = new ExtensionContextChecker();
  console.log('[ExtensionContextChecker] 已初始化');
}

// 如果在content script中，自动启动定期检查
if (typeof chrome !== 'undefined' && chrome.runtime && document) {
  const checker = new ExtensionContextChecker();
  // 延迟启动，避免影响页面加载
  setTimeout(() => {
    checker.startPeriodicCheck(5000); // 每5秒检查一次
  }, 2000);
}
