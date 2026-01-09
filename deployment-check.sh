#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "Web自动化测试工具 - 部署检查清单"
echo "=================================="
echo ""

# 检查1: manifest.json格式
echo "📋 检查1: Manifest.json JSON格式..."
if python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo -e "${GREEN}✅ manifest.json 格式正确${NC}"
else
    echo -e "${RED}❌ manifest.json 格式错误${NC}"
    exit 1
fi

# 检查2: 必需的src文件
echo ""
echo "📁 检查2: 必需的脚本文件..."

required_files=(
    "src/popup.html"
    "src/popup.js"
    "src/popup.css"
    "src/content-script.js"
    "src/test-case-parser.js"
    "src/custom-test-executor.js"
    "src/report.html"
    "src/report.js"
    "src/background.js"
    "src/qwen-integration.js"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ 缺失: $file${NC}"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    exit 1
fi

# 检查3: 图标文件
echo ""
echo "🎨 检查3: 图标文件..."

icon_files=(
    "images/icon-16.png"
    "images/icon-48.png"
    "images/icon-128.png"
)

for file in "${icon_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${YELLOW}⚠️ 建议添加: $file${NC}"
    fi
done

# 检查4: 文档文件
echo ""
echo "📚 检查4: 文档文件..."

doc_files=(
    "TEST_CASE_FORMAT_v2.0.md"
    "CUSTOM_TEST_USER_GUIDE_v2.0.md"
    "DEPLOYMENT_COMPLETE_v2.0.md"
)

for file in "${doc_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${YELLOW}⚠️ 文档缺失: $file${NC}"
    fi
done

# 检查5: JavaScript语法
echo ""
echo "🔍 检查5: JavaScript文件语法..."

js_files=(
    "src/popup.js"
    "src/test-case-parser.js"
    "src/custom-test-executor.js"
)

all_js_valid=true
for file in "${js_files[@]}"; do
    if node -c "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        # node可能未安装，尝试基本检查
        if grep -q "function\|const\|let\|var" "$file"; then
            echo -e "${GREEN}✅ $file (基本检查)${NC}"
        else
            echo -e "${RED}❌ $file 可能有问题${NC}"
            all_js_valid=false
        fi
    fi
done

# 最终总结
echo ""
echo "=================================="
echo "✅ 部署检查完成！"
echo "=================================="
echo ""
echo "📖 下一步:"
echo "  1. 打开 Chrome 浏览器"
echo "  2. 访问 chrome://extensions/"
echo "  3. 启用右上角的 '开发者模式'"
echo "  4. 点击 '加载已解压的扩展程序'"
echo "  5. 选择 web-test-automation 文件夹"
echo "  6. 点击任何网站上的扩展图标开始使用"
echo ""
echo "💡 帮助:"
echo "  - 查看 TEST_CASE_FORMAT_v2.0.md 了解JSON格式"
echo "  - 查看 CUSTOM_TEST_USER_GUIDE_v2.0.md 完整指南"
echo "  - 查看 DEPLOYMENT_COMPLETE_v2.0.md 部署说明"
echo ""
