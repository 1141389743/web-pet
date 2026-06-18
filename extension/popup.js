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
      { id: 'emoji_cat', name: '🐱 小猫' },
      { id: 'emoji_dog', name: '🐶 小狗' },
      { id: 'emoji_bunny', name: '🐰 兔子' },
      { id: 'emoji_panda', name: '🐼 熊猫' },
      { id: 'emoji_fox', name: '🦊 狐狸' },
      { id: 'emoji_penguin', name: '🐧 企鹅' }
    ];
    const skinList = $('skin-list');
    const currentSkin = cfg.skin || 'emoji_cat';
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

// 初始化提醒时间默认值
function initReminderTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const pad = n => String(n).padStart(2, '0');
  const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  $('reminder-time').value = local;
}

// 快捷时间按钮
function setQuickReminder(minutes) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  const pad = n => String(n).padStart(2, '0');
  const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  $('reminder-time').value = local;
}

$('rem-10m').addEventListener('click', () => setQuickReminder(10));
$('rem-30m').addEventListener('click', () => setQuickReminder(30));
$('rem-1h').addEventListener('click', () => setQuickReminder(60));
$('rem-2h').addEventListener('click', () => setQuickReminder(120));

$('add-reminder').addEventListener('click', () => {
  const text = $('reminder-text').value.trim();
  const timeStr = $('reminder-time').value;
  if (!text) { alert('请输入提醒内容'); return; }
  if (!timeStr) { alert('请选择提醒时间'); return; }

  const triggerAt = new Date(timeStr).getTime();
  if (isNaN(triggerAt) || triggerAt <= Date.now()) { alert('请选择未来的时间'); return; }

  const repeat = $('reminder-repeat').checked ? 'daily' : 'none';
  const minutes = Math.round((triggerAt - Date.now()) / 60000);

  sendToTab({ type: 'ADD_REMINDER', content: text, minutes, triggerAt, repeat });
  $('reminder-text').value = '';
  initReminderTime();
  setTimeout(() => window.close(), 500);
});

initReminderTime();

init();
