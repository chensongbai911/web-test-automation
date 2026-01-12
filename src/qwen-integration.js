/**
 * 通义千问(Qwen3-max) 集成模块
 * 提供智能化增强功能
 */

class QwenIntegration {
  constructor(apiKey, baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = 'qwen-max';
    this.enabled = !!apiKey;
    this.rateLimitDelay = 100; // 请求间隔
    this.lastRequestTime = 0;
  }

  /**
   * 发送请求到Qwen API
   */
  async request (messages, options = {}) {
    if (!this.enabled) {
      console.warn('[Qwen] API未配置，跳过此操作');
      return null;
    }

    // 速率限制
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve =>
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'chrome-extension/1.0'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: options.temperature || 0.1,  // 🔥 降低随机性，加快响应
          max_tokens: options.maxTokens || 1500,    // 🔥 减少token，加快响应
          top_p: options.topP || 0.8,               // 🔥 降低采样范围
          stream: false                              // 禁用流式输出
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Qwen API错误: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('[Qwen] API请求失败:', error);
      return null;
    }
  }

  /**
   * 1️⃣ 智能页面分析 - 理解页面结构和业务逻辑
   */
  async analyzePage (pageHTML, pageInfo = {}) {
    const prompt = `你是一个专业的Web自动化测试分析师。
分析这个HTML页面，提供以下信息：

HTML内容（前5000字符）:
\`\`\`html
${pageHTML.substring(0, 5000)}
\`\`\`

页面URL: ${pageInfo.url || '未知'}
页面标题: ${pageInfo.title || '未知'}

请以JSON格式返回分析结果：
{
  "pageType": "页面类型（如：登录表单、搜索表单、注册表单等）",
  "businessContext": "业务背景和目的简述",
  "forms": [
    {
      "id": "表单ID或描述",
      "type": "表单类型",
      "purpose": "表单目的",
      "fields": [
        {
          "name": "字段名",
          "type": "字段类型（text/password/email/select等）",
          "label": "字段标签",
          "required": true,
          "purpose": "字段用途"
        }
      ]
    }
  ],
  "interactiveElements": [
    {
      "type": "元素类型（button/link/dropdown等）",
      "text": "元素文本",
      "purpose": "元素目的"
    }
  ],
  "risks": "页面中可能的问题或风险"
}`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.5,
      maxTokens: 3000
    });

    if (!result) return null;

    try {
      // 提取JSON部分
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('[Qwen] 页面分析结果解析失败:', e);
      return null;
    }
  }

  /**
   * 2️⃣ 智能数据生成 - 生成上下文相关的测试数据
   */
  async generateTestData (fieldInfo, context = {}) {
    const prompt = `你是一个测试数据生成专家。
为这个表单字段生成合适的测试数据。

字段信息：
- 字段名: ${fieldInfo.name}
- 字段类型: ${fieldInfo.type}
- 字段标签: ${fieldInfo.label}
- 字段描述: ${fieldInfo.placeholder || '无'}
- 是否必填: ${fieldInfo.required}
- 字段用途: ${fieldInfo.purpose || '通用'}

页面上下文：
- 表单类型: ${context.formType || '未知'}
- 业务背景: ${context.businessContext || '通用测试'}

生成要求：
1. 数据必须符合字段要求和格式
2. 数据应该是真实可信的
3. 如果是敏感字段（密码、银行卡等），提供演示数据
4. 考虑字段的实际用途生成相关数据

直接返回测试数据值（不要包含任何额外说明）:`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.3,
      maxTokens: 500
    });

    return result ? result.trim() : null;
  }

  /**
   * 3️⃣ 错误诊断和恢复 - 智能分析错误并提供恢复方案
   */
  async diagnoseAndRecover (errorInfo) {
    const prompt = `你是一个Web自动化测试调试专家。
分析这个测试执行中的错误，并提供恢复方案。

错误信息:
- 错误消息: ${errorInfo.message}
- 错误类型: ${errorInfo.type}
- 元素信息: ${errorInfo.element}
- 操作类型: ${errorInfo.action}
- 页面状态: ${errorInfo.pageState}

请提供：
1. 错误的可能原因（按概率排序）
2. 建议的恢复措施
3. 是否需要更改策略
4. 预期的恢复成功率

以JSON格式返回：
{
  "causes": ["原因1", "原因2", ...],
  "recoveryMeasures": [
    {
      "measure": "具体措施",
      "priority": 1,
      "successRate": 0.8,
      "description": "措施说明"
    }
  ],
  "needStrategyChange": false,
  "recommendation": "总体建议"
}`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.5,
      maxTokens: 1500
    });

    if (!result) return null;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('[Qwen] 错误诊断结果解析失败:', e);
      return null;
    }
  }

  /**
   * 4️⃣ 动态选择器生成 - 生成鲁棒的元素定位器
   */
  async generateRobustSelectors (element, pageContext = {}) {
    const elementInfo = {
      tag: element.tagName,
      id: element.id,
      className: element.className,
      text: element.textContent?.substring(0, 100),
      ariaLabel: element.getAttribute('aria-label'),
      dataTestId: element.getAttribute('data-testid'),
      name: element.name,
      type: element.type,
      outerHTML: element.outerHTML.substring(0, 500)
    };

    const prompt = `你是一个DOM选择器专家。
为这个HTML元素生成最稳健的CSS选择器。

元素信息:
${JSON.stringify(elementInfo, null, 2)}

页面上下文:
- 页面类型: ${pageContext.pageType || '未知'}
- 是否为主要交互元素: ${pageContext.isPrimary || false}

生成要求：
1. 返回3-5个选择器，按优先级排序
2. 第一个应该是最稳定的
3. 考虑页面改版时的适应能力
4. 评估每个选择器的稳定性（0-100%）

以JSON格式返回：
{
  "selectors": [
    {
      "selector": "CSS选择器",
      "stability": 95,
      "reason": "稳定性说明"
    }
  ],
  "recommendation": "推荐方案说明"
}`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.3,
      maxTokens: 1000
    });

    if (!result) return null;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('[Qwen] 选择器生成结果解析失败:', e);
      return null;
    }
  }

  /**
   * 5️⃣ 自然语言转脚本 - 将自然语言描述转为测试脚本
   */
  async generateTestScript (instruction) {
    const prompt = `你是一个自动化测试脚本生成器。
根据自然语言描述生成自动化测试脚本。

用户指令: "${instruction}"

请分析并生成：
1. 完整的操作步骤
2. 每个步骤的验证方式
3. 错误处理策略

以JSON格式返回：
{
  "steps": [
    {
      "order": 1,
      "action": "操作类型（click/input/select等）",
      "target": "目标选择器或描述",
      "value": "如果需要输入，输入的值",
      "description": "步骤说明"
    }
  ],
  "verifications": [
    {
      "step": 1,
      "type": "验证类型（element/text/url等）",
      "selector": "要验证的选择器",
      "expectedValue": "预期值"
    }
  ],
  "errorHandlers": [
    {
      "error": "可能的错误",
      "recovery": "恢复步骤"
    }
  ]
}`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.5,
      maxTokens: 2000
    });

    if (!result) return null;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('[Qwen] 脚本生成结果解析失败:', e);
      return null;
    }
  }

  /**
   * 6️⃣ 报告生成和建议 - 分析测试结果并生成建议
   */
  async analyzeTestResults (testData) {
    const prompt = `你是一个质量分析专家。
分析这个自动化测试的结果，并提供改进建议。

测试数据:
${JSON.stringify(testData, null, 2)}

请提供：
1. 测试覆盖率评估
2. 发现的问题分类
3. 性能评价
4. 用户体验评价
5. 改进建议（优先级排序）

以JSON格式返回：
{
  "summary": "总体评价",
  "coverage": {
    "functionalCoverage": 0.85,
    "scenarioCoverage": 0.70,
    "recommendation": "覆盖建议"
  },
  "issues": [
    {
      "severity": "critical/high/medium/low",
      "category": "问题分类",
      "description": "问题描述",
      "impact": "影响范围"
    }
  ],
  "performance": {
    "score": 0.8,
    "avgResponseTime": "平均响应时间",
    "bottlenecks": ["瓶颈1", "瓶颈2"]
  },
  "ux": {
    "score": 0.75,
    "issues": ["问题1", "问题2"]
  },
  "improvements": [
    {
      "priority": 1,
      "suggestion": "改进建议",
      "expectedImpact": "预期影响"
    }
  ]
}`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.5,
      maxTokens: 2500
    });

    if (!result) return null;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('[Qwen] 结果分析解析失败:', e);
      return null;
    }
  }

  /**
   * 7️⃣ 业务逻辑理解 - 理解复杂的业务流程
   */
  async understandBusinessLogic (flowDescription, pageContext = {}) {
    const prompt = `你是一个业务流程分析专家。
分析这个业务流程，并制定自动化测试策略。

业务流程描述:
${flowDescription}

页面信息:
${JSON.stringify(pageContext, null, 2)}

请分析并返回：
1. 流程的关键步骤
2. 每个步骤的验证方式
3. 可能的业务规则
4. 测试场景（包括异常场景）
5. 风险点

以JSON格式返回：
{
  "keySteps": [
    {
      "step": 1,
      "name": "步骤名称",
      "description": "步骤描述",
      "businessRules": ["规则1", "规则2"]
    }
  ],
  "verifications": [
    {
      "step": 1,
      "verifyWhat": "验证什么",
      "how": "如何验证"
    }
  ],
  "testScenarios": [
    {
      "name": "测试场景名",
      "type": "happy_path/edge_case/error_case",
      "steps": ["步骤1", "步骤2"],
      "expectedResult": "预期结果"
    }
  ],
  "risks": [
    {
      "risk": "风险描述",
      "mitigation": "缓解措施"
    }
  ]
}`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.5,
      maxTokens: 2500
    });

    if (!result) return null;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('[Qwen] 业务逻辑分析解析失败:', e);
      return null;
    }
  }

  /**
   * 8️⃣ 智能弹框识别 - AI识别弹框并找到最佳关闭按钮
   */
  async identifyModalCloseButton (modalHTML, context = {}) {
    const prompt = `你是一个Web UI专家。分析这个弹框(Modal/Dialog)的HTML结构，找出关闭按钮。

弹框HTML（部分）:
\`\`\`html
${modalHTML.substring(0, 3000)}
\`\`\`

页面信息:
- 当前操作: ${context.currentAction || '未知'}
- 弹框类型: ${context.modalType || '未知'}

任务：
1. 识别弹框的UI框架（Bootstrap/Ant Design/Element UI/自定义等）
2. 找出关闭按钮的特征（位置、文本、类名、图标）
3. 推荐最佳关闭策略

以JSON格式返回：
{
  "framework": "UI框架名称",
  "closeButtons": [
    {
      "selector": "CSS选择器",
      "type": "类型（X按钮/取消按钮/确定按钮/关闭按钮）",
      "location": "位置（右上角/底部左侧/底部右侧）",
      "priority": 1-10,
      "reason": "推荐原因"
    }
  ],
  "maskSelectors": ["遮罩层选择器1", "遮罩层选择器2"],
  "recommendation": "最佳关闭策略说明"
}`;

    const result = await this.request([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.3,
      maxTokens: 1500
    });

    if (!result) return null;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('[Qwen] 弹框识别结果解析失败:', e);
      return null;
    }
  }

  /**
   * 通用聊天接口 - 提问Qwen任何问题
   */
  async chat (message, conversationHistory = []) {
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const result = await this.request(messages, {
      temperature: 0.7,
      maxTokens: 2000
    });

    return result;
  }
}

// 全局实例
let qwenInstance = null;

/**
 * 获取或创建Qwen实例
 */
function getQwenInstance (apiKey) {
  if (!qwenInstance && apiKey) {
    qwenInstance = new QwenIntegration(apiKey);
  }
  return qwenInstance;
}

/**
 * 设置Qwen API密钥
 */
function setQwenApiKey (apiKey) {
  qwenInstance = new QwenIntegration(apiKey);
  chrome.storage.local.set({ qwenApiKey: apiKey });
}

/**
 * 获取Qwen API密钥
 */
async function getQwenApiKey () {
  return new Promise(resolve => {
    chrome.storage.local.get(['qwenApiKey'], result => {
      resolve(result.qwenApiKey || null);
    });
  });
}
