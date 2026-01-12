# 🧠 流程导向的智能化测试系统 - 完整优化方案

**项目**:  chensongbai911/web-test-automation  
**版本**: v4.0 - Intelligent Flow-Oriented Testing  
**核心理念**: 像测试人员一样思考和操作  
**日期**: 2026-01-12  
**作者**: 高级产品设计团队

---

## 📋 目录

1. [核心问题分析](#核心问题分析)
2. [智能化测试新架构](#智能化测试新架构)
3. [完整代码实现](#完整代码实现)
4. [Dialog/Modal完整测试方案](#dialogmodal完整测试方案)
5. [功能级测试管理](#功能级测试管理)
6. [AI提示词工程](#ai提示词工程)
7. [实施指南](#实施指南)

---

## 🎯 核心问题分析

### 问题1: 缺乏流程完整性

**当前问题**: 
```javascript
// 当前的测试逻辑（元素导向）
测试流程：
1. 发现按钮 "打开设置"
2. 点击按钮
3. ❌ 弹框打开了，但立即跳到下一个元素
4. 发现按钮 "保存" 
5. 点击保存（但弹框还没填写完！）
6. ❌ 弹框还开着，但已经在测试其他元素了

结果：功能测试不完整，逻辑混乱
```

**应该的流程（功能导向）**:
```javascript
// 正确的测试逻辑（功能导向）
测试流程：
1. 发现按钮 "打开设置"
2. 点击按钮
3. ✅ 检测到弹框打开 → 进入"弹框测试模式"
4. ✅ 识别弹框内的所有交互元素
5. ✅ 依次测试：
   - 勾选必要的checkbox
   - 填写必要的输入框
   - 选择必要的下拉框
6. ✅ 点击"确认"按钮（完成业务操作）
7. ✅ 如果弹框还在，点击"×"或"取消"关闭
8. ✅ 验证弹框已关闭
9. ✅ 记录整个功能的测试结果
10. ✅ 继续测试下一个功能

结果：功能测试完整，逻辑清晰，像人一样操作
```

### 问题2: 缺乏上下文感知

**当前**:  工具不知道自己处于什么状态
```javascript
// 没有状态管理
页面状态：不知道
弹框状态：不知道
当前任务：不知道
应该做什么：不知道

→ 结果：盲目地点击所有元素
```

**应该**:  工具清楚地知道当前状态和任务
```javascript
// 完整的状态管理
当前状态：{
  pageState: "弹框已打开",
  currentTask: "测试用户设置弹框",
  taskProgress: "填写表单中",
  openModals: ["#user-settings-modal"],
  pendingActions: ["点击确认", "关闭弹框"],
  nextTask: "测试导航菜单"
}

→ 结果：知道自己在做什么，应该做什么
```

### 问题3: AI能力未充分发挥

**当前**: AI只是"工具"，被动响应
```javascript
用户:  测试这个页面
AI: 好的，我分析了页面，有50个元素
工具: 开始逐个点击这50个元素
→ AI并未真正参与测试过程
```

**应该**: AI是"测试员"，主动思考
```javascript
用户: 测试这个页面
AI:  我看到这是一个用户管理页面，有以下核心功能：
    1. 添加用户（打开弹框 → 填写表单 → 提交）
    2. 编辑用户（选择用户 → 打开弹框 → 修改 → 保存）
    3. 删除��户（选择用户 → 点击删除 → 确认）
    我将按照功能完整性进行测试，每个功能都会完整走完
    
→ AI理解业务流程，主动规划和执行
```

---

## 🏗️ 智能化测试新架构

### 核心设计理念

```
传统架构 (v1-3):
┌──────────┐
│ 发现元素 │ → 逐个点击 → 记录结果
└──────────┘
问题：无脑点击，无逻辑

新架构 (v4):
┌─────────────────────────────────────────────────────────┐
│                   AI测试指挥中心                         │
│         (像人类测试经理一样思考和决策)                    │
└──────────────┬──────────────────────────────────────────┘
               │
      ┌────────┴────────┐
      │  理解页面业务   │
      │  识别核心功能   │
      │  规划测试流程   │
      └────────┬────────┘
               │
      ┌────────┴────────┐
      │  功能级测试执行 │
      └────────┬────────┘
               │
      ┌────────┴────────────────────────────────────┐
      │                                              │
  ┌───▼───┐  ┌───────┐  ┌───────┐  ┌────────┐  ┌──▼──┐
  │ 流程  │  │上下文 │  │ 状态  │  │ 智能  │  │功能│
  │ 编排  │  │ 管理  │  │ 机    │  │ 决策  │  │记录│
  └───────┘  └───────┘  └───────┘  └────────┘  └─────┘
```

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│              智能化流程导向测试系统架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  第1层:  AI测试指挥中心 (Test Commander)                       │
│  ├─ 理解页面业务和功能结构                                   │
│  ├─ 识别完整的用户操作流程                                   │
│  ├─ 规划功能级测试计划                                       │
│  └─ 实时决策和调度                                           │
│                                                               │
│  第2层: 上下文感知引擎 (Context Engine)                       │
│  ├─ 页面状态跟踪（正常/弹框/加载/错误）                      │
│  ├─ 操作上下文管理（当前在做什么）                           │
│  ├─ 任务队列管理（待完成的任务）                             │
│  └─ 依赖关系识别（什么依赖什么）                             │
│                                                               │
│  第3层: 流程编排引擎 (Flow Orchestrator)                      │
│  ├─ 功能流程模板库                                           │
│  ├─ 动态流程生成（AI生成测试流程）                           │
│  ├─ 流程步骤执行                                             │
│  └─ 流程完整性验证                                           │
│                                                               │
│  第4层: 智能交互执行器 (Smart Executor)                       │
│  ├─ 组件识别和交互                                           │
│  ├─ 等待和重试机制                                           │
│  ├─ 异常处理和恢复                                           │
│  └─ 结果验证                                                 │
│                                                               │
│  第5层: 功能级测试记录器 (Feature Recorder)                   │
│  ├─ 功能级数据收集                                           │
│  ├─ 操作路径记录                                             │
│  ├─ 测试结果聚合                                             │
│  └─ 报告生成                                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 完整代码实现

### 1. AI测试指挥中心 (Test Commander)

```javascript
// 新文件:  src/ai-test-commander.js

/**
 * AI测试指挥中心
 * 核心职责：
 * 1. 理解页面的业务功能结构
 * 2. 识别完整的用户操作流程
 * 3. 规划功能级测试计划
 * 4. 指挥整个测试过程
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
      features: [], // 识别到的功能列表
      currentFeature: null,
      completedFeatures: [],
      testResults: []
    };
  }

  /**
   * 核心方法:  智能化测试主流程
   */
  async startIntelligentTesting(pageUrl, userIntent) {
    console.log('[测试指挥中心] 🚀 启动智能化测试...');
    
    this.testingSession.startTime = Date.now();
    
    try {
      // 第1步:  AI深度理解页面
      console.log('[测试指挥中心] 📖 AI正在理解页面业务...');
      const pageUnderstanding = await this.understandPage();
      
      // 第2步: 识别页面的核心功能
      console. log('[测试指挥中心] 🎯 识别核心功能...');
      const features = await this.identifyFeatures(pageUnderstanding, userIntent);
      this.testingSession.features = features;
      
      console.log(`[测试指挥中心] ✅ 识别到 ${features.length} 个核心功能`);
      features.forEach((f, i) => {
        console.log(`  ${i+1}. ${f.name} (优先级: ${f.priority})`);
      });
      
      // 第3步: 为每个功能生成完整的测试流程
      console. log('[测试指挥中心] 📋 生成测试流程...');
      for (const feature of features) {
        feature.testFlow = await this.flowOrchestrator.generateTestFlow(feature);
      }
      
      // 第4步:  按优先级执行功能测试
      console.log('[测试指挥中心] ⚡ 开始执行功能测试...');
      for (const feature of features. sort((a, b) => b.priority - a.priority)) {
        await this.testFeature(feature);
      }
      
      // 第5步: 生成测试报告
      console.log('[测试指挥中心] 📊 生成测试报告...');
      const report = await this.generateReport();
      
      console.log('[测试指挥中心] ✅ 测试完成！');
      return report;
      
    } catch (error) {
      console.error('[测试指挥中心] ❌ 测试失败:', error);
      throw error;
    }
  }

  /**
   * AI深度理解页面
   */
  async understandPage() {
    const pageSnapshot = this.capturePageSnapshot();
    
    const prompt = `你是一位资深的Web应用测试专家。请深度分析这个页面，理解其业务功能。

**页面信息**:
- URL: ${pageSnapshot.url}
- 标题: ${pageSnapshot.title}
- 页面类型: ${pageSnapshot.pageType}

**页面结构**:
- 导航菜单: ${pageSnapshot.navItems.length}个
- 按钮: ${pageSnapshot.buttons.length}个
- 表单: ${pageSnapshot.forms. length}个
- 表格: ${pageSnapshot.tables. length}个
- 弹框/对话框: ${pageSnapshot. modals.length}个

**主要按钮**:
${pageSnapshot.buttons.slice(0, 10).map(b => `- ${b.text}`).join('\n')}

**表单字段**:
${pageSnapshot. formFields.slice(0, 10).map(f => `- ${f.label || f.name}: ${f.type}`).join('\n')}

**任务**:
作为测试专家，请分析：
1. 这是什么类型的业务系统？（如：管理后台、电商平台、社交应用等）
2. 页面的核心业务功能有哪些？
3. 用户在这个页面上通常会进行什么操作？
4. 哪些功能是关键的、必须测试的？
5. 功能之间的依赖关系是什么？

**返回JSON格式**:
{
  "systemType": "业务系统类型",
  "pagePurpose": "页面主要用途描述",
  "businessContext": "业务背景和场景",
  "coreFeatures": [
    {
      "featureName": "功能名称（如：添加用户）",
      "description": "功能描述",
      "userStory": "作为XX，我想要XX，以便XX",
      "importance": "critical|high|medium|low",
      "triggerElement": "触发该功能的元素（按钮文本或选择器）",
      "expectedFlow": [
        "步骤1：点击添加按钮",
        "步骤2：打开表单弹框",
        "步骤3：填写用户信息",
        "步骤4：点击确认",
        "步骤5：弹框关闭",
        "步骤6：表格中出现新用户"
      ],
      "completionCriteria": "如何判断功能完成（如：弹框关闭且表格更新）"
    }
  ],
  "featureDependencies": {
    "功能A": ["依赖功能B", "依赖功能C"]
  },
  "testingStrategy": {
    "recommendedOrder": ["建议的测试顺序"],
    "criticalPaths": ["关键测试路径"],
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

    try {
      const result = await this.qwen.request([{
        role: 'system',
        content: '你是一位拥有15年经验的高级测试工程师，精通业务分析和测试设计。你善于从页面结构中理解业务逻辑，能够识别关键功能和测试路径。'
      }, {
        role:  'user',
        content:  prompt
      }], {
        temperature: 0.3,
        max_tokens: 4000
      });

      const understanding = this.parseResponse(result);
      console.log('[测试指挥中心] ✅ 页面理解完成');
      console.log('[测试指挥中心] 系统类型:', understanding.systemType);
      console.log('[测试指挥中心] 页面用途:', understanding.pagePurpose);
      
      return understanding;

    } catch (error) {
      console.error('[测试指挥中心] 页面理解失败:', error);
      return this.fallbackPageUnderstanding(pageSnapshot);
    }
  }

  /**
   * 识别核心功能
   */
  async identifyFeatures(pageUnderstanding, userIntent) {
    const features = [];
    
    // 从AI理解中提取功能
    if (pageUnderstanding.coreFeatures) {
      for (const featureInfo of pageUnderstanding.coreFeatures) {
        const feature = {
          id: this.generateFeatureId(),
          name: featureInfo.featureName,
          description: featureInfo.description,
          userStory: featureInfo.userStory,
          priority: this.mapImportanceToPriority(featureInfo.importance),
          triggerElement: featureInfo.triggerElement,
          expectedFlow: featureInfo.expectedFlow,
          completionCriteria: featureInfo.completionCriteria,
          status: 'pending',
          testFlow: null,
          testResult: null
        };
        
        features.push(feature);
      }
    }
    
    // 如果AI没有识别到功能，使用启发式方法
    if (features.length === 0) {
      features.push(... this.fallbackFeatureIdentification());
    }
    
    return features;
  }

  /**
   * 测试单个功能（完整流程）
   */
  async testFeature(feature) {
    console.log(`\n[测试指挥中心] 🎯 开始测试功能: ${feature.name}`);
    console.log(`[测试指挥中心] 描述: ${feature.description}`);
    console.log(`[测试指挥中心] 预期流程: ${feature.expectedFlow.length}个步骤`);
    
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
      const flowResult = await this.flowOrchestrator.executeFlow(
        feature.testFlow,
        this.contextEngine
      );
      
      feature.endTime = Date.now();
      feature.duration = feature.endTime - feature. startTime;
      feature.status = flowResult.success ? 'passed' : 'failed';
      feature.testResult = flowResult;
      
      // 记录功能测试结果
      this.featureRecorder.completeFeature(featureRecord. id, {
        success: flowResult.success,
        steps: flowResult.steps,
        duration: feature.duration,
        error: flowResult.error
      });
      
      this.testingSession.completedFeatures.push(feature);
      
      console.log(`[测试指挥中心] ${flowResult.success ? '✅' : '❌'} 功能测试${flowResult.success ? '成功' : '失败'}:  ${feature.name}`);
      console.log(`[测试指挥中心] 耗时: ${(feature.duration / 1000).toFixed(2)}秒`);
      
      // 等待页面稳定
      await this.waitForPageStable();
      
      return flowResult;
      
    } catch (error) {
      console.error(`[测试指挥中心] ❌ 功能测试异常: ${feature.name}`, error);
      
      feature.endTime = Date.now();
      feature.duration = feature.endTime - feature.startTime;
      feature.status = 'error';
      feature.testResult = {
        success: false,
        error: error.message
      };
      
      this.featureRecorder.completeFeature(featureRecord.id, {
        success: false,
        error: error.message,
        duration: feature.duration
      });
      
      return { success: false, error: error. message };
    }
  }

  /**
   * 捕获页面快照
   */
  capturePageSnapshot() {
    return {
      url: window.location.href,
      title: document.title,
      pageType: this.detectPageType(),
      navItems: Array.from(document.querySelectorAll('nav a, . nav-item, [class*="menu"] a')),
      buttons: Array.from(document.querySelectorAll('button, [role="button"], . btn')).map(b => ({
        text: b.textContent. trim(),
        selector: this.generateSelector(b),
        visible: b.offsetParent !== null
      })),
      forms: Array.from(document.querySelectorAll('form')),
      formFields: Array.from(document. querySelectorAll('input, select, textarea')).map(f => ({
        name: f.name,
        type: f.type,
        label: this.findFieldLabel(f),
        required: f.required
      })),
      tables: Array.from(document.querySelectorAll('table')),
      modals: Array.from(document. querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]'))
    };
  }

  /**
   * 生成测试报告
   */
  async generateReport() {
    const features = this.testingSession.completedFeatures;
    const totalDuration = Date.now() - this.testingSession.startTime;
    
    const passed = features.filter(f => f.status === 'passed').length;
    const failed = features. filter(f => f.status === 'failed').length;
    const error = features.filter(f => f.status === 'error').length;
    
    const report = {
      sessionId: this.testingSession. sessionId,
      summary: {
        totalFeatures:  features.length,
        passed,
        failed,
        error,
        successRate: features.length > 0 ? (passed / features.length * 100).toFixed(2) : 0,
        totalDuration: (totalDuration / 1000).toFixed(2) + '秒'
      },
      features: features.map(f => ({
        name: f.name,
        status: f.status,
        duration: (f.duration / 1000).toFixed(2) + '秒',
        steps: f.testResult?.steps?. length || 0,
        result: f.testResult
      })),
      detailedRecords: this.featureRecorder.getFullReport()
    };
    
    // AI分析报告
    const aiAnalysis = await this.analyzeTestResults(report);
    report.aiInsights = aiAnalysis;
    
    return report;
  }

  /**
   * AI分析测试结果
   */
  async analyzeTestResults(report) {
    const prompt = `请分析这份测试报告，给出专业的质量评估和改进建议。

**测试概况**:
- 测试功能数: ${report.summary. totalFeatures}
- 通过:  ${report.summary.passed}
- 失败: ${report. summary.failed}
- 错误: ${report.summary.error}
- 成功率: ${report.summary.successRate}%
- 总耗时: ${report.summary.totalDuration}

**功能测试详情**:
${report.features.map(f => `- ${f.name}:  ${f.status} (${f.duration})`).join('\n')}

**任务**:
1. 评估整体测试质量
2. 分析失败和错误的原因
3. 识别潜在的质量风险
4. 提供改进建议

**返回JSON**:
{
  "qualityAssessment": {
    "overallScore": 0-100,
    "level": "excellent|good|fair|poor",
    "summary": "整体质量评估"
  },
  "failureAnalysis": [
    {
      "feature": "失败的功能",
      "possibleCause": "可能的原因",
      "recommendation": "建议"
    }
  ],
  "riskAreas": [
    {
      "area": "风险区域",
      "risk": "风险描述",
      "severity": "high|medium|low"
    }
  ],
  "improvements": [
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
        content: '你是一位资深的测试分析师，擅长从测试结果中发现问题和改进机会。'
      }, {
        role:  'user',
        content:  prompt
      }]);

      return this.parseResponse(result);
    } catch (error) {
      console.error('[测试指挥中心] AI分析失败:', error);
      return null;
    }
  }

  // 辅助方法
  generateSessionId() {
    return 'test_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  generateFeatureId() {
    return 'feature_' + Date. now() + '_' + Math.random().toString(36).substring(7);
  }

  mapImportanceToPriority(importance) {
    const map = {
      'critical': 10,
      'high': 7,
      'medium': 5,
      'low': 3
    };
    return map[importance] || 5;
  }

  detectPageType() {
    const url = window.location.href. toLowerCase();
    const title = document.title.toLowerCase();
    
    if (url.includes('admin') || title.includes('管理')) return '管理后台';
    if (url.includes('shop') || url.includes('store')) return '电商平台';
    if (url.includes('user') || title.includes('用户')) return '用户中心';
    return '通用页面';
  }

  findFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) return label.textContent. trim();
    
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    
    return field.placeholder || field.name || '';
  }

  generateSelector(element) {
    if (element.id) return '#' + element.id;
    if (element.className) return '.' + element.className.split(' ')[0];
    return element.tagName.toLowerCase();
  }

  parseResponse(response) {
    try {
      const content = response.content || response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      console.error('[测试指挥中心] 响应解析失败:', error);
      return {};
    }
  }

  async waitForPageStable(timeout = 2000) {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }

  fallbackPageUnderstanding(pageSnapshot) {
    return {
      systemType: '未知系统',
      pagePurpose: pageSnapshot.title,
      businessContext: '需要人工分析',
      coreFeatures: [],
      featureDependencies: {},
      testingStrategy: {
        recommendedOrder:  [],
        criticalPaths: [],
        edgeCases: []
      },
      uiPatterns: {
        usesModals: pageSnapshot.modals.length > 0,
        usesTables:  pageSnapshot.tables.length > 0,
        usesForms:  pageSnapshot.forms.length > 0,
        usesWizards: false,
        interactionComplexity: 'moderate'
      }
    };
  }

  fallbackFeatureIdentification() {
    // 基于启发式规则识别功能
    const features = [];
    
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const button of buttons) {
      const text = button.textContent.trim();
      if (text && text.length < 20) {
        features. push({
          id: this. generateFeatureId(),
          name: text,
          description: `点击"${text}"按钮的功能`,
          priority: 5,
          triggerElement:  this.generateSelector(button),
          expectedFlow: ['点击按钮'],
          completionCriteria: '操作完成',
          status: 'pending'
        });
      }
    }
    
    return features;
  }
}
```

---

### 2. 上下文感知引擎 (Context Engine)

```javascript
// 新文件:  src/context-engine.js

/**
 * 上下文感知引擎
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
      pageState:  'normal', // normal | modal_open | loading | error
      
      // 弹框状态
      openModals: [], // 当前打开的弹框列表
      modalStack: [], // 弹框栈（支持嵌套弹框）
      
      // 任务上下文
      currentTask: null, // 当前正在执行的任务
      taskStack: [], // 任务栈
      pendingActions: [], // 待执行的动作
      
      // 操作历史
      actionHistory: [], // 所有操作的历史记录
      
      // 依赖关系
      dependencies: new Map(),
      
      // 状态变化监听器
      listeners: []
    };
    
    this.setupStateMonitoring();
  }

  /**
   * 设置状态监控
   */
  setupStateMonitoring() {
    // 监听DOM变化，检测弹框出现/消失
    const observer = new MutationObserver((mutations) => {
      this.checkForModals();
      this.checkForLoadingStates();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.domObserver = observer;
  }

  /**
   * 检测弹框状态
   */
  checkForModals() {
    // 常见弹框选择器
    const modalSelectors = [
      '[class*="modal"][style*="display: block"]',
      '[class*="modal"]:not([style*="display:  none"])',
      '[class*="dialog"][style*="display:  block"]',
      '[role="dialog"]',
      '. el-dialog__wrapper: not([style*="display: none"])',
      '.ant-modal-wrap:not([style*="display: none"])',
      '.n-modal-container'
    ];
    
    const visibleModals = [];
    
    for (const selector of modalSelectors) {
      const modals = document.querySelectorAll(selector);
      for (const modal of modals) {
        if (this.isModalVisible(modal)) {
          visibleModals.push({
            element: modal,
            selector: selector,
            id: modal.id || this.generateModalId(modal),
            openTime: Date.now()
          });
        }
      }
    }
    
    // 更新状态
    const prevModalCount = this.state.openModals.length;
    this.state.openModals = visibleModals;
    
    if (visibleModals.length > 0) {
      if (this.state.pageState !== 'modal_open') {
        console.log('[上下文引擎] 🎭 检测到弹框打开');
        this.state.pageState = 'modal_open';
        this.notifyStateChange('modal_opened', visibleModals[visibleModals.length - 1]);
      }
    } else {
      if (prevModalCount > 0) {
        console.log('[上下文引擎] ✅ 弹框已关闭');
        this.state.pageState = 'normal';
        this. notifyStateChange('modal_closed');
      }
    }
  }

  /**
   * 检测加载状态
   */
  checkForLoadingStates() {
    const loadingIndicators = document.querySelectorAll(
      '[class*="loading"], [class*="spinner"], . el-loading-mask'
    );
    
    const isLoading = Array.from(loadingIndicators).some(el => 
      el.offsetParent !== null
    );
    
    if (isLoading && this.state.pageState !== 'loading') {
      console.log('[上下文引擎] ⏳ 页面加载中.. .');
      this.state.pageState = 'loading';
      this.notifyStateChange('loading_started');
    } else if (!isLoading && this.state.pageState === 'loading') {
      console.log('[上下文引擎] ✅ 加载完成');
      this.state.pageState = 'normal';
      this.notifyStateChange('loading_completed');
    }
  }

  /**
   * 判断弹框是否可见
   */
  isModalVisible(modal) {
    if (!modal. offsetParent) return false;
    
    const style = window.getComputedStyle(modal);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
    
    return true;
  }

  /**
   * 推入任务
   */
  pushTask(task) {
    console.log(`[上下文引擎] 📝 推入任务: ${task.name}`);
    
    this.state.taskStack.push(this.state.currentTask);
    this.state.currentTask = {
      ... task,
      startTime: Date.now(),
      id: this.generateTaskId()
    };
    
    this. notifyStateChange('task_started', this.state.currentTask);
  }

  /**
   * 完成当前任务
   */
  completeTask(result) {
    if (!this.state.currentTask) {
      console.warn('[上下文引擎] 没有当前任务');
      return;
    }
    
    const completedTask = {
      ...this.state.currentTask,
      endTime: Date.now(),
      duration: Date.now() - this.state.currentTask.startTime,
      result
    };
    
    console.log(`[上下文引擎] ✅ 任务完成: ${completedTask.name} (${(completedTask.duration/1000).toFixed(2)}s)`);
    
    // 恢复上一个任务
    this.state.currentTask = this.state. taskStack.pop() || null;
    
    this.notifyStateChange('task_completed', completedTask);
    
    return completedTask;
  }

  /**
   * 添加待执行动作
   */
  addPendingAction(action) {
    console.log(`[上下文引擎] ➕ 添加待执行动作: ${action.type}`);
    this.state.pendingActions.push(action);
  }

  /**
   * 获取下一个待执行动作
   */
  getNextAction() {
    return this.state.pendingActions. shift();
  }

  /**
   * 记录操作
   */
  recordAction(action) {
    const record = {
      ... action,
      timestamp: Date. now(),
      pageState: this.state.pageState,
      taskContext: this.state.currentTask?. name
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
  getContext() {
    return {
      pageState: this.state.pageState,
      hasOpenModals: this.state.openModals.length > 0,
      openModals: this.state.openModals,
      currentTask:  this.state.currentTask,
      pendingActionsCount: this.state.pendingActions.length,
      recentActions: this.state.actionHistory.slice(-10)
    };
  }

  /**
   * 监听状态变化
   */
  onStateChange(listener) {
    this.state.listeners.push(listener);
  }

  /**
   * 通知状态变化
   */
  notifyStateChange(event, data) {
    for (const listener of this.state. listeners) {
      try {
        listener(event, data, this.getContext());
      } catch (error) {
        console.error('[上下文引擎] 监听器错误:', error);
      }
    }
  }

  /**
   * 等待状态变化
   */
  async waitForState(targetState, timeout = 10000) {
    console.log(`[上下文引擎] ⏰ 等待状态:  ${targetState}`);
    
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      // 立即检查
      if (this.state.pageState === targetState) {
        resolve();
        return;
      }
      
      // 设置超时
      const timer = setTimeout(() => {
        listener && this.state.listeners.splice(this.state.listeners.indexOf(listener), 1);
        reject(new Error(`等待状态"${targetState}"超时`));
      }, timeout);
      
      // 监听状态变化
      const listener = (event, data, context) => {
        if (context.pageState === targetState) {
          clearTimeout(timer);
          this.state.listeners.splice(this.state.listeners.indexOf(listener), 1);
          resolve();
        }
      };
      
      this.state.listeners. push(listener);
    });
  }

  /**
   * 等待弹框打开
   */
  async waitForModalOpen(timeout = 5000) {
    console.log('[上下文引擎] ⏰ 等待弹框打开.. .');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      this.checkForModals();
      if (this.state.openModals.length > 0) {
        console.log('[上下文引擎] ✅ 弹框已打开');
        return this.state.openModals[this.state.openModals.length - 1];
      }
      await this.sleep(200);
    }
    
    throw new Error('等待弹框打开超时');
  }

  /**
   * 等待弹框关闭
   */
  async waitForModalClose(timeout = 5000) {
    console.log('[上下文引擎] ⏰ 等待弹框关闭...');
    
    const startTime = Date. now();
    
    while (Date.now() - startTime < timeout) {
      this.checkForModals();
      if (this.state.openModals. length === 0) {
        console.log('[上下文引擎] ✅ 弹框已关闭');
        return true;
      }
      await this.sleep(200);
    }
    
    throw new Error('等待弹框关闭超时');
  }

  /**
   * 重置状态
   */
  reset() {
    this.state = {
      pageState: 'normal',
      openModals:  [],
      modalStack: [],
      currentTask: null,
      taskStack: [],
      pendingActions: [],
      actionHistory:  [],
      dependencies: new Map(),
      listeners: this.state.listeners // 保留监听器
    };
  }

  // 辅助方法
  generateModalId(modal) {
    return 'modal_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.domObserver) {
      this.domObserver. disconnect();
    }
  }
}
```

---

### 3. 流程编排引擎 (Flow Orchestrator)

```javascript
// 新文件: src/flow-orchestrator.js

/**
 * 流程编排引擎
 * 核心职责：
 * 1. 生成完整的测试流程
 * 2. 执行流程步骤
 * 3. 验证流程完整性
 * 4. 处理流程中的异常
 */
class FlowOrchestrator {
  constructor(qwen) {
    this.qwen = qwen;
    this. flowTemplates = this.initFlowTemplates();
    this.componentInteractor = new ComponentInteractor();
  }

  /**
   * 初始化流程模板库
   */
  initFlowTemplates() {
    return {
      // 弹框操作流程模板
      'modal_interaction': {
        name: '弹框完整操作流程',
        steps:  [
          { action: 'trigger', description: '触发打开弹框' },
          { action: 'wait_modal_open', description: '等待弹框打开' },
          { action: 'interact_modal_content', description: '与弹框内容交互' },
          { action: 'submit_or_confirm', description: '点击确认/提交按钮' },
          { action: 'wait_modal_close', description: '等待弹框关闭' },
          { action: 'verify_result', description: '验证操作结果' }
        ]
      },
      
      // 表单提交流程模板
      'form_submission': {
        name: '表单完整提交流程',
        steps: [
          { action:  'locate_form', description: '定位表单' },
          { action: 'fill_fields', description: '填写��有字段' },
          { action:  'validate_input', description: '验证输入' },
          { action: 'submit_form', description: '提交表单' },
          { action: 'wait_response', description: '等待响应' },
          { action: 'verify_success', description: '验证提交成功' }
        ]
      },
      
      // 表格操作流程模板
      'table_operation': {
        name: '表格数据操作流程',
        steps: [
          { action:  'locate_table', description:  '定位表格' },
          { action: 'select_row', description: '选择数据行' },
          { action: 'trigger_action', description: '触发操作（编辑/删除等）' },
          { action:  'handle_confirmation', description: '处理确认对话框' },
          { action: 'verify_table_update', description: '验证表格更新' }
        ]
      },
      
      // 搜索流程模板
      'search_operation': {
        name: '搜索功能流程',
        steps:  [
          { action: 'locate_search', description: '定位搜索框' },
          { action: 'input_keyword', description: '输入关键词' },
          { action:  'trigger_search', description:  '触发搜索' },
          { action: 'wait_results', description: '等待结果加载' },
          { action:  'verify_results', description: '验证搜索结果' }
        ]
      }
    };
  }

  /**
   * 核心方法:  为功能生成测试流程
   */
  async generateTestFlow(feature) {
    console.log(`[流程编排] 📋 为功能"${feature.name}"生成测试流程...`);
    
    // 第1步:  判断功能类型，选择合适的模板
    const flowTemplate = await this.selectFlowTemplate(feature);
    
    // 第2步: AI生成详细的测试步骤
    const detailedFlow = await this.generateDetailedSteps(feature, flowTemplate);
    
    // 第3步: 添加验证点
    const flowWithValidation = this.addValidationPoints(detailedFlow);
    
    console.log(`[流程编排] ✅ 流程生成完成，共${flowWithValidation.steps.length}个步骤`);
    
    return flowWithValidation;
  }

  /**
   * 选择合适的流程模板
   */
  async selectFlowTemplate(feature) {
    // 基于特征匹配模板
    const featureName = feature.name. toLowerCase();
    const description = (feature.description || '').toLowerCase();
    const triggerText = (feature.triggerElement || '').toLowerCase();
    
    // 规则匹配
    if (featureName.includes('添加') || featureName.includes('新增') || 
        triggerText.includes('添加') || triggerText.includes('新增')) {
      if (feature.expectedFlow && feature.expectedFlow.some(s => s.includes('弹框'))) {
        return this.flowTemplates['modal_interaction'];
      }
      return this.flowTemplates['form_submission'];
    }
    
    if (featureName.includes('编辑') || featureName.includes('修改') ||
        featureName.includes('删除')) {
      return this.flowTemplates['table_operation'];
    }
    
    if (featureName.includes('搜索') || featureName.includes('查询')) {
      return this. flowTemplates['search_operation'];
    }
    
    // 如果规则无法匹配，使用AI
    return await this.aiSelectTemplate(feature);
  }

  /**
   * AI选择模板
   */
  async aiSelectTemplate(feature) {
    const prompt = `判断这个功能应该使用哪种测试流程模板。

**功能信息**:
- 名称: ${feature.name}
- 描述: ${feature. description}
- 触发元素: ${feature.triggerElement}
- 预期流程: ${feature.expectedFlow?. join(' → ')}

**可选模板**:
1. modal_interaction - 弹框操作流程（适用于打开弹框、填写、确认、关闭）
2. form_submission - 表单提交流程（适用于表单填写和提交）
3. table_operation - 表格操作流程（适用于数据的增删改查）
4. search_operation - 搜索流程（适用于搜索和筛选）

返回JSON:  
{
  "template": "模板名称",
  "reason": "选择理由"
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }]);

      const selection = this.parseResponse(result);
      const template = this.flowTemplates[selection.template];
      
      if (template) {
        console.log(`[流程编排] AI选择模板: ${selection.template} (${selection.reason})`);
        return template;
      }
    } catch (error) {
      console.error('[流程编排] AI选择模板失败:', error);
    }
    
    // 默认返回弹框流程
    return this.flowTemplates['modal_interaction'];
  }

  /**
   * AI生成详细步骤
   */
  async generateDetailedSteps(feature, template) {
    const prompt = `为功能测试生成详细的、可执行的测试步骤。

**功能**:  ${feature.name}
**描述**: ${feature.description}
**触发元素**: ${feature.triggerElement}
**预期流程**: ${feature.expectedFlow?.join(' → ')}

**基础模板** (${template.name}):
${template.steps.map((s, i) => `${i+1}. ${s. description}`).join('\n')}

**要求**:
1. 基于模板，生成具体的、可执行的步骤
2. 每个步骤必须明确：
   - 要做什么操作（点击/输入/选择/等待/验证）
   - 操作的目标元素（选择器或描述）
   - 操作的值（如果需要）
   - 预期的结果
3. 步骤必须完整，形成闭环
4. 特别注意：
   - 如果打开了弹框，必须关闭弹框
   - 如果填写了表单，必须提交表单
   - 如果选择了选项，必须确认选择

**返回JSON**:
{
  "flowName": "流程名称",
  "steps": [
    {
      "stepId": 1,
      "action": "click|input|select|wait|verify|close_modal",
      "description": "步骤描述",
      "target": {
        "type": "button|input|select|modal|element",
        "selector": "CSS选择器或文本描述",
        "value": "如果是input/select，指定值"
      },
      "waitAfter": 等待时间毫秒,
      "expectedOutcome": "预期结果",
      "validations": ["验证点1", "验证点2"],
      "isCritical": true/false,
      "fallbackStrategy": "失败时的备选方案"
    }
  ],
  "completionCriteria": [
    "流程完成的标准1：弹框已关闭",
    "流程完成的标准2：数据已保存"
  ]
}`;

    try {
      const result = await this.qwen.request([{
        role: 'system',
        content: '你是一位经验丰富的测试工程师，擅长设计完整、严谨的测试流程。你深知测试流程必须形成闭环，任何打开的窗口都必须关闭，任何开始的操作都必须完成。'
      }, {
        role: 'user',
        content: prompt
      }], {
        temperature: 0.3,
        max_tokens: 3000
      });

      const detailedFlow = this.parseResponse(result);
      
      // 验证流程完整性
      this.validateFlowCompleteness(detailedFlow, feature);
      
      return detailedFlow;

    } catch (error) {
      console.error('[流程编排] AI生成步骤失败:', error);
      return this.fallbackFlow(feature, template);
    }
  }

  /**
   * 验证流程完整性
   */
  validateFlowCompleteness(flow, feature) {
    // 检查是否有打开弹框但没有关闭
    const hasModalOpen = flow.steps.some(s => 
      s.description.includes('打开') && s.description.includes('弹框')
    );
    const hasModalClose = flow.steps.some(s => 
      s.action === 'close_modal' || 
      s.description.includes('关闭弹框') ||
      s.description.includes('点击确认') ||
      s.description.includes('点击取消')
    );
    
    if (hasModalOpen && !hasModalClose) {
      console.warn('[流程编排] ⚠️ 警告：流程中打开了弹框但没有关闭步骤，自动添加');
      
      // 自动添加关闭步骤
      flow.steps.push({
        stepId: flow.steps.length + 1,
        action: 'close_modal',
        description: '关���弹框',
        target: {
          type: 'modal',
          selector: '. el-dialog__close, .ant-modal-close, [class*="close"], [aria-label="Close"]'
        },
        waitAfter: 500,
        expectedOutcome: '弹框关闭',
        validations:  ['弹框不再可见'],
        isCritical: true,
        fallbackStrategy: '点击遮罩层关闭'
      });
    }
    
    // 检查是否有表单填写但没有提交
    const hasFormFill = flow.steps.some(s => 
      s.action === 'input' || s.action === 'select'
    );
    const hasFormSubmit = flow.steps.some(s => 
      s. action === 'submit' || 
      s.description.includes('提交') ||
      s.description.includes('保存') ||
      s.description.includes('确认')
    );
    
    if (hasFormFill && !hasFormSubmit) {
      console.warn('[流程编排] ⚠️ 警告：流程中填写了表单但没有提交步骤');
    }
  }

  /**
   * 添加验证点
   */
  addValidationPoints(flow) {
    // 为每个关键步骤添加验证点
    for (const step of flow.steps) {
      if (! step.validations || step.validations.length === 0) {
        step.validations = this.generateValidations(step);
      }
    }
    
    return flow;
  }

  /**
   * 生成验证点
   */
  generateValidations(step) {
    const validations = [];
    
    switch (step.action) {
      case 'click':
        validations.push('元素可点击');
        validations.push('点击后有响应');
        break;
      case 'input':
        validations.push('输入框可输入');
        validations. push('值已填入');
        break;
      case 'select':
        validations.push('选项已选中');
        break;
      case 'wait':
        validations.push('等待条件满足');
        break;
      case 'close_modal':
        validations. push('弹框已关闭');
        validations.push('页面恢复正常');
        break;
    }
    
    return validations;
  }

  /**
   * 核心方法: 执行流程
   */
  async executeFlow(flow, contextEngine) {
    console.log(`\n[流程编排] ▶️ 开始执行流程:  ${flow.flowName}`);
    console.log(`[流程编排] 共${flow.steps.length}个步骤`);
    
    const flowResult = {
      flowName: flow.flowName,
      startTime: Date.now(),
      steps: [],
      success: true,
      error: null
    };
    
    // 推入流程任务到上下文
    contextEngine.pushTask({
      name: flow.flowName,
      type: 'flow',
      totalSteps: flow.steps.length
    });
    
    try {
      for (let i = 0; i < flow.steps.length; i++) {
        const step = flow.steps[i];
        
        console.log(`\n[流程编排] 步骤 ${i+1}/${flow.steps.length}: ${step.description}`);
        
        const stepResult = await this.executeStep(step, contextEngine);
        flowResult.steps.push(stepResult);
        
        if (! stepResult.success) {
          if (step.isCritical) {
            console.error(`[流程编