/**
 * 报告页面调试工具
 * 这个脚本帮助诊断报告页面为什么显示空白
 */

console.log('%c[报告调试] 开始诊断报告数据...', 'color: blue; font-size: 14px; font-weight: bold;');

// 1. 检查 Storage 中的数据
function debugStorageData () {
  chrome.storage.local.get(null, (result) => {
    console.log('%c[报告调试] Chrome Storage 完整数据:', 'color: green; font-weight: bold;');

    // 检查所有与测试相关的键
    const testKeys = Object.keys(result).filter(key =>
      key.includes('test') ||
      key.includes('report') ||
      key.includes('Report') ||
      key.includes('Test') ||
      key.includes('data')
    );

    console.log(`找到 ${testKeys.length} 个相关键:`, testKeys);

    testKeys.forEach(key => {
      const value = result[key];
      console.group(`%c${key}`, 'color: purple; font-weight: bold;');

      if (Array.isArray(value)) {
        console.log(`数组，长度: ${value.length}`);
        if (value.length > 0) {
          console.log('第一个元素:', value[0]);
        }
      } else if (typeof value === 'object' && value !== null) {
        console.log('对象结构:');
        console.log('  - 顶级键:', Object.keys(value));
        console.log('  - 值:', value);
      } else {
        console.log('值:', value);
      }

      console.groupEnd();
    });
  });
}

// 2. 检查页面 DOM 元素
function debugDOMElements () {
  console.group('%c[报告调试] DOM 元素检查', 'color: orange; font-weight: bold;');

  const elements = {
    '饼图容器': document.getElementById('pieChart'),
    '柱状图容器': document.getElementById('barChart'),
    '元素表体': document.getElementById('elementsTableBody'),
    '请求表体': document.getElementById('requestTableBody'),
    '统计卡片': document.querySelectorAll('.stat-card'),
    '图表容器': document.querySelectorAll('.chart-container'),
  };

  Object.entries(elements).forEach(([name, el]) => {
    if (el instanceof HTMLCollection || el instanceof NodeList) {
      console.log(`${name}: 找到 ${el.length} 个元素`);
    } else {
      console.log(`${name}: ${el ? '✅ 存在' : '❌ 不存在'}`);
      if (el && el.offsetHeight !== undefined) {
        console.log(`  - 尺寸: ${el.offsetWidth}x${el.offsetHeight}`);
      }
    }
  });

  console.groupEnd();
}

// 3. 检查 Chart.js 是否加载
function debugChartJS () {
  console.group('%c[报告调试] Chart.js 检查', 'color: cyan; font-weight: bold;');

  if (typeof Chart !== 'undefined') {
    console.log('✅ Chart.js 已加载');
    console.log('  - 版本:', Chart.version || '未知');
  } else {
    console.log('❌ Chart.js 未加载！');
  }

  console.groupEnd();
}

// 4. 模拟测试数据
function createMockTestData () {
  console.group('%c[报告调试] 创建模拟测试数据', 'color: yellow; font-weight: bold;');

  const mockData = {
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    duration: 135,
    totalElements: 39,
    stats: {
      testedCount: 39,
      successCount: 5,
      failureCount: 34,
      apiErrorCount: 0,
      successRate: 12.8
    },
    elementTypes: {
      input: 12,
      button: 8,
      link: 10,
      text: 9
    },
    apiStats: {
      total: 15,
      success: 12,
      clientError: 2,
      serverError: 0,
      failed: 1
    },
    elements: [
      { type: 'input', text: '用户名', selector: '#username', success: false },
      { type: 'input', text: '密码', selector: '#password', success: false },
      { type: 'button', text: '登录', selector: '.login-btn', success: true },
      { type: 'link', text: '首页', selector: 'a.home', success: true },
      { type: 'text', text: '欢迎', selector: '.welcome', success: false }
    ],
    apiRequests: [
      { timestamp: Date.now(), type: 'xhr', method: 'POST', url: '/api/login', status: 200 },
      { timestamp: Date.now(), type: 'fetch', method: 'GET', url: '/api/user', status: 404 },
      { timestamp: Date.now(), type: 'xhr', method: 'GET', url: '/api/config', status: 200 }
    ],
    pageInfo: {
      title: '测试页面',
      domain: 'example.com',
      path: '/'
    }
  };

  // 保存到 storage
  chrome.storage.local.set({ lastTestReport: mockData }, () => {
    console.log('✅ 模拟数据已保存到 lastTestReport');
    console.log('模拟数据:', mockData);
    console.log('刷新页面以查看效果');
  });

  console.groupEnd();
}

// 5. 检查内存中的数据
function debugMemoryData () {
  console.group('%c[报告调试] 内存数据检查', 'color: red; font-weight: bold;');

  if (typeof testData !== 'undefined') {
    console.log('✅ testData 存在:', testData);
  } else {
    console.log('❌ testData 未定义');
  }

  if (typeof enhancedReport !== 'undefined') {
    console.log('✅ enhancedReport 存在:', enhancedReport);
  } else {
    console.log('❌ enhancedReport 未定义');
  }

  console.groupEnd();
}

// 导出所有调试函数
window.reportDebug = {
  storageData: debugStorageData,
  domElements: debugDOMElements,
  chartJS: debugChartJS,
  createMockData: createMockTestData,
  memoryData: debugMemoryData,
  runAll: function () {
    debugStorageData();
    debugDOMElements();
    debugChartJS();
    debugMemoryData();
  }
};

console.log('%c[报告调试] 工具已加载，使用 window.reportDebug.runAll() 运行所有诊断', 'color: blue; font-size: 12px;');
console.log('%c可用命令:', 'color: blue;');
console.log('  reportDebug.storageData()  - 检查 Storage 数据');
console.log('  reportDebug.domElements()  - 检查 DOM 元素');
console.log('  reportDebug.chartJS()      - 检查 Chart.js');
console.log('  reportDebug.memoryData()   - 检查内存中的数据');
console.log('  reportDebug.createMockData() - 创建模拟测试数据');
console.log('  reportDebug.runAll()       - 运行所有诊断');
