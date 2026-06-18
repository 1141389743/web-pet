/**
 * Content Script - 注入宠物到页面
 */
(async () => {
  // 避免重复注入
  if (window.__webPetInjected) return;
  window.__webPetInjected = true;

  // 加载核心模块（打包时合并）
  const scriptUrls = [
    'pet-core.js' // 已在manifest中加载
  ];

  // 检查是否启用
  const { enabled } = await chrome.storage.local.get('enabled');
  if (enabled === false) return;

  // 获取配置
  const config = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, resolve);
  });

  // 初始化宠物
  if (typeof WebPet !== 'undefined') {
    window.__webPet = new WebPet(config || {});

    // 监听后台消息
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'SHOW_BUBBLE') {
        window.__webPet?.say(msg.text, msg.duration);
      }
      if (msg.type === 'TOGGLE_PET') {
        if (msg.enabled) window.__webPet?.show();
        else window.__webPet?.hide();
      }
    });

    // 配置变更同步
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.config) {
        const newCfg = changes.config.newValue;
        if (newCfg && window.__webPet) {
          window.__webPet.container.setScale(newCfg.scale || 1);
          window.__webPet.container.setOpacity(newCfg.opacity || 1);
        }
      }
    });
  }
})();
