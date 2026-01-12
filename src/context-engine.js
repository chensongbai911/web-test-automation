/**
 * 上下文感知引擎 (Context Engine)
 * 版本: v4.0
 * 核心职责：
 * 1. 跟踪页面状态（正常/弹框/加载/错误）
 * 2. 管理操作上下文（当前在做什么）
 * 3. 维护任务队列（待完成的任务）
 * 4. 识别依赖关系
 */

class ContextEngine {
  constructor() {
    this.state = {
      // 页面状态
      pageState: 'normal', // normal | modal_open | loading | error | dropdown_open

      // 弹框/模态框状态
      openModals: [], // 当前打开的弹框列表
      modalStack: [], // 弹框栈（支持嵌套弹框）

      // 任务上下文
      currentTask: null, // 当前正在执行的任务
      taskStack: [], // 任务栈，支持任务嵌套
      pendingActions: [], // 待执行的动作队列

      // 操作历史
      actionHistory: [], // 所有操作的历史记录

      // 依赖关系
      dependencies: new Map(),

      // 状态变化监听器
      listeners: [],

      // 页面元素缓存
      elementCache: new Map()
    };

    this.logger = this.createLogger('[上下文引擎]');
    this.setupStateMonitoring();
  }

  /**
   * 设置状态监控
   */
  setupStateMonitoring () {
    try {
      // 监听DOM变化，检测弹框出现/消失
      const observer = new MutationObserver((mutations) => {
        this.checkForModals();
        this.checkForLoadingStates();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'data-visible']
      });

      this.domObserver = observer;

      this.logger.log('✅ 状态监控已启动');
    } catch (error) {
      this.logger.error('状态监控启动失败:', error);
    }
  }

  /**
   * 检测弹框状态
   */
  checkForModals () {
    // 常见弹框/模态框选择器
    const modalSelectors = [
      // 通用选择器
      '[class*="modal"]:not([style*="display: none"])',
      '[class*="dialog"]:not([style*="display: none"])',
      '[role="dialog"]:not([style*="display: none"])',

      // Element UI
      '.el-dialog__wrapper',
      '.el-dialog:not([style*="display: none"])',

      // Ant Design
      '.ant-modal-wrap:not([style*="display: none"])',
      '.ant-modal:not([style*="display: none"])',

      // Bootstrap
      '.modal.show',
      '.modal[style*="display: block"]',

      // 其他常见框架
      '.n-modal-container',
      '.v-dialog--active',
      '[data-modal="true"][style*="display: block"]'
    ];

    const visibleModals = [];
    const processedSelectors = new Set();

    for (const selector of modalSelectors) {
      if (processedSelectors.has(selector)) continue;
      processedSelectors.add(selector);

      try {
        const modals = document.querySelectorAll(selector);

        for (const modal of modals) {
          // 检查该modal是否已在列表中
          const alreadyAdded = visibleModals.some(m => m.element === modal);

          if (!alreadyAdded && this.isElementVisible(modal)) {
            visibleModals.push({
              element: modal,
              selector: selector,
              id: modal.id || this.generateModalId(modal),
              openTime: Date.now(),
              title: this.extractModalTitle(modal),
              closeButtons: this.findModalCloseButtons(modal)
            });
          }
        }
      } catch (error) {
        // 无效的选择器，忽略
      }
    }

    // 比较状态变化
    const prevModalCount = this.state.openModals.length;
    const prevModals = new Set(this.state.openModals.map(m => m.element));
    const currentModals = new Set(visibleModals.map(m => m.element));

    // 检测新打开的弹框
    for (const modal of visibleModals) {
      if (!prevModals.has(modal.element)) {
        this.logger.log(`🎭 检测到弹框打开: ${modal.title || '未知弹框'}`);
        this.state.pageState = 'modal_open';
        this.notifyStateChange('modal_opened', modal);
      }
    }

    // 检测关闭的弹框
    for (const prevModal of this.state.openModals) {
      if (!currentModals.has(prevModal.element)) {
        this.logger.log(`✅ 弹框已关闭: ${prevModal.title || '未知弹框'}`);
        this.notifyStateChange('modal_closed', prevModal);
      }
    }

    // 更新状态
    this.state.openModals = visibleModals;

    // 更新页面状态
    if (visibleModals.length === 0 && this.state.pageState === 'modal_open') {
      this.state.pageState = 'normal';
    }
  }

  /**
   * 检测加载状态
   */
  checkForLoadingStates () {
    const loadingIndicators = document.querySelectorAll(
      '[class*="loading"]:not([style*="display: none"]):not([style*="opacity: 0"])',
      '[class*="spinner"]:not([style*="display: none"])',
      '.el-loading-mask',
      '[data-loading="true"]',
      '[aria-label*="加载"]'
    );

    const isLoading = Array.from(loadingIndicators).some(el =>
      this.isElementVisible(el)
    );

    if (isLoading && this.state.pageState !== 'loading') {
      this.logger.log('⏳ 页面加载中...');
      this.state.pageState = 'loading';
      this.notifyStateChange('loading_started');
    } else if (!isLoading && this.state.pageState === 'loading') {
      this.logger.log('✅ 加载完成');
      this.state.pageState = 'normal';
      this.notifyStateChange('loading_completed');
    }
  }

  /**
   * 判断元素是否可见
   */
  isElementVisible (element) {
    if (!element || !element.offsetParent) return false;

    try {
      const style = window.getComputedStyle(element);
      if (style.display === 'none') return false;
      if (style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity) === 0) return false;

      // 检查宽高
      if (element.offsetWidth <= 0 || element.offsetHeight <= 0) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 提取弹框标题
   */
  extractModalTitle (modal) {
    // 尝试多种选择器找标题
    const titleSelectors = [
      '.modal-title',
      '.el-dialog__title',
      '.ant-modal-title',
      '[class*="title"]',
      'h1',
      'h2',
      'h3'
    ];

    for (const selector of titleSelectors) {
      const titleEl = modal.querySelector(selector);
      if (titleEl) {
        const text = titleEl.textContent.trim();
        if (text && text.length > 0 && text.length < 100) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * 找到弹框的关闭按钮
   */
  findModalCloseButtons (modal) {
    const closeButtons = [];

    const closeSelectors = [
      '[class*="close"]',
      '[aria-label*="关闭"]',
      '[aria-label*="Close"]',
      'button[type="button"][class*="close"]',
      '.modal-close'
    ];

    for (const selector of closeSelectors) {
      const buttons = modal.querySelectorAll(selector);
      for (const btn of buttons) {
        if (this.isElementVisible(btn)) {
          closeButtons.push({
            element: btn,
            text: btn.textContent.trim() || '×',
            selector: this.generateSelector(btn)
          });
        }
      }
    }

    return closeButtons;
  }

  /**
   * 推入任务
   */
  pushTask (task) {
    this.logger.log(`📝 推入任务: ${task.name}`);

    // 保存当前任务到栈
    if (this.state.currentTask) {
      this.state.taskStack.push(this.state.currentTask);
    }

    // 设置新的当前任务
    this.state.currentTask = {
      ...task,
      startTime: Date.now(),
      id: this.generateTaskId(),
      steps: [],
      status: 'in-progress'
    };

    this.notifyStateChange('task_started', this.state.currentTask);
  }

  /**
   * 完成当前任务
   */
  completeTask (result) {
    if (!this.state.currentTask) {
      this.logger.warn('⚠️ 没有当前任务');
      return null;
    }

    const completedTask = {
      ...this.state.currentTask,
      endTime: Date.now(),
      duration: Date.now() - this.state.currentTask.startTime,
      result: result,
      status: 'completed'
    };

    const taskName = completedTask.name;
    const duration = (completedTask.duration / 1000).toFixed(2);
    this.logger.log(`✅ 任务完成: ${taskName} (${duration}s)`);

    // 从栈恢复上一个任务
    this.state.currentTask = this.state.taskStack.length > 0
      ? this.state.taskStack.pop()
      : null;

    this.notifyStateChange('task_completed', completedTask);

    return completedTask;
  }

  /**
   * 向当前任务添加步骤
   */
  addTaskStep (step) {
    if (this.state.currentTask) {
      this.state.currentTask.steps.push({
        ...step,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 添加待执行动作
   */
  addPendingAction (action) {
    this.logger.log(`➕ 添加待执行动作: ${action.type} - ${action.description}`);
    this.state.pendingActions.push({
      ...action,
      addedAt: Date.now()
    });
  }

  /**
   * 获取下一个待执行动作
   */
  getNextAction () {
    return this.state.pendingActions.shift();
  }

  /**
   * 获取所有待执行动作
   */
  getPendingActions () {
    return [...this.state.pendingActions];
  }

  /**
   * 清空待执行动作
   */
  clearPendingActions () {
    this.state.pendingActions = [];
  }

  /**
   * 记录操作
   */
  recordAction (action) {
    const record = {
      ...action,
      timestamp: Date.now(),
      pageState: this.state.pageState,
      taskId: this.state.currentTask?.id || null,
      taskName: this.state.currentTask?.name || null,
      openModalsCount: this.state.openModals.length
    };

    this.state.actionHistory.push(record);

    // 只保留最近1000条记录
    if (this.state.actionHistory.length > 1000) {
      this.state.actionHistory.shift();
    }
  }

  /**
   * 获取当前上下文信息
   */
  getContext () {
    return {
      pageState: this.state.pageState,
      hasOpenModals: this.state.openModals.length > 0,
      openModals: this.state.openModals.map(m => ({
        id: m.id,
        title: m.title,
        selector: m.selector
      })),
      currentTask: this.state.currentTask ? {
        id: this.state.currentTask.id,
        name: this.state.currentTask.name,
        status: this.state.currentTask.status
      } : null,
      pendingActionsCount: this.state.pendingActions.length,
      recentActions: this.state.actionHistory.slice(-10),
      actionHistorySize: this.state.actionHistory.length
    };
  }

  /**
   * 获取完整的执行上下文（用于AI决策）
   */
  getExecutionContext () {
    return {
      pageState: this.state.pageState,
      currentTask: this.state.currentTask,
      openModals: this.state.openModals,
      pendingActions: this.state.pendingActions,
      actionHistory: this.state.actionHistory.slice(-50), // 最后50条操作
      taskStack: this.state.taskStack.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status
      }))
    };
  }

  /**
   * 监听状态变化
   */
  onStateChange (listener) {
    this.state.listeners.push(listener);

    // 返回取消监听的函数
    return () => {
      const index = this.state.listeners.indexOf(listener);
      if (index > -1) {
        this.state.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知状态变化
   */
  notifyStateChange (event, data) {
    for (const listener of this.state.listeners) {
      try {
        listener(event, data, this.getContext());
      } catch (error) {
        this.logger.error('监听器错误:', error);
      }
    }
  }

  /**
   * 等待特定状态
   */
  async waitForState (targetState, timeout = 10000) {
    this.logger.log(`⏰ 等待状态: ${targetState}`);

    // 立即检查
    if (this.state.pageState === targetState) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`等待状态"${targetState}"超时 (${timeout}ms)`));
      }, timeout);

      const unsubscribe = this.onStateChange((event, data, context) => {
        if (context.pageState === targetState) {
          clearTimeout(timer);
          unsubscribe();
          const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
          this.logger.log(`✅ 状态变化完成 (${elapsedTime}s): ${targetState}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * 等待弹框打开
   */
  async waitForModalOpen (timeout = 5000) {
    this.logger.log('⏰ 等待弹框打开...');

    const startTime = Date.now();

    // 立即检查
    if (this.state.openModals.length > 0) {
      const modal = this.state.openModals[this.state.openModals.length - 1];
      this.logger.log(`✅ 弹框已打开: ${modal.title || '未知弹框'}`);
      return modal;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`等待弹框打开超时 (${timeout}ms)`));
      }, timeout);

      const unsubscribe = this.onStateChange((event, data, context) => {
        if (event === 'modal_opened' || context.openModals.length > 0) {
          clearTimeout(timer);
          unsubscribe();

          // 重新检查弹框
          this.checkForModals();

          if (this.state.openModals.length > 0) {
            const modal = this.state.openModals[this.state.openModals.length - 1];
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
            this.logger.log(`✅ 弹框已打开 (${elapsedTime}s): ${modal.title || '未知弹框'}`);
            resolve(modal);
          }
        }
      });
    });
  }

  /**
   * 等待弹框关闭
   */
  async waitForModalClose (timeout = 5000) {
    this.logger.log('⏰ 等待弹框关闭...');

    const startTime = Date.now();

    // 立即检查
    if (this.state.openModals.length === 0) {
      this.logger.log('✅ 弹框已关闭');
      return true;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`等待弹框关闭超时 (${timeout}ms)`));
      }, timeout);

      const unsubscribe = this.onStateChange((event, data, context) => {
        if (event === 'modal_closed' || context.openModals.length === 0) {
          clearTimeout(timer);
          unsubscribe();

          // 重新检查弹框
          this.checkForModals();

          if (this.state.openModals.length === 0) {
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
            this.logger.log(`✅ 弹框已关闭 (${elapsedTime}s)`);
            resolve(true);
          }
        }
      });
    });
  }

  /**
   * 等待页面稳定（不在加载状态）
   */
  async waitForPageStable (timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      this.checkForLoadingStates();

      if (this.state.pageState !== 'loading') {
        return true;
      }

      await this.sleep(200);
    }

    this.logger.warn('⚠️ 等待页面稳定超时');
    return false;
  }

  /**
   * 重置状态
   */
  reset () {
    this.state = {
      pageState: 'normal',
      openModals: [],
      modalStack: [],
      currentTask: null,
      taskStack: [],
      pendingActions: [],
      actionHistory: [],
      dependencies: new Map(),
      listeners: this.state.listeners, // 保留监听器
      elementCache: new Map()
    };

    this.logger.log('🔄 状态已重置');
  }

  /**
   * 辅助方法
   */
  generateModalId (modal) {
    return 'modal_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  generateTaskId () {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  generateSelector (element) {
    if (element.id) return '#' + element.id;

    const classes = element.className
      .split(' ')
      .filter(c => c && !c.match(/^(ng-|vue-|react-)/))
      .slice(0, 2);

    if (classes.length > 0) return '.' + classes.join('.');

    return element.tagName.toLowerCase();
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createLogger (prefix) {
    return {
      log: (msg) => console.log(`${prefix} ${msg}`),
      warn: (msg) => console.warn(`${prefix} ${msg}`),
      error: (msg, error) => console.error(`${prefix} ${msg}`, error || '')
    };
  }

  /**
   * 清理资源
   */
  destroy () {
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }

    this.state.listeners = [];
    this.state.pendingActions = [];
    this.state.actionHistory = [];

    this.logger.log('🔌 上下文引擎已销毁');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextEngine;
}
