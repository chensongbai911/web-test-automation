/**
 * AI测试指挥中心 (Test Commander)
 * 版本: v4.0
 * 核心职责：
 * 1. 理解页面的业务功能结构
 * 2. 识别完整的用户操作流程
 * 3. 规划功能级测试计划
 * 4. 指挥整个测试过程
 * 5. 生成功能级测试报告
 */

class AITestCommander {
  constructor(qwenApiKey) {
    this.qwen = new QwenIntegration(qwenApiKey);
    this.contextEngine = new ContextEngine();
    this.flowOrchestrator = new FlowOrchestrator(this.qwen);
    this.featureRecorder = new FeatureRecorder();

    this.testingSession = {
      sessionId: this.generateSessionId(),
      startTime: null,
      endTime: null,
      features: [], // 识别到的功能列表
      currentFeature: null,
      completedFeatures: [],
      testResults: [],
      pageUnderstanding: null
    };

    this.logger = this.createLogger('[测试指挥中心]');
  }

  /**
   * 核心方法: 启动智能化测试
   */
  async startIntelligentTesting (pageUrl, userIntent) {
    this.logger.log('🚀 启动智能化测试...');
    this.logger.log(`📍 页面URL: ${pageUrl}`);
    if (userIntent) {
      this.logger.log(`👤 用户意图: ${userIntent}`);
    }

    this.testingSession.startTime = Date.now();

    try {
      // 第1步: AI深度理解页面
      this.logger.log('📖 AI正在理解页面业务...');
      const pageUnderstanding = await this.understandPage();
      this.testingSession.pageUnderstanding = pageUnderstanding;

      // 第2步: 识别页面的核心功能
      this.logger.log('🎯 识别核心功能...');
      const features = await this.identifyFeatures(pageUnderstanding, userIntent);
      this.testingSession.features = features;

      this.logger.log(`✅ 识别到 ${features.length} 个核心功能`);
      features.forEach((f, i) => {
        this.logger.log(`  ${i + 1}. ${f.name} (优先级: ${f.priority}/10)`);
      });

      // 第3步: 为每个功能生成完整的测试流程
      this.logger.log('📋 为每个功能生成测试流程...');
      for (const feature of features) {
        try {
          feature.testFlow = await this.flowOrchestrator.generateTestFlow(feature);
        } catch (error) {
          this.logger.error(`流程生成失败: ${feature.name}`, error);
          feature.testFlow = null;
        }
      }

      // 第4步: 按优先级执行功能测试
      this.logger.log('⚡ 开始执行功能测试...');
      const sortedFeatures = features.sort((a, b) => b.priority - a.priority);

      for (const feature of sortedFeatures) {
        await this.testFeature(feature);
      }

      // 第5步: 生成测试报告
      this.logger.log('📊 生成测试报告...');
      const report = await this.generateReport();

      this.testingSession.endTime = Date.now();

      this.logger.log('✅ 智能化测试完成！');

      return report;

    } catch (error) {
      this.logger.error('❌ 测试失败:', error);
      this.testingSession.endTime = Date.now();
      throw error;
    }
  }

  /**
   * AI深度理解页面业务
   */
  async understandPage () {
    try {
      const pageSnapshot = this.capturePageSnapshot();

      const prompt = `你是一位资深的Web应用测试专家。请深度分析这个页面，理解其业务功能。

【页面信息】
- URL: ${pageSnapshot.url}
- 标题: ${pageSnapshot.title}
- 页面类型识别: ${pageSnapshot.pageType}

【页面结构】
- 导航菜单: ${pageSnapshot.navItems.length}个
- 按钮: ${pageSnapshot.buttons.length}个
- 表单: ${pageSnapshot.forms.length}个
- 表格: ${pageSnapshot.tables.length}个
- 弹框/对话框: ${pageSnapshot.modals.length}个
- 输入字段: ${pageSnapshot.formFields.length}个

【主要交互元素】
按钮: ${pageSnapshot.buttons.slice(0, 15).map(b => `"${b.text}"`).join(', ')}

【表单字段】
${pageSnapshot.formFields.slice(0, 15).map(f => `- ${f.label || f.name} (${f.type}${f.required ? ' *必填' : ''})`).join('\n')}

【任务】
请分析这个页面的：
1. 业务系统类型（如：管理后台、电商、社交等）
2. 页面的核心业务功能（最多8个，必须是完整的、可闭环的功能）
3. 用户在这个页面上通常会进行什么操作
4. 哪些功能是关键的、必须测试的
5. 功能之间的依赖关系

【重要要求】
- 必须识别"完整的、可闭环的"功能，不要列出单个操作
- 例如：不要写"点击按钮"，要写"打开用户设置弹框→填写表单→确认保存→弹框关闭"
- 每个功能必须有明确的"开始动作"和"完成条件"
- 优先级必须是 critical/high/medium/low 中的一个

【返回JSON格式】
{
  "systemType": "业务系统类型",
  "pagePurpose": "页面主要用途",
  "businessContext": "业务背景描述",
  "coreFeatures": [
    {
      "featureName": "功能名称（如：添加新用户）",
      "description": "详细的功能描述",
      "userStory": "作为XX，我想要XX，以便XX",
      "importance": "critical|high|medium|low",
      "triggerElement": "触发该功能的按钮/链接（文本内容或选择器）",
      "expectedFlow": [
        "步骤1: 点击XX按钮",
        "步骤2: 弹框打开显示表单",
        "步骤3: 填写必要信息",
        "步骤4: 点击确认按钮",
        "步骤5: 弹框关闭",
        "步骤6: 验证数据已保存"
      ],
      "completionCriteria": "功能完成的判断标准（如：弹框关闭且列表更新）"
    }
  ],
  "featureDependencies": {
    "功能A": ["功能B必须先执行"],
    "功能B": []
  },
  "testingStrategy": {
    "recommendedOrder": ["按照这个顺序测试"],
    "criticalPaths": ["最关键的业务流程"],
    "edgeCases": ["需要考虑的边界情况"]
  },
  "uiPatterns": {
    "usesModals": true/false,
    "usesTables": true/false,
    "usesForms": true/false,
    "usesWizards": true/false,
    "interactionComplexity": "simple|moderate|complex"
  }
}`;

      const result = await this.qwen.request([{
        role: 'system',
        content: '你是一位拥有15年经验的高级QA工程师。你擅长从页面结构快速理解业务逻辑，能识别关键功能和完整的用户操作流程。你特别关注功能的"完整性"和"闭环性"。'
      }, {
        role: 'user',
        content: prompt
      }], {
        temperature: 0.3,
        max_tokens: 4000
      });

      const understanding = this.parseResponse(result);

      this.logger.log('✅ 页面理解完成');
      this.logger.log(`📊 系统类型: ${understanding.systemType}`);
      this.logger.log(`📄 页面用途: ${understanding.pagePurpose}`);

      return understanding;

    } catch (error) {
      this.logger.error('页面理解失败:', error);
      return this.fallbackPageUnderstanding();
    }
  }

  /**
   * 识别核心功能
   */
  async identifyFeatures (pageUnderstanding, userIntent) {
    const features = [];

    // 从AI理解中提取功能
    if (pageUnderstanding.coreFeatures && Array.isArray(pageUnderstanding.coreFeatures)) {
      for (const featureInfo of pageUnderstanding.coreFeatures) {
        const feature = {
          id: this.generateFeatureId(),
          name: featureInfo.featureName || '未命名功能',
          description: featureInfo.description || '',
          userStory: featureInfo.userStory || '',
          priority: this.mapImportanceToPriority(featureInfo.importance),
          triggerElement: featureInfo.triggerElement || '',
          expectedFlow: Array.isArray(featureInfo.expectedFlow) ? featureInfo.expectedFlow : [],
          completionCriteria: featureInfo.completionCriteria || '功能完成',
          status: 'pending',
          testFlow: null,
          testResult: null,
          startTime: null,
          endTime: null,
          duration: 0
        };

        features.push(feature);
      }
    }

    // 如果AI没有识别到功能，使用启发式方法
    if (features.length === 0) {
      this.logger.warn('⚠️ AI未识别到功能，使用启发式方法...');
      features.push(...this.fallbackFeatureIdentification());
    }

    return features;
  }

  /**
   * 测试单个功能（完整流程）
   */
  async testFeature (feature) {
    this.logger.log(`\n🎯 开始测试功能: ${feature.name}`);
    this.logger.log(`📝 描述: ${feature.description}`);
    if (feature.expectedFlow && feature.expectedFlow.length > 0) {
      this.logger.log(`📋 预期流程: ${feature.expectedFlow.length}个步骤`);
    }

    this.testingSession.currentFeature = feature;
    feature.startTime = Date.now();

    // 开始记录功能测试
    const featureRecord = this.featureRecorder.startFeature({
      id: feature.id,
      name: feature.name,
      description: feature.description
    });

    try {
      // 执行完整的测试流程
      let flowResult;

      if (feature.testFlow) {
        flowResult = await this.flowOrchestrator.executeFlow(
          feature.testFlow,
          this.contextEngine
        );
      } else {
        // 如果没有流程，执行基础交互
        flowResult = await this.executeBasicInteraction(feature);
      }

      feature.endTime = Date.now();
      feature.duration = feature.endTime - feature.startTime;
      feature.status = flowResult.success ? 'passed' : 'failed';
      feature.testResult = flowResult;

      // 记录功能测试结果
      this.featureRecorder.completeFeature(featureRecord.id, {
        success: flowResult.success,
        steps: flowResult.steps ? flowResult.steps.length : 0,
        duration: feature.duration,
        error: flowResult.error
      });

      this.testingSession.completedFeatures.push(feature);

      const statusIcon = flowResult.success ? '✅' : '❌';
      const statusText = flowResult.success ? '成功' : '失败';
      this.logger.log(`${statusIcon} 功能测试${statusText}: ${feature.name}`);
      this.logger.log(`⏱️ 耗时: ${(feature.duration / 1000).toFixed(2)}秒`);

      // 等待页面稳定
      await this.waitForPageStable();

      return flowResult;

    } catch (error) {
      this.logger.error(`❌ 功能测试异常: ${feature.name}`, error);

      feature.endTime = Date.now();
      feature.duration = feature.endTime - feature.startTime;
      feature.status = 'error';
      feature.testResult = {
        success: false,
        error: error.message,
        steps: []
      };

      this.featureRecorder.completeFeature(featureRecord.id, {
        success: false,
        error: error.message,
        duration: feature.duration
      });

      // 等待页面恢复
      await this.waitForPageStable(1000);

      return { success: false, error: error.message, steps: [] };
    }
  }

  /**
   * 执行基础交互（当没有完整流程时）
   */
  async executeBasicInteraction (feature) {
    try {
      const steps = [];

      // 尝试找到触发元素
      if (feature.triggerElement) {
        const triggerElement = this.findElement(feature.triggerElement);

        if (triggerElement) {
          // 点击触发元素
          const stepResult = {
            step: 1,
            action: 'click',
            description: `点击"${feature.name}"触发元素`,
            success: true
          };

          triggerElement.click();
          steps.push(stepResult);

          // 等待响应
          await this.waitForPageStable(1000);

          return {
            success: true,
            steps: steps
          };
        }
      }

      return {
        success: false,
        steps: steps,
        error: '无法找到触发元素'
      };

    } catch (error) {
      return {
        success: false,
        steps: [],
        error: error.message
      };
    }
  }

  /**
   * 生成测试报告
   */
  async generateReport () {
    const features = this.testingSession.completedFeatures;
    const totalDuration = this.testingSession.endTime - this.testingSession.startTime;

    const passed = features.filter(f => f.status === 'passed').length;
    const failed = features.filter(f => f.status === 'failed').length;
    const error = features.filter(f => f.status === 'error').length;
    const skipped = this.testingSession.features.length - features.length;

    const report = {
      sessionId: this.testingSession.sessionId,
      timestamp: new Date().toISOString(),

      summary: {
        totalFeatures: this.testingSession.features.length,
        passed,
        failed,
        error,
        skipped,
        successRate: features.length > 0 ? ((passed / features.length) * 100).toFixed(2) : 0,
        totalDuration: ((totalDuration / 1000).toFixed(2)) + '秒',
        pageUnderstanding: this.testingSession.pageUnderstanding ? {
          systemType: this.testingSession.pageUnderstanding.systemType,
          pagePurpose: this.testingSession.pageUnderstanding.pagePurpose,
          businessContext: this.testingSession.pageUnderstanding.businessContext
        } : null
      },

      features: features.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        duration: (f.duration / 1000).toFixed(2) + '秒',
        priority: f.priority,
        steps: f.testResult?.steps?.length || 0,
        error: f.testResult?.error || null
      })),

      detailedRecords: this.featureRecorder.getFullReport(),

      // AI分析报告
      aiInsights: null
    };

    // 获取AI分析报告
    try {
      const aiAnalysis = await this.analyzeTestResults(report);
      report.aiInsights = aiAnalysis;
    } catch (error) {
      this.logger.error('AI分析失败:', error);
    }

    return report;
  }

  /**
   * AI分析测试结果
   */
  async analyzeTestResults (report) {
    const prompt = `请分析这份功能测试报告，给出专业的质量评估和改进建议。

【测试概况】
- 测试的功能数: ${report.summary.totalFeatures}
- 通过: ${report.summary.passed}
- 失败: ${report.summary.failed}
- 错误: ${report.summary.error}
- 跳过: ${report.summary.skipped}
- 成功率: ${report.summary.successRate}%
- 总耗时: ${report.summary.totalDuration}

【功能测试详情】
${report.features.map(f => `- ${f.name} (${f.status}): ${f.duration}`).join('\n')}

【功能描述】
${this.testingSession.features.map(f => `- ${f.name}: ${f.description}`).join('\n')}

【任务】
请：
1. 评估整体的测试质量（优秀/良好/一般/较差）
2. 分析失败和错误的可能原因
3. 识别潜在的质量风险
4. 提供针对性的改进建议
5. 指出关键的业务功能是否完整测试

【返回JSON】
{
  "qualityScore": 0-100,
  "qualityLevel": "excellent|good|fair|poor",
  "qualitySummary": "总体质量评估",
  "failureAnalysis": [
    {
      "feature": "失败的功能名称",
      "possibleCause": "可能的原因",
      "recommendation": "改进建议"
    }
  ],
  "riskAreas": [
    {
      "area": "风险区域",
      "risk": "风险描述",
      "severity": "high|medium|low"
    }
  ],
  "keyImprovements": [
    "改进建议1",
    "改进建议2"
  ],
  "nextSteps": [
    "下一步行动建议"
  ]
}`;

    try {
      const result = await this.qwen.request([{
        role: 'system',
        content: '你是一位资深的QA主管，擅长从测试结果中发现问题和改进机会。你能识别关键的质量问题，并提供可行的改进方案。'
      }, {
        role: 'user',
        content: prompt
      }]);

      return this.parseResponse(result);
    } catch (error) {
      this.logger.error('AI分析失败:', error);
      return null;
    }
  }

  /**
   * 捕获页面快照
   */
  capturePageSnapshot () {
    try {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"]'))
        .filter(b => b.offsetParent !== null)
        .slice(0, 50)
        .map(b => ({
          text: b.textContent.trim().substring(0, 50),
          selector: this.generateSelector(b),
          visible: true,
          ariaLabel: b.getAttribute('aria-label')
        }));

      const formFields = Array.from(document.querySelectorAll('input, select, textarea'))
        .filter(f => f.offsetParent !== null)
        .slice(0, 50)
        .map(f => ({
          name: f.name || f.id || '',
          type: f.type || f.tagName.toLowerCase(),
          label: this.findFieldLabel(f),
          required: f.required || f.hasAttribute('required'),
          placeholder: f.placeholder || ''
        }));

      return {
        url: window.location.href,
        title: document.title,
        pageType: this.detectPageType(),
        navItems: Array.from(document.querySelectorAll('nav a, .nav-item, [class*="menu"] a')).length,
        buttons: buttons,
        forms: Array.from(document.querySelectorAll('form')).length,
        formFields: formFields,
        tables: Array.from(document.querySelectorAll('table')).length,
        modals: Array.from(document.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]')).length,
        totalElements: document.querySelectorAll('*').length
      };
    } catch (error) {
      this.logger.error('捕获页面快照失败:', error);
      return {
        url: window.location.href,
        title: document.title,
        pageType: '未知',
        navItems: 0,
        buttons: [],
        forms: 0,
        formFields: [],
        tables: 0,
        modals: 0,
        totalElements: 0
      };
    }
  }

  /**
   * 查找页面元素
   */
  findElement (selector) {
    try {
      // 首先尝试作为CSS选择器
      let element = document.querySelector(selector);
      if (element && element.offsetParent !== null) return element;

      // 其次尝试按文本内容搜索按钮
      if (!element) {
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const btn of buttons) {
          if (btn.textContent.includes(selector) && btn.offsetParent !== null) {
            return btn;
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 检测页面类型
   */
  detectPageType () {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyClass = document.body.className.toLowerCase();

    if (url.includes('admin') || title.includes('管理') || bodyClass.includes('admin')) return '管理后台';
    if (url.includes('shop') || url.includes('store') || title.includes('商城')) return '电商平台';
    if (url.includes('user') || title.includes('用户') || url.includes('profile')) return '用户中心';
    if (url.includes('dashboard') || title.includes('仪表板')) return '数据仪表板';
    if (url.includes('form') || title.includes('表单')) return '表单页面';
    return '通用页面';
  }

  /**
   * 查找字段标签
   */
  findFieldLabel (field) {
    // 查找关联的label
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) return label.textContent.trim();

    // 查找父label
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();

    // 使用placeholder
    if (field.placeholder) return field.placeholder;

    // 使用aria-label
    if (field.getAttribute('aria-label')) return field.getAttribute('aria-label');

    return field.name || field.id || '未知字段';
  }

  /**
   * 生成选择器
   */
  generateSelector (element) {
    if (element.id) return '#' + element.id;

    const classes = element.className
      .split(' ')
      .filter(c => c && !c.match(/^(ng-|vue-|react-)/))
      .slice(0, 3);

    if (classes.length > 0) return '.' + classes.join('.');

    return element.tagName.toLowerCase();
  }

  /**
   * 解析AI响应
   */
  parseResponse (response) {
    try {
      const content = typeof response === 'string' ? response : (response.content || '');
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {};
    } catch (error) {
      this.logger.error('响应解析失败:', error);
      return {};
    }
  }

  /**
   * 等待页面稳定
   */
  async waitForPageStable (timeout = 2000) {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  /**
   * 备用页面理解
   */
  fallbackPageUnderstanding () {
    return {
      systemType: '未知系统',
      pagePurpose: document.title || '页面',
      businessContext: '需要人工分析',
      coreFeatures: [],
      featureDependencies: {},
      testingStrategy: {
        recommendedOrder: [],
        criticalPaths: [],
        edgeCases: []
      },
      uiPatterns: {
        usesModals: false,
        usesTables: false,
        usesForms: false,
        usesWizards: false,
        interactionComplexity: 'moderate'
      }
    };
  }

  /**
   * 启发式功能识别
   */
  fallbackFeatureIdentification () {
    const features = [];

    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const button of buttons) {
      const text = button.textContent.trim();
      if (text && text.length < 20 && button.offsetParent !== null) {
        features.push({
          id: this.generateFeatureId(),
          name: text,
          description: `点击"${text}"按钮的功能`,
          userStory: `作为用户，我想点击${text}按钮`,
          priority: 5,
          triggerElement: this.generateSelector(button),
          expectedFlow: ['点击按钮', '等待响应'],
          completionCriteria: '操作完成',
          status: 'pending',
          testFlow: null
        });
      }
    }

    return features;
  }

  /**
   * 优先级映射
   */
  mapImportanceToPriority (importance) {
    const map = {
      'critical': 10,
      'high': 7,
      'medium': 5,
      'low': 3
    };
    return map[importance] || 5;
  }

  /**
   * 生成ID
   */
  generateSessionId () {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  generateFeatureId () {
    return 'feature_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  /**
   * 创建日志记录器
   */
  createLogger (prefix) {
    return {
      log: (msg) => console.log(`${prefix} ${msg}`),
      warn: (msg) => console.warn(`${prefix} ${msg}`),
      error: (msg, error) => console.error(`${prefix} ${msg}`, error || '')
    };
  }

  /**
   * 获取测试会话信息
   */
  getSessionInfo () {
    return {
      sessionId: this.testingSession.sessionId,
      totalFeatures: this.testingSession.features.length,
      completedFeatures: this.testingSession.completedFeatures.length,
      currentFeature: this.testingSession.currentFeature?.name || null,
      pageUnderstanding: this.testingSession.pageUnderstanding
    };
  }

  /**
   * 清理资源
   */
  destroy () {
    if (this.contextEngine) {
      this.contextEngine.destroy();
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AITestCommander;
}
