# 🎨 复杂UI组件智能测试方案 - 完整优化文档

**项目**:  chensongbai911/web-test-automation  
**版本**: v3.0 - UI Component Testing Enhanced  
**日期**: 2026-01-12  
**作者**: UI测试专家团队

---

## 📋 目录

1. [问题定义与分析](#问题定义与分析)
2. [UI框架组件测试挑战](#ui框架组件测试挑战)
3. [AI增强解决方案](#ai增强解决方案)
4. [组件识别系统](#组件识别系统)
5. [智能交互引擎](#智能交互引擎)
6. [完整代码实现](#完整代码实现)
7. [测试策略库](#测试策略库)
8. [实施指南](#实施指南)

---

## 🎯 问题定义与分析

### 核心痛点

**问题1:  组件框架的DOM结构复杂**

```html
<!-- Element Plus的Select组件实际结构 -->
<div class="el-select">
  <!-- 显示的是这个div，但真正的select被隐藏 -->
  <div class="el-input">
    <input readonly class="el-input__inner" />
    <span class="el-input__suffix">
      <i class="el-icon-arrow-down"></i>
    </span>
  </div>
  <!-- 真实的select被隐藏 -->
  <select style="display: none;">
    <option value="1">选项1</option>
    <option value="2">选项2</option>
  </select>
</div>

<!-- 下拉面板是动态插入到body的 -->
<div class="el-select-dropdown" style="position: absolute; top: 100px;">
  <ul class="el-select-dropdown__list">
    <li class="el-select-dropdown__item">选项1</li>
    <li class="el-select-dropdown__item">选项2</li>
  </ul>
</div>
```

**当前测试工具的问题**: 
- ❌ 只能识别`<select>`标签，无法识别Element Plus的自定义下拉框
- ❌ 点击到错误的元素（点击了wrapper而不是真正可交互的元素）
- ❌ 无法处理动态弹出的dropdown面板
- ❌ 无法正确触发组件的事件

**问题2: 复杂交互流程**

```javascript
// Element Plus Select的正确操作流程
1. 点击 . el-select 的输入框区域
2. 等待 .el-select-dropdown 出现
3. 找到 .el-select-dropdown__item 元素
4. 点击对应的选项
5. 等待dropdown关闭
6. 验证选中的值

// 如果直接点击hidden的<select>，什么都不会发生
```

**问题3: 组件类型多样**

| 组件类型 | Element Plus | Ant Design Vue | Naive UI | 原生HTML |
|---------|--------------|----------------|----------|----------|
| 下拉框 | el-select | a-select | n-select | select |
| 多选框 | el-checkbox | a-checkbox | n-checkbox | input[type=checkbox] |
| 单选框 | el-radio | a-radio | n-radio | input[type=radio] |
| 日期选择器 | el-date-picker | a-date-picker | n-date-picker | input[type=date] |
| 开关 | el-switch | a-switch | n-switch | - |
| 滑块 | el-slider | a-slider | n-slider | input[type=range] |
| 级联选择 | el-cascader | a-cascader | n-cascader | - |
| 上传 | el-upload | a-upload | n-upload | input[type=file] |

每种框架的DOM结构和交互方式都不同！

---

## 🔍 UI框架组件测试挑战

### 挑战1: 组件框架识别

需要自动识别页面使用的UI框架：
- Element Plus
- Ant Design Vue
- Naive UI
- Vuetify
- Quasar
- iView
- Vant (移动端)
- Bootstrap Vue
- 原生HTML

### 挑战2: 组件类型识别

同一个UI框架中有几十种组件类型，需要准确识别每种组件。

### 挑战3: 正确的交互方式

每种组件的交互方式不同：
- **Select**: 点击 → 等待dropdown → 点击选项
- **DatePicker**: 点击 → 等待日历 → 选择年月 → 选择日期
- **Cascader**: 点击 → 选择第一级 → 等待第二级加载 → 选择第二级 → ... 
- **Upload**: 需要模拟文件选择和上传流程

### 挑战4: 测试数据生成

不同组件需要不同类型的测试数据：
- Select: 需要从可用选项中选择
- DatePicker: 需要生成合法的日期
- Input: 需要符合验证规则的文本
- NumberInput: 需要在min/max范围内的数字

---

## 🤖 AI增强解决方案

### 解决方案架构

```
┌─────────────────────────────────────────────────────────────┐
│              AI增强的UI组件测试系统                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  第1层:  AI组件识别引擎                                        │
│  ├─ 识别UI框架（Element Plus/Ant Design/原生等）            │
│  ├─ 识别组件类型（Select/Checkbox/DatePicker等）            │
│  ├─ 分析组件结构（DOM树、class命名规律）                     │
│  └─ 提取组件属性（可选项、验证规则、默认值）                 │
│                                                               │
│  第2层: 智能交互策略库                                        │
│  ├─ 预定义的框架特定交互模式                                 │
│  ├─ AI动态生成的交互序列                                     │
│  ├─ 自适应等待和重试机制                                     │
│  └─ 交互结果验证                                             │
│                                                               │
│  第3层: AI数据生成器                                          │
│  ├─ 理解组件的数据约束                                       │
│  ├─ 生成符合规则的测试数据                                   │
│  ├─ 边界值和异常数据生成                                     │
│  └─ 跨组件数据关联                                           │
│                                                               │
│  第4层: 测试执行引擎                                          │
│  ├─ 执行AI生成的交互序列                                     │
│  ├─ 实时监控组件状态变化                                     │
│  ├─ 智能异常处理和重试                                       │
│  └─ 测试结果记录和分析                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 完整代码实现

### 1. AI组件识别引擎

```javascript
// 新文件: src/ai-component-recognizer.js

/**
 * AI增强的UI组件识别引擎
 * 核心职责：
 * 1. 识别页面使用的UI框架
 * 2. 识别每个元素对应的组件类型
 * 3. 提取组件的配置和约束
 * 4. 生成针对性的测试策略
 */
class AIComponentRecognizer {
  constructor(qwenApiKey) {
    this.qwen = new QwenIntegration(qwenApiKey);
    this.frameworkSignatures = this.initFrameworkSignatures();
    this.componentPatterns = new Map();
    this.recognizedFramework = null;
  }

  /**
   * 初始化框架特征库
   */
  initFrameworkSignatures() {
    return {
      'element-plus': {
        indicators: [
          'el-button', 'el-input', 'el-select', 'el-form',
          'ElButton', 'ElInput', 'ElSelect', // Vue组件名
          'element-plus', // script标签中
          '. ep-' // CSS类前缀
        ],
        version: null,
        confidence: 0
      },
      'ant-design-vue': {
        indicators:  [
          'a-button', 'a-input', 'a-select', 'a-form',
          'ant-', 'antd',
          'AButton', 'AInput'
        ],
        version: null,
        confidence: 0
      },
      'naive-ui': {
        indicators: [
          'n-button', 'n-input', 'n-select', 'n-form',
          'naive-ui'
        ],
        version: null,
        confidence: 0
      },
      'vuetify': {
        indicators: [
          'v-btn', 'v-text-field', 'v-select', 'v-form',
          'vuetify', 'mdi-'
        ],
        version: null,
        confidence: 0
      },
      'quasar': {
        indicators: [
          'q-btn', 'q-input', 'q-select', 'q-form',
          'quasar'
        ],
        version: null,
        confidence: 0
      },
      'vant': {
        indicators: [
          'van-button', 'van-field', 'van-picker',
          'vant'
        ],
        version: null,
        confidence: 0
      },
      'iview': {
        indicators: [
          'i-button', 'i-input', 'i-select',
          'iview', 'view-ui'
        ],
        version:  null,
        confidence: 0
      },
      'native':  {
        indicators: ['input', 'select', 'button', 'textarea'],
        version: 'html5',
        confidence: 100 // 原生HTML总是存在
      }
    };
  }

  /**
   * 核心方法:  识别页面使用的UI框架
   */
  async detectUIFramework() {
    console.log('[AI组件识别] 🔍 开始识别UI框架.. .');

    // 第1步:  基于DOM特征的快速检测
    const frameworkScores = await this.quickFrameworkDetection();
    
    // 第2步: 如果不确定，使用AI深度分析
    if (Math.max(...Object.values(frameworkScores)) < 70) {
      const aiDetection = await this.aiDeepFrameworkAnalysis();
      this.recognizedFramework = aiDetection;
    } else {
      const topFramework = Object.entries(frameworkScores)
        .sort((a, b) => b[1] - a[1])[0];
      this.recognizedFramework = {
        framework: topFramework[0],
        confidence: topFramework[1],
        version: await this.detectFrameworkVersion(topFramework[0])
      };
    }

    console.log('[AI组件识别] ✅ 框架识别完成:', this.recognizedFramework);
    return this.recognizedFramework;
  }

  /**
   * 基于DOM特征的快速检测
   */
  async quickFrameworkDetection() {
    const scores = {};
    
    for (const [framework, signature] of Object.entries(this. frameworkSignatures)) {
      let score = 0;
      
      // 检查HTML中的class名称
      for (const indicator of signature.indicators) {
        const elements = document.querySelectorAll(`[class*="${indicator}"]`);
        if (elements.length > 0) {
          score += elements.length * 10;
        }
      }
      
      // 检查script标签
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || script.src || '';
        for (const indicator of signature.indicators) {
          if (content.includes(indicator)) {
            score += 30;
          }
        }
      }
      
      // 检查link标签（CSS）
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      for (const link of links) {
        const href = link.href || '';
        for (const indicator of signature.indicators) {
          if (href.includes(indicator)) {
            score += 30;
          }
        }
      }
      
      scores[framework] = Math.min(score, 100);
    }
    
    return scores;
  }

  /**
   * AI深度框架分析（当快速检测不确定时）
   */
  async aiDeepFrameworkAnalysis() {
    const htmlSample = this.extractHTMLSample();
    const cssSample = this.extractCSSClasses();
    
    const prompt = `你是UI框架识别专家。请分析以下HTML片段，识别使用的UI框架。

**HTML样本**:
\`\`\`html
${htmlSample}
\`\`\`

**CSS类名样本**:
${cssSample. join(', ')}

**已知的主流UI框架**:
1. Element Plus (Vue) - class前缀: el-
2. Ant Design Vue - class前缀: a-, ant-
3. Naive UI (Vue) - class前缀: n-
4. Vuetify (Vue) - class前缀: v-
5. Quasar (Vue) - class前缀: q-
6. Vant (Vue移动端) - class前缀: van-
7. iView/View UI (Vue) - class前缀: i-, ivu-
8. Bootstrap - class前缀: btn-, form-, nav-
9. Tailwind CSS - 原子化class
10. 原生HTML - 标准HTML标签

请分析识别，返回JSON: 
{
  "framework": "框架名称",
  "confidence": 0-100,
  "version": "版本号（如果能识别）",
  "indicators":  [
    "识别依据1：发现el-button类",
    "识别依据2：发现el-form-item结构"
  ],
  "components": [
    {
      "type": "组件类型（如：select, checkbox, datepicker）",
      "selector": "CSS选择器",
      "frameworkSpecific": true/false
    }
  ],
  "reasoning": "详细的识别理由"
}`;

    try {
      const result = await this.qwen.request([{
        role: 'system',
        content: '你是一位资深的前端开发工程师，精通各种UI框架的特征和使用方式。你能通过HTML结构和CSS类名准确识别UI框架。'
      }, {
        role: 'user',
        content: prompt
      }], {
        temperature: 0.2, // 低温度保证识别准确性
        max_tokens: 2000
      });

      const analysis = this.parseResponse(result);
      console.log('[AI组件识别] AI分析结果:', analysis);
      
      return analysis;

    } catch (error) {
      console.error('[AI组件识别] AI分析失败:', error);
      return {
        framework: 'native',
        confidence: 50,
        version: 'html5',
        indicators: [],
        components: []
      };
    }
  }

  /**
   * 识别具体组件类型
   */
  async recognizeComponent(element) {
    console.log('[AI组件识别] 🎯 识别组件类型...');

    // 第1步: 基于框架的规则识别
    const ruleBasedType = this.ruleBasedRecognition(element);
    
    if (ruleBasedType && ruleBasedType.confidence > 80) {
      return ruleBasedType;
    }

    // 第2步: AI深度识别
    return await this.aiComponentRecognition(element);
  }

  /**
   * 基于规则的组件识别
   */
  ruleBasedRecognition(element) {
    const framework = this.recognizedFramework?. framework || 'native';
    const classList = Array.from(element.classList);
    const tagName = element.tagName.toLowerCase();
    
    // Element Plus 识别规则
    if (framework === 'element-plus') {
      if (classList.some(c => c.startsWith('el-select'))) {
        return {
          type: 'select',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy: 'element-plus-select',
          realElement: element,
          dropdown: null // 将在交互时查找
        };
      }
      
      if (classList.some(c => c.startsWith('el-checkbox'))) {
        return {
          type: 'checkbox',
          framework: 'element-plus',
          confidence:  95,
          interactionStrategy: 'element-plus-checkbox',
          realElement: element. querySelector('input[type="checkbox"]') || element
        };
      }
      
      if (classList. some(c => c.startsWith('el-radio'))) {
        return {
          type: 'radio',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy: 'element-plus-radio',
          realElement: element. querySelector('input[type="radio"]') || element
        };
      }
      
      if (classList.some(c => c.startsWith('el-date-picker'))) {
        return {
          type: 'datepicker',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy: 'element-plus-datepicker',
          realElement: element
        };
      }
      
      if (classList. some(c => c.startsWith('el-input'))) {
        return {
          type: 'input',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy: 'element-plus-input',
          realElement: element. querySelector('input, textarea') || element
        };
      }
      
      if (classList.some(c => c.startsWith('el-switch'))) {
        return {
          type: 'switch',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy: 'element-plus-switch',
          realElement: element
        };
      }
      
      if (classList.some(c => c. startsWith('el-cascader'))) {
        return {
          type: 'cascader',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy:  'element-plus-cascader',
          realElement: element
        };
      }
      
      if (classList.some(c => c.startsWith('el-slider'))) {
        return {
          type: 'slider',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy: 'element-plus-slider',
          realElement: element
        };
      }
      
      if (classList.some(c => c. startsWith('el-upload'))) {
        return {
          type: 'upload',
          framework: 'element-plus',
          confidence: 95,
          interactionStrategy: 'element-plus-upload',
          realElement: element. querySelector('input[type="file"]') || element
        };
      }
    }
    
    // Ant Design Vue 识别规则
    if (framework === 'ant-design-vue') {
      if (classList.some(c => c.startsWith('ant-select') || c.startsWith('a-select'))) {
        return {
          type: 'select',
          framework: 'ant-design-vue',
          confidence: 95,
          interactionStrategy: 'ant-select',
          realElement: element
        };
      }
      
      if (classList.some(c => c.startsWith('ant-checkbox') || c.startsWith('a-checkbox'))) {
        return {
          type: 'checkbox',
          framework: 'ant-design-vue',
          confidence:  95,
          interactionStrategy: 'ant-checkbox',
          realElement: element. querySelector('input[type="checkbox"]') || element
        };
      }
      
      // ...  其他Ant Design组件规则
    }
    
    // 原生HTML识别
    if (tagName === 'select') {
      return {
        type: 'select',
        framework: 'native',
        confidence: 100,
        interactionStrategy: 'native-select',
        realElement: element
      };
    }
    
    if (tagName === 'input') {
      const inputType = element.type || 'text';
      return {
        type: inputType,
        framework: 'native',
        confidence: 100,
        interactionStrategy: `native-${inputType}`,
        realElement: element
      };
    }
    
    if (tagName === 'textarea') {
      return {
        type: 'textarea',
        framework: 'native',
        confidence: 100,
        interactionStrategy: 'native-textarea',
        realElement: element
      };
    }
    
    return null;
  }

  /**
   * AI深度组件识别（当规则无法识别时）
   */
  async aiComponentRecognition(element) {
    const elementInfo = this.extractElementInfo(element);
    
    const prompt = `识别这个UI组件的类型和交互方式。

**元素信息**:
- 标签:  ${elementInfo.tagName}
- Class列表: ${elementInfo.classList. join(', ')}
- 可见文本: ${elementInfo.text}
- 父元素Class: ${elementInfo.parentClass}
- 子元素:  ${elementInfo.children}

**HTML结构**:
\`\`\`html
${elementInfo.outerHTML}
\`\`\`

**检测到的框架**:  ${this.recognizedFramework?.framework || '未知'}

请识别：
1. 这是什么类型的组件？
2. 是框架组件还是原生HTML？
3. 正确的交互方式是什么？
4. 真正需要操作的DOM元素是哪个？

返回JSON: 
{
  "componentType": "select|checkbox|radio|datepicker|input|button|switch|slider|cascader|upload|other",
  "framework": "element-plus|ant-design-vue|native|unknown",
  "confidence": 0-100,
  "isCustomComponent": true/false,
  "interactionMethod": {
    "steps": [
      {
        "action": "click|input|select|wait",
        "target": "CSS选择器或描述",
        "description": "步骤说明"
      }
    ],
    "targetSelector": "最终要操作的元素选择器",
    "expectedBehavior": "预期的交互效果"
  },
  "dataConstraints": {
    "inputType": "text|number|date|select|boolean",
    "options": ["如果是select，列出可选项"],
    "validation": "验证规则"
  },
  "reasoning": "识别理由"
}`;

    try {
      const result = await this.qwen.request([{
        role: 'system',
        content: '你是UI组件识别专家，精通各种前端框架的组件结构和交互方式。'
      }, {
        role:  'user',
        content:  prompt
      }], {
        temperature: 0.3,
        max_tokens: 2000
      });

      const recognition = this.parseResponse(result);
      console.log('[AI组件识别] AI识别结果:', recognition);
      
      return {
        type: recognition.componentType,
        framework: recognition.framework,
        confidence: recognition.confidence,
        interactionStrategy: 'ai-generated',
        interactionMethod: recognition.interactionMethod,
        dataConstraints: recognition.dataConstraints,
        realElement: this.findRealElement(element, recognition.interactionMethod. targetSelector)
      };

    } catch (error) {
      console.error('[AI组件识别] AI识别失败:', error);
      return {
        type: 'unknown',
        framework: 'unknown',
        confidence: 0,
        interactionStrategy: 'default',
        realElement: element
      };
    }
  }

  /**
   * 提取元素信息
   */
  extractElementInfo(element) {
    return {
      tagName: element. tagName.toLowerCase(),
      classList: Array.from(element.classList),
      text: (element.textContent || '').trim().substring(0, 100),
      parentClass: element.parentElement ?  Array.from(element.parentElement. classList).join(' ') : '',
      children: Array.from(element.children).map(c => c.tagName.toLowerCase()).join(', '),
      outerHTML: element.outerHTML. substring(0, 500), // 限制长度
      attributes: Array.from(element.attributes).map(a => `${a.name}="${a. value}"`).join(' ')
    };
  }

  /**
   * 提取HTML样本
   */
  extractHTMLSample() {
    // 提取页面中表单和交互元素的HTML片段
    const forms = Array.from(document.querySelectorAll('form, [class*="form"]')).slice(0, 2);
    const samples = forms.map(form => form.outerHTML. substring(0, 1000));
    
    // 如果没有表单，提取其他交互元素
    if (samples.length === 0) {
      const interactive = Array.from(document.querySelectorAll('button, input, select, [class*="btn"], [class*="input"]')).slice(0, 5);
      samples.push(...interactive. map(el => el.outerHTML. substring(0, 300)));
    }
    
    return samples.join('\n\n');
  }

  /**
   * 提取CSS类名
   */
  extractCSSClasses() {
    const allClasses = new Set();
    const elements = document.querySelectorAll('*');
    
    for (const el of elements) {
      for (const className of el.classList) {
        allClasses.add(className);
      }
    }
    
    return Array. from(allClasses).slice(0, 100);
  }

  /**
   * 检测框架版本
   */
  async detectFrameworkVersion(framework) {
    // 尝试从window对象获取版本
    if (window.ElementPlus && framework === 'element-plus') {
      return window.ElementPlus.version || 'unknown';
    }
    
    // 尝试从script标签的src获取版本
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    for (const script of scripts) {
      const src = script.src;
      const versionMatch = src.match(/[\/@](\d+\.\d+\.\d+)/);
      if (versionMatch && src.includes(framework)) {
        return versionMatch[1];
      }
    }
    
    return 'unknown';
  }

  /**
   * 查找真正可交互的元素
   */
  findRealElement(wrapper, selector) {
    if (selector) {
      const target = wrapper.querySelector(selector);
      if (target) return target;
    }
    
    // 查找hidden的input/select
    const hidden = wrapper.querySelector('input[type="hidden"], select[style*="display: none"]');
    if (hidden) return hidden;
    
    // 查找第一个可交互元素
    const interactive = wrapper.querySelector('input, select, textarea, button');
    if (interactive) return interactive;
    
    return wrapper;
  }

  /**
   * 解析AI响应
   */
  parseResponse(response) {
    try {
      const content = response.content || response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      console.error('[AI组件识别] 响应解析失败:', error);
      return {};
    }
  }
}

// 全局实例
if (typeof window !== 'undefined') {
  window.aiComponentRecognizer = null; // 延迟初始化
}
```

---

### 2. 智能交互策略库

```javascript
// 新文件:  src/component-interaction-strategies.js

/**
 * UI组件交互策略库
 * 包含各种UI框架组件的标准交互方法
 */
class ComponentInteractionStrategies {
  constructor() {
    this.strategies = this.initStrategies();
  }

  /**
   * 初始化所有交互策略
   */
  initStrategies() {
    return {
      // ============ Element Plus 策略 ============
      
      'element-plus-select': {
        name: 'Element Plus Select 下拉框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Select 交互');
          
          try {
            // 第1步: 点击打开下拉框
            const trigger = element.querySelector('.el-input__inner') || element;
            trigger.click();
            
            // 第2步: 等待dropdown出现
            await this.waitForDropdown('. el-select-dropdown', 3000);
            
            // 第3步: 获取dropdown（可能append到body）
            const dropdown = document.querySelector('.el-select-dropdown: not(. el-select-dropdown--hidden)');
            if (! dropdown) {
              throw new Error('Dropdown未出现');
            }
            
            // 第4步: 选择选项
            let selectedOption = null;
            
            if (value !== undefined) {
              // 指定了值，查找对应选项
              const options = dropdown.querySelectorAll('.el-select-dropdown__item');
              for (const option of options) {
                if (option.textContent. trim() === value || 
                    option.getAttribute('data-value') === value) {
                  selectedOption = option;
                  break;
                }
              }
            } else {
              // 未指定值，随机选择一个
              const options = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item: not(. is-disabled)'));
              if (options.length > 0) {
                selectedOption = options[Math.floor(Math.random() * options.length)];
              }
            }
            
            if (!selectedOption) {
              throw new Error(`未找到选项:  ${value}`);
            }
            
            // 第5步: 点击选项
            selectedOption.click();
            
            // 第6步: 等待dropdown关闭
            await this.waitForDropdownClose('.el-select-dropdown', 2000);
            
            // 第7步: 验证选中
            await this.sleep(300);
            const selectedText = trigger.value || trigger.textContent. trim();
            
            console.log('[交互策略] ✅ Select 交互成功，选中:', selectedText);
            
            return {
              success:  true,
              selectedValue: selectedText,
              method: 'element-plus-select'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Select 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-select'
            };
          }
        },
        
        async waitForDropdown(selector, timeout) {
          const startTime = Date.now();
          while (Date.now() - startTime < timeout) {
            const dropdown = document.querySelector(selector);
            if (dropdown && !dropdown. classList.contains('el-select-dropdown--hidden')) {
              await this.sleep(200); // 额外等待动画完成
              return dropdown;
            }
            await this.sleep(100);
          }
          throw new Error('等待dropdown超时');
        },
        
        async waitForDropdownClose(selector, timeout) {
          const startTime = Date.now();
          while (Date.now() - startTime < timeout) {
            const dropdown = document.querySelector(selector);
            if (!dropdown || dropdown.classList.contains('el-select-dropdown--hidden')) {
              return true;
            }
            await this.sleep(100);
          }
          return true; // 超时也认为成功
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-checkbox': {
        name: 'Element Plus Checkbox 多选框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Checkbox 交互');
          
          try {
            // 查找真正的checkbox或点击区域
            const checkboxInput = element.querySelector('input[type="checkbox"]');
            const checkboxLabel = element.querySelector('. el-checkbox__inner') || element;
            
            // 获取当前状态
            const currentChecked = checkboxInput ?  checkboxInput.checked : 
                                  element.classList.contains('is-checked');
            
            // 判断是否需要切换
            const targetChecked = value === undefined ?  ! currentChecked : !!value;
            
            if (currentChecked !== targetChecked) {
              // 需要切换，点击
              checkboxLabel.click();
              await this.sleep(200);
            }
            
            // 验证状态
            const finalChecked = checkboxInput ? checkboxInput.checked : 
                                element.classList.contains('is-checked');
            
            console.log('[交互策略] ✅ Checkbox 交互成功，状态:', finalChecked);
            
            return {
              success: true,
              checked:  finalChecked,
              method:  'element-plus-checkbox'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Checkbox 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-checkbox'
            };
          }
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-radio': {
        name:  'Element Plus Radio 单选框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Radio 交互');
          
          try {
            // 如果element是radio-group，查找所有radio
            let radioToClick = element;
            
            if (element.classList.contains('el-radio-group')) {
              const radios = element.querySelectorAll('.el-radio');
              if (value !== undefined) {
                // 根据value查找对应radio
                for (const radio of radios) {
                  const radioValue = radio.querySelector('input')?.value;
                  const radioLabel = radio.querySelector('.el-radio__label')?.textContent. trim();
                  if (radioValue === value || radioLabel === value) {
                    radioToClick = radio;
                    break;
                  }
                }
              } else {
                // 随机选择未选中的radio
                const unchecked = Array.from(radios).filter(r => 
                  !r.classList. contains('is-checked')
                );
                if (unchecked.length > 0) {
                  radioToClick = unchecked[Math.floor(Math. random() * unchecked.length)];
                }
              }
            }
            
            // 点击radio
            const radioLabel = radioToClick.querySelector('.el-radio__inner') || radioToClick;
            radioLabel.click();
            await this.sleep(200);
            
            // 获取选中的值
            const radioInput = radioToClick.querySelector('input[type="radio"]');
            const selectedValue = radioInput?. value || 
                                 radioToClick.querySelector('. el-radio__label')?.textContent.trim();
            
            console.log('[交互策略] ✅ Radio 交互成功，选中:', selectedValue);
            
            return {
              success: true,
              selectedValue,
              method: 'element-plus-radio'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Radio 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-radio'
            };
          }
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-datepicker': {
        name: 'Element Plus DatePicker 日期选择器',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus DatePicker 交互');
          
          try {
            // 第1步: 点击打开日期面板
            const input = element.querySelector('.el-input__inner') || element;
            input.click();
            
            // 第2步: 等待日期面板出现
            await this.waitForPicker('.el-picker-panel', 3000);
            
            // 第3步: 获取picker面板
            const picker = document. querySelector('.el-picker-panel:not([style*="display: none"])');
            if (!picker) {
              throw new Error('DatePicker面板未出现');
            }
            
            // 第4步: 选择日期
            let selectedDate = null;
            
            if (value) {
              // 指定了日期，尝试解析并选择
              selectedDate = await this.selectSpecificDate(picker, value);
            } else {
              // 未指定日期，选择今天或随机日期
              selectedDate = await this.selectRandomDate(picker);
            }
            
            // 第5步: 等待面板关闭
            await this.sleep(500);
            
            // 第6步: 验证选中
            const inputValue = input.value || input.textContent.trim();
            
            console.log('[交互策略] ✅ DatePicker 交互成功，选中:', inputValue);
            
            return {
              success: true,
              selectedDate:  inputValue,
              method: 'element-plus-datepicker'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ DatePicker 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-datepicker'
            };
          }
        },
        
        async waitForPicker(selector, timeout) {
          const startTime = Date.now();
          while (Date.now() - startTime < timeout) {
            const picker = document.querySelector(selector);
            if (picker && picker.offsetParent !== null) {
              await this.sleep(300);
              return picker;
            }
            await this.sleep(100);
          }
          throw new Error('等待DatePicker超时');
        },
        
        async selectRandomDate(picker) {
          // 查找所有可选日期
          const availableDates = picker.querySelectorAll('.el-date-table td. available: not(.disabled)');
          if (availableDates.length === 0) {
            throw new Error('没有可选日期');
          }
          
          // 随机选择一个日期
          const randomDate = availableDates[Math. floor(Math.random() * availableDates.length)];
          randomDate.click();
          await this.sleep(300);
          
          return randomDate. textContent.trim();
        },
        
        async selectSpecificDate(picker, dateString) {
          // 这里可以实现复杂的日期选择逻辑
          // 暂时使用简化版本
          return await this.selectRandomDate(picker);
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-input': {
        name: 'Element Plus Input 输入框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Input 交互');
          
          try {
            // 查找真正的input元素
            const input = element.querySelector('input, textarea') || element;
            
            if (input. tagName !== 'INPUT' && input.tagName !== 'TEXTAREA') {
              throw new Error('未找到input元素');
            }
            
            // 清空现有值
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 输入新值
            const inputValue = value || this.generateDefaultValue(input);
            input. value = inputValue;
            
            // 触发事件
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            await this.sleep(200);
            
            console.log('[交互策略] ✅ Input 交互成功，输入:', inputValue);
            
            return {
              success: true,
              inputValue,
              method: 'element-plus-input'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Input 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-input'
            };
          }
        },
        
        generateDefaultValue(input) {
          const type = input.type || 'text';
          const placeholder = input.placeholder || '';
          
          if (type === 'email' || placeholder.includes('邮箱') || placeholder.includes('email')) {
            return 'test_' + Date.now() + '@example.com';
          }
          if (type === 'tel' || placeholder.includes('电话') || placeholder.includes('手机')) {
            return '138' + Math.floor(Math. random() * 100000000).toString().padStart(8, '0');
          }
          if (type === 'number') {
            return Math.floor(Math.random() * 100).toString();
          }
          if (placeholder.includes('姓名') || placeholder.includes('用户名')) {
            return '测试用户' + Date.now();
          }
          
          return '测试内容_' + Date.now();
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-switch': {
        name: 'Element Plus Switch 开关',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Switch 交互');
          
          try {
            // 获取当前状态
            const isActive = element.classList.contains('is-checked');
            
            // 判断是否需要切换
            const targetState = value === undefined ? !isActive : !!value;
            
            if (isActive !== targetState) {
              // 需要切换
              element.click();
              await this.sleep(300);
            }
            
            // 验证状态
            const finalState = element.classList.contains('is-checked');
            
            console.log('[交互策略] ✅ Switch 交互成功，状态:', finalState);
            
            return {
              success: true,
              state: finalState,
              method:  'element-plus-switch'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Switch 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-switch'
            };
          }
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-cascader': {
        name: 'Element Plus Cascader 级联选择器',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Cascader 交互');
          
          try {
            // 第1步: 点击打开级联面板
            const trigger = element.querySelector('.el-input__inner') || element;
            trigger.click();
            
            // 第2步: 等待面板出现
            await this. waitForPanel('.el-cascader-panel', 3000);
            
            // 第3步: 获取面板
            const panel = document. querySelector('.el-cascader-panel');
            if (!panel) {
              throw new Error('Cascader面板未出现');
            }
            
            // 第4步: 依次选择各级选项
            const selectedPath = [];
            const menus = panel.querySelectorAll('.el-cascader-menu');
            
            for (let level = 0; level < menus.length; level++) {
              const menu = menus[level];
              const options = menu.querySelectorAll('. el-cascader-node: not(.is-disabled)');
              
              if (options.length === 0) break;
              
              // 随机选择一个选项
              const randomOption = options[Math.floor(Math.random() * options.length)];
              const optionText = randomOption.textContent.trim();
              selectedPath.push(optionText);
              
              randomOption.click();
              await this.sleep(500); // 等待下一级加载
              
              // 如果没有更多级别，结束
              if (! randomOption.classList.contains('has-children')) {
                break;
              }
            }
            
            // 第5步: 等待面板关闭
            await this.sleep(500);
            
            console.log('[交互策略] ✅ Cascader 交互成功，选中路径:', selectedPath.join(' / '));
            
            return {
              success: true,
              selectedPath:  selectedPath.join(' / '),
              method: 'element-plus-cascader'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Cascader 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-cascader'
            };
          }
        },
        
        async waitForPanel(selector, timeout) {
          const startTime = Date.now();
          while (Date.now() - startTime < timeout) {
            const panel = document.querySelector(selector);
            if (panel && panel.offsetParent !== null) {
              await this.sleep(300);
              return panel;
            }
            await this.sleep(100);
          }
          throw new Error('等待Cascader面板超时');
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-slider': {
        name: 'Element Plus Slider 滑块',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Slider 交互');
          
          try {
            // 查找滑块按钮
            const button = element.querySelector('.el-slider__button') || element;
            const runway = element.querySelector('.el-slider__runway');
            
            if (!runway) {
              throw new Error('未找到slider runway');
            }
            
            // 获取滑块范围
            const min = parseFloat(element.getAttribute('aria-valuemin') || '0');
            const max = parseFloat(element.getAttribute('aria-valuemax') || '100');
            const step = parseFloat(element.getAttribute('aria-step') || '1');
            
            // 确定目标值
            let targetValue = value !== undefined ? parseFloat(value) : 
                             Math.floor(Math.random() * (max - min) / step) * step + min;
            
            // 计算需要移动的百分比
            const percentage = (targetValue - min) / (max - min);
            const runwayWidth = runway.offsetWidth;
            const targetX = runwayWidth * percentage;
            
            // 模拟拖拽
            const buttonX = button.getBoundingClientRect().left;
            const runwayX = runway.getBoundingClientRect().left;
            const currentX = buttonX - runwayX;
            const moveX = targetX - currentX;
            
            // 触发拖拽事件
            button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            document.dispatchEvent(new MouseEvent('mousemove', { 
              bubbles: true,
              clientX: buttonX + moveX 
            }));
            document. dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            
            await this.sleep(300);
            
            // 获取实际值
            const actualValue = element.getAttribute('aria-valuenow') || targetValue;
            
            console. log('[交互策略] ✅ Slider 交互成功，值:', actualValue);
            
            return {
              success: true,
              value: actualValue,
              method: 'element-plus-slider'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Slider 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-slider'
            };
          }
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'element-plus-upload':  {
        name: 'Element Plus Upload 上传组件',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行 Element Plus Upload 交互');
          
          try {
            // 查找文件输入框
            const fileInput = element.querySelector('input[type="file"]');
            
            if (!fileInput) {
              throw new Error('未找到文件输入框');
            }
            
            // 创建模拟文件
            const file = this.createMockFile(options.filename || 'test.txt', options.content || 'test content');
            
            // 创建DataTransfer对象
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer. files;
            
            // 触发change事件
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            await this.sleep(500);
            
            console.log('[交互策略] ✅ Upload 交互成功，文件:', file.name);
            
            return {
              success: true,
              filename: file.name,
              method: 'element-plus-upload'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ Upload 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'element-plus-upload'
            };
          }
        },
        
        createMockFile(filename, content) {
          const blob = new Blob([content], { type: 'text/plain' });
          return new File([blob], filename, { type: 'text/plain' });
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      // ============ 原生HTML策略 ============
      
      'native-select': {
        name: '原生 Select 下拉框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行原生 Select 交互');
          
          try {
            const select = element.tagName === 'SELECT' ? element : element.querySelector('select');
            
            if (!select) {
              throw new Error('未找到select元素');
            }
            
            const options_list = Array.from(select.options).filter(opt => ! opt.disabled);
            
            if (options_list.length === 0) {
              throw new Error('没有可选项');
            }
            
            let optionToSelect = null;
            
            if (value !== undefined) {
              // 查找指定值的选项
              optionToSelect = options_list. find(opt => 
                opt.value === value || opt.textContent.trim() === value
              );
            }
            
            if (!optionToSelect) {
              // 随机选择
              optionToSelect = options_list[Math.floor(Math. random() * options_list.length)];
            }
            
            // 设置选中
            select.value = optionToSelect.value;
            select. dispatchEvent(new Event('change', { bubbles: true }));
            
            await this.sleep(200);
            
            console.log('[交互策略] ✅ 原生Select 交互成功，选中:', optionToSelect.textContent.trim());
            
            return {
              success: true,
              selectedValue: optionToSelect.textContent.trim(),
              method: 'native-select'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ 原生Select 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'native-select'
            };
          }
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'native-checkbox': {
        name: '原生 Checkbox 多选框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行原生 Checkbox 交互');
          
          try {
            const checkbox = element.type === 'checkbox' ? element :  element.querySelector('input[type="checkbox"]');
            
            if (!checkbox) {
              throw new Error('未找到checkbox元素');
            }
            
            const targetChecked = value === undefined ? !checkbox.checked : !!value;
            
            if (checkbox.checked !== targetChecked) {
              checkbox.checked = targetChecked;
              checkbox.dispatchEvent(new Event('change', { bubbles:  true }));
            }
            
            await this. sleep(200);
            
            console.log('[交互策略] ✅ 原生Checkbox 交互成功，状态:', checkbox.checked);
            
            return {
              success: true,
              checked:  checkbox.checked,
              method: 'native-checkbox'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ 原生Checkbox 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'native-checkbox'
            };
          }
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'native-radio': {
        name: '原生 Radio 单选框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行原生 Radio 交互');
          
          try {
            const radio = element.type === 'radio' ? element : element.querySelector('input[type="radio"]');
            
            if (!radio) {
              throw new Error('未找到radio元素');
            }
            
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            
            await this.sleep(200);
            
            console.log('[交互策略] ✅ 原生Radio 交互成功');
            
            return {
              success: true,
              method: 'native-radio'
            };
            
          } catch (error) {
            console. error('[交互策略] ❌ 原生Radio 交互失败:', error);
            return {
              success: false,
              error: error.message,
              method: 'native-radio'
            };
          }
        },
        
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      },
      
      'native-text':  {
        name: '原生 Input 输入框',
        async execute(element, value, options = {}) {
          console.log('[交互策略] 执行原生 Input 交互');
          
          try {
            const input = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? 
                         element : element.querySelector('input, textarea');
            
            if (! input) {
              throw new Error('未找到input元素');
            }
            
            const inputValue = value || this.generateDefaultValue(input);
            
            input.value = inputValue;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            await this. sleep(200);
            
            console.log('[交互策略] ✅ 原生Input 交互成功，输入:', inputValue);
            
            return {
              success: true,
              inputValue,
              method: 'native-text'
            };
            
          } catch (error) {
            console.error('[交互策略] ❌ 原生Input 交互失败:', error);
            return {
              success: false,
              error:  error.message,