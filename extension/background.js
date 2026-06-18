/**
 * Chrome 插件后台 Service Worker
 * 处理定时提醒、跨页面同步
 */

// 安装时初始化默认配置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('config').then(({ config }) => {
    if (!config) {
      chrome.storage.local.set({
        enabled: true,
        config: {
          scale: 1.0,
          opacity: 1.0,
          edgeSnap: true,
          skin: 'default_cat',
          idleEnabled: true,
          idleInterval: 8000,
          hourlyEnabled: true,
          silentStart: 23,
          silentEnd: 7
        }
      });
    }
  });
});

// 创建定时检查提醒的 alarm
chrome.alarms.create('checkReminders', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkReminders') return;

  try {
    const { reminders } = await chrome.storage.local.get('reminders');
    if (!reminders || !reminders.length) return;

    const now = Date.now();
    let changed = false;

    for (const r of reminders) {
      if (!r.enabled) continue;
      if (now >= r.triggerAt) {
        // 通知所有标签页显示气泡
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_BUBBLE',
            text: '⏰ ' + r.content,
            duration: 5000
          }).catch(() => {});
        }

        // 系统通知
        try {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: '桌面宠物提醒',
            message: r.content
          });
        } catch {}

        if (r.repeat === 'daily') {
          r.triggerAt += 86400000;
        } else {
          r.enabled = false;
        }
        changed = true;
      }
    }

    if (changed) {
      chrome.storage.local.set({ reminders });
    }
  } catch {}
});

// 处理来自 popup 的消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_CONFIG') {
    chrome.storage.local.get('config').then(data => sendResponse(data.config || {}));
    return true;
  }
  if (msg.type === 'SAVE_CONFIG') {
    chrome.storage.local.set({ config: msg.config });
    sendResponse({ ok: true });
  }
  if (msg.type === 'TOGGLE_PET') {
    chrome.storage.local.get('enabled').then(data => {
      const newState = msg.enabled !== undefined ? msg.enabled : !data.enabled;
      chrome.storage.local.set({ enabled: newState });
      // 通知所有标签页
      chrome.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PET', enabled: newState }).catch(() => {});
        }
      });
      sendResponse({ enabled: newState });
    });
    return true;
  }
});
