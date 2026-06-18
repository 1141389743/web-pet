/**
 * Content Script - 将宠物注入到每个页面
 */
(async () => {
  // 避免重复注入
  if (window.__webPetInjected) {
    console.log('[WebPet] 已注入，跳过');
    return;
  }
  window.__webPetInjected = true;
  console.log('[WebPet] 开始注入...');

  // 检查是否在 iframe 中
  try {
    if (window !== window.top) {
      console.log('[WebPet] iframe中，跳过');
      return;
    }
  } catch (e) {
    // 跨域iframe，跳过
    console.log('[WebPet] 跨域iframe，跳过');
    return;
  }

  // 读取配置
  let config = {};
  let enabled = true;
  try {
    const result = await chrome.storage.local.get(['config', 'enabled']);
    if (result.enabled === false) {
      console.log('[WebPet] 已禁用');
      return;
    }
    config = result.config || {};
    enabled = result.enabled !== false;
    // 同步到localStorage（供WebPet内部读取）
    try { localStorage.setItem('web_pet_config', JSON.stringify(config)); } catch {}
  } catch (e) {
    console.warn('[WebPet] 读取配置失败:', e);
  }

  // 等待 DOM 就绪
  if (document.readyState === 'loading') {
    await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  }

  // 延迟注入
  await new Promise(r => setTimeout(r, 800));

  // 检查 WebPet 类是否可用
  if (typeof WebPet === 'undefined') {
    console.error('[WebPet] WebPet 类未定义！pet-core.js 可能加载失败');
    return;
  }

  // 初始化宠物
  try {
    console.log('[WebPet] 初始化宠物...', config);
    window.__webPet = new WebPet({
      size: config.size || 120,
      scale: config.scale || 1.0,
      opacity: config.opacity || 1.0,
      edgeSnap: config.edgeSnap !== false,
      skin: config.skin || 'emoji_cat',
      idleEnabled: config.idleEnabled !== false,
      idleInterval: config.idleInterval || 8000,
      hourlyEnabled: config.hourlyEnabled !== false,
      silentStart: config.silentStart ?? 23,
      silentEnd: config.silentEnd ?? 7
    });
    console.log('[WebPet] ✅ 宠物初始化成功！');
  } catch (e) {
    console.error('[WebPet] ❌ 初始化失败:', e);
    return;
  }

  // 监听消息
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const pet = window.__webPet;
    if (!pet) return;

    try {
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
          // 保存到chrome.storage.local
          try {
            chrome.storage.local.get('config').then(({ config }) => {
              const cfg = config || {};
              cfg.skin = msg.skinId;
              chrome.storage.local.set({ config: cfg });
            });
          } catch {}
          sendResponse({ ok: true });
          break;
        case 'GET_STATUS':
          sendResponse({
            visible: pet.container.isVisible,
            currentSkin: pet.options.skin
          });
          break;
        case 'ADD_REMINDER':
          if (msg.content) {
            const triggerAt = msg.triggerAt || (Date.now() + (msg.minutes || 30) * 60000);
            const repeat = msg.repeat || 'none';
            pet.reminder.add(msg.content, triggerAt, repeat);
            const mins = Math.round((triggerAt - Date.now()) / 60000);
            let timeText = '';
            if (mins < 60) timeText = mins + '分钟';
            else if (mins < 1440) timeText = Math.round(mins/60) + '小时';
            else timeText = Math.round(mins/1440) + '天';
            pet.say('⏰ ' + timeText + '后提醒', 2000);
          }
          sendResponse({ ok: true });
          break;
      }
    } catch (e) {
      console.error('[WebPet] 消息处理错误:', e);
    }
    return true;
  });

  // 同步配置变更
  try {
    chrome.storage.onChanged.addListener((changes) => {
      const pet = window.__webPet;
      if (!pet) return;
      if (changes.config) {
        const cfg = changes.config.newValue || {};
        if (cfg.scale) pet.container.setScale(cfg.scale);
        if (cfg.opacity) pet.container.setOpacity(cfg.opacity);
      }
      if (changes.enabled) {
        changes.enabled.newValue ? pet.show() : pet.hide();
      }
    });
  } catch (e) {
    console.warn('[WebPet] 配置同步失败:', e);
  }

  console.log('[WebPet] 内容脚本加载完成');
})();
