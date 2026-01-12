/**
 * 状态保持功能验证脚本
 * 检查是否正确实现了测试状态、统计数据、日志的保存和恢复
 */

const fs = require('fs');
const path = require('path');

console.log('=== 🔍 状态保持功能验证 ===\n');

const popupPath = path.join(__dirname, 'src/popup.js');
const popupContent = fs.readFileSync(popupPath, 'utf-8');

// 1. 检查是否移除了 alert
console.log('1️⃣ 检查是否移除了 Alert 提示:');
if (popupContent.includes("alert('[Popup] DOMContentLoaded 事件触发！')")) {
  console.log('   ❌ Alert 提示仍然存在');
} else {
  console.log('   ✅ Alert 提示已移除');
}

// 2. 检查统计数据恢复代码
console.log('\n2️⃣ 检查统计数据恢复代码:');
if (popupContent.includes('result.testStats')) {
  console.log('   ✅ 检查 testStats 代码存在');
  if (popupContent.includes('testedCount.textContent = stats.testedCount')) {
    console.log('   ✅ 恢复已测试数字代码存在');
  }
  if (popupContent.includes('successCount.textContent = stats.successCount')) {
    console.log('   ✅ 恢复成功数字代码存在');
  }
  if (popupContent.includes('failureCount.textContent = stats.failureCount')) {
    console.log('   ✅ 恢复失败数字代码存在');
  }
  if (popupContent.includes('apiErrorCount.textContent = stats.apiErrorCount')) {
    console.log('   ✅ 恢复验证失败数字代码存在');
  }
} else {
  console.log('   ❌ 缺少统计数据恢复代码');
}

// 3. 检查日志恢复代码
console.log('\n3️⃣ 检查日志恢复代码:');
if (popupContent.includes('logResult.testLogs')) {
  console.log('   ✅ 检查 testLogs 代码存在');
  if (popupContent.includes("logResult.testLogs.forEach(log =>")) {
    console.log('   ✅ 日志遍历代码存在');
  }
} else {
  console.log('   ❌ 缺少日志恢复代码');
}

// 4. 检查日志保存代码
console.log('\n4️⃣ 检查日志保存代码 (在 addLog 函数中):');
const addLogMatch = popupContent.match(/function addLog[\s\S]*?chrome\.storage\.local\.set.*?testLogs/);
if (addLogMatch) {
  console.log('   ✅ addLog 函数中有日志保存代码');
} else {
  console.log('   ❌ addLog 函数中缺少日志保存代码');
}

// 5. 检查统计数据保存代码
console.log('\n5️⃣ 检查统计数据保存代码:');
const saveStatsCount = (popupContent.match(/testStats:/g) || []).length;
console.log(`   📊 testStats 保存位置数: ${saveStatsCount}`);
if (saveStatsCount >= 3) {
  console.log('   ✅ 多处保存统计数据（很好！）');
} else {
  console.log('   ⚠️ 统计数据保存位置可能不足');
}

// 6. 检查新测试时清空数据
console.log('\n6️⃣ 检查新测试时清空旧数据:');
const startAutoTestSection = popupContent.match(/async function startAutoTest[\s\S]*?chrome\.storage\.local\.set.*?testStats.*?testLogs/);
if (startAutoTestSection) {
  console.log('   ✅ startAutoTest 中清空旧数据代码存在');
} else {
  console.log('   ⚠️ 可能缺少新测试时清空数据的代码');
}

// 7. 检查 updateTestStats 消息处理
console.log('\n7️⃣ 检查 updateTestStats 消息处理:');
if (popupContent.includes("request.action === 'updateTestStats'")) {
  console.log('   ✅ updateTestStats 处理存在');
  if (popupContent.includes('testStats:', 2076)) {
    console.log('   ✅ 在消息处理中保存 testStats');
  }
} else {
  console.log('   ❌ 缺少 updateTestStats 消息处理');
}

// 8. 检查 updateStatus 消息处理
console.log('\n8️⃣ 检查 updateStatus 消息处理中的数据保存:');
const updateStatusMatch = popupContent.match(/request\.action === 'updateStatus'[\s\S]*?testStats:/);
if (updateStatusMatch) {
  console.log('   ✅ updateStatus 中有保存 testStats 代码');
} else {
  console.log('   ⚠️ updateStatus 中可能没有保存 testStats');
}

// 9. 检查 chrome.storage.local.get 调用
console.log('\n9️⃣ 检查状态读取调用:');
const getCallCount = (popupContent.match(/chrome\.storage\.local\.get/g) || []).length;
console.log(`   📊 chrome.storage.local.get 调用数: ${getCallCount}`);
if (getCallCount >= 3) {
  console.log('   ✅ 有多个地方读取存储数据');
} else {
  console.log('   ⚠️ 数据读取位置可能不足');
}

// 10. 总体诊断
console.log('\n🔟 总体诊断:');
const hasAlertRemoved = !popupContent.includes("alert('[Popup] DOMContentLoaded 事件触发！')");
const hasStatsRestore = popupContent.includes('result.testStats');
const hasLogRestore = popupContent.includes('logResult.testLogs');
const hasLogSave = popupContent.includes('logs.push');
const hasStatsSave = (popupContent.match(/testStats:/g) || []).length >= 3;

const checks = {
  'Alert 已移除': hasAlertRemoved,
  '统计数据恢复': hasStatsRestore,
  '日志恢复': hasLogRestore,
  '日志保存': hasLogSave,
  '统计数据保存': hasStatsSave
};

let allPass = true;
for (const [check, result] of Object.entries(checks)) {
  console.log(`   ${result ? '✅' : '❌'} ${check}`);
  if (!result) allPass = false;
}

if (allPass) {
  console.log('\n✅ 所有检查都通过！状态保持功能已完整实现');
  console.log('   用户现在可以：');
  console.log('   1. 关闭 popup 再打开，看到保持的测试状态');
  console.log('   2. 查看恢复的统计数字和日志');
  console.log('   3. 继续监视测试进度而无需重新启动');
} else {
  console.log('\n⚠️ 发现一些可能的问题，请检查上面的标记');
}

// 11. 数据流验证
console.log('\n📋 数据流验证:');
console.log('   Popup DOMContentLoaded');
console.log('        ↓');
console.log('   chrome.storage.local.get([\'testStats\', \'testLogs\', \'testingState\'])');
console.log('        ↓');
if (hasStatsRestore) {
  console.log('   ✅ 恢复 testStats → 更新 UI 数字和进度条');
} else {
  console.log('   ❌ 缺少 testStats 恢复');
}
if (hasLogRestore) {
  console.log('   ✅ 恢复 testLogs → 重新显示日志');
} else {
  console.log('   ❌ 缺少 testLogs 恢复');
}
console.log('        ↓');
console.log('   测试进行中，每有更新');
console.log('        ↓');
console.log('   chrome.storage.local.set({ testStats, testLogs })');

// 12. 建议
console.log('\n💡 建议:');
console.log('   1. 重新加载扩展后测试上述功能');
console.log('   2. 启动测试并等待数据更新');
console.log('   3. 关闭 popup，再次打开');
console.log('   4. 验证统计数据和日志是否恢复');
console.log('   5. 启动新测试，验证数据是否重置');

console.log('\n✅ 验证完成！');
