/**
 * 增强测试报告生成器
 * 实现功能点、测试状态、API 接口的完整映射
 */

class EnhancedTestReporter {
  constructor() {
    this.testSessions = [];
    this.currentSession = null;
    this.featureMap = new Map(); // 功能点映射
    this.apiMap = new Map(); // API 映射
    this.elementMap = new Map(); // 元素映射
  }

  /**
   * 开始新的测试会话
   */
  startSession (config) {
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      endTime: null,
      config: config,
      pageInfo: {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname
      },
      features: [], // 功能点列表
      elements: [], // 测试元素列表
      apis: [], // API 调用列表
      statistics: {
        totalFeatures: 0,
        testedFeatures: 0,
        passedFeatures: 0,
        failedFeatures: 0,
        totalElements: 0,
        testedElements: 0,
        passedElements: 0,
        failedElements: 0,
        totalApis: 0,
        successApis: 0,
        failedApis: 0
      },
      errors: [],
      warnings: []
    };

    console.log('[增强报告] 测试会话已开始:', this.currentSession.sessionId);
    return this.currentSession;
  }

  /**
   * 记录功能点测试
   */
  recordFeatureTest (featureInfo) {
    // 如果没有活动会话，自动创建一个
    if (!this.currentSession) {
      console.warn('[增强报告] 没有活动的测试会话，自动创建...');
      this.startSession({
        testName: '自动测试',
        autoCreated: true
      });
    }

    const feature = {
      featureId: this.generateFeatureId(featureInfo),
      featureName: featureInfo.name || featureInfo.description,
      featureType: featureInfo.type || 'unknown', // button/form/link/table等
      status: 'testing', // testing/passed/failed/skipped
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      elements: [], // 关联的元素
      apis: [], // 触发的API
      steps: [], // 测试步骤
      result: null,
      error: null,
      screenshot: null,
      metadata: featureInfo.metadata || {}
    };

    this.currentSession.features.push(feature);
    this.currentSession.statistics.totalFeatures++;
    this.featureMap.set(feature.featureId, feature);

    console.log('[增强报告] 记录功能点:', feature.featureName, '(ID:', feature.featureId + ')');
    return feature;
  }

  /**
   * 更新功能点状态
   */
  updateFeatureStatus (featureId, status, result = null, error = null) {
    const feature = this.featureMap.get(featureId);
    if (!feature) {
      console.warn('[增强报告] 未找到功能点:', featureId);
      return;
    }

    feature.status = status;
    feature.endTime = new Date().toISOString();
    feature.duration = new Date(feature.endTime) - new Date(feature.startTime);
    feature.result = result;
    feature.error = error;

    // 更新统计
    this.currentSession.statistics.testedFeatures++;
    if (status === 'passed') {
      this.currentSession.statistics.passedFeatures++;
    } else if (status === 'failed') {
      this.currentSession.statistics.failedFeatures++;
    }

    console.log(`[增强报告] 功能点 "${feature.featureName}" 状态更新为: ${status}`);
  }

  /**
   * 记录功能点的测试步骤
   */
  recordFeatureStep (featureId, step) {
    const feature = this.featureMap.get(featureId);
    if (!feature) {
      console.warn('[增强报告] 未找到功能点:', featureId);
      return;
    }

    const stepRecord = {
      stepId: feature.steps.length + 1,
      action: step.action,
      target: step.target,
      value: step.value,
      timestamp: new Date().toISOString(),
      success: step.success !== false,
      error: step.error || null
    };

    feature.steps.push(stepRecord);
    console.log(`[增强报告] 记录步骤: ${step.action} -> ${step.target}`);
  }

  /**
   * 记录元素测试
   */
  recordElementTest (elementInfo, featureId = null) {
    // 如果没有活动会话，自动创建
    if (!this.currentSession) {
      console.warn('[增强报告] recordElementTest: 自动创建会话');
      this.startSession({ testName: '自动测试', autoCreated: true });
    }

    const element = {
      elementId: this.generateElementId(elementInfo),
      elementType: elementInfo.type || elementInfo.tagName,
      elementText: elementInfo.text || elementInfo.innerText || '',
      elementSelector: elementInfo.selector || this.generateSelector(elementInfo.element),
      featureId: featureId, // 关联的功能点
      status: 'testing',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      action: elementInfo.action || 'click',
      apis: [], // 触发的API
      result: null,
      error: null
    };

    this.currentSession.elements.push(element);
    this.currentSession.statistics.totalElements++;
    this.elementMap.set(element.elementId, element);

    // 如果关联到功能点，添加到功能点的元素列表
    if (featureId) {
      const feature = this.featureMap.get(featureId);
      if (feature) {
        feature.elements.push(element.elementId);
      }
    }

    console.log('[增强报告] 记录元素测试:', element.elementText || element.elementType);
    return element;
  }

  /**
   * 更新元素测试结果
   */
  updateElementResult (elementId, status, result = null, error = null) {
    const element = this.elementMap.get(elementId);
    if (!element) return;

    element.status = status;
    element.endTime = new Date().toISOString();
    element.duration = new Date(element.endTime) - new Date(element.startTime);
    element.result = result;
    element.error = error;

    // 更新统计
    this.currentSession.statistics.testedElements++;
    if (status === 'passed') {
      this.currentSession.statistics.passedElements++;
    } else if (status === 'failed') {
      this.currentSession.statistics.failedElements++;
    }
  }

  /**
   * 记录 API 调用
   */
  recordApiCall (apiInfo, elementId = null, featureId = null) {
    if (!this.currentSession) return null;

    const api = {
      apiId: this.generateApiId(apiInfo),
      method: apiInfo.method,
      url: apiInfo.url,
      requestTime: apiInfo.requestTime || new Date().toISOString(),
      responseTime: apiInfo.responseTime,
      duration: apiInfo.duration || 0,
      status: apiInfo.status,
      statusText: apiInfo.statusText || this.getStatusText(apiInfo.status),
      requestHeaders: apiInfo.requestHeaders || {},
      requestBody: apiInfo.requestBody || null,
      responseHeaders: apiInfo.responseHeaders || {},
      responseBody: apiInfo.responseBody || null,
      success: apiInfo.status >= 200 && apiInfo.status < 300,
      elementId: elementId, // 触发此API的元素
      featureId: featureId, // 关联的功能点
      error: apiInfo.error || null
    };

    this.currentSession.apis.push(api);
    this.currentSession.statistics.totalApis++;
    if (api.success) {
      this.currentSession.statistics.successApis++;
    } else {
      this.currentSession.statistics.failedApis++;
    }

    this.apiMap.set(api.apiId, api);

    // 关联到元素
    if (elementId) {
      const element = this.elementMap.get(elementId);
      if (element) {
        element.apis.push(api.apiId);
      }
    }

    // 关联到功能点
    if (featureId) {
      const feature = this.featureMap.get(featureId);
      if (feature) {
        feature.apis.push(api.apiId);
      }
    }

    console.log(`[增强报告] 记录 API: ${api.method} ${api.url} - ${api.status}`);
    return api;
  }

  /**
   * 结束测试会话
   */
  endSession () {
    if (!this.currentSession) {
      console.warn('[增强报告] 没有活动的测试会话');
      return null;
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.duration = new Date(this.currentSession.endTime) - new Date(this.currentSession.startTime);

    // 计算通过率
    this.currentSession.statistics.featurePassRate =
      this.currentSession.statistics.testedFeatures > 0
        ? (this.currentSession.statistics.passedFeatures / this.currentSession.statistics.testedFeatures * 100).toFixed(2)
        : 0;

    this.currentSession.statistics.elementPassRate =
      this.currentSession.statistics.testedElements > 0
        ? (this.currentSession.statistics.passedElements / this.currentSession.statistics.testedElements * 100).toFixed(2)
        : 0;

    this.currentSession.statistics.apiSuccessRate =
      this.currentSession.statistics.totalApis > 0
        ? (this.currentSession.statistics.successApis / this.currentSession.statistics.totalApis * 100).toFixed(2)
        : 0;

    // 生成完整报告
    const report = this.generateFullReport();

    // 保存到历史
    this.testSessions.push(this.currentSession);

    console.log('[增强报告] 测试会话已结束:', this.currentSession.sessionId);
    console.log('[增强报告] 测试统计:', this.currentSession.statistics);

    const session = this.currentSession;
    this.currentSession = null;

    return { session, report };
  }

  /**
   * 生成完整报告
   */
  generateFullReport () {
    if (!this.currentSession) return null;

    const report = {
      reportId: this.currentSession.sessionId,
      reportTime: new Date().toISOString(),
      summary: {
        ...this.currentSession.statistics,
        testUrl: this.currentSession.pageInfo.url,
        testTitle: this.currentSession.pageInfo.title,
        duration: this.currentSession.duration,
        startTime: this.currentSession.startTime,
        endTime: this.currentSession.endTime
      },
      features: this.buildFeatureReportSection(),
      elements: this.buildElementReportSection(),
      apis: this.buildApiReportSection(),
      mappings: this.buildMappings(),
      errors: this.currentSession.errors,
      warnings: this.currentSession.warnings
    };

    return report;
  }

  /**
   * 构建功能点报告部分
   */
  buildFeatureReportSection () {
    return this.currentSession.features.map(feature => ({
      featureId: feature.featureId,
      featureName: feature.featureName,
      featureType: feature.featureType,
      status: feature.status,
      duration: feature.duration,
      elementCount: feature.elements.length,
      apiCount: feature.apis.length,
      steps: feature.steps,
      result: feature.result,
      error: feature.error,
      // 关联的元素详情
      relatedElements: feature.elements.map(elemId => {
        const elem = this.elementMap.get(elemId);
        return elem ? {
          elementId: elemId,
          elementType: elem.elementType,
          elementText: elem.elementText,
          status: elem.status
        } : null;
      }).filter(Boolean),
      // 关联的API详情
      relatedApis: feature.apis.map(apiId => {
        const api = this.apiMap.get(apiId);
        return api ? {
          apiId: apiId,
          method: api.method,
          url: api.url,
          status: api.status,
          success: api.success
        } : null;
      }).filter(Boolean)
    }));
  }

  /**
   * 构建元素报告部分
   */
  buildElementReportSection () {
    return this.currentSession.elements.map(element => ({
      elementId: element.elementId,
      elementType: element.elementType,
      elementText: element.elementText,
      elementSelector: element.elementSelector,
      featureName: element.featureId ? this.featureMap.get(element.featureId)?.featureName : '未关联',
      status: element.status,
      action: element.action,
      duration: element.duration,
      apiCount: element.apis.length,
      relatedApis: element.apis.map(apiId => {
        const api = this.apiMap.get(apiId);
        return api ? {
          method: api.method,
          url: api.url,
          status: api.status
        } : null;
      }).filter(Boolean),
      result: element.result,
      error: element.error
    }));
  }

  /**
   * 构建 API 报告部分
   */
  buildApiReportSection () {
    return this.currentSession.apis.map(api => ({
      apiId: api.apiId,
      method: api.method,
      url: api.url,
      status: api.status,
      statusText: api.statusText,
      duration: api.duration,
      success: api.success,
      featureName: api.featureId ? this.featureMap.get(api.featureId)?.featureName : '未关联',
      elementText: api.elementId ? this.elementMap.get(api.elementId)?.elementText : '未关联',
      error: api.error
    }));
  }

  /**
   * 构建映射关系
   */
  buildMappings () {
    return {
      featureToElements: this.buildFeatureToElementsMapping(),
      featureToApis: this.buildFeatureToApisMapping(),
      elementToApis: this.buildElementToApisMapping(),
      apiToFeatures: this.buildApiToFeaturesMapping()
    };
  }

  /**
   * 功能点 -> 元素映射
   */
  buildFeatureToElementsMapping () {
    const mapping = [];
    this.currentSession.features.forEach(feature => {
      mapping.push({
        featureId: feature.featureId,
        featureName: feature.featureName,
        elements: feature.elements.map(elemId => {
          const elem = this.elementMap.get(elemId);
          return elem ? {
            elementId: elemId,
            elementText: elem.elementText,
            status: elem.status
          } : null;
        }).filter(Boolean)
      });
    });
    return mapping;
  }

  /**
   * 功能点 -> API 映射
   */
  buildFeatureToApisMapping () {
    const mapping = [];
    this.currentSession.features.forEach(feature => {
      mapping.push({
        featureId: feature.featureId,
        featureName: feature.featureName,
        apis: feature.apis.map(apiId => {
          const api = this.apiMap.get(apiId);
          return api ? {
            apiId: apiId,
            method: api.method,
            url: api.url,
            status: api.status
          } : null;
        }).filter(Boolean)
      });
    });
    return mapping;
  }

  /**
   * 元素 -> API 映射
   */
  buildElementToApisMapping () {
    const mapping = [];
    this.currentSession.elements.forEach(element => {
      if (element.apis.length > 0) {
        mapping.push({
          elementId: element.elementId,
          elementText: element.elementText,
          apis: element.apis.map(apiId => {
            const api = this.apiMap.get(apiId);
            return api ? {
              apiId: apiId,
              method: api.method,
              url: api.url,
              status: api.status
            } : null;
          }).filter(Boolean)
        });
      }
    });
    return mapping;
  }

  /**
   * API -> 功能点映射
   */
  buildApiToFeaturesMapping () {
    const mapping = [];
    this.currentSession.apis.forEach(api => {
      if (api.featureId) {
        const feature = this.featureMap.get(api.featureId);
        mapping.push({
          apiId: api.apiId,
          method: api.method,
          url: api.url,
          status: api.status,
          featureName: feature ? feature.featureName : '未知功能'
        });
      }
    });
    return mapping;
  }

  /**
   * 保存报告到存储
   */
  async saveReport (report) {
    try {
      const reports = await this.loadAllReports();
      reports.unshift(report); // 最新的在前面

      // 只保留最近50个报告
      const reportsToSave = reports.slice(0, 50);

      await new Promise(resolve => {
        chrome.storage.local.set({
          enhancedTestReports: reportsToSave,
          latestReport: report
        }, resolve);
      });

      console.log('[增强报告] 报告已保存:', report.reportId);
      return true;
    } catch (error) {
      console.error('[增强报告] 保存报告失败:', error);
      return false;
    }
  }

  /**
   * 加载所有报告
   */
  async loadAllReports () {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['enhancedTestReports'], resolve);
      });
      return result.enhancedTestReports || [];
    } catch (error) {
      console.error('[增强报告] 加载报告失败:', error);
      return [];
    }
  }

  /**
   * 生成唯一ID
   */
  generateSessionId () {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFeatureId (info) {
    return `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateElementId (info) {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateApiId (info) {
    return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSelector (element) {
    if (!element) return '';
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).slice(0, 2);
      if (classes.length > 0) return `.${classes.join('.')}`;
    }
    return element.tagName.toLowerCase();
  }

  getStatusText (status) {
    const statusTexts = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return statusTexts[status] || `HTTP ${status}`;
  }
}

// 全局实例
if (typeof window !== 'undefined') {
  window.enhancedReporter = new EnhancedTestReporter();
}
