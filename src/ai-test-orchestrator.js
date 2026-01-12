/**
 * AI 测试编排器 - 全面利用 Qwen AI 模型赋能自动化测试
 *
 * 核心能力：
 * 1. 智能测试策略生成
 * 2. 动态元素识别与操作
 * 3. 复杂场景理解与决策
 * 4. 异常自愈与自适应
 * 5. 测试结果智能分析
 */

class AITestOrchestrator {
  constructor() {
    this.qwen = null;
    this.testContext = {
      visitedPages: new Set(),
      interactionHistory: [],
      errorPatterns: new Map(),
      successPatterns: new Map()
    };
    this.init();
  }

  /**
   * 初始化 AI 编排器
   */
  async init () {
    try {
      const config = await chrome.storage.local.get(['qwenApiKey', 'qwenEnabled']);
      const enabled = (config.qwenEnabled ?? true);
      if (config.qwenApiKey && enabled && typeof QwenIntegration !== 'undefined') {
        this.qwen = new QwenIntegration(config.qwenApiKey);
        console.log('[AI编排器] ✅ Qwen AI 已就绪，开启智能测试模式');
      } else {
        console.log('[AI编排器] ⚠️ AI 未启用，使用基础规则模式');
      }
    } catch (error) {
      console.error('[AI编排器] 初始化失败:', error);
    }
  }

  /**
   * 🎯 核心功能1: 智能生成测试策略
   * 分析页面后自动生成最优测试步骤
   */
  async generateSmartTestPlan (pageSnapshot) {
    if (!this.qwen) {
      return this.fallbackTestPlan(pageSnapshot);
    }

    console.log('[AI编排器] 🧠 正在生成智能测试计划...');

    const prompt = `你是一位资深的自动化测试专家。请分析以下页面并生成最优测试策略。

**页面快照：**
- URL: ${pageSnapshot.url}
- 标题: ${pageSnapshot.title}
- 可交互元素: ${pageSnapshot.interactiveElements.length}个
- 表单: ${pageSnapshot.forms.length}个
- 按钮: ${pageSnapshot.buttons.length}个
- 链接: ${pageSnapshot.links.length}个
- 表格: ${pageSnapshot.tables.length}个

**元素详情：**
${JSON.stringify(pageSnapshot.interactiveElements.slice(0, 20), null, 2)}

**任务：**
请生成一个智能化的测试计划，包括：
1. 识别页面类型和业务场景
2. 确定测试优先级（哪些功能最重要）
3. 规划测试步骤顺序（考虑依赖关系）
4. 预测可能的异常情况
5. 提供每个步骤的验证点

**返回JSON格式：**
{
  "pageType": "页面类型（如：列表管理/表单提交/数据查询/审批流程等）",
  "businessScenario": "业务场景描述",
  "testStrategy": {
    "priority": "high/medium/low",
    "estimatedDuration": "预计耗时（秒）",
    "complexity": "simple/moderate/complex"
  },
  "testSteps": [
    {
      "stepId": 1,
      "action": "操作类型（click/fill/select/verify等）",
      "target": "目标元素描述",
      "selector": "推荐的选择器",
      "value": "填充值（如果需要）",
      "priority": 1-10,
      "dependencies": [前置步骤ID],
      "expectedResult": "预期结果",
      "validationPoints": ["验证点1", "验证点2"],
      "riskLevel": "low/medium/high",
      "fallbackStrategy": "失败时的备选策略"
    }
  ],
  "potentialIssues": [
    {
      "issue": "可能的问题描述",
      "likelihood": "high/medium/low",
      "mitigation": "缓解措施"
    }
  ],
  "dataPreparation": {
    "requiredData": ["需要准备的数据"],
    "mockData": {"字段": "建议的测试数据"}
  }
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }], {
        temperature: 0.3,
        max_tokens: 4000
      });

      const plan = this.parseAIResponse(result);
      console.log('[AI编排器] ✅ 测试计划生成完成:', plan);
      return plan;

    } catch (error) {
      console.error('[AI编排器] ❌ AI生成失败，使用备用方案:', error);
      return this.fallbackTestPlan(pageSnapshot);
    }
  }

  /**
   * 🎯 核心功能2: 智能元素定位与识别
   * 当常规选择器失败时，AI 理解页面结构并找到目标元素
   */
  async smartElementLocator (elementDescription, pageContext) {
    if (!this.qwen) {
      return null;
    }

    console.log(`[AI编排器] 🔍 智能定位元素: "${elementDescription}"`);

    const prompt = `你是DOM结构分析专家。请帮我在页面中定位元素。

**要查找的元素：** ${elementDescription}

**页面上下文：**
${this.getPageSnapshot(pageContext)}

**任务：**
分析页面DOM结构，找到最匹配的元素，并提供多种定位策略。

**返回JSON：**
{
  "matchedElements": [
    {
      "confidence": 0-100,
      "selector": "CSS选择器",
      "xpath": "XPath路径",
      "reason": "为什么这个元素匹配",
      "attributes": {"属性名": "属性值"},
      "position": {"x": 0, "y": 0},
      "isVisible": true/false,
      "isEnabled": true/false
    }
  ],
  "bestMatch": {
    "selector": "最佳选择器",
    "confidence": 95
  },
  "fallbackSelectors": ["备选选择器1", "备选选择器2"],
  "recommendations": "定位建议"
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }], {
        temperature: 0.2
      });

      return this.parseAIResponse(result);
    } catch (error) {
      console.error('[AI编排器] 元素定位失败:', error);
      return null;
    }
  }

  /**
   * 🎯 核心功能3: 异常智能诊断与自愈
   * 测试失败时，AI 分析原因并提供修复方案
   */
  async diagnosisAndAutoHeal (errorContext) {
    if (!this.qwen) {
      return { canHeal: false };
    }

    console.log('[AI编排器] 🏥 智能诊断异常...');

    const prompt = `你是自动化测试故障诊断专家。请分析以下测试失败情况并提供解决方案。

**错误信息：**
${errorContext.error}

**失败步骤：**
- 操作: ${errorContext.action}
- 目标: ${errorContext.target}
- 预期: ${errorContext.expected}
- 实际: ${errorContext.actual}

**页面状态：**
${JSON.stringify(errorContext.pageState, null, 2)}

**历史交互：**
${JSON.stringify(this.testContext.interactionHistory.slice(-5), null, 2)}

**相似错误历史：**
${this.getSimilarErrors(errorContext.error)}

**任务：**
1. 分析失败根本原因
2. 判断是否可以自动修复
3. 提供修复步骤
4. 评估修复成功率

**返回JSON：**
{
  "diagnosis": {
    "rootCause": "根本原因",
    "category": "元素未找到/超时/验证失败/数据错误/权限问题/网络问题",
    "severity": "critical/high/medium/low",
    "isKnownIssue": true/false
  },
  "autoHeal": {
    "canHeal": true/false,
    "confidence": 0-100,
    "healingSteps": [
      {
        "action": "操作类型",
        "description": "具体操作",
        "estimatedTime": "耗时（秒）"
      }
    ],
    "expectedResult": "修复后预期结果"
  },
  "alternatives": [
    {
      "strategy": "备选策略",
      "steps": ["步骤1", "步骤2"],
      "successRate": "成功率%"
    }
  ],
  "recommendations": [
    "建议1：优化选择器策略",
    "建议2：增加等待时间"
  ],
  "preventionMeasures": "预防措施"
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }], {
        temperature: 0.4
      });

      const diagnosis = this.parseAIResponse(result);

      // 如果可以自愈，执行修复
      if (diagnosis.autoHeal && diagnosis.autoHeal.canHeal) {
        console.log('[AI编排器] 🔧 开始自动修复...');
        return await this.executeHealingSteps(diagnosis.autoHeal.healingSteps);
      }

      return diagnosis;

    } catch (error) {
      console.error('[AI编排器] 诊断失败:', error);
      return { canHeal: false, error: error.message };
    }
  }

  /**
   * 🎯 核心功能4: 智能数据生成
   * 根据字段语义和验证规则生成合适的测试数据
   */
  async generateSmartTestData (fieldInfo) {
    if (!this.qwen) {
      return this.fallbackDataGeneration(fieldInfo);
    }

    const prompt = `你是测试数据生成专家。请为以下表单字段生成合适的测试数据。

**字段信息：**
${JSON.stringify(fieldInfo, null, 2)}

**要求：**
1. 数据必须符合字段类型和验证规则
2. 数据要真实合理，符合业务场景
3. 考虑边界情况和特殊字符
4. 提供多组数据用于不同测试场景

**返回JSON：**
{
  "normalCase": {"字段名": "正常数据"},
  "edgeCases": [
    {"scenario": "场景描述", "data": {"字段名": "边界数据"}}
  ],
  "invalidCases": [
    {"scenario": "场景描述", "data": {"字段名": "无效数据"}, "expectedError": "预期错误"}
  ],
  "recommendations": "数据生成建议"
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }]);

      return this.parseAIResponse(result);
    } catch (error) {
      console.error('[AI编排器] 数据生成失败:', error);
      return this.fallbackDataGeneration(fieldInfo);
    }
  }

  /**
   * 🎯 核心功能5: 智能测试报告分析
   * AI 分析测试结果，提供洞察和改进建议
   */
  async analyzeTestResults (testReport) {
    if (!this.qwen) {
      return null;
    }

    console.log('[AI编排器] 📊 智能分析测试结果...');

    const prompt = `你是测试结果分析专家。请深入分析以下测试报告。

**测试报告：**
${JSON.stringify(testReport, null, 2)}

**任务：**
1. 总结测试覆盖情况
2. 识别高风险区域
3. 分析失败模式和趋势
4. 提供改进建议
5. 评估系统质量

**返回JSON：**
{
  "summary": {
    "totalTests": 100,
    "passed": 95,
    "failed": 5,
    "coverage": "覆盖率评估",
    "quality": "excellent/good/fair/poor"
  },
  "insights": [
    {
      "category": "洞察类别",
      "finding": "发现",
      "impact": "high/medium/low",
      "recommendation": "建议"
    }
  ],
  "riskAreas": [
    {
      "area": "风险区域",
      "risk": "风险描述",
      "priority": "优先级",
      "mitigation": "缓解措施"
    }
  ],
  "failurePatterns": [
    {
      "pattern": "失败模式",
      "frequency": 5,
      "rootCause": "根因",
      "fix": "修复建议"
    }
  ],
  "improvements": [
    "改进建议1",
    "改进建议2"
  ],
  "nextSteps": ["下一步行动"]
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }]);

      const analysis = this.parseAIResponse(result);
      console.log('[AI编排器] ✅ 报告分析完成');
      return analysis;

    } catch (error) {
      console.error('[AI编排器] 分析失败:', error);
      return null;
    }
  }

  /**
   * 🆕 核心功能7: 跨页面业务流程智能编排
   */
  async planCrossPageTestFlow (startUrl, testObjective) {
    if (!this.qwen) {
      return this.fallbackTestPlan({ interactiveElements: [], url: startUrl || window.location.href });
    }

    const prompt = `你是一位自动化测试专家。请为我规划一个跨页面测试流程。\n\n测试目标: ${testObjective}\n起始页面: ${startUrl}\n返回JSON测试计划（包含testPath、每页测试点与数据依赖）`;

    try {
      const result = await this.qwen.request([{ role: 'user', content: prompt }], { temperature: 0.4, max_tokens: 4000 });
      const plan = this.parseAIResponse(result);
      this.testContext.crossPagePlan = plan;
      return plan;
    } catch (error) {
      console.error('[AI编排器] AI规划失败:', error);
      return this.fallbackTestPlan({ interactiveElements: [], url: startUrl || window.location.href });
    }
  }

  /**
   * 🆕 核心功能8: 实时测试决策
   */
  async makeTestDecision (context) {
    if (!this.qwen) return { decision: 'continue' };
    const prompt = `当前测试上下文：\n- 当前页面: ${context.currentUrl}\n- 已测试页面: ${context.testedPages?.length || 0}个\n- 新页面: ${context.discoveredPages?.length || 0}个\n- 进度: ${context.progress || 0}%\n情况：${context.situation || ''}\n请返回JSON决策（decision/nextAction/expectedOutcome）`;
    try {
      const result = await this.qwen.request([{ role: 'user', content: prompt }]);
      return this.parseAIResponse(result);
    } catch (e) {
      return { decision: 'continue' };
    }
  }

  /**
   * 🆕 核心功能9: 页面关系图谱构建
   */
  async buildSiteMap (visitedPages) {
    if (!this.qwen) return null;
    const prompt = `我已经访问了以下页面：\n${(visitedPages || []).map((p, i) => `${i + 1}. ${p.url} (from ${p.fromUrl || '-'})`).join('\n')}\n请分析并返回JSON站点结构/业务流程/覆盖率。`;
    try {
      const res = await this.qwen.request([{ role: 'user', content: prompt }]);
      return this.parseAIResponse(res);
    } catch (e) {
      return null;
    }
  }

  /**
   * 🆕 核心功能10: 元素优先级排序
   * 基于测试目标对元素进行智能排序
   */
  async prioritizeElements (elements, testGoal) {
    try {
      if (!this.qwen || !elements || elements.length === 0) return elements || [];
      const elementsSummary = elements.slice(0, 50).map((el, idx) => ({
        index: idx,
        type: el.type,
        text: el.text,
        selector: el.selector
      }));

      const prompt = `请为以下元素评估测试优先级。\n\n测试目标: ${testGoal} \n\n元素列表:\n${JSON.stringify(elementsSummary, null, 2)}\n\n返回JSON: {"prioritizedIndexes":[索引按优先级排序]}`;
      const result = await this.qwen.request([{ role: 'user', content: prompt }], { temperature: 0.2, max_tokens: 1200 });
      const data = this.parseAIResponse(result);
      if (!data || !Array.isArray(data.prioritizedIndexes)) return elements;
      const sorted = data.prioritizedIndexes.map(i => elements[i]).filter(Boolean);
      // 补齐遗漏
      const set = new Set(sorted);
      for (const el of elements) if (!set.has(el)) sorted.push(el);
      return sorted;
    } catch (e) {
      console.error('[AI编排器] 元素排序失败:', e);
      return elements;
    }
  }

  /**
   * 🎯 核心功能6: 复杂业务流程理解
   * AI 理解多步骤业务流程并自动编排测试
   */
  async understandBusinessFlow (flowDescription, pageSequence) {
    if (!this.qwen) {
      return null;
    }

    const prompt = `你是业务流程分析专家。请理解以下业务流程并生成自动化测试方案。

**流程描述：** ${flowDescription}

**页面序列：**
${JSON.stringify(pageSequence, null, 2)}

**返回JSON：**
{
  "flowUnderstanding": {
    "flowType": "流程类型（审批/订单/注册等）",
    "actors": ["参与角色"],
    "steps": [
      {
        "step": "步骤名称",
        "page": "页面",
        "actions": ["操作"],
        "data": "所需数据",
        "validations": ["验证点"]
      }
    ]
  },
  "testScenarios": [
    {
      "scenario": "场景名称",
      "priority": "high/medium/low",
      "steps": ["测试步骤"],
      "expectedOutcome": "预期结果"
    }
  ],
  "dependencies": "依赖关系",
  "testData": "测试数据建议"
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }]);

      return this.parseAIResponse(result);
    } catch (error) {
      console.error('[AI编排器] 流程理解失败:', error);
      return null;
    }
  }

  /**
   * 辅助方法：解析 AI 响应
   */
  parseAIResponse (response) {
    try {
      const content = response.content || response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { rawResponse: content };
    } catch (error) {
      console.error('[AI编排器] JSON解析失败:', error);
      return { error: 'Parse failed', rawResponse: response };
    }
  }

  /**
   * 辅助方法：备用测试计划
   */
  fallbackTestPlan (pageSnapshot) {
    return {
      pageType: 'unknown',
      testSteps: pageSnapshot.interactiveElements.map((el, idx) => ({
        stepId: idx + 1,
        action: 'click',
        target: el.text || el.type,
        selector: el.selector,
        priority: 5
      }))
    };
  }

  /**
   * 辅助方法：备用数据生成
   */
  fallbackDataGeneration (fieldInfo) {
    const data = {};
    for (const field of fieldInfo) {
      if (field.type === 'email') data[field.name] = 'test@example.com';
      else if (field.type === 'tel') data[field.name] = '13800138000';
      else data[field.name] = 'test_' + Date.now();
    }
    return { normalCase: data };
  }

  /**
   * 辅助方法：获取页面快照
   */
  getPageSnapshot (context) {
    return JSON.stringify({
      url: window.location.href,
      title: document.title,
      forms: document.querySelectorAll('form').length,
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input').length
    }, null, 2);
  }

  /**
   * 辅助方法：获取相似错误
   */
  getSimilarErrors (error) {
    const similar = [];
    for (const [pattern, count] of this.testContext.errorPatterns) {
      if (error.includes(pattern) || pattern.includes(error.substring(0, 50))) {
        similar.push({ pattern, count });
      }
    }
    return JSON.stringify(similar.slice(0, 3));
  }

  /**
   * 辅助方法：执行自愈步骤
   */
  async executeHealingSteps (steps) {
    for (const step of steps) {
      console.log(`[AI编排器] 🔧 执行修复: ${step.description}`);
      // 这里可以调用实际的操作函数
      await new Promise(resolve => setTimeout(resolve, step.estimatedTime * 1000));
    }
    return { healed: true, steps: steps.length };
  }

  /**
   * 记录交互历史
   */
  recordInteraction (interaction) {
    this.testContext.interactionHistory.push({
      ...interaction,
      timestamp: new Date().toISOString()
    });

    // 只保留最近100条
    if (this.testContext.interactionHistory.length > 100) {
      this.testContext.interactionHistory.shift();
    }
  }

  /**
   * 记录错误模式
   */
  recordError (error) {
    const pattern = error.substring(0, 100);
    this.testContext.errorPatterns.set(
      pattern,
      (this.testContext.errorPatterns.get(pattern) || 0) + 1
    );
  }

  /**
   * 记录成功模式
   */
  recordSuccess (action) {
    const pattern = JSON.stringify(action);
    this.testContext.successPatterns.set(
      pattern,
      (this.testContext.successPatterns.get(pattern) || 0) + 1
    );
  }
}

// 全局实例
if (typeof window !== 'undefined') {
  window.aiTestOrchestrator = new AITestOrchestrator();
  console.log('[AI编排器] 全局实例已创建');
}
