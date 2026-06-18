/**
 * 快捷面板 - 点击宠物弹出，包含提醒和便签
 */
class QuickPanel {
  constructor(options = {}) {
    this.el = null;
    this.overlay = null;
    this.visible = false;
    this.options = options;
    this._init();
  }

  _init() {
    // 遮罩
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.2)', zIndex: '2147483646',
      display: 'none'
    });
    this.overlay.addEventListener('click', () => this.hide());
    document.body.appendChild(this.overlay);

    // 面板
    this.el = document.createElement('div');
    this.el.className = 'web-pet-quick-panel';
    Object.assign(this.el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      width: '300px',
      maxWidth: '90vw',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      color: '#333',
      display: 'none',
      overflow: 'hidden'
    });
    document.body.appendChild(this.el);
  }

  show(x, y) {
    this.visible = true;
    this._render();
    this.el.style.display = 'block';
    this.overlay.style.display = 'block';

    // 定位：优先在宠物上方，空间不够则下方
    const panelH = 420;
    const panelW = 300;
    let px = Math.min(x, window.innerWidth - panelW - 10);
    let py = y - panelH - 20;
    if (py < 10) py = y + 120;
    if (px < 10) px = 10;
    this.el.style.left = px + 'px';
    this.el.style.top = py + 'px';
  }

  hide() {
    this.visible = false;
    this.el.style.display = 'none';
    this.overlay.style.display = 'none';
  }

  _render() {
    const reminders = this.options.getReminders?.() || [];
    const notes = this.options.getNotes?.() || [];

    this.el.innerHTML = `
      <div style="background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;padding:14px 16px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:15px;font-weight:600">🐾 宠物控制台</span>
          <span style="cursor:pointer;font-size:18px" id="qp-close">✕</span>
        </div>
      </div>

      <div style="padding:0">
        <div style="display:flex;border-bottom:1px solid #f0f0f0">
          <div class="qp-tab active" data-tab="timer" style="flex:1;padding:10px;text-align:center;cursor:pointer;font-size:13px;border-bottom:2px solid #FF6B81;color:#FF6B81;font-weight:600">⏰ 提醒</div>
          <div class="qp-tab" data-tab="notes" style="flex:1;padding:10px;text-align:center;cursor:pointer;font-size:13px;color:#999">📝 便签</div>
        </div>
      </div>

      <div id="qp-tab-timer" style="padding:14px;max-height:320px;overflow-y:auto">
        <div style="margin-bottom:10px">
          <input type="text" id="qp-rem-text" placeholder="提醒内容（如：喝水、休息）" style="width:100%;padding:8px 10px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">
        </div>
        <div style="font-size:12px;color:#666;margin-bottom:8px">快速倒计时（点击直接设置）</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">
          <button class="qp-timer" data-min="5" style="padding:10px 0;border:1px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px">5 分钟</button>
          <button class="qp-timer" data-min="10" style="padding:10px 0;border:1px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px">10 分钟</button>
          <button class="qp-timer" data-min="15" style="padding:10px 0;border:1px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px">15 分钟</button>
          <button class="qp-timer" data-min="30" style="padding:10px 0;border:1px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px">30 分钟</button>
          <button class="qp-timer" data-min="60" style="padding:10px 0;border:1px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px">1 小时</button>
          <button class="qp-timer" data-min="120" style="padding:10px 0;border:1px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px">2 小时</button>
        </div>
        <div style="border-top:1px solid #f0f0f0;padding-top:10px">
          <div style="font-size:12px;color:#666;margin-bottom:6px">自定义</div>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="number" id="qp-custom-min" placeholder="分钟" min="1" max="1440" style="width:70px;padding:6px 8px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;outline:none;text-align:center">
            <span style="font-size:12px;color:#999">分钟后</span>
            <button id="qp-custom-btn" style="margin-left:auto;padding:6px 14px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">确定</button>
          </div>
        </div>
        <div style="border-top:1px solid #f0f0f0;padding-top:10px;margin-top:10px">
          <div style="font-size:12px;color:#666;margin-bottom:6px">设闹钟</div>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="time" id="qp-alarm-time" style="flex:1;padding:6px 8px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;outline:none">
            <button id="qp-alarm-btn" style="padding:6px 14px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">设闹钟</button>
          </div>
        </div>
        ${reminders.length > 0 ? `
        <div style="border-top:1px solid #f0f0f0;padding-top:10px;margin-top:10px">
          <div style="font-size:12px;color:#666;margin-bottom:6px">进行中的提醒</div>
          ${reminders.filter(r => r.enabled).map(r => {
            const mins = Math.max(0, Math.round((r.triggerAt - Date.now()) / 60000));
            const timeText = mins < 60 ? mins + '分钟' : Math.round(mins/60) + '小时';
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f5f5f5">
              <div>
                <div style="font-size:13px">${r.content}</div>
                <div style="font-size:11px;color:#999">还剩 ${timeText}</div>
              </div>
              <button class="qp-rem-del" data-id="${r.id}" style="padding:3px 8px;border:1px solid #ffccc7;border-radius:6px;background:#fff1f0;color:#ff4d4f;font-size:11px;cursor:pointer">取消</button>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>

      <div id="qp-tab-notes" style="padding:14px;max-height:320px;overflow-y:auto;display:none">
        <div style="display:flex;gap:6px;margin-bottom:10px">
          <input type="text" id="qp-note-input" placeholder="写点什么..." style="flex:1;padding:8px 10px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;outline:none">
          <button id="qp-note-add" style="padding:8px 14px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">添加</button>
        </div>
        ${notes.length === 0 ? '<div style="text-align:center;color:#ccc;padding:30px 0">还没有便签~</div>' :
          notes.map(n => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #f5f5f5;${n.done ? 'opacity:0.5' : ''}">
              <span class="qp-note-check" data-id="${n.id}" style="cursor:pointer;font-size:16px;flex-shrink:0">${n.done ? '✅' : '⬜'}</span>
              <div style="flex:1;font-size:13px;${n.done ? 'text-decoration:line-through;color:#999' : ''}">${n.text}</div>
              <span class="qp-note-pin" data-id="${n.id}" style="cursor:pointer;font-size:14px;flex-shrink:0" title="${n.pinned ? '取消置顶' : '置顶'}">${n.pinned ? '📌' : '📍'}</span>
              <span class="qp-note-del" data-id="${n.id}" style="cursor:pointer;font-size:14px;color:#ccc;flex-shrink:0">✕</span>
            </div>
          `).join('')}
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const $ = id => this.el.querySelector(id);

    // 关闭
    $('qp-close').onclick = () => this.hide();

    // Tab切换
    this.el.querySelectorAll('.qp-tab').forEach(tab => {
      tab.onclick = () => {
        this.el.querySelectorAll('.qp-tab').forEach(t => {
          t.style.borderBottom = 'none';
          t.style.color = '#999';
          t.style.fontWeight = 'normal';
          t.classList.remove('active');
        });
        tab.style.borderBottom = '2px solid #FF6B81';
        tab.style.color = '#FF6B81';
        tab.style.fontWeight = '600';
        tab.classList.add('active');
        $('qp-tab-timer').style.display = tab.dataset.tab === 'timer' ? 'block' : 'none';
        $('qp-tab-notes').style.display = tab.dataset.tab === 'notes' ? 'block' : 'none';
      };
    });

    // 快速倒计时
    this.el.querySelectorAll('.qp-timer').forEach(btn => {
      btn.onclick = () => {
        const text = $('qp-rem-text').value.trim() || '时间到了~';
        const minutes = parseInt(btn.dataset.min);
        this.options.onAddReminder?.(text, Date.now() + minutes * 60000, minutes);
        btn.style.background = '#52C41A';
        btn.style.color = '#fff';
        btn.style.borderColor = '#52C41A';
        btn.textContent = '✓ 已设置';
        setTimeout(() => {
          btn.style.background = '';
          btn.style.color = '';
          btn.style.borderColor = '';
          const m = parseInt(btn.dataset.min);
          btn.textContent = m >= 60 ? (m/60) + ' 小时' : m + ' 分钟';
        }, 1500);
      };
    });

    // 自定义分钟
    $('qp-custom-btn').onclick = () => {
      const text = $('qp-rem-text').value.trim() || '时间到了~';
      const minutes = parseInt($('qp-custom-min').value);
      if (!minutes || minutes < 1) return;
      this.options.onAddReminder?.(text, Date.now() + minutes * 60000, minutes);
      $('qp-custom-min').value = '';
      this.hide();
    };

    // 设闹钟
    $('qp-alarm-btn').onclick = () => {
      const text = $('qp-rem-text').value.trim() || '闹钟响了~';
      const timeStr = $('qp-alarm-time').value;
      if (!timeStr) return;
      const [h, m] = timeStr.split(':').map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const minutes = Math.round((target.getTime() - Date.now()) / 60000);
      this.options.onAddReminder?.(text, target.getTime(), minutes);
      this.hide();
    };

    // 删除提醒
    this.el.querySelectorAll('.qp-rem-del').forEach(btn => {
      btn.onclick = () => this.options.onRemoveReminder?.(btn.dataset.id);
    });

    // 添加便签
    $('qp-note-add').onclick = () => {
      const text = $('qp-note-input').value.trim();
      if (!text) return;
      this.options.onAddNote?.(text);
      this._render(); // 刷新
    };

    // 便签操作
    this.el.querySelectorAll('.qp-note-check').forEach(el => {
      el.onclick = () => { this.options.onToggleNote?.(el.dataset.id); this._render(); };
    });
    this.el.querySelectorAll('.qp-note-pin').forEach(el => {
      el.onclick = () => { this.options.onPinNote?.(el.dataset.id); this._render(); };
    });
    this.el.querySelectorAll('.qp-note-del').forEach(el => {
      el.onclick = () => { this.options.onDeleteNote?.(el.dataset.id); this._render(); };
    });
  }

  destroy() {
    this.el?.remove();
    this.overlay?.remove();
  }
}
