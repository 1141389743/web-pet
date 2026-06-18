/**
 * Chrome 插件后台 Service Worker
 * 处理定时任务、跨页面同步
 */

// 安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    reminders: [],
    notes: [],
    config: {
      scale: 1.0,
      opacity: 1.0,
      edgeSnap: true,
      skin: 'default_cat',
      hourlyEnabled: true,
      silentStart: 23,
      silentEnd: 7
    }
  });
});

// 定时提醒检查
chrome.alarms.create('checkReminders', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkReminders') return;

  const { reminders } = await chrome.storage.local.get('reminders');
  if (!reminders) return;

  const now = Date.now();
  let changed = false;

  for (const r of reminders) {
    if (!r.enabled) continue;
    if (now >= r.triggerAt) {
      // 发送通知给所有标签页
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_BUBBLE',
          text: '⏰ ' + r.content,
          duration: 5000
        }).catch(() => {});
      }

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
});

// 消息处理
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_CONFIG') {
    chrome.storage.local.get('config').then(data => sendResponse(data.config));
    return true;
  }
  if (msg.type === 'SAVE_CONFIG') {
    chrome.storage.local.set({ config: msg.config });
  }
  if (msg.type === 'TOGGLE_PET') {
    chrome.storage.local.get('enabled').then(data => {
      const newState = !data.enabled;
      chrome.storage.local.set({ enabled: newState });
      // 通知所有标签页
      chrome.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PET', enabled: newState }).catch(() => {});
        }
      });
    });
  }
});
