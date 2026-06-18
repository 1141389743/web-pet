/**
 * Popup 控制面板
 */
const $ = id => document.getElementById(id);

// 向当前标签页发送消息
function sendToTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, msg, () => {
        if (chrome.runtime.lastError) {} // 忽略无接收者错误
      });
    }
  });
}

// 初始化状态
async function init() {
  try {
    const { config, enabled } = await chrome.storage.local.get(['config', 'enabled']);
    const cfg = config || {};

    $('enabled').checked = enabled !== false;
    $('edge-snap').checked = cfg.edgeSnap !== false;
    $('idle-enabled').checked = cfg.idleEnabled !== false;
    $('hourly').checked = cfg.hourlyEnabled !== false;

    // 皮肤列表
    const skins = [
      { id: 'default_cat', name: '🐱 小猫' },
      { id: 'blue_bird', name: '🐦 小鸟' }
    ];
    const skinList = $('skin-list');
    const currentSkin = cfg.skin || 'default_cat';
    skins.forEach(s => {
      const item = document.createElement('div');
      item.className = 'skin-item' + (s.id === currentSkin ? ' active' : '');
      item.textContent = s.name;
      item.dataset.id = s.id;
      item.onclick = () => {
        skinList.querySelectorAll('.skin-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        cfg.skin = s.id;
        chrome.storage.local.set({ config: cfg });
        sendToTab({ type: 'CHANGE_SKIN', skinId: s.id });
      };
      skinList.appendChild(item);
    });
  } catch {}
}

// 事件绑定
$('enabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ enabled });
  sendToTab({ type: 'TOGGLE_PET', enabled });
});

$('edge-snap').addEventListener('change', (e) => {
  chrome.storage.local.get('config').then(({ config }) => {
    const cfg = config || {};
    cfg.edgeSnap = e.target.checked;
    chrome.storage.local.set({ config: cfg });
  });
});

$('idle-enabled').addEventListener('change', (e) => {
  chrome.storage.local.get('config').then(({ config }) => {
    const cfg = config || {};
    cfg.idleEnabled = e.target.checked;
    chrome.storage.local.set({ config: cfg });
  });
});

$('hourly').addEventListener('change', (e) => {
  chrome.storage.local.get('config').then(({ config }) => {
    const cfg = config || {};
    cfg.hourlyEnabled = e.target.checked;
    chrome.storage.local.set({ config: cfg });
  });
});

$('hide-btn').addEventListener('click', () => {
  sendToTab({ type: 'TOGGLE_PET', enabled: false });
  $('enabled').checked = false;
  chrome.storage.local.set({ enabled: false });
});

$('reset-btn').addEventListener('click', () => {
  sendToTab({ type: 'RESET_POSITION' });
});

$('settings-btn').addEventListener('click', () => {
  sendToTab({ type: 'OPEN_SETTINGS' });
  window.close();
});

$('add-reminder').addEventListener('click', () => {
  const text = $('reminder-text').value.trim();
  const minutes = parseInt($('reminder-minutes').value);
  if (!text || !minutes) return;
  sendToTab({ type: 'ADD_REMINDER', content: text, minutes });
  $('reminder-text').value = '';
  // 关闭 popup
  setTimeout(() => window.close(), 500);
});

init();
