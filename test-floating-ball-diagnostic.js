/**
 * 浮球显示诊断脚本
 * 检查浮球显示流程的每一个环节
 */

const fs = require('fs');
const path = require('path');

console.log('=== 🔍 浮球显示流程诊断 ===\n');

// 1. 检查 floating-ball-injector.js
console.log('1️⃣ floating-ball-injector.js 检查:');
const injectorPath = path.join(__dirname, 'src/floating-ball-injector.js');
const injectorContent = fs.readFileSync(injectorPath, 'utf-8');

if (injectorContent.includes('floating-ball-container')) {
  console.log('   ✅ DOM容器创建代码存在');
} else {
  console.log('   ❌ 缺少DOM容器创建代码');
}

if (injectorContent.includes('floating-ball.js')) {
  console.log('   ✅ floating-ball.js 注入代码存在');
} else {
  console.log('   ❌ 缺少 floating-ball.js 注入代码');
}

if (injectorContent.includes('floatingBallMessage')) {
  console.log('   ✅ CustomEvent 转发代码存在');
} else {
  console.log('   ❌ 缺少 CustomEvent 转发代码');
}

// 2. 检查 floating-ball.js
console.log('\n2️⃣ floating-ball.js 检查:');
const ballPath = path.join(__dirname, 'src/floating-ball.js');
const ballContent = fs.readFileSync(ballPath, 'utf-8');

if (ballContent.includes('window.addEventListener(\'floatingBallMessage\'')) {
  console.log('   ✅ floatingBallMessage 事件监听存在');
} else {
  console.log('   ❌ 缺少 floatingBallMessage 事件监听');
}

if (ballContent.includes('showBall()')) {
  console.log('   ✅ showBall() 方法存在');
} else {
  console.log('   ❌ 缺少 showBall() 方法');
}

if (ballContent.includes('container.style.display = \'block\'')) {
  console.log('   ✅ display=block 设置代码存在');
} else {
  console.log('   ❌ 缺少 display=block 设置');
}

if (ballContent.includes('floating-ball-container')) {
  console.log('   ✅ 正在查找容器 floating-ball-container');
} else {
  console.log('   ⚠️  没有直接引用 floating-ball-container');
}

// 3. 检查 content-script.js
console.log('\n3️⃣ content-script.js 检查:');
const contentPath = path.join(__dirname, 'src/content-script.js');
const contentContent = fs.readFileSync(contentPath, 'utf-8');

if (contentContent.includes('showFloatingBall')) {
  console.log('   ✅ showFloatingBall 消息处理存在');
} else {
  console.log('   ❌ 缺少 showFloatingBall 处理');
}

if (contentContent.includes('dispatchEvent') && contentContent.includes('floatingBallMessage')) {
  console.log('   ✅ dispatchEvent CustomEvent 代码存在');
} else {
  console.log('   ❌ 缺少 dispatchEvent CustomEvent 代码');
}

const showBallMatches = contentContent.match(/showFloatingBall/g);
console.log(`   📊 showFloatingBall 出现次数: ${showBallMatches ? showBallMatches.length : 0}`);

// 4. 检查 popup.js
console.log('\n4️⃣ popup.js 中的 showFloatingBall 消息发送:');
const popupPath = path.join(__dirname, 'src/popup.js');
const popupContent = fs.readFileSync(popupPath, 'utf-8');

const sendMessageMatches = popupContent.match(/chrome\.tabs\.sendMessage.*?action:\s*'showFloatingBall'/g);
console.log(`   📊 sendMessage showFloatingBall 出现次数: ${sendMessageMatches ? sendMessageMatches.length : 0}`);

if (popupContent.includes('showFloatingBall')) {
  console.log('   ✅ showFloatingBall 消息发送代码存在');

  // 找到具体的行号
  const lines = popupContent.split('\n');
  let lineNum = 1;
  for (const line of lines) {
    if (line.includes('showFloatingBall')) {
      console.log(`      - 第 ${lineNum} 行`);
    }
    lineNum++;
  }
} else {
  console.log('   ❌ 缺少 showFloatingBall 发送代码');
}

// 5. 检查 manifest.json
console.log('\n5️⃣ manifest.json 检查:');
const manifestPath = path.join(__dirname, 'manifest.json');
const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
const manifest = JSON.parse(manifestContent);

if (manifest.content_scripts && manifest.content_scripts[0]) {
  const scripts = manifest.content_scripts[0].js || [];

  if (scripts.includes('src/floating-ball-injector.js')) {
    console.log('   ✅ floating-ball-injector.js 在 manifest 中正确列出');
  } else {
    console.log('   ❌ floating-ball-injector.js 未在 manifest 中列出');
  }

  console.log(`   📊 Content scripts 总数: ${scripts.length}`);
  console.log(`      Injector位置: ${scripts.indexOf('src/floating-ball-injector.js') + 1}/${scripts.length}`);
} else {
  console.log('   ❌ manifest 中没有 content_scripts 配置');
}

if (manifest.web_accessible_resources && manifest.web_accessible_resources[0]) {
  const resources = manifest.web_accessible_resources[0].resources || [];

  if (resources.includes('src/floating-ball.js')) {
    console.log('   ✅ floating-ball.js 在 web_accessible_resources 中正确列出');
  } else {
    console.log('   ❌ floating-ball.js 未在 web_accessible_resources 中列出');
  }
} else {
  console.log('   ⚠️  web_accessible_resources 未正确配置');
}

// 6. 总体检查
console.log('\n6️⃣ 总体问题诊断:');

const checks = {
  '浮球DOM注入': injectorContent.includes('floating-ball-container'),
  '浮球脚本注入': injectorContent.includes('floating-ball.js'),
  '消息转发': injectorContent.includes('floatingBallMessage'),
  '事件监听': ballContent.includes('window.addEventListener(\'floatingBallMessage\''),
  'showBall方法': ballContent.includes('showBall()'),
  'Display设置': ballContent.includes('display = \'block\''),
  'Content处理': contentContent.includes('showFloatingBall'),
  'Popup发送': popupContent.includes('showFloatingBall'),
  'Manifest配置': manifest.content_scripts && manifest.content_scripts[0] &&
    manifest.content_scripts[0].js.includes('src/floating-ball-injector.js')
};

let allOk = true;
for (const [check, result] of Object.entries(checks)) {
  console.log(`   ${result ? '✅' : '❌'} ${check}`);
  if (!result) allOk = false;
}

if (allOk) {
  console.log('\n✅ 所有检查都通过！浮球应该能正常显示');
  console.log('   如果仍然无法显示，可能是');
  console.log('   运行时问题（需要查看浏览器console日志）');
} else {
  console.log('\n❌ 发现了潜在的配置问题，需要修复');
}
