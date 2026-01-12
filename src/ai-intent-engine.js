// AI测试意图理解引擎（在内容脚本环境运行，使用QwenIntegration）
class AIIntentEngine {
  constructor() {
    this.qwen = null;
    this.intentHistory = [];
    this.inited = false;
  }

  async init () {
    if (this.inited) return;
    try {
      const cfg = await new Promise(resolve => chrome.storage.local.get(['qwenApiKey', 'qwenEnabled'], resolve));
      if (cfg.qwenApiKey && (cfg.qwenEnabled ?? true) && typeof QwenIntegration !== 'undefined') {
        this.qwen = new QwenIntegration(cfg.qwenApiKey);
        console.log('[AI意图引擎] ✅ Qwen已就绪');
      } else {
        console.log('[AI意图引擎] ⚠️ Qwen未启用或密钥缺失');
      }
      this.inited = true;
    } catch (e) {
      console.error('[AI意图引擎] 初始化失败:', e);
      this.inited = true;
    }
  }

  async understandIntent (userInput, pageContext) {
    await this.init();
    if (!this.qwen) {
      return this.fallbackPlan(userInput, pageContext);
    }

    const prompt = `你是一位资深QA测试专家。请理解用户的测试需求并生成详细的测试计划。\n\n用户输入: "${userInput}"\n\n页面信息:\n- URL: ${pageContext.url}\n- 标题: ${pageContext.title}\n- 概览: ${pageContext.summary}\n\n返回JSON计划（intentAnalysis/testStrategy/recommendedConfig/aiInsights）`;

    try {
      const result = await this.qwen.request([{ role: 'user', content: prompt }], { temperature: 0.3, max_tokens: 2000 });
      const plan = this.parseResponse(result);
      this.intentHistory.push({ input: userInput, plan, timestamp: new Date().toISOString() });
      return plan;
    } catch (error) {
      console.error('[AI意图引擎] 调用失败，使用备用计划:', error);
      return this.fallbackPlan(userInput, pageContext);
    }
  }

  parseResponse (response) {
    try {
      const content = response.content || response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('[AI意图引擎] JSON解析失败:', e);
      return {};
    }
  }

  fallbackPlan (userInput, pageContext) {
    return {
      intentAnalysis: {
        userGoal: userInput || '全面功能测试',
        testScope: 'single-page',
        testType: 'functional',
        priority: 'medium'
      },
      testStrategy: {
        testAreas: [{ area: '交互元素', priority: 5 }]
      },
      recommendedConfig: {
        testButtons: true,
        testLinks: true,
        testForms: true,
        delay: 1000,
        maxElements: 100,
        timeout: 30
      },
      aiInsights: { recommendations: ['启用AI可获得更智能建议'] }
    };
  }
}

if (typeof window !== 'undefined') {
  window.AIIntentEngine = AIIntentEngine;
}
