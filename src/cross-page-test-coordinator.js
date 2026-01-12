// 跨页面测试协调器（运行于 Background Service Worker）
// 负责维护全局测试状态、监听页面导航并在新页面恢复测试

class CrossPageTestCoordinator {
  constructor() {
    this.globalState = {
      sessionId: null,
      isTestingActive: false,
      currentTestPlan: null,
      testConfig: null,

      // 跨页面状态追踪
      pageStack: [],
      testedPages: new Set(),
      pendingPages: [],

      // 进度
      totalPagesPlanned: 0,
      pagesCompleted: 0,
      currentPageProgress: {
        url: '',
        elementsTotal: 0,
        elementsTested: 0
      },

      // AI上下文
      aiContext: {
        businessFlow: null,
        pageRelationships: new Map(),
        crossPageScenarios: []
      }
    };

    this.setupNavigationListeners();
  }

  setupNavigationListeners () {
    // 监听页面提交导航（包括新文档加载）
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (!this.globalState.isTestingActive) return;
      // 仅关注主框架导航
      if (details.frameId !== 0) return;
      this.handlePageNavigation({ tabId: details.tabId, toUrl: details.url, transitionType: details.transitionType });
    });

    // 页面加载完成后尝试在新页面恢复测试
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (!this.globalState.isTestingActive) return;
      if (details.frameId !== 0) return;
      this.resumeTestingOnNewPage(details.tabId, details.url);
    });
  }

  startTestSession ({ startUrl, config, tabId, testObjective }) {
    const sessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.globalState.sessionId = sessionId;
    this.globalState.isTestingActive = true;
    this.globalState.currentTestPlan = { objective: testObjective || '自动化测试' };
    this.globalState.testConfig = config || null;
    this.globalState.pageStack = startUrl ? [{ url: startUrl, timestamp: Date.now(), transitionType: 'typed' }] : [];
    this.globalState.testedPages = new Set();
    this.globalState.pendingPages = [];
    this.globalState.totalPagesPlanned = 0;
    this.globalState.pagesCompleted = 0;
    this.globalState.currentPageProgress = { url: startUrl || '', elementsTotal: 0, elementsTested: 0 };

    // 通知popup
    this.notifyPopup({ action: 'crossPageSessionStarted', url: startUrl, sessionId });
  }

  stopTestSession () {
    this.globalState.isTestingActive = false;
    this.notifyPopup({ action: 'crossPageSessionStopped' });
  }

  getStatus () {
    const { pageStack, pagesCompleted, totalPagesPlanned, currentPageProgress } = this.globalState;
    return { pageStack, pagesCompleted, totalPagesPlanned, currentPageProgress };
  }

  async handlePageNavigation ({ tabId, toUrl, transitionType, fromUrl, trigger }) {
    try {
      const prevUrl = this.getCurrentPageUrl();
      const url = toUrl || prevUrl;

      // 记录访问路径
      this.globalState.pageStack.push({
        url: url,
        timestamp: Date.now(),
        transitionType: transitionType || 'link',
        fromUrl: fromUrl || prevUrl,
        trigger: trigger || undefined
      });

      if (await this.shouldTestPage(url)) {
        this.globalState.pendingPages.push({ url, tabId, discoveredFrom: fromUrl || prevUrl, priority: this.calculatePagePriority(url) });
        this.notifyPopup({ action: 'crossPagePageQueued', url });
      }

      // 保存到storage供报告页展示
      try {
        chrome.storage.local.set({
          crossPageState: {
            pageStack: this.globalState.pageStack,
            pagesCompleted: this.globalState.pagesCompleted,
            totalPagesPlanned: this.globalState.totalPagesPlanned
          }
        });
      } catch { }
    } catch (e) {
      // 静默错误
    }
  }

  async resumeTestingOnNewPage (tabId, url) {
    try {
      if (!url) return;
      if (!this.globalState.isTestingActive) return;
      if (this.globalState.testedPages.has(url)) return;

      // 等待内容脚本可用
      const ready = await this.waitForPageReady(tabId, 8000);
      if (!ready) return;

      // 发送恢复消息
      await chrome.tabs.sendMessage(tabId, {
        action: 'resumeCrossPageTest',
        sessionId: this.globalState.sessionId,
        testConfig: this.globalState.testConfig,
        aiContext: this.globalState.aiContext,
        pageContext: {
          isNewPage: true,
          previousPage: this.globalState.pageStack[this.globalState.pageStack.length - 2]?.url,
          testPath: this.globalState.pageStack.map(p => p.url)
        }
      });

      this.globalState.testedPages.add(url);
      this.globalState.pagesCompleted += 1;
      this.globalState.currentPageProgress = { url, elementsTotal: 0, elementsTested: 0 };

      this.notifyPopup({
        action: 'crossPageTestStarted',
        url,
        progress: {
          pagesCompleted: this.globalState.pagesCompleted,
          totalPages: this.globalState.totalPagesPlanned
        }
      });

      // 保存到storage供报告页展示
      try {
        chrome.storage.local.set({
          crossPageState: {
            pageStack: this.globalState.pageStack,
            pagesCompleted: this.globalState.pagesCompleted,
            totalPagesPlanned: this.globalState.totalPagesPlanned
          }
        });
      } catch { }
    } catch (e) {
      // 静默
    }
  }

  async shouldTestPage (url) {
    try {
      if (this.globalState.testedPages.has(url)) return false;
      if (this.isResourceUrl(url)) return false;

      const firstUrl = this.globalState.pageStack[0]?.url;
      if (firstUrl && !this.isSameDomain(url, firstUrl)) return false;
    } catch { }

    // 默认同域且未测试过则测试
    return true;
  }

  calculatePagePriority (url) {
    if (!url) return 'low';
    const u = url.toLowerCase();
    if (u.includes('/login') || u.includes('/register')) return 'high';
    if (u.includes('/checkout') || u.includes('/pay')) return 'high';
    if (u.includes('/profile') || u.includes('/settings')) return 'medium';
    return 'low';
  }

  async waitForPageReady (tabId, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const res = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        if (res && res.success) {
          await new Promise(r => setTimeout(r, 500));
          return true;
        }
      } catch { }
      await new Promise(r => setTimeout(r, 300));
    }
    return false;
  }

  getCurrentPageUrl () {
    return this.globalState.pageStack[this.globalState.pageStack.length - 1]?.url;
  }

  isSameDomain (url1, url2) {
    try {
      const d1 = new URL(url1).hostname;
      const d2 = new URL(url2).hostname;
      return d1 === d2;
    } catch { return false; }
  }

  isResourceUrl (url) {
    const resourceExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.css', '.js', '.svg', '.ico', '.woff', '.woff2'];
    const u = (url || '').toLowerCase();
    return resourceExtensions.some(ext => u.endsWith(ext));
  }

  notifyPopup (message) {
    try {
      chrome.runtime.sendMessage(message).catch(() => { });
    } catch { }
  }
}

export default CrossPageTestCoordinator;
