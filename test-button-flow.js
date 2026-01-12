/**
 * 测试按钮流程诊断脚本
 * 检查 downloadTestCaseReportBtn 在整个流程中的状态变化
 */

const fs = require('fs');
const path = require('path');

// 读取 popup.js
const popupPath = path.join(__dirname, 'src/popup.js');
const popupContent = fs.readFileSync(popupPath, 'utf-8');

console.log('=== 诊断 downloadTestCaseReportBtn 按钮状态 ===\n');

// 1. 检查初始化状态
console.log('1️⃣ 初始化状态检查:');
if (popupContent.includes('downloadTestCaseReportBtn.disabled = true') ||
  popupContent.includes('disabled')) {
  console.log('   ✓ HTML 中按钮默认禁用');
} else {
  console.log('   ⚠️ 按钮初始化状态不清楚');
}

// 2. 检查 AI 计划完成时的设置
console.log('\n2️⃣ AI 计划完成时的设置:');
const aiPlanSection = popupContent.slice(
  popupContent.indexOf('AI计划生成完成，即将按推荐配置启动测试'),
  popupContent.indexOf('AI计划生成完成，即将按推荐配置启动测试') + 3000
);

if (aiPlanSection.includes('downloadTestCaseReportBtn.disabled = false')) {
  console.log('   ✅ AI 计划完成时按钮被启用 ✓');
} else {
  console.log('   ❌ AI 计划完成时没有启用按钮！');
}

// 3. 检查 startAutoTest 函数
console.log('\n3️⃣ startAutoTest 函数中的按钮状态:');
const startAutoTestStart = popupContent.indexOf('function startAutoTest()');
const startAutoTestEnd = popupContent.indexOf('// ', startAutoTestStart + 500);
const startAutoTestSection = popupContent.slice(startAutoTestStart, startAutoTestEnd);

const disableMatches = startAutoTestSection.match(/downloadTestCaseReportBtn\.disabled\s*=\s*true/g);
if (disableMatches) {
  console.log(`   ❌ 发现 ${disableMatches.length} 处禁用按钮的代码！`);
  // 显示行号
  const lines = popupContent.split('\n');
  let lineNum = 1;
  for (const line of lines) {
    if (line.includes('downloadTestCaseReportBtn.disabled = true')) {
      console.log(`      - 第 ${lineNum} 行: ${line.trim()}`);
    }
    lineNum++;
  }
} else {
  console.log('   ✅ startAutoTest 中没有禁用按钮的代码');
}

// 4. 检查停止测试处理
console.log('\n4️⃣ 停止测试处理:');
const stopTestSection = popupContent.slice(
  popupContent.indexOf("stopTestBtn.addEventListener('click'"),
  popupContent.indexOf("stopTestBtn.addEventListener('click'") + 1000
);

if (stopTestSection.includes('downloadTestCaseReportBtn.disabled = true')) {
  if (stopTestSection.includes('// downloadTestCaseReportBtn.disabled = true')) {
    console.log('   ✅ 禁用代码已被注释掉');
  } else {
    console.log('   ❌ 停止测试时仍在禁用按钮！');
  }
} else {
  console.log('   ✅ 停止测试时没有禁用按钮');
}

// 5. 总体检查
console.log('\n5️⃣ 总体问题诊断:');
const totalDisableCount = (popupContent.match(/downloadTestCaseReportBtn\.disabled\s*=\s*true/g) || []).length;
const commentedCount = (popupContent.match(/\/\/\s*downloadTestCaseReportBtn\.disabled\s*=\s*true/g) || []).length;

console.log(`   - 禁用代码总数: ${totalDisableCount}`);
console.log(`   - 注释掉的数: ${commentedCount}`);
console.log(`   - 活跃的禁用: ${totalDisableCount - commentedCount}`);

if (totalDisableCount - commentedCount === 0) {
  console.log('\n✅ 按钮状态管理正确！');
} else {
  console.log(`\n❌ 还有 ${totalDisableCount - commentedCount} 处需要修复!`);
}

// 6. 检查按钮启用代码
console.log('\n6️⃣ 按钮启用代码检查:');
const enableCount = (popupContent.match(/downloadTestCaseReportBtn\.disabled\s*=\s*false/g) || []).length;
console.log(`   - 启用代码数: ${enableCount}`);

if (enableCount > 0) {
  console.log('   ✅ 找到启用代码');
}
