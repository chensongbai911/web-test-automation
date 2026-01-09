/**
 * 增强型文档生成工具
 * 支持多种格式导出、模板管理、文档预览等功能
 */

class EnhancedDocumentGenerator {
  constructor() {
    this.templates = new Map();
    this.history = [];
    this.maxHistorySize = 20;
    this.initTemplates();
  }

  /**
   * 初始化文档模板库
   */
  initTemplates () {
    // 表单测试模板
    this.templates.set('form-testing', {
      name: '表单测试',
      description: '用于测试各种表单字段和验证规则',
      sections: ['分析', '字段测试', '验证规则', '边界值', '错误处理'],
      focusPoints: ['必填字段验证', '字段格式验证', '字段间依赖关系', '提交按钮功能']
    });

    // 列表操作模板
    this.templates.set('list-management', {
      name: '列表管理',
      description: '用于测试列表的增删改查操作',
      sections: ['列表加载', '排序功能', '筛选功能', '分页功能', '操作功能'],
      focusPoints: ['数据正确性', '排序准确性', '筛选有效性', '分页完整性', '批量操作']
    });

    // 表格交互模板
    this.templates.set('table-interaction', {
      name: '表格交互',
      description: '用于测试复杂表格的交互',
      sections: ['表格渲染', '行操作', '列排序', '表格筛选', '数据导出'],
      focusPoints: ['表格完整性', '行按钮功能', '排序正确性', '筛选有效性']
    });

    // 工作流测试模板
    this.templates.set('workflow', {
      name: '工作流程',
      description: '用于测试多步骤工作流',
      sections: ['流程初始化', '各步骤验证', '流程回退', '流程完成', '异常处理'],
      focusPoints: ['步骤顺序正确', '数据传递完整', '权限控制正确', '异常恢复']
    });

    // 权限控制模板
    this.templates.set('permission', {
      name: '权限控制',
      description: '用于测试不同用户权限下的操作',
      sections: ['权限初始化', '可见性测试', '可操作性测试', '数据隔离', '审计日志'],
      focusPoints: ['功能可见性', '操作权限验证', '数据访问权限', '操作审计']
    });

    // 性能测试模板
    this.templates.set('performance', {
      name: '性能测试',
      description: '用于测试页面性能和响应速度',
      sections: ['页面加载时间', '交互响应时间', '数据加载速度', '内存使用', '网络使用'],
      focusPoints: ['首屏加载时间', '交互延迟', '大数据处理', '内存泄漏']
    });
  }

  /**
   * 获取所有模板
   */
  getTemplates () {
    return Array.from(this.templates.values());
  }

  /**
   * 获取模板
   */
  getTemplate (templateId) {
    return this.templates.get(templateId);
  }

  /**
   * 生成 Markdown 格式文档
   */
  toMarkdown (testPlan, options = {}) {
    let md = '# 自动化测试计划\n\n';

    // 文档元信息
    md += `> **生成时间：** ${new Date().toLocaleString('zh-CN')}\n`;
    md += `> **页面URL：** ${testPlan.pageUrl || '未知'}\n`;
    md += `> **页面标题：** ${testPlan.pageTitle || '未知'}\n\n`;

    // 目录
    md += '## 📑 目录\n\n';
    md += '1. [页面分析](#页面分析)\n';
    md += '2. [测试步骤](#测试步骤)\n';
    if (testPlan.dataPreparation) md += '3. [数据准备](#数据准备)\n';
    if (testPlan.potentialRisks?.length) md += '4. [风险评估](#风险评估)\n';
    if (testPlan.testingGuidelines?.length) md += '5. [测试指南](#测试指南)\n';
    md += '\n---\n\n';

    // 页面分析
    md += '## 页面分析\n\n';
    if (testPlan.pageAnalysis) {
      md += `| 项目 | 内容 |\n`;
      md += `|-----|------|\n`;
      md += `| 页面类型 | ${testPlan.pageAnalysis.pageType} |\n`;
      md += `| 业务场景 | ${testPlan.pageAnalysis.businessScenario} |\n`;
      md += `| 复杂度 | ${testPlan.pageAnalysis.complexity} |\n`;
      md += `| 预计时长 | ${testPlan.pageAnalysis.estimatedTime} 分钟 |\n\n`;
    }

    // 测试步骤
    md += '## 测试步骤\n\n';
    if (testPlan.testSteps?.length) {
      testPlan.testSteps.forEach((step, index) => {
        md += `### ${index + 1}. ${step.action}\n\n`;
        md += `**优先级：** ${this.getPriorityText(step.priority)} | `;
        md += `**风险：** ${this.getRiskText(step.riskLevel)}\n\n`;
        md += `| 项目 | 内容 |\n`;
        md += `|-----|------|\n`;
        md += `| 目标 | ${step.target} |\n`;
        if (step.selector) md += `| 选择器 | \`${step.selector}\` |\n`;
        md += `| 预期结果 | ${step.expectedResult} |\n`;
        if (step.testData) md += `| 测试数据 | ${step.testData} |\n`;
        md += '\n';

        if (step.validationPoints?.length) {
          md += `**验证点：**\n`;
          step.validationPoints.forEach(v => md += `- ${v}\n`);
          md += '\n';
        }
      });
    }

    // 数据准备
    if (testPlan.dataPreparation) {
      md += '## 数据准备\n\n';
      if (testPlan.dataPreparation.requiredData?.length) {
        md += `**需要的数据：** ${testPlan.dataPreparation.requiredData.join(', ')}\n\n`;
      }
      if (testPlan.dataPreparation.mockData) {
        md += `**模拟数据：**\n\`\`\`json\n`;
        md += JSON.stringify(testPlan.dataPreparation.mockData, null, 2);
        md += '\n```\n\n';
      }
    }

    // 风险评估
    if (testPlan.potentialRisks?.length) {
      md += '## 风险评估\n\n';
      testPlan.potentialRisks.forEach(risk => {
        md += `- **${risk.risk}** (可能性: ${risk.likelihood})\n`;
        md += `  - 缓解措施: ${risk.mitigation}\n`;
      });
      md += '\n';
    }

    // 测试指南
    if (testPlan.testingGuidelines?.length) {
      md += '## 测试指南\n\n';
      testPlan.testingGuidelines.forEach(g => md += `- ${g}\n`);
      md += '\n';
    }

    return md;
  }

  /**
   * 生成 HTML 格式文档
   */
  toHTML (testPlan, options = {}) {
    const style = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .document {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        h2 { color: #764ba2; margin-top: 30px; }
        h3 { color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f0f0f0; font-weight: 600; }
        .meta-info { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
        .step-box { border-left: 4px solid #667eea; background: #f9f9f9; padding: 15px; margin: 15px 0; }
        .risk-box { border-left: 4px solid #ff6b6b; background: #fff5f5; padding: 15px; margin: 15px 0; }
        .tip-box { border-left: 4px solid #51cf66; background: #f1fdf4; padding: 15px; margin: 15px 0; }
        ul { margin: 10px 0; padding-left: 20px; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      </style>
    `;

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试计划 - ${testPlan.pageTitle || '未命名'}</title>
  ${style}
</head>
<body>
  <div class="document">`;

    html += `<h1>📋 自动化测试计划</h1>`;
    html += `
      <div class="meta-info">
        <p><strong>生成时间：</strong> ${new Date().toLocaleString('zh-CN')}</p>
        <p><strong>页面URL：</strong> ${testPlan.pageUrl || '未知'}</p>
        <p><strong>页面标题：</strong> ${testPlan.pageTitle || '未知'}</p>
      </div>`;

    // 页面分析
    html += '<h2>📊 页面分析</h2>';
    if (testPlan.pageAnalysis) {
      html += '<table>';
      html += '<tr><th>项目</th><th>内容</th></tr>';
      html += `<tr><td>页面类型</td><td>${testPlan.pageAnalysis.pageType}</td></tr>`;
      html += `<tr><td>业务场景</td><td>${testPlan.pageAnalysis.businessScenario}</td></tr>`;
      html += `<tr><td>复杂度</td><td>${testPlan.pageAnalysis.complexity}</td></tr>`;
      html += `<tr><td>预计时长</td><td>${testPlan.pageAnalysis.estimatedTime} 分钟</td></tr>`;
      html += '</table>';
    }

    // 测试步骤
    html += '<h2>🎯 测试步骤</h2>';
    if (testPlan.testSteps?.length) {
      testPlan.testSteps.forEach((step, index) => {
        html += `
          <div class="step-box">
            <h3>${index + 1}. ${step.action}</h3>
            <p><strong>优先级：</strong> ${this.getPriorityText(step.priority)} |
               <strong>风险：</strong> ${this.getRiskText(step.riskLevel)}</p>
            <table>
              <tr><th>项目</th><th>内容</th></tr>
              <tr><td>目标</td><td>${step.target}</td></tr>`;
        if (step.selector) html += `<tr><td>选择器</td><td><code>${step.selector}</code></td></tr>`;
        html += `<tr><td>预期结果</td><td>${step.expectedResult}</td></tr>`;
        if (step.testData) html += `<tr><td>测试数据</td><td>${step.testData}</td></tr>`;
        html += '</table>';

        if (step.validationPoints?.length) {
          html += '<strong>验证点：</strong><ul>';
          step.validationPoints.forEach(v => html += `<li>${v}</li>`);
          html += '</ul>';
        }
        html += '</div>';
      });
    }

    // 风险评估
    if (testPlan.potentialRisks?.length) {
      html += '<h2>⚠️ 风险评估</h2>';
      testPlan.potentialRisks.forEach(risk => {
        html += `
          <div class="risk-box">
            <p><strong>${risk.risk}</strong> (可能性: ${risk.likelihood})</p>
            <p>缓解措施: ${risk.mitigation}</p>
          </div>`;
      });
    }

    // 测试指南
    if (testPlan.testingGuidelines?.length) {
      html += '<h2>💡 测试指南</h2>';
      html += '<div class="tip-box"><ul>';
      testPlan.testingGuidelines.forEach(g => html += `<li>${g}</li>`);
      html += '</ul></div>';
    }

    html += `
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * 生成 CSV 格式文档（用于Excel）
   */
  toCSV (testPlan) {
    let csv = '测试计划 - ' + testPlan.pageTitle + '\n';
    csv += `生成时间,${new Date().toLocaleString('zh-CN')}\n`;
    csv += `页面URL,${testPlan.pageUrl}\n\n`;

    csv += '步骤序号,操作类型,目标元素,优先级,风险等级,预期结果,测试数据,验证点\n';

    if (testPlan.testSteps?.length) {
      testPlan.testSteps.forEach((step, index) => {
        const validationPoints = step.validationPoints?.join(';') || '';
        csv += `${index + 1},`;
        csv += `"${step.action}",`;
        csv += `"${step.target}",`;
        csv += `${step.priority || 'medium'},`;
        csv += `${step.riskLevel || 'low'},`;
        csv += `"${step.expectedResult}",`;
        csv += `"${step.testData || ''}",`;
        csv += `"${validationPoints}"\n`;
      });
    }

    return csv;
  }

  /**
   * 生成 JSON 格式文档
   */
  toJSON (testPlan) {
    return JSON.stringify({
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0'
      },
      ...testPlan
    }, null, 2);
  }

  /**
   * 获取优先级文本
   */
  getPriorityText (priority) {
    const map = { high: '🔴 高', medium: '🟡 中', low: '🟢 低' };
    return map[priority] || map.medium;
  }

  /**
   * 获取风险等级文本
   */
  getRiskText (riskLevel) {
    const map = { high: '🔴 高', medium: '🟡 中', low: '🟢 低' };
    return map[riskLevel] || map.low;
  }

  /**
   * 保存到历史记录
   */
  saveToHistory (testPlan) {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      pageUrl: testPlan.pageUrl,
      pageTitle: testPlan.pageTitle,
      stepCount: testPlan.testSteps?.length || 0
    };

    this.history.unshift(entry);

    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }

    return entry;
  }

  /**
   * 获取历史记录
   */
  getHistory () {
    return [...this.history];
  }

  /**
   * 导出为文件
   */
  exportFile (testPlan, format = 'markdown') {
    let content, filename, mimeType;

    switch (format) {
      case 'markdown':
        content = this.toMarkdown(testPlan);
        filename = `测试计划_${testPlan.pageTitle}_${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
      case 'html':
        content = this.toHTML(testPlan);
        filename = `测试计划_${testPlan.pageTitle}_${Date.now()}.html`;
        mimeType = 'text/html';
        break;
      case 'csv':
        content = this.toCSV(testPlan);
        filename = `测试计划_${testPlan.pageTitle}_${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        content = this.toJSON(testPlan);
        filename = `测试计划_${testPlan.pageTitle}_${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      default:
        throw new Error(`不支持的格式: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    return filename;
  }
}

// 全局实例
const docGenerator = new EnhancedDocumentGenerator();
