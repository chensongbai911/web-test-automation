/**
 * Web自动化测试工具 - v1.4.6
 * 快速状态检查脚本
 *
 * 使用方法：
 * 1. 右键扩展图标 → "审查弹出内容"
 * 2. 在Console中粘贴此脚本并运行
 * 3. 查看输出的状态信息
 */

(function () {
  console.log('\n=== Web自动化测试工具 - 状态检查 ===\n');

  // 检查storage中的测试状态
  chrome.storage.local.get(['testingState', 'testData'], (result) => {
    console.log('📦 Storage状态：');

    if (result.testingState) {
      console.log('\n✅ testingState 存在：', result.testingState);

      if (result.testingState.inProgress) {
        console.log('   ⚡ 测试进行中');
        console.log('   📍 标签页ID:', result.testingState.tabId);
        console.log('   ⏰ 开始时间:', result.testingState.startTime);

        const startTime = new Date(result.testingState.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        console.log('   ⏱️  已运行:', `${minutes}分${seconds}秒`);

        if (elapsed > 300) {
          console.warn('   ⚠️  警告: 测试时间超过5分钟，可能已失效');
        }

        // 验证标签页是否存在
        chrome.tabs.get(result.testingState.tabId, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('   ❌ 标签页不存在:', chrome.runtime.lastError.message);
          } else {
            console.log('   ✅ 标签页存在:', tab.url);

            // 发送ping验证
            chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('   ❌ Content-script未响应:', chrome.runtime.lastError.message);
              } else if (response && response.testing) {
                console.log('   ✅ 测试确实在运行');
              } else {
                console.warn('   ⚠️  测试未在运行 (testActive=false)');
              }
            });
          }
        });
      } else {
        console.log('   ⭕ 无测试进行中');
      }
    } else {
      console.log('   ⭕ 无testingState数据');
    }

    if (result.testData) {
      console.log('\n📊 testData 存在：');
      console.log('   URL:', result.testData.url);
      console.log('   开始时间:', result.testData.startTime);
      console.log('   日志数量:', result.testData.logs?.length || 0);
      console.log('   按钮数量:', result.testData.buttons?.length || 0);
    }
  });

  // 检查当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('\n🌐 当前标签页：');
    if (tabs[0]) {
      console.log('   ID:', tabs[0].id);
      console.log('   URL:', tabs[0].url);
      console.log('   标题:', tabs[0].title);
    }
  });

  console.log('\n=================================\n');
})();
