/**
 * AI增强的测试报告分析器
 * 使用Qwen大模型分析测试结果并生成质量报告
 */

class TestReportAnalyzer {
  constructor(qwenApiKey) {
    this.qwen = qwenApiKey ? new QwenIntegration(qwenApiKey) : null;
  }

  /**
   * 生成AI增强的测试质量报告
   */
  async generateQualityReport (testReport) {
    if (!this.qwen) {
      console.log('[报告分析] Qwen未配置，跳过AI分析');
      return null;
    }

    try {
      console.log('[报告分析] 开始AI质量分析...');

      // 准备测试数据摘要
      const summary = this.prepareTestSummary(testReport);

      // 调用Qwen分析
      const prompt = `你是一个专业的Web自动化测试分析专家。请分析以下测试报告，生成详细的质量分析报告。

**测试基本信息：**
- 测试URL: ${testReport.url}
- 测试时间: ${new Date(testReport.timestamp).toLocaleString('zh-CN')}
- 测试时长: ${testReport.duration}秒
- 页面标题: ${testReport.pageInfo?.title || '未知'}

**测试统计：**
- 总测试元素: ${testReport.stats.testedCount}
- 成功: ${testReport.stats.successCount} (${testReport.stats.successRate}%)
- 失败: ${testReport.stats.failureCount}
- API错误: ${testReport.stats.apiErrorCount}

**元素类型分布：**
${Object.entries(testReport.elementTypes || {}).map(([type, count]) => `- ${type}: ${count}个`).join('\n')}

**API请求统计：**
- 总请求数: ${testReport.apiStats?.total || 0}
- 成功请求: ${testReport.apiStats?.success || 0}
- 客户端错误: ${testReport.apiStats?.clientError || 0}
- 服务器错误: ${testReport.apiStats?.serverError || 0}

**失败的测试元素（前5个）：**
${this.getFailedElements(testReport).slice(0, 5).map((el, i) =>
        `${i + 1}. [${el.type}] ${el.text.substring(0, 50)} - 错误: ${el.error}`
      ).join('\n')}

**异常API请求（前5个）：**
${this.getFailedAPI(testReport).slice(0, 5).map((req, i) =>
        `${i + 1}. ${req.method} ${req.url.substring(0, 80)} - ${req.status} ${req.error || ''}`
      ).join('\n')}

请以JSON格式返回详细的质量分析报告：
{
  "overallQuality": {
    "score": 85,
    "level": "良好/优秀/一般/较差",
    "summary": "整体质量评价（2-3句话）"
  },
  "strengths": [
    "优点1：具体描述",
    "优点2：具体描述"
  ],
  "weaknesses": [
    "问题1：具体描述及影响",
    "问题2：具体描述及影响"
  ],
  "recommendations": [
    {
      "priority": "高/中/低",
      "category": "功能/性能/稳定性/用户体验",
      "issue": "问题描述",
      "suggestion": "改进建议",
      "expectedBenefit": "预期收益"
    }
  ],
  "riskAssessment": {
    "criticalIssues": 2,
    "highRiskAreas": ["区域1", "区域2"],
    "stabilityScore": 85,
    "notes": "风险评估说明"
  },
  "performanceAnalysis": {
    "apiResponseTime": "分析API响应时间",
    "testDuration": "测试时长评估",
    "bottlenecks": ["瓶颈1", "瓶颈2"]
  },
  "nextSteps": [
    "下一步行动1",
    "下一步行动2"
  ]
}`;

      const result = await this.qwen.request([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.5,
        maxTokens: 3000
      });

      if (!result) {
        console.error('[报告分析] AI分析无响应');
        return null;
      }

      // 解析JSON结果
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          console.log('[报告分析] AI分析完成');
          return analysis;
        }
      } catch (e) {
        console.error('[报告分析] 解析AI结果失败:', e);
        return null;
      }

    } catch (error) {
      console.error('[报告分析] AI分析出错:', error);
      return null;
    }
  }

  /**
   * 准备测试数据摘要
   */
  prepareTestSummary (testReport) {
    return {
      totalElements: testReport.stats.testedCount,
      successRate: testReport.stats.successRate,
      failureRate: 100 - testReport.stats.successRate,
      apiErrorRate: (testReport.stats.apiErrorCount / testReport.stats.testedCount * 100).toFixed(1),
      testDuration: testReport.duration
    };
  }

  /**
   * 获取失败的测试元素
   */
  getFailedElements (testReport) {
    return (testReport.elements || []).filter(el => el.status === 'failed');
  }

  /**
   * 获取失败的API请求
   */
  getFailedAPI (testReport) {
    return (testReport.apiRequests || []).filter(req =>
      (req.status && req.status >= 400) || req.error
    );
  }

  /**
   * 生成改进建议
   */
  async generateImprovementSuggestions (testReport) {
    if (!this.qwen) return [];

    const failedElements = this.getFailedElements(testReport);
    if (failedElements.length === 0) return [];

    const prompt = `基于以下失败的测试元素，提供具体的改进建议：

${failedElements.slice(0, 10).map((el, i) =>
      `${i + 1}. [${el.type}] ${el.text} - 错误: ${el.error}`
    ).join('\n')}

请以JSON数组格式返回改进建议：
[
  {
    "element": "元素描述",
    "issue": "问题",
    "rootCause": "根本原因分析",
    "solution": "解决方案",
    "priority": "高/中/低"
  }
]`;

    try {
      const result = await this.qwen.request([
        { role: 'user', content: prompt }
      ], { temperature: 0.3, maxTokens: 2000 });

      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[改进建议] 生成失败:', e);
    }

    return [];
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.TestReportAnalyzer = TestReportAnalyzer;
}
