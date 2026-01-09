// 筛选条件处理器 - 处理复杂的筛选场景

/**
 * 多选框处理器
 * 支持原生checkbox和自定义多选组件
 */
class CheckboxHandler {
  constructor() {
    this.stepDelay = 200;
  }

  /**
   * 选择多个复选框
   * @param {HTMLElement} container - 容器元素
   * @param {string[]} values - 要选择的值或文本数组
   */
  async selectMultiple (container, values) {
    const result = {
      success: false,
      selected: [],
      errors: [],
      steps: []
    };

    try {
      // 1. 查找所有复选框
      const checkboxes = this.findCheckboxes(container);
      result.steps.push(`✓ 第1步: 找到${checkboxes.length}个复选框`);

      if (checkboxes.length === 0) {
        throw new Error('未找到复选框');
      }

      // 2. 逐个选择
      for (const value of values) {
        try {
          const checkbox = this.findCheckbox(checkboxes, value);
          if (!checkbox) {
            result.errors.push(`未找到选项: ${value}`);
            continue;
          }

          // 3. 点击选中
          await this.checkCheckbox(checkbox);
          result.selected.push(value);
          result.steps.push(`✓ 已选中: ${value}`);
          await this.delay(this.stepDelay);

        } catch (error) {
          result.errors.push(`选择"${value}"失败: ${error.message}`);
        }
      }

      result.success = result.selected.length > 0;
      return result;

    } catch (error) {
      result.error = error.message;
      console.error('[CheckboxHandler] 选择失败:', error);
      return result;
    }
  }

  /**
   * 查找所有复选框
   */
  findCheckboxes (container) {
    const checkboxes = [];

    // 原生checkbox
    const nativeCheckboxes = container.querySelectorAll('input[type="checkbox"]:not([disabled])');
    checkboxes.push(...nativeCheckboxes);

    // 自定义复选框（含checkbox role）
    const customCheckboxes = container.querySelectorAll('[role="checkbox"], .checkbox, .ant-checkbox');
    checkboxes.push(...customCheckboxes);

    return checkboxes;
  }

  /**
   * 查找特定复选框
   */
  findCheckbox (checkboxes, value) {
    const searchValue = value.toLowerCase().trim();

    for (const checkbox of checkboxes) {
      // 检查value属性
      if (checkbox.value && checkbox.value.toLowerCase().includes(searchValue)) {
        return checkbox;
      }

      // 检查文本内容
      const label = checkbox.nextElementSibling || checkbox.parentElement;
      if (label && label.textContent.toLowerCase().includes(searchValue)) {
        return checkbox;
      }

      // 检查关联label
      const labelText = document.querySelector(`label[for="${checkbox.id}"]`)?.textContent;
      if (labelText && labelText.toLowerCase().includes(searchValue)) {
        return checkbox;
      }
    }

    return null;
  }

  /**
   * 勾选复选框
   */
  async checkCheckbox (checkbox) {
    if (checkbox.tagName === 'INPUT') {
      if (!checkbox.checked) {
        checkbox.click();
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // 自定义复选框
      if (checkbox.getAttribute('aria-checked') !== 'true') {
        checkbox.click();
        checkbox.setAttribute('aria-checked', 'true');
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    await this.delay(100);
  }

  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 单选框处理器
 * 支持原生radio和自定义单选组件
 */
class RadioHandler {
  constructor() {
    this.stepDelay = 200;
  }

  /**
   * 选择单选框
   * @param {HTMLElement} container - 容器元素
   * @param {string} value - 要选择的值或文本
   */
  async selectOption (container, value) {
    const result = {
      success: false,
      selected: null,
      steps: [],
      error: null
    };

    try {
      // 1. 查找所有单选框
      const radios = this.findRadios(container);
      result.steps.push(`✓ 第1步: 找到${radios.length}个单选框`);

      if (radios.length === 0) {
        throw new Error('未找到单选框');
      }

      // 2. 查找目标单选框
      const targetRadio = this.findRadio(radios, value);
      if (!targetRadio) {
        throw new Error(`未找到选项: ${value}`);
      }
      result.steps.push('✓ 第2步: 找到目标选项');

      // 3. 选中
      await this.selectRadio(targetRadio);
      result.steps.push('✓ 第3步: 已选中选项');

      // 4. 验证
      const isSelected = this.isRadioSelected(targetRadio);
      if (!isSelected) {
        throw new Error('选项选中失败');
      }
      result.steps.push('✓ 第4步: 验证选中成功');

      result.success = true;
      result.selected = value;
      return result;

    } catch (error) {
      result.error = error.message;
      console.error('[RadioHandler] 选择失败:', error);
      return result;
    }
  }

  /**
   * 查找所有单选框
   */
  findRadios (container) {
    const radios = [];

    // 原生radio
    const nativeRadios = container.querySelectorAll('input[type="radio"]:not([disabled])');
    radios.push(...nativeRadios);

    // 自定义单选框（含radio role）
    const customRadios = container.querySelectorAll('[role="radio"], .radio, .ant-radio');
    radios.push(...customRadios);

    return radios;
  }

  /**
   * 查找特定单选框
   */
  findRadio (radios, value) {
    const searchValue = value.toLowerCase().trim();

    for (const radio of radios) {
      // 检查value属性
      if (radio.value && radio.value.toLowerCase().includes(searchValue)) {
        return radio;
      }

      // 检查文本内容
      const label = radio.nextElementSibling || radio.parentElement;
      if (label && label.textContent.toLowerCase().includes(searchValue)) {
        return radio;
      }

      // 检查关联label
      const labelText = document.querySelector(`label[for="${radio.id}"]`)?.textContent;
      if (labelText && labelText.toLowerCase().includes(searchValue)) {
        return radio;
      }
    }

    return null;
  }

  /**
   * 选中单选框
   */
  async selectRadio (radio) {
    if (radio.tagName === 'INPUT') {
      radio.click();
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // 自定义单选框
      radio.click();
      radio.setAttribute('aria-checked', 'true');
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await this.delay(100);
  }

  /**
   * 检查单选框是否选中
   */
  isRadioSelected (radio) {
    if (radio.tagName === 'INPUT') {
      return radio.checked;
    } else {
      return radio.getAttribute('aria-checked') === 'true' ||
        radio.classList.contains('checked') ||
        radio.classList.contains('ant-radio-checked');
    }
  }

  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 树形选择处理器
 * 支持层级展开和选择
 */
class TreeSelectHandler {
  constructor() {
    this.maxWaitTime = 3000;
    this.stepDelay = 300;
  }

  /**
   * 选择树形选项
   * @param {HTMLElement} container - 树形选择容器
   * @param {string[]} path - 选择路径，如: ['一级', '二级', '三级']
   */
  async selectTreeOption (container, path) {
    const result = {
      success: false,
      selectedPath: [],
      steps: [],
      error: null
    };

    try {
      // 1. 打开树形选择器
      const treeOpened = await this.openTreeSelector(container);
      if (!treeOpened) {
        throw new Error('无法打开树形选择器');
      }
      result.steps.push('✓ 第1步: 树形选择器已打开');
      await this.delay(this.stepDelay);

      // 2. 逐级展开和选择
      for (let i = 0; i < path.length; i++) {
        const currentPath = path[i];

        // 查找节点
        const node = await this.findTreeNode(container, currentPath);
        if (!node) {
          throw new Error(`未找到节点: ${currentPath}`);
        }
        result.steps.push(`✓ 第${i + 2}步: 找到节点 "${currentPath}"`);

        // 如果不是最后一个，展开节点
        if (i < path.length - 1) {
          await this.expandTreeNode(node);
          result.steps.push(`✓ 已展开节点 "${currentPath}"`);
          await this.delay(this.stepDelay);
        } else {
          // 最后一个节点，选中它
          await this.selectTreeNode(node);
          result.steps.push(`✓ 已选中节点 "${currentPath}"`);
          result.selectedPath.push(currentPath);
        }
      }

      // 3. 确认选择
      await this.confirmTreeSelection(container);
      result.steps.push('✓ 已确认选择');

      result.success = true;
      return result;

    } catch (error) {
      result.error = error.message;
      console.error('[TreeSelectHandler] 选择失败:', error);
      return result;
    }
  }

  /**
   * 打开树形选择器
   */
  async openTreeSelector (container) {
    try {
      const trigger = container.querySelector('[class*="trigger"], [role="button"]');
      if (trigger) {
        trigger.click();
        await this.waitForTree(container);
        return true;
      }

      // 直接点击容器
      container.click();
      return true;

    } catch (error) {
      console.error('[TreeSelectHandler] 打开失败:', error);
      return false;
    }
  }

  /**
   * 等待树形菜单加载
   */
  async waitForTree (container, timeout = this.maxWaitTime) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const treeItems = container.querySelectorAll('[role="treeitem"], .tree-node, li[class*="node"]');
      if (treeItems.length > 0) {
        return;
      }
      await this.delay(100);
    }

    throw new Error('树形菜单未在预期时间加载');
  }

  /**
   * 查找树形节点
   */
  async findTreeNode (container, nodeName) {
    const searchName = nodeName.toLowerCase().trim();
    const nodes = container.querySelectorAll('[role="treeitem"], .tree-node, li[class*="node"], .ant-tree-node-content-wrapper');

    for (const node of nodes) {
      if (node.textContent.toLowerCase().includes(searchName)) {
        return node;
      }
    }

    return null;
  }

  /**
   * 展开树形节点
   */
  async expandTreeNode (node) {
    // 查找展开按钮
    const expandBtn = node.querySelector('[class*="expand"], [class*="arrow"], [role="button"]');
    if (expandBtn) {
      expandBtn.click();
      await this.delay(200);
    } else {
      // 尝试双击节点
      node.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await this.delay(200);
    }
  }

  /**
   * 选择树形节点
   */
  async selectTreeNode (node) {
    node.click();
    node.dispatchEvent(new Event('click', { bubbles: true }));

    // 标记为选中
    node.setAttribute('aria-selected', 'true');
    await this.delay(100);
  }

  /**
   * 确认树形选择
   */
  async confirmTreeSelection (container) {
    const confirmBtn = document.querySelector('.confirm-btn, [aria-label*="confirm"], .ant-btn-primary');
    if (confirmBtn && confirmBtn.offsetParent !== null) {
      confirmBtn.click();
      await this.delay(300);
    }
  }

  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 标签选择处理器
 * 支持标签多选和单选
 */
class TagSelectHandler {
  constructor() {
    this.stepDelay = 200;
  }

  /**
   * 选择标签
   * @param {HTMLElement} container - 标签容器
   * @param {string[]} tags - 要选择的标签文本
   */
  async selectTags (container, tags) {
    const result = {
      success: false,
      selected: [],
      errors: [],
      steps: []
    };

    try {
      // 1. 查找所有标签
      const tagElements = this.findTags(container);
      result.steps.push(`✓ 第1步: 找到${tagElements.length}个标签`);

      if (tagElements.length === 0) {
        throw new Error('未找到标签');
      }

      // 2. 逐个选择
      for (const tagText of tags) {
        try {
          const tag = this.findTag(tagElements, tagText);
          if (!tag) {
            result.errors.push(`未找到标签: ${tagText}`);
            continue;
          }

          await this.selectTag(tag);
          result.selected.push(tagText);
          result.steps.push(`✓ 已选中标签: ${tagText}`);
          await this.delay(this.stepDelay);

        } catch (error) {
          result.errors.push(`选择"${tagText}"失败: ${error.message}`);
        }
      }

      result.success = result.selected.length > 0;
      return result;

    } catch (error) {
      result.error = error.message;
      console.error('[TagSelectHandler] 选择失败:', error);
      return result;
    }
  }

  /**
   * 查找所有标签
   */
  findTags (container) {
    const tags = [];

    // 各种标签组件
    const selectors = [
      '.tag',
      '.ant-tag',
      '[class*="tag"]',
      '[role="button"][class*="tag"]',
      '.chip',
      '.badge'
    ];

    for (const selector of selectors) {
      try {
        const elements = container.querySelectorAll(selector);
        tags.push(...elements);
      } catch (e) {
        // 选择器可能无效，跳过
      }
    }

    // 去重
    return [...new Set(tags)];
  }

  /**
   * 查找特定标签
   */
  findTag (tags, tagText) {
    const searchText = tagText.toLowerCase().trim();

    for (const tag of tags) {
      if (tag.textContent.toLowerCase().includes(searchText)) {
        return tag;
      }
    }

    return null;
  }

  /**
   * 选择标签
   */
  async selectTag (tag) {
    tag.click();
    tag.dispatchEvent(new Event('click', { bubbles: true }));

    // 标记为选中
    tag.classList.add('selected', 'ant-tag-blue');
    tag.setAttribute('aria-selected', 'true');
    await this.delay(100);
  }

  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出所有处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CheckboxHandler,
    RadioHandler,
    TreeSelectHandler,
    TagSelectHandler
  };
}
