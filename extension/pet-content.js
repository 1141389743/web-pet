/**
 * Content Script - 将宠物注入到每个页面
 */
(async () => {
  // 避免重复注入
  if (window.__webPetInjected) return;
  window.__webPetInjected = true;

  // 读取配置
  let config = {};
  try {
    const result = await chrome.storage.local.get(['config', 'enabled']);
    if (result.enabled === false) return;
    config = result.config || {};
  } catch {}

  // 等待 DOM 就绪
  if (document.readyState === 'loading') {
    await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  }

  // 延迟注入，避免影响页面加载
  await new Promise(r => setTimeout(r, 500));

  // 检查是否在 iframe 中（避免重复注入）
  if (window !== window.top) return;

  // 初始化宠物
  try {
    window.__webPet = new WebPet({
      size: config.size || 120,
      scale: config.scale || 1.0,
      opacity: config.opacity || 1.0,
      edgeSnap: config.edgeSnap !== false,
      skin: config.skin || 'default_cat',
      idleEnabled: config.idleEnabled !== false,
      idleInterval: config.idleInterval || 8000,
      hourlyEnabled: config.hourlyEnabled !== false,
      silentStart: config.silentStart ?? 23,
      silentEnd: config.silentEnd ?? 7
    });
  } catch (e) {
    console.warn('[WebPet] 初始化失败:', e);
  }

  // 监听来自 popup/background 的消息
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const pet = window.__webPet;
    if (!pet) return;

    switch (msg.type) {
      case 'TOGGLE_PET':
        if (msg.enabled !== undefined) {
          msg.enabled ? pet.show() : pet.hide();
        } else {
          pet.toggle();
        }
        sendResponse({ ok: true });
        break;

      case 'SHOW_BUBBLE':
        pet.say(msg.text, msg.duration || 3000);
        sendResponse({ ok: true });
        break;

      case 'RESET_POSITION':
        pet.container.resetPosition();
        pet.say('已重置位置', 2000);
        sendResponse({ ok: true });
        break;

      case 'OPEN_SETTINGS':
        pet.settings.show();
        sendResponse({ ok: true });
        break;

      case 'CHANGE_SKIN':
        pet.setSkin(msg.skinId);
        sendResponse({ ok: true });
        break;

      case 'GET_STATUS':
        sendResponse({
          visible: pet.container.isVisible,
          currentSkin: pet.options.skin
        });
        break;

      case 'ADD_REMINDER':
        if (msg.content && msg.minutes) {
          pet.reminder.add(msg.content, Date.now() + msg.minutes * 60000);
          pet.say(`⏰ ${msg.minutes}分钟后提醒`, 2000);
        }
        sendResponse({ ok: true });
        break;
    }
    return true; // 异步响应
  });

  // 同步配置变更
  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.config) {
        const cfg = changes.config.newValue || {};
        const pet = window.__webPet;
        if (!pet) return;
        if (cfg.scale) pet.container.setScale(cfg.scale);
        if (cfg.opacity) pet.container.setOpacity(cfg.opacity);
      }
      if (changes.enabled) {
        const pet = window.__webPet;
        if (!pet) return;
        changes.enabled.newValue ? pet.show() : pet.hide();
      }
    });
  } catch {}
})();
