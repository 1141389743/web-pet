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

// 快速倒计时按钮 - 单击直接启动
document.querySelectorAll('.timer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = $('reminder-text').value.trim() || '时间到了~';
    const minutes = parseInt(btn.dataset.min);
    const triggerAt = Date.now() + minutes * 60000;
    sendToTab({ type: 'ADD_REMINDER', content: text, triggerAt, minutes });
    // 视觉反馈
    btn.style.background = '#52C41A';
    btn.style.color = '#fff';
    btn.textContent = '✓ 已设置';
    setTimeout(() => {
      btn.style.background = '';
      btn.style.color = '';
      btn.textContent = btn.dataset.min >= 60 ? (btn.dataset.min/60) + ' 小时' : btn.dataset.min + ' 分钟';
    }, 1500);
  });
});

// 自定义分钟数
$('add-custom-timer').addEventListener('click', () => {
  const text = $('reminder-text').value.trim() || '时间到了~';
  const minutes = parseInt($('custom-minutes').value);
  if (!minutes || minutes < 1) { alert('请输入有效分钟数'); return; }
  const triggerAt = Date.now() + minutes * 60000;
  sendToTab({ type: 'ADD_REMINDER', content: text, triggerAt, minutes });
  $('custom-minutes').value = '';
  window.close();
});

// 设闹钟
$('add-alarm').addEventListener('click', () => {
  const text = $('reminder-text').value.trim() || '闹钟响了~';
  const timeStr = $('reminder-time').value;
  if (!timeStr) { alert('请选择时间'); return; }

  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  // 如果选的时间已过，设为明天
  if (target <= now) target.setDate(target.getDate() + 1);

  const triggerAt = target.getTime();
  const minutes = Math.round((triggerAt - Date.now()) / 60000);

  sendToTab({ type: 'ADD_REMINDER', content: text, triggerAt, minutes });
  $('reminder-text').value = '';
  $('reminder-time').value = '';
  window.close();
});

init();
