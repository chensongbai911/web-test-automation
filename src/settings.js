/**
 * Web测试工具 - 设置页面脚本
 */

// DOM 元素
const qwenApiKeyInput = document.getElementById('qwenApiKey');
const showKeyBtn = document.getElementById('showKeyBtn');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const closeBtn = document.getElementById('closeBtn');
const qwenStatus = document.getElementById('qwenStatus');
const apiCallCount = document.getElementById('apiCallCount');
const apiCost = document.getElementById('apiCost');

// 页面加载时恢复设置
window.addEventListener('DOMContentLoaded', async () => {
  // 恢复API密钥（仅显示前缀）
  chrome.storage.local.get(['qwenApiKey', 'qwenStats'], (result) => {
    if (result.qwenApiKey) {
      const key = result.qwenApiKey;
      qwenApiKeyInput.value = key.substring(0, 7) + '***' + key.substring(key.length - 4);
      showStatus('✓ 已配置 Qwen API', 'success');
    } else {
      showStatus('⚠ 未配置 Qwen API，某些功能将不可用', 'info');
    }

    // 显示统计信息
    if (result.qwenStats) {
      apiCallCount.textContent = result.qwenStats.callCount || 0;
      apiCost.textContent = '¥' + ((result.qwenStats.tokenCount || 0) * 0.001 / 1000).toFixed(2);
    }
  });
});

// 显示/隐藏API密钥
showKeyBtn.addEventListener('click', () => {
  if (qwenApiKeyInput.type === 'password') {
    qwenApiKeyInput.type = 'text';
    showKeyBtn.textContent = '隐藏';
  } else {
    qwenApiKeyInput.type = 'password';
    showKeyBtn.textContent = '显示';
  }
});

// 测试连接
testBtn.addEventListener('click', async () => {
  const apiKey = qwenApiKeyInput.value.trim();

  if (!apiKey || apiKey.includes('***')) {
    showStatus('⚠ 请先输入API密钥', 'info');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = '测试中...';

  try {
    // 创建临时的Qwen实例
    const qwen = new QwenIntegration(apiKey);

    // 测试简单的请求
    const result = await qwen.request([
      {
        role: 'user',
        content: '回复"测试成功"'
      }
    ], {
      maxTokens: 100
    });

    if (result && result.includes('成功')) {
      showStatus('✓ 连接成功！API密钥有效', 'success');
    } else {
      showStatus('⚠ 连接失败，请检查API密钥', 'error');
    }
  } catch (error) {
    showStatus(`❌ 连接错误: ${error.message}`, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '🧪 测试连接';
  }
});

// 保存设置
saveBtn.addEventListener('click', async () => {
  let apiKey = qwenApiKeyInput.value.trim();

  // 如果输入的是掩码形式，说明用户没有修改，不保存
  if (apiKey.includes('***')) {
    showStatus('⚠ 请输入完整的API密钥或不进行修改', 'info');
    return;
  }

  if (!apiKey) {
    showStatus('⚠ API密钥不能为空', 'info');
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    showStatus('⚠ API密钥格式不正确（应以sk-开头）', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = '保存中...';

  try {
    // 验证API密钥
    const qwen = new QwenIntegration(apiKey);
    const result = await qwen.request([
      {
        role: 'user',
        content: '你好'
      }
    ], {
      maxTokens: 100
    });

    if (result) {
      // 保存到storage
      chrome.storage.local.set({ qwenApiKey: apiKey }, () => {
        showStatus('✓ 设置已保存！', 'success');

        // 通知popup更新
        chrome.runtime.sendMessage({
          action: 'qwenConfigUpdated',
          apiKey: apiKey
        }).catch(() => { });

        // 3秒后关闭
        setTimeout(() => {
          window.close();
        }, 2000);
      });
    } else {
      showStatus('❌ API验证失败，请检查密钥', 'error');
    }
  } catch (error) {
    showStatus(`❌ 保存失败: ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 保存设置';
  }
});

// 关闭
closeBtn.addEventListener('click', () => {
  window.close();
});

/**
 * 显示状态信息
 */
function showStatus (message, type) {
  qwenStatus.textContent = message;
  qwenStatus.className = `status ${type}`;

  // 10秒后自动隐藏
  if (type !== 'error' && type !== 'success') {
    setTimeout(() => {
      qwenStatus.className = 'status';
    }, 10000);
  }
}
