// 报告页面脚本 - 增强版
let testData = null;
let enhancedReport = null;

// 初始化报告
document.addEventListener('DOMContentLoaded', () => {
  console.log('[报告页面] 开始加载报告数据...');

  // 尝试读取所有可能的报告数据
  chrome.storage.local.get([
    'lastTestReport',
    'enhancedTestReports',
    'latestReport',
    'testReports',
    'aiPlan',
    'crossPageState',
    'aiInsights'
  ], (result) => {
    console.log('[报告页面] Storage数据:', result);

    // 优先使用增强报告
    if (result.latestReport) {
      console.log('[报告页面] 找到latestReport');
      enhancedReport = result.latestReport;
      testData = convertEnhancedToBasic(enhancedReport);
      renderEnhancedReport();
    } else if (result.enhancedTestReports && result.enhancedTestReports.length > 0) {
      console.log('[报告页面] 找到enhancedTestReports');
      enhancedReport = result.enhancedTestReports[0];
      testData = convertEnhancedToBasic(enhancedReport);
      renderEnhancedReport();
    } else if (result.lastTestReport) {
      console.log('[报告页面] 找到lastTestReport');
      testData = result.lastTestReport;
      renderReport();
    } else if (result.testReports && result.testReports.length > 0) {
      console.log('[报告页面] 找到testReports');
      testData = result.testReports[0];
      renderReport();
    } else {
      console.warn('[报告页面] 未找到任何报告数据');
      showNoDataMessage();
    }

    // 渲染AI计划摘要（如果有）
    try {
      if (result.aiPlan) {
        renderAIPlanSummary(result.aiPlan);
      }
    } catch (e) { console.log('[报告页面] AI计划渲染跳过:', e?.message || e); }

    // 渲染跨页面路径（如果有）
    try {
      if (result.crossPageState && result.crossPageState.pageStack && result.crossPageState.pageStack.length) {
        renderCrossPagePath(result.crossPageState);
      }
    } catch (e) { console.log('[报告页面] 路径渲染跳过:', e?.message || e); }

    // 渲染AI洞察（决策与异常）
    try {
      if (result.aiInsights) {
        renderAIInsights(result.aiInsights);
        // 决策时间线
        renderDecisionTimeline(result.aiInsights?.decisions || []);
      }
    } catch (e) { console.log('[报告页面] AI洞察渲染跳过:', e?.message || e); }

    // 覆盖率进度条（总覆盖与成功/失败占比）
    try {
      if (testData) {
        renderCoverageProgress(testData);
      }
    } catch (e) { console.log('[报告页面] 覆盖率渲染跳过:', e?.message || e); }
  });
});

// 显示无数据提示
function showNoDataMessage () {
  document.body.innerHTML = `
    <div style="padding: 60px 40px; text-align: center; max-width: 600px; margin: 0 auto;">
      <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
      <h2 style="color: #333; margin-bottom: 15px;">暂无测试报告</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
        请先运行一次测试，测试完成后报告将自动保存并显示在这里。
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: left;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">快速开始：</h3>
        <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
          <li>打开要测试的网页</li>
          <li>点击扩展图标</li>
          <li>点击"开始测试"按钮</li>
          <li>等待测试完成</li>
          <li>再次打开报告页面查看结果</li>
        </ol>
      </div>
      <button onclick="location.reload()" style="
        margin-top: 30px;
        padding: 12px 30px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
      ">🔄 刷新页面</button>
    </div>
  `;
}

// 转换增强报告为基本格式
function convertEnhancedToBasic (enhanced) {
  console.log('[报告页面] 转换增强报告:', enhanced);

  if (!enhanced || !enhanced.summary) {
    console.error('[报告页面] 增强报告格式错误');
    return null;
  }

  return {
    url: enhanced.summary.testUrl || window.location.href,
    timestamp: enhanced.reportTime || enhanced.summary.startTime,
    duration: Math.round(enhanced.summary.duration / 1000) || 0,
    totalElements: enhanced.summary.totalElements || 0,
    stats: {
      testedCount: enhanced.summary.testedElements || 0,
      successCount: enhanced.summary.passedElements || 0,
      failureCount: enhanced.summary.failedElements || 0,
      apiErrorCount: enhanced.summary.failedApis || 0,
      successRate: enhanced.summary.elementPassRate || 0
    },
    elementTypes: getElementTypesFromReport(enhanced),
    apiStats: {
      total: enhanced.summary.totalApis || 0,
      success: enhanced.summary.successApis || 0,
      clientError: 0,
      serverError: 0,
      failed: enhanced.summary.failedApis || 0
    },
    elements: enhanced.elements || [],
    apiRequests: enhanced.apis || [],
    pageInfo: {
      title: enhanced.summary.testTitle || document.title,
      domain: new URL(enhanced.summary.testUrl || window.location.href).hostname,
      path: new URL(enhanced.summary.testUrl || window.location.href).pathname
    },
    features: enhanced.features || [],
    mappings: enhanced.mappings || {}
  };
}

// 从报告中提取元素类型统计
function getElementTypesFromReport (report) {
  const types = {};
  if (report.elements && Array.isArray(report.elements)) {
    report.elements.forEach(el => {
      const type = el.elementType || el.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
  }
  return types;
}

// 渲染增强报告
function renderEnhancedReport () {
  console.log('[报告页面] 渲染增强报告...');

  if (!testData) {
    console.error('[报告页面] testData为空');
    showNoDataMessage();
    return;
  }

  try {
    // 渲染基本报告
    renderReport();

    // 如果有增强数据，添加额外内容
    if (enhancedReport && enhancedReport.features) {
      console.log('[报告页面] 添加功能点映射');
      renderFeatureMapping();
    }

    if (enhancedReport && enhancedReport.mappings) {
      console.log('[报告页面] 添加元素-API映射');
      renderElementApiMapping();
    }
  } catch (error) {
    console.error('[报告页面] 渲染错误:', error.message || String(error));
  }
}

// 渲染AI计划摘要
function renderAIPlanSummary (plan) {
  try {
    const container = document.querySelector('.content') || document.body;
    const section = document.createElement('section');
    section.className = 'section';
    section.innerHTML = `
      <h2>🤖 AI测试计划摘要</h2>
      <div style="background:#f0f9ff;border-left:4px solid #0066cc;padding:12px;border-radius:6px;">
        <div><strong>目标：</strong>${plan?.intentAnalysis?.userGoal || '—'}</div>
        <div><strong>范围：</strong>${plan?.intentAnalysis?.testScope || '—'}</div>
        <div><strong>重点区域：</strong>${(plan?.testStrategy?.testAreas || []).map(a => a.area).join('，') || '—'}</div>
        ${plan?.aiInsights?.recommendations?.length ? `<div><strong>建议：</strong>${plan.aiInsights.recommendations.slice(0, 3).join('；')}</div>` : ''}
      </div>
    `;
    container.appendChild(section);
  } catch (e) {
    console.error('[报告页面] 渲染AI计划摘要失败:', e);
  }
}

// 渲染跨页面路径
function renderCrossPagePath (state) {
  try {
    const container = document.querySelector('.content') || document.body;
    const section = document.createElement('section');
    section.className = 'section';
    const nodesHtml = state.pageStack.map((p, i) => `
      <div style="padding:6px;margin:4px 0;border:1px solid #eee;border-radius:4px;">
        <strong>${i + 1}.</strong> ${p.url}
        ${p.trigger ? `<span style="color:#777;">（${p.trigger}）</span>` : ''}
      </div>`).join('');
    section.innerHTML = `
      <h2>🗺️ 跨页面测试路径</h2>
      <div style="background:#fafafa;padding:8px;border-radius:6px;">${nodesHtml || '—'}</div>
    `;
    container.appendChild(section);
  } catch (e) {
    console.error('[报告页面] 渲染跨页面路径失败:', e);
  }
}

// 渲染AI洞察（决策与异常）
function renderAIInsights (insights) {
  try {
    const container = document.querySelector('.content') || document.body;
    const section = document.createElement('section');
    section.className = 'section';
    const decisions = insights.decisions || [];
    const anomalies = insights.anomalies || [];
    const decisionsHtml = decisions.slice(-5).map(d => `
      <div style="padding:6px;margin:4px 0;border:1px solid #eee;border-radius:4px;">
        <strong>决策：</strong>${String(d.decision || '—').toUpperCase()} <span style="color:#777;">@${new Date(d.ts).toLocaleTimeString()}</span>
        ${d.reason ? `<div style="color:#555;">理由：${d.reason}</div>` : ''}
      </div>`).join('');
    const anomaliesHtml = anomalies.slice(-5).map(a => `
      <div style="padding:6px;margin:4px 0;border:1px solid #f5c2c7;background:#f8d7da;border-radius:4px;">
        <strong>异常：</strong>${a.error || '—'} <span style="color:#777;">@${new Date(a.ts).toLocaleTimeString()}</span>
        ${a.target ? `<div style="color:#555;">目标：${a.target}</div>` : ''}
        ${a.diagnosis?.rootCause ? `<div style="color:#555;">根因：${a.diagnosis.rootCause}</div>` : ''}
      </div>`).join('');
    section.innerHTML = `
      <h2>🧠 AI洞察</h2>
      <div style="margin-bottom:10px;">决策记录（${decisions.length}）</div>
      <div style="background:#fafafa;padding:8px;border-radius:6px;">${decisionsHtml || '—'}</div>
      <div style="margin-top:12px;margin-bottom:10px;">异常记录（${anomalies.length}）</div>
      <div style="background:#fff;padding:8px;border-radius:6px;">${anomaliesHtml || '—'}</div>
    `;
    container.appendChild(section);
  } catch (e) {
    console.error('[报告页面] 渲染AI洞察失败:', e);
  }
}

// 渲染功能点映射
function renderFeatureMapping () {
  if (!enhancedReport.features || enhancedReport.features.length === 0) {
    console.log('[报告页面] 没有功能点数据');
    return;
  }

  const section = document.createElement('section');
  section.className = 'section feature-mapping';
  section.innerHTML = `
    <h2>📋 功能点详情</h2>
    <div id="featureList"></div>
  `;

  // 插入到第一个section之后
  const firstSection = document.querySelector('.section');
  if (firstSection && firstSection.nextSibling) {
    firstSection.parentNode.insertBefore(section, firstSection.nextSibling);
  } else {
    document.querySelector('.content').appendChild(section);
  }

  const featureList = document.getElementById('featureList');

  enhancedReport.features.forEach((feature, index) => {
    const featureCard = document.createElement('div');
    featureCard.className = 'feature-card';
    featureCard.style.cssText = `
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;

    const statusIcon = feature.status === 'passed' ? '✅' : '❌';
    const statusColor = feature.status === 'passed' ? '#4CAF50' : '#f44336';

    featureCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #333; font-size: 18px;">
          ${index + 1}. ${escapeHtml(feature.featureName || '未命名功能')}
        </h3>
        <span style="
          background: ${statusColor};
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
        ">${statusIcon} ${feature.status}</span>
      </div>

      <div style="color: #666; margin-bottom: 10px;">
        <strong>类型:</strong> ${feature.featureType || 'unknown'}
        ${feature.duration ? `<span style="margin-left: 20px;"><strong>耗时:</strong> ${feature.duration}ms</span>` : ''}
      </div>

      ${feature.relatedElements && feature.relatedElements.length > 0 ? `
        <div style="margin-top: 15px;">
          <strong style="color: #333;">关联元素 (${feature.relatedElements.length}):</strong>
          <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
            ${feature.relatedElements.map(el => `
              <li>
                ${el.status === 'passed' ? '✅' : '❌'}
                ${escapeHtml(el.elementText || el.elementType || '未知元素')}
                <span style="color: #999; font-size: 12px;">(${el.elementType})</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${feature.relatedApis && feature.relatedApis.length > 0 ? `
        <div style="margin-top: 15px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
          <strong style="color: #333;">触发的 API (${feature.relatedApis.length}):</strong>
          <ul style="margin: 10px 0; padding-left: 20px; color: #666; list-style: none;">
            ${feature.relatedApis.map(api => `
              <li style="margin: 5px 0;">
                <span style="
                  display: inline-block;
                  background: ${api.success ? '#4CAF50' : '#f44336'};
                  color: white;
                  padding: 2px 8px;
                  border-radius: 3px;
                  font-size: 11px;
                  margin-right: 8px;
                ">${api.status || 'ERR'}</span>
                <strong>${api.method}</strong>
                <code style="color: #333; font-size: 12px;">${escapeHtml(api.url)}</code>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${feature.steps && feature.steps.length > 0 ? `
        <details style="margin-top: 15px;">
          <summary style="cursor: pointer; color: #667eea; font-weight: bold;">
            查看测试步骤 (${feature.steps.length})
          </summary>
          <ol style="margin: 10px 0; padding-left: 20px; color: #666; font-size: 14px;">
            ${feature.steps.map(step => `
              <li style="margin: 5px 0;">
                ${step.success ? '✓' : '✗'}
                <strong>${step.action}</strong> → ${escapeHtml(step.target)}
                ${step.value ? `<span style="color: #999;"> = "${escapeHtml(String(step.value))}"</span>` : ''}
              </li>
            `).join('')}
          </ol>
        </details>
      ` : ''}

      ${feature.error ? `
        <div style="
          margin-top: 15px;
          padding: 10px;
          background: #fff3cd;
          border-left: 3px solid #ff9800;
          color: #856404;
          border-radius: 4px;
        ">
          <strong>错误:</strong> ${escapeHtml(feature.error)}
        </div>
      ` : ''}
    `;

    featureList.appendChild(featureCard);
  });
}

// 渲染元素-API映射
function renderElementApiMapping () {
  if (!enhancedReport.mappings || !enhancedReport.mappings.elementToApis) {
    console.log('[报告页面] 没有映射数据');
    return;
  }

  const mappings = enhancedReport.mappings.elementToApis;
  if (mappings.length === 0) return;

  const section = document.createElement('section');
  section.className = 'section';
  section.innerHTML = `
    <h2>🔗 元素 → API 映射关系</h2>
    <div class="mapping-table-container">
      <table class="mapping-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">元素</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">类型</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">触发的 API</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; width: 80px;">状态</th>
          </tr>
        </thead>
        <tbody id="mappingTableBody"></tbody>
      </table>
    </div>
  `;

  document.querySelector('.content').appendChild(section);

  const tbody = document.getElementById('mappingTableBody');

  mappings.forEach(mapping => {
    mapping.apis.forEach((api, idx) => {
      const row = tbody.insertRow();
      row.style.borderBottom = '1px solid #eee';

      // 只在第一行显示元素信息
      if (idx === 0) {
        const cellElement = row.insertCell();
        cellElement.rowSpan = mapping.apis.length;
        cellElement.style.cssText = 'padding: 12px; border: 1px solid #ddd; vertical-align: top; font-weight: bold;';
        cellElement.textContent = mapping.elementText || '未知元素';

        const cellType = row.insertCell();
        cellType.rowSpan = mapping.apis.length;
        cellType.style.cssText = 'padding: 12px; border: 1px solid #ddd; vertical-align: top;';
        cellType.innerHTML = `<span class="type-badge">${mapping.elementId ? mapping.elementId.split('_')[0] : 'element'}</span>`;
      }

      const cellApi = row.insertCell();
      cellApi.style.cssText = 'padding: 12px; border: 1px solid #ddd; font-family: monospace; font-size: 12px;';
      cellApi.innerHTML = `<strong>${api.method}</strong> ${escapeHtml(api.url)}`;

      const cellStatus = row.insertCell();
      cellStatus.style.cssText = 'padding: 12px; border: 1px solid #ddd; text-align: center;';
      const statusClass = api.status >= 400 ? 'error' : 'success';
      cellStatus.innerHTML = `<span class="${statusClass}" style="
        display: inline-block;
        padding: 4px 12px;
        border-radius: 4px;
        background: ${api.status >= 400 ? '#f44336' : '#4CAF50'};
        color: white;
        font-size: 12px;
      ">${api.status || 'ERR'}</span>`;
    });
  });
}

// 渲染报告（基础版本）
function renderReport () {
  if (!testData) return;

  const { stats, apiRequests, elements, timestamp, duration, apiStats, elementTypes, pageInfo } = testData;

  // 更新基本信息
  document.getElementById('testUrl').textContent = testData.url || '-';
  document.getElementById('testTime').textContent = new Date(timestamp).toLocaleString('zh-CN');
  document.getElementById('footerTime').textContent = new Date(timestamp).toLocaleString('zh-CN');

  // 显示测试时长
  if (duration) {
    const durationEl = document.createElement('p');
    durationEl.innerHTML = `测试时长: <span>${duration}秒</span>`;
    document.querySelector('.report-info').appendChild(durationEl);
  }

  // 显示页面信息
  if (pageInfo) {
    const pageInfoEl = document.createElement('p');
    pageInfoEl.innerHTML = `页面标题: <span>${pageInfo.title}</span>`;
    document.querySelector('.report-info').appendChild(pageInfoEl);
  }

  // 更新统计数据
  document.getElementById('totalElements').textContent = stats.testedCount || 0;
  document.getElementById('successCount').textContent = stats.successCount || 0;
  document.getElementById('failureCount').textContent = stats.failureCount || 0;
  document.getElementById('apiErrorCount').textContent = stats.apiErrorCount || 0;

  // 显示成功率
  if (stats.successRate) {
    const successRateEl = document.createElement('div');
    successRateEl.className = 'stat-card rate';
    successRateEl.innerHTML = `
      <div class="stat-icon">🎯</div>
      <div class="stat-value">${stats.successRate}%</div>
      <div class="stat-label">成功率</div>
    `;
    document.querySelector('.stats-grid').appendChild(successRateEl);
  }

  // 渲染饼图 - 传递 elements 数组或 stats 对象
  renderPieChart(elements || []);

  // 渲染柱状图
  renderBarChart(elementTypes || elements);

  // 渲染API统计
  renderAPIStats(apiStats || apiRequests);

  // 渲染元素表
  renderElementsTable(elements);

  // 渲染API请求表
  renderRequestsTable(apiRequests);
}

// HTML转义函数
function escapeHtml (text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// 渲染饼图
function renderPieChart (elements) {
  const ctx = document.getElementById('pieChart');
  if (!ctx) {
    console.warn('[报告] 未找到饼图容器');
    return;
  }

  // 统计成功和失败
  let success = 0;
  let failed = 0;

  if (Array.isArray(elements)) {
    elements.forEach(el => {
      // 兼容多种字段名：success, status, result, passed
      const elSuccess = el.success || el.status === 'success' || el.passed || el.result === true;
      if (elSuccess) {
        success++;
      } else {
        failed++;
      }
    });
  }

  // 使用备用数据源
  if (success === 0 && failed === 0 && testData && testData.stats) {
    success = testData.stats.successCount || 0;
    failed = testData.stats.failureCount || 0;
  }

  // 如果仍然没有数据，显示提示
  if (success === 0 && failed === 0) {
    console.warn('[报告] 没有测试结果数据');
    ctx.parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无测试结果数据</p>';
    return;
  }

  const total = success + failed;

  try {
    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['成功', '失败'],
        datasets: [{
          data: [success, failed],
          backgroundColor: ['#4CAF50', '#f44336'],
          borderColor: ['#45a049', '#da190b'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('[报告] 饼图渲染失败:', error.message || String(error));
  }
}

// 渲染柱状图
function renderBarChart (elements) {
  const ctx = document.getElementById('barChart');
  if (!ctx) {
    console.warn('[报告] 未找到柱状图容器');
    return;
  }

  // 处理数据格式，支持多种字段名
  const types = {};

  if (Array.isArray(elements)) {
    elements.forEach(el => {
      // 兼容多种字段名：type, elementType
      const elType = el.type || el.elementType || 'unknown';
      types[elType] = (types[elType] || 0) + 1;
    });
  } else if (typeof elements === 'object') {
    // 如果是对象类型（键为类型，值为数量）
    Object.assign(types, elements);
  }

  // 检查是否有数据
  const labels = Object.keys(types);
  const data = Object.values(types);

  if (labels.length === 0) {
    console.warn('[报告] 没有元素类型数据');
    ctx.parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无元素类型数据</p>';
    return;
  }

  const colors = ['#667eea', '#764ba2', '#f44336', '#4CAF50', '#ff9800', '#2196F3', '#009688'];

  try {
    new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '元素数量',
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('[报告] 柱状图渲染失败:', error.message || String(error));
  }
}

// 渲染API统计
function renderAPIStats (apiRequests) {
  let total2xx = 0, total3xx = 0, total4xx = 0, total5xx = 0;

  apiRequests.forEach(req => {
    if (req.status) {
      if (req.status >= 200 && req.status < 300) total2xx++;
      else if (req.status >= 300 && req.status < 400) total3xx++;
      else if (req.status >= 400 && req.status < 500) total4xx++;
      else if (req.status >= 500 && req.status < 600) total5xx++;
    }
  });

  document.getElementById('apiTotal').textContent = apiRequests.length;
  document.getElementById('api2xx').textContent = total2xx;
  document.getElementById('api3xx').textContent = total3xx;
  document.getElementById('api4xx').textContent = total4xx;
  document.getElementById('api5xx').textContent = total5xx;
}

// 覆盖率进度条渲染
function renderCoverageProgress (data) {
  try {
    const container = document.querySelector('.content') || document.body;
    const section = document.createElement('section');
    section.className = 'section';

    const total = Number(data.totalElements || (Array.isArray(data.elements) ? data.elements.length : 0) || 0);
    const tested = Number((data.stats && data.stats.testedCount) || (Array.isArray(data.elements) ? data.elements.length : 0) || 0);
    const success = Number((data.stats && data.stats.successCount) || 0);
    const failure = Number((data.stats && data.stats.failureCount) || Math.max(0, tested - success) || 0);

    const coverage = total > 0 ? Math.min(100, Math.round((tested / total) * 100)) : 0;
    const successPct = tested > 0 ? Math.round((success / tested) * 100) : 0;
    const failurePct = tested > 0 ? Math.max(0, 100 - successPct) : 0;

    section.innerHTML = `
      <h2>📈 覆盖率进度</h2>
      <div style="margin-bottom: 10px; color: #555;">总元素：<strong>${total}</strong>，已测试：<strong>${tested}</strong>（覆盖率：<strong>${coverage}%</strong>）</div>
      <div style="height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden; display: flex;">
        <div title="成功 ${success}" style="width: ${successPct}%; background: #4CAF50;"></div>
        <div title="失败 ${failure}" style="width: ${failurePct}%; background: #f44336;"></div>
      </div>
      <div style="margin-top: 6px; color: #777; font-size: 12px;">成功：${success}（${successPct}%） | 失败：${failure}（${failurePct}%）</div>
    `;
    container.appendChild(section);
  } catch (e) {
    console.error('[报告页面] 渲染覆盖率进度失败:', e);
  }
}

// AI决策时间线渲染
function renderDecisionTimeline (decisions) {
  try {
    if (!Array.isArray(decisions) || decisions.length === 0) return;
    const container = document.querySelector('.content') || document.body;
    const section = document.createElement('section');
    section.className = 'section';

    const items = decisions.map((d, i) => {
      const time = d.ts ? new Date(d.ts).toLocaleTimeString() : `#${i + 1}`;
      const label = (d.decision || '—').toString().toUpperCase();
      const reason = d.reason ? escapeHtml(String(d.reason)) : '';
      return `
        <div style="min-width: 180px; padding: 8px 10px; margin-right: 10px; border: 1px solid #eee; border-radius: 6px; background: #fff;">
          <div style="font-size: 12px; color: #777;">${time}</div>
          <div style="font-weight: bold; color: #333;">${label}</div>
          ${reason ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${reason}</div>` : ''}
        </div>
      `;
    }).join('');

    section.innerHTML = `
      <h2>🕒 AI决策时间线</h2>
      <div style="display: flex; overflow-x: auto; padding-bottom: 6px;">${items}</div>
    `;
    container.appendChild(section);
  } catch (e) {
    console.error('[报告页面] 渲染AI决策时间线失败:', e);
  }
}

// 渲染元素表
function renderElementsTable (elements) {
  const tbody = document.getElementById('elementsTableBody');
  if (!tbody) {
    console.warn('[报告] 未找到elementsTableBody元素');
    return;
  }

  tbody.innerHTML = '';

  if (!Array.isArray(elements) || elements.length === 0) {
    const row = tbody.insertRow();
    row.innerHTML = '<td colspan="5" style="text-align: center; color: #999;">暂无测试元素</td>';
    return;
  }

  elements.forEach((el, index) => {
    try {
      // 兼容多种字段名
      const elType = el.type || el.elementType || 'unknown';
      const elText = el.text || el.elementText || el.innerText || '';
      const elSelector = el.selector || el.elementSelector || el.xpath || '';
      // 兼容不同的状态字段名：status, success, actionSuccess, passed
      const elStatus = el.status || (el.success ? 'success' : el.actionSuccess ? 'success' : 'unknown');
      const statusClass = (elStatus === 'success' || el.success || el.actionSuccess) ? 'success' : 'error';
      const statusIcon = (elStatus === 'success' || el.success || el.actionSuccess) ? '✓' : '✗';

      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><span class="type-badge">${escapeHtml(elType)}</span></td>
        <td>${escapeHtml(elText)}</td>
        <td><code>${escapeHtml(elSelector)}</code></td>
        <td><span class="${statusClass}" style="color: ${statusClass === 'success' ? '#4CAF50' : '#f44336'};">${statusIcon} ${elStatus}</span></td>
      `;
    } catch (error) {
      console.error(`[报告] 渲染第${index}行失败:`, error.message || String(error));
    }
  });
}

// 渲染请求表
function renderRequestsTable (apiRequests) {
  const tbody = document.getElementById('requestTableBody');
  if (!tbody) {
    console.warn('[报告] 未找到requestTableBody元素');
    return;
  }

  tbody.innerHTML = '';

  if (!Array.isArray(apiRequests) || apiRequests.length === 0) {
    const row = tbody.insertRow();
    row.innerHTML = '<td colspan="5" style="text-align: center; color: #999;">暂无API请求记录</td>';
    return;
  }

  apiRequests.slice(0, 100).forEach(req => {
    try {
      const row = tbody.insertRow();
      const statusClass = (req.status >= 400) ? 'error' : 'success';
      const statusText = req.status ? `<span class="${statusClass}">${req.status}</span>` : 'Error';

      const timestamp = req.timestamp ? new Date(req.timestamp).toLocaleTimeString() : '-';
      const reqType = req.type || req.requestType || '-';
      const reqMethod = req.method || '-';
      const reqUrl = req.url || req.href || '-';

      row.innerHTML = `
        <td>${timestamp}</td>
        <td>${escapeHtml(reqType)}</td>
        <td><strong>${reqMethod}</strong></td>
        <td>${escapeHtml(reqUrl)}</td>
        <td>${statusText}</td>
      `;
    } catch (error) {
      console.error('[报告] API请求行渲染失败:', error.message || String(error));
    }
  });

  if (apiRequests.length > 100) {
    const row = tbody.insertRow();
    row.innerHTML = `<td colspan="5" style="text-align: center; color: #999;">还有 ${apiRequests.length - 100} 个请求，仅显示前100个</td>`;
  }
}

// 导出为JSON
function exportToJSON () {
  const dataStr = JSON.stringify(testData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  downloadFile(dataBlob, `test-report-${Date.now()}.json`);
}

// 导出为CSV
function exportToCSV () {
  let csv = 'Web功能自动化测试报告\n\n';
  csv += `测试地址,${testData.url}\n`;
  csv += `测试时间,${new Date(testData.timestamp).toLocaleString()}\n\n`;

  csv += '统计信息\n';
  csv += `测试元素总数,${testData.totalElements}\n`;
  csv += `成功,${testData.stats.successCount}\n`;
  csv += `失败,${testData.stats.failureCount}\n`;
  csv += `API错误,${testData.stats.apiErrorCount}\n\n`;

  csv += '测试元素\n';
  csv += '序号,类型,文本,选择器\n';
  testData.elements.forEach((el, idx) => {
    csv += `${idx + 1},"${el.type}","${el.text}","${el.selector}"\n`;
  });

  const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(dataBlob, `test-report-${Date.now()}.csv`);
}

// 打印报告
function printReport () {
  window.print();
}

// 下载文件
function downloadFile (blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// HTML转义
function escapeHtml (text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
