/**
 * 流程编排引擎 (Flow Orchestrator)
 * 版本: v4.0
 * 核心职责：
 * 1. 生成完整的测试流程
 * 2. 执行流程步骤
 * 3. 验证流程完整性
 * 4. 处理流程中的异常和恢复
 */

class FlowOrchestrator {
  constructor(qwen) {
    this.qwen = qwen;
    this.flowTemplates = this.initFlowTemplates();
    this.executingFlow = null;
    this.currentStep = 0;

    this.logger = this.createLogger('[流程编排]');
  }

  /**
   * 初始化流程模板库
   */
  initFlowTemplates () {
    return {
      // 弹框操作流程模板
      'modal_interaction': {
        name: '弹框完整操作流程',
        description: '打开弹框→识别元素→交互→确认→关闭的完整闭环',
        steps: [
          { action: 'trigger', description: '触发打开弹框', priority: 10 },
          { action: 'wait_modal_open', description: '等待弹框打开', priority: 9 },
          { action: 'identify_modal_fields', description: '识别弹框内的交互元素', priority: 8 },
          { action: 'interact_modal_content', description: '与弹框内容交互', priority: 7 },
          { action: 'submit_or_confirm', description: '点击确认/保存/提交按钮', priority: 6 },
          { action: 'wait_modal_close', description: '等待弹框关闭', priority: 5 },
          { action: 'verify_result', description: '验证操作结果', priority: 4 }
        ]
      },

      // 表单提交流程模板
      'form_submission': {
        name: '表单完整提交流程',
        description: '定位→填写→验证→提交→确认的完整闭环',
        steps: [
          { action: 'locate_form', description: '定位表单', priority: 10 },
          { action: 'identify_fields', description: '识别所有表单字段', priority: 9 },
          { action: 'fill_fields', description: '填写表单字段', priority: 8 },
          { action: 'validate_input', description: '验证输入内容', priority: 7 },
          { action: 'submit_form', description: '点击提交按钮', priority: 6 },
          { action: 'wait_response', description: '等待表单提交响应', priority: 5 },
          { action: 'verify_success', description: '验证提交成功', priority: 4 }
        ]
      },

      // 表格操作流程模板
      'table_operation': {
        name: '表格数据操作流程',
        description: '定位→选择→操作→确认→验证的完整闭环',
        steps: [
          { action: 'locate_table', description: '定位表格', priority: 10 },
          { action: 'find_row', description: '找到目标数据行', priority: 9 },
          { action: 'select_row', description: '选择数据行', priority: 8 },
          { action: 'trigger_action', description: '触发操作（编辑/删除等）', priority: 7 },
          { action: 'handle_confirmation', description: '处理确认对话框', priority: 6 },
          { action: 'wait_response', description: '等待操作响应', priority: 5 },
          { action: 'verify_table_update', description: '验证表格已更新', priority: 4 }
        ]
      },

      // 搜索流程模板
      'search_operation': {
        name: '搜索功能流程',
        description: '定位→输入→搜索→等待→验证的完整闭环',
        steps: [
          { action: 'locate_search', description: '定位搜索框', priority: 10 },
          { action: 'clear_search', description: '清空搜索框（如有内容）', priority: 9 },
          { action: 'input_keyword', description: '输入搜索关键词', priority: 8 },
          { action: 'trigger_search', description: '触发搜索（回车或按钮）', priority: 7 },
          { action: 'wait_results', description: '等待搜索结果加载', priority: 6 },
          { action: 'verify_results', description: '验证搜索结果显示', priority: 5 }
        ]
      }
    };
  }

  /**
   * 为功能生成测试流程
   */
  async generateTestFlow (feature) {
    this.logger.log(`📋 为功能"${feature.name}"生成测试流程...`);

    try {
      // 步骤1: 判断功能类型，选择合适的模板
      const flowTemplate = await this.selectFlowTemplate(feature);

      // 步骤2: AI生成详细的测试步骤
      const detailedFlow = await this.generateDetailedSteps(feature, flowTemplate);

      // 步骤3: 验证流程完整性
      this.validateFlowCompleteness(detailedFlow);

      // 步骤4: 添加验证点
      const flowWithValidation = this.addValidationPoints(detailedFlow);

      this.logger.log(`✅ 流程生成完成，共${flowWithValidation.steps.length}个步骤`);

      return flowWithValidation;

    } catch (error) {
      this.logger.error('流程生成失败:', error);
      // 返回基础流程
      return {
        flowName: `${feature.name} (基础流程)`,
        steps: [
          {
            stepId: 1,
            action: 'click',
            description: `点击"${feature.name}"`,
            target: {
              type: 'button',
              selector: feature.triggerElement
            },
            expectedOutcome: '功能触发',
            validations: ['功能已触发'],
            isCritical: true
          }
        ],
        completionCriteria: ['功能执行完成']
      };
    }
  }

  /**
   * 选择合适的流程模板
   */
  async selectFlowTemplate (feature) {
    const featureName = (feature.name || '').toLowerCase();
    const description = (feature.description || '').toLowerCase();
    const expectedFlow = (feature.expectedFlow || []).join(' ').toLowerCase();

    // 规则匹配
    if (featureName.includes('添加') || featureName.includes('新增') || featureName.includes('创建')) {
      if (expectedFlow.includes('弹框') || expectedFlow.includes('对话框') || expectedFlow.includes('modal')) {
        return this.flowTemplates['modal_interaction'];
      }
      return this.flowTemplates['form_submission'];
    }

    if (featureName.includes('编辑') || featureName.includes('修改')) {
      if (expectedFlow.includes('弹框') || expectedFlow.includes('modal')) {
        return this.flowTemplates['modal_interaction'];
      }
      return this.flowTemplates['table_operation'];
    }

    if (featureName.includes('删除') || featureName.includes('移除')) {
      return this.flowTemplates['table_operation'];
    }

    if (featureName.includes('搜索') || featureName.includes('查询') || featureName.includes('筛选')) {
      return this.flowTemplates['search_operation'];
    }

    // 如果规则无法匹配，使用AI
    return await this.aiSelectTemplate(feature);
  }

  /**
   * AI选择模板
   */
  async aiSelectTemplate (feature) {
    const prompt = `判断这个功能应该使用哪种测试流程模板。

【功能信息】
- 名称: ${feature.name}
- 描述: ${feature.description}
- 触发元素: ${feature.triggerElement}
- 预期流程: ${feature.expectedFlow?.join(' → ') || '未定义'}

【可选模板】
1. modal_interaction - 弹框操作流程（打开弹框→填写→确认→关闭）
2. form_submission - 表单提交流程（填写→验证→提交）
3. table_operation - 表格操作流程（选择→操作→验证）
4. search_operation - 搜索流程（输入→搜索→验证结果）

返回JSON:
{
  "template": "模板名称",
  "reason": "选择理由",
  "confidence": 0.0-1.0
}`;

    try {
      const result = await this.qwen.request([{
        role: 'user',
        content: prompt
      }]);

      const selection = this.parseResponse(result);
      const template = this.flowTemplates[selection.template];

      if (template) {
        this.logger.log(`🤖 AI选择模板: ${selection.template} (${selection.reason})`);
        return template;
      }
    } catch (error) {
      this.logger.error('AI选择模板失败:', error);
    }

    // 默认返回弹框流程
    return this.flowTemplates['modal_interaction'];
  }

  /**
   * AI生成详细步骤
   */
  async generateDetailedSteps (feature, template) {
    const prompt = `为这个功能生成详细的、可执行的测试步骤。

【功能信息】
- 名称: ${feature.name}
- 描述: ${feature.description}
- 触发元素: ${feature.triggerElement}
- 预期流程: ${feature.expectedFlow?.join(' → ') || '待定'}
- 完成标准: ${feature.completionCriteria}

【基础模板】(${template.name})
${template.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

【关键要求】
1. 生成具体的、可执行的步骤（不能是抽象的）
2. 每个步骤必须明确：
   - 做什么操作（click/input/select/wait/verify/close_modal等）
   - 操作的目标元素（选择器或描述）
   - 如果是input/select，指定具体值或选择项
   - 预期的结果
   - 如何判断成功

3. **必须保证流程的完整性和闭环性**：
   - 如果打开了弹框，必须有关闭步骤
   - 如果填写了表单，必须有提交步骤
   - 如果选择了选项，必须有确认步骤

4. 特别关注：
   - 弹框的检测、识别、交互、确认、关闭
   - 表单的字段识别、填写、验证、提交
   - 表格的行选择、操作、确认、验证

【返回JSON】
{
  "flowName": "流程名称",
  "steps": [
    {
      "stepId": 1,
      "action": "click|input|select|wait|verify|close_modal|submit|confirm",
      "description": "详细的步骤描述",
      "target": {
        "type": "button|input|select|modal|element|text",
        "selector": "CSS选择器或元素描述",
        "value": "如果是input/select，指定具体值"
      },
      "waitAfter": 500,
      "expectedOutcome": "预期的操作结果",
      "validations": ["验证点1", "验证点2"],
      "isCritical": true,
      "fallbackStrategy": "失败时的备选方案"
    }
  ],
  "completionCriteria": [
    "流程完成标准1",
    "流程完成标准2"
  ]
}`;

    try {
      const result = await this.qwen.request([{
        role: 'system',
        content: '你是一位资深的自动化测试工程师。你擅长设计完整、严谨、可闭环的测试流程。你深知：任何打开的窗口都必须关闭，任何开始的操作都必须完成，任何提示都必须确认。'
      }, {
        role: 'user',
        content: prompt
      }], {
        temperature: 0.3,
        max_tokens: 3500
      });

      const detailedFlow = this.parseResponse(result);

      if (!detailedFlow.steps) {
        detailedFlow.steps = [];
      }

      return detailedFlow;

    } catch (error) {
      this.logger.error('AI生成步骤失败:', error);
      // 返回基础步骤
      return {
        flowName: `${feature.name} (基础流程)`,
        steps: template.steps.map((ts, i) => ({
          stepId: i + 1,
          action: ts.action,
          description: ts.description,
          target: { type: 'element', selector: 'auto' },
          expectedOutcome: '步骤执行',
          validations: ['操作成功'],
          isCritical: false
        })),
        completionCriteria: [feature.completionCriteria || '功能完成']
      };
    }
  }

  /**
   * 验证流程完整性
   */
  validateFlowCompleteness (flow) {
    const stepActions = flow.steps.map(s => s.action || s.description).join('|').toLowerCase();

    // 检查是否有打开弹框但没有关闭
    const hasModalOpen = flow.steps.some(s =>
      s.description?.includes('打开') && s.description?.includes('弹框')
    );
    const hasModalClose = flow.steps.some(s =>
      s.action === 'close_modal' ||
      s.description?.includes('关闭弹框') ||
      s.description?.includes('点击确认') ||
      s.description?.includes('点击取消')
    );

    if (hasModalOpen && !hasModalClose) {
      this.logger.warn('⚠️ 检测到弹框打开但未关闭，自动添加关闭步骤');

      flow.steps.push({
        stepId: flow.steps.length + 1,
        action: 'close_modal',
        description: '关闭弹框',
        target: {
          type: 'modal',
          selector: '.el-dialog__close, .ant-modal-close, button[aria-label="Close"], [class*="close"]'
        },
        waitAfter: 500,
        expectedOutcome: '弹框关闭',
        validations: ['弹框不再可见'],
        isCritical: true,
        fallbackStrategy: '点击弹框遮罩层关闭'
      });
    }

    // 检查是否有表单填写但没有提交
    const hasFormFill = flow.steps.some(s =>
      s.action === 'input' || s.action === 'select'
    );
    const hasFormSubmit = flow.steps.some(s =>
      s.action === 'submit' ||
      s.description?.includes('提交') ||
      s.description?.includes('保存') ||
      s.description?.includes('确认')
    );

    if (hasFormFill && !hasFormSubmit) {
      this.logger.warn('⚠️ 检测到表单填写但未提交，可能存在流程不完整');
    }
  }

  /**
   * 添加验证点
   */
  addValidationPoints (flow) {
    for (const step of flow.steps) {
      if (!step.validations || step.validations.length === 0) {
        step.validations = this.generateValidations(step);
      }
    }

    return flow;
  }

  /**
   * 生成验证点
   */
  generateValidations (step) {
    const validations = [];

    switch (step.action) {
      case 'click':
      case 'trigger':
        validations.push('元素可见且可点击');
        validations.push('点击后有响应');
        break;
      case 'input':
        validations.push('输入框可见');
        validations.push('输入框可输入');
        validations.push('值已成功填入');
        break;
      case 'select':
        validations.push('选择器可见');
        validations.push('选项已选中');
        break;
      case 'wait':
      case 'wait_modal_open':
      case 'wait_modal_close':
        validations.push('等待条件满足');
        break;
      case 'verify':
      case 'verify_result':
        validations.push('验证点检查通过');
        break;
      case 'close_modal':
        validations.push('弹框不再可见');
        validations.push('页面恢复正常');
        break;
      case 'submit':
      case 'submit_form':
        validations.push('表单已提交');
        validations.push('收到响应');
        break;
      default:
        validations.push('操作成功执行');
    }

    return validations;
  }

  /**
   * 执行流程
   */
  async executeFlow (flow, contextEngine) {
    if (!flow || !flow.steps || flow.steps.length === 0) {
      return {
        success: false,
        error: '流程为空或格式不正确',
        steps: []
      };
    }

    this.logger.log(`\n▶️ 开始执行流程: ${flow.flowName}`);
    this.logger.log(`📝 共${flow.steps.length}个步骤`);

    this.executingFlow = flow;
    const flowResult = {
      flowName: flow.flowName,
      startTime: Date.now(),
      steps: [],
      success: true,
      error: null,
      completedSteps: 0,
      totalSteps: flow.steps.length
    };

    // 推入流程任务到上下文
    contextEngine.pushTask({
      name: flow.flowName,
      type: 'flow_execution',
      totalSteps: flow.steps.length
    });

    try {
      for (let i = 0; i < flow.steps.length; i++) {
        const step = flow.steps[i];
        this.currentStep = i + 1;

        this.logger.log(`\n📍 步骤 ${i + 1}/${flow.steps.length}: ${step.description}`);

        try {
          const stepResult = await this.executeStep(step, contextEngine);
          flowResult.steps.push(stepResult);

          if (stepResult.success) {
            flowResult.completedSteps++;
          } else if (step.isCritical) {
            this.logger.error(`❌ 关键步骤失败: ${step.description}`);
            flowResult.success = false;
            flowResult.error = `步骤失败: ${step.description}`;
            break; // 关键步骤失败，停止流程
          } else {
            this.logger.warn(`⚠️ 非关键步骤失败: ${step.description}`);
            // 继续执行下一个步骤
          }

          // 步骤后等待
          if (step.waitAfter) {
            await this.sleep(step.waitAfter);
          }

        } catch (stepError) {
          this.logger.error(`❌ 步骤执行异常: ${step.description}`, stepError);

          flowResult.steps.push({
            stepId: step.stepId,
            description: step.description,
            success: false,
            error: stepError.message,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0
          });

          if (step.isCritical) {
            flowResult.success = false;
            flowResult.error = stepError.message;
            break;
          }
        }
      }

      flowResult.endTime = Date.now();
      flowResult.duration = flowResult.endTime - flowResult.startTime;

      // 完成流程任务
      contextEngine.completeTask({
        success: flowResult.success,
        completedSteps: flowResult.completedSteps,
        totalSteps: flowResult.totalSteps,
        error: flowResult.error
      });

      const statusIcon = flowResult.success ? '✅' : '❌';
      const duration = (flowResult.duration / 1000).toFixed(2);
      this.logger.log(`\n${statusIcon} 流程执行${flowResult.success ? '成功' : '失败'} (${duration}s)`);
      this.logger.log(`📊 完成步骤: ${flowResult.completedSteps}/${flowResult.totalSteps}`);

      return flowResult;

    } catch (error) {
      this.logger.error('流程执行异常:', error);

      flowResult.endTime = Date.now();
      flowResult.duration = flowResult.endTime - flowResult.startTime;
      flowResult.success = false;
      flowResult.error = error.message;

      contextEngine.completeTask({
        success: false,
        error: error.message
      });

      return flowResult;
    }
  }

  /**
   * 执行单个步骤
   */
  async executeStep (step, contextEngine) {
    const stepStartTime = Date.now();

    const stepResult = {
      stepId: step.stepId,
      description: step.description,
      action: step.action,
      success: false,
      startTime: stepStartTime,
      endTime: null,
      duration: 0,
      error: null
    };

    try {
      // 记录步骤开始
      contextEngine.recordAction({
        type: 'step_start',
        description: step.description,
        stepId: step.stepId
      });

      // 根据动作类型执行
      switch (step.action) {
        case 'click':
        case 'trigger':
          await this.executeClick(step, contextEngine);
          break;

        case 'input':
          await this.executeInput(step, contextEngine);
          break;

        case 'select':
          await this.executeSelect(step, contextEngine);
          break;

        case 'wait':
        case 'wait_modal_open':
          await contextEngine.waitForModalOpen(step.target?.timeout || 5000);
          break;

        case 'wait_modal_close':
          await contextEngine.waitForModalClose(step.target?.timeout || 5000);
          break;

        case 'close_modal':
          await this.executeCloseModal(step, contextEngine);
          break;

        case 'verify':
        case 'verify_result':
          await this.executeVerify(step, contextEngine);
          break;

        case 'submit':
        case 'submit_form':
          await this.executeClick(step, contextEngine);
          break;

        case 'wait_response':
          await contextEngine.waitForPageStable(step.target?.timeout || 3000);
          break;

        default:
          // 默认作为点击处理
          await this.executeClick(step, contextEngine);
      }

      stepResult.success = true;

    } catch (error) {
      stepResult.success = false;
      stepResult.error = error.message;

      this.logger.error(`  ❌ 错误: ${error.message}`);

      // 尝试备选方案
      if (step.fallbackStrategy) {
        this.logger.log(`  🔄 尝试备选方案: ${step.fallbackStrategy}`);
        try {
          // 这里可以添加备选方案的执行逻辑
        } catch (fallbackError) {
          // 备选方案也失败了
        }
      }
    }

    stepResult.endTime = Date.now();
    stepResult.duration = stepResult.endTime - stepResult.startTime;

    // 记录步骤结果
    contextEngine.recordAction({
      type: 'step_complete',
      description: step.description,
      success: stepResult.success,
      stepId: step.stepId,
      duration: stepResult.duration
    });

    const statusIcon = stepResult.success ? '✅' : '❌';
    this.logger.log(`  ${statusIcon} 耗时: ${(stepResult.duration / 1000).toFixed(2)}s`);

    return stepResult;
  }

  /**
   * 执行点击操作
   */
  async executeClick (step, contextEngine) {
    const target = step.target;

    if (!target || !target.selector) {
      throw new Error('点击操作缺少选择器');
    }

    const element = this.findElement(target.selector, target.type);

    if (!element) {
      throw new Error(`未找到目标元素: ${target.selector}`);
    }

    if (!this.isElementVisible(element)) {
      throw new Error(`目标元素不可见: ${target.selector}`);
    }

    // 滚动到元素
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.sleep(300);

    // 点击元素
    element.click();
    this.logger.log(`  👆 已点击: ${target.selector}`);

    // 检测是否打开了弹框
    await this.sleep(500);
    contextEngine.checkForModals?.();
  }

  /**
   * 执行输入操作
   */
  async executeInput (step, contextEngine) {
    const target = step.target;

    if (!target || !target.selector) {
      throw new Error('输入操作缺少选择器');
    }

    if (!target.value) {
      throw new Error('输入操作缺少输入值');
    }

    const element = this.findElement(target.selector, 'input');

    if (!element || !['INPUT', 'TEXTAREA'].includes(element.tagName)) {
      throw new Error(`未找到输入框: ${target.selector}`);
    }

    if (!this.isElementVisible(element)) {
      throw new Error(`输入框不可见: ${target.selector}`);
    }

    // 清空现有内容
    element.value = '';

    // 触发focus事件
    element.focus();
    element.dispatchEvent(new Event('focus', { bubbles: true }));

    await this.sleep(200);

    // 输入值
    element.value = target.value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    this.logger.log(`  ⌨️ 已输入: ${target.value}`);

    contextEngine.recordAction({
      type: 'input',
      description: step.description,
      value: target.value,
      element: target.selector
    });
  }

  /**
   * 执行选择操作
   */
  async executeSelect (step, contextEngine) {
    const target = step.target;

    if (!target || !target.selector) {
      throw new Error('选择操作缺少选择器');
    }

    const element = this.findElement(target.selector, 'select');

    if (!element) {
      throw new Error(`未找到选择器: ${target.selector}`);
    }

    if (!this.isElementVisible(element)) {
      throw new Error(`选择器不可见: ${target.selector}`);
    }

    if (element.tagName === 'SELECT') {
      // 原生select
      element.value = target.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // 可能是自定义dropdown
      element.click();
      await this.sleep(300);

      const optionElement = document.querySelector(`[data-value="${target.value}"]`);
      if (optionElement) {
        optionElement.click();
      }
    }

    this.logger.log(`  ✓ 已选择: ${target.value}`);

    contextEngine.recordAction({
      type: 'select',
      description: step.description,
      value: target.value,
      element: target.selector
    });
  }

  /**
   * 执行关闭弹框操作
   */
  async executeCloseModal (step, contextEngine) {
    // 优先尝试找关闭按钮
    const closeSelectors = [
      '.el-dialog__close',
      '.ant-modal-close',
      'button[aria-label="Close"]',
      '[class*="close"]',
      '.modal-close'
    ];

    for (const selector of closeSelectors) {
      const closeBtn = document.querySelector(selector);
      if (closeBtn && this.isElementVisible(closeBtn)) {
        closeBtn.click();
        this.logger.log(`  ✕ 已关闭弹框`);
        await this.sleep(500);
        return;
      }
    }

    // 如果找不到关闭按钮，尝试点击遮罩
    const backdrop = document.querySelector('.el-dialog__wrapper, .ant-modal-wrap, .modal-backdrop');
    if (backdrop) {
      backdrop.click();
      this.logger.log(`  ✕ 通过遮罩关闭弹框`);
      await this.sleep(500);
      return;
    }

    throw new Error('无法关闭弹框');
  }

  /**
   * 执行验证操作
   */
  async executeVerify (step, contextEngine) {
    // 这里可以添加验证逻辑
    this.logger.log(`  ✓ 验证步骤执行`);
  }

  /**
   * 查找元素
   */
  findElement (selector, type) {
    if (!selector) return null;

    try {
      // 首先尝试作为CSS选择器
      let element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) return element;

      // 其次尝试按文本内容搜索
      if (!element) {
        const elements = type === 'input'
          ? document.querySelectorAll('input, textarea')
          : type === 'select'
            ? document.querySelectorAll('select')
            : document.querySelectorAll('button, [role="button"]');

        for (const el of elements) {
          if ((el.textContent || el.value || el.placeholder).includes(selector)) {
            if (this.isElementVisible(el)) return el;
          }
        }
      }

      return element;
    } catch (error) {
      return null;
    }
  }

  /**
   * 判断元素是否可见
   */
  isElementVisible (element) {
    if (!element) return false;

    if (element.offsetParent === null) return false;

    try {
      const style = window.getComputedStyle(element);
      if (style.display === 'none') return false;
      if (style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity) === 0) return false;

      return element.offsetWidth > 0 && element.offsetHeight > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 辅助方法
   */
  parseResponse (response) {
    try {
      const content = typeof response === 'string' ? response : (response.content || '');
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { steps: [] };
    } catch (error) {
      this.logger.error('响应解析失败:', error);
      return { steps: [] };
    }
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
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowOrchestrator;
}
