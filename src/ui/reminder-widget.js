/**
 * 提醒列表浮动组件 - 右上角显示，带数量徽章
 * 触发后自动从列表移除
 */
class ReminderWidget {
  constructor(reminderTool) {
    this.reminder = reminderTool;
    this.el = null;
    this.badgeEl = null;
    this.listEl = null;
    this._collapsed = false;
    this._init();
  }

  _init() {
    this.el = document.createElement('div');
    this.el.className = 'web-pet-reminder-widget';
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '12px',
      right: '16px',
      width: '280px',
      zIndex: '2147483640',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
      fontSize: '13px',
      display: 'none', // 有提醒时才显示
      pointerEvents: 'auto'
    });

    this.el.innerHTML = `
      <div class="rw-card" style="
        background: rgba(22,22,30,0.94);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 14px;
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.45);
        overflow: hidden;
        color: #e0e0e0;
        transition: opacity 0.35s, transform 0.35s, max-height 0.4s;
      ">
        <div class="rw-header" style="
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 14px; cursor:pointer; user-select:none;
        ">
          <div style="display:flex;align-items:center;gap:7px;font-weight:600;font-size:13px">
            <span style="font-size:15px">⏰</span>
            <span>提醒</span>
            <span class="rw-badge" style="
              display:inline-flex;align-items:center;justify-content:center;
              min-width:20px;height:20px;padding:0 6px;border-radius:10px;
              font-size:11px;font-weight:700;color:#fff;background:#5b6eea;
            ">0</span>
          </div>
          <span class="rw-chevron" style="font-size:10px;color:#666;transition:transform 0.25s">▼</span>
        </div>
        <div class="rw-body" style="max-height:300px;overflow:hidden;transition:max-height 0.35s">
          <div class="rw-scroll" style="max-height:260px;overflow-y:auto;padding-bottom:4px"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);

    // 折叠切换
    const header = this.el.querySelector('.rw-header');
    header.addEventListener('click', () => this._toggle());

    // 定时刷新列表
    setInterval(() => this.refresh(), 10000);
    this.refresh();

    // 通知天气组件调整位置
    window.addEventListener('web-pet-reminder-widget-resize', () => {});
  }

  /**
   * 获取组件当前高度，供天气组件定位参考
   */
  getHeight() {
    if (!this.el || this.el.style.display === 'none') return 0;
    return this.el.offsetHeight + 8; // 8px gap
  }

  _toggle() {
    this._collapsed = !this._collapsed;
    const body = this.el.querySelector('.rw-body');
    const chev = this.el.querySelector('.rw-chevron');
    body.style.maxHeight = this._collapsed ? '0' : '300px';
    chev.style.transform = this._collapsed ? 'rotate(-90deg)' : '';
  }

  refresh() {
    const all = this.reminder.getAll();
    const active = all.filter(r => r.enabled);
    const badge = this.el.querySelector('.rw-badge');
    const scroll = this.el.querySelector('.rw-scroll');

    badge.textContent = active.length;

    // 有提醒才显示组件
    const wasVisible = this.el.style.display !== 'none';
    const nowVisible = active.length > 0;
    this.el.style.display = nowVisible ? 'block' : 'none';

    // 通知外部组件位置变化
    if (wasVisible !== nowVisible && this.onVisibilityChange) {
      this.onVisibilityChange(nowVisible ? this.getHeight() : 0);
    }

    if (active.length === 0) {
      scroll.innerHTML = '';
      return;
    }

    scroll.innerHTML = active.map(r => {
      const remaining = Math.max(0, r.triggerAt - Date.now());
      const mins = Math.round(remaining / 60000);
      let timeText;
      if (mins < 1) timeText = '即将触发';
      else if (mins < 60) timeText = `剩余 ${mins} 分钟`;
      else timeText = `剩余 ${Math.round(mins / 60)} 小时`;

      const repeatTag = r.repeat === 'daily'
        ? '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(91,110,234,0.18);color:#9fa8da;margin-left:6px">每天</span>'
        : '';

      return `
        <div data-id="${r.id}" style="
          display:flex;align-items:center;padding:9px 14px;gap:10px;
          border-bottom:1px solid rgba(255,255,255,0.03);
          transition:background 0.12s;
        " onmouseenter="this.style.background='rgba(255,255,255,0.025)'" onmouseleave="this.style.background=''">
          <span style="font-size:18px;flex-shrink:0">${this._emoji(r.content)}</span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:500;color:#eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px">${this._esc(r.content)}${repeatTag}</div>
            <div style="font-size:11px;color:#777;margin-top:2px">${timeText}</div>
          </div>
          <span class="rw-del" data-id="${r.id}" style="
            padding:3px 8px;border:1px solid rgba(255,77,79,0.3);border-radius:6px;
            background:rgba(255,77,79,0.08);color:#ff7875;font-size:11px;cursor:pointer;
            flex-shrink:0;transition:background 0.15s;
          " onmouseenter="this.style.background='rgba(255,77,79,0.2)'" onmouseleave="this.style.background='rgba(255,77,79,0.08)'">取消</span>
        </div>
      `;
    }).join('');

    // 绑定取消事件
    scroll.querySelectorAll('.rw-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reminder.remove(btn.dataset.id);
        this.refresh();
      });
    });
  }

  _emoji(text) {
    const t = text.toLowerCase();
    if (/天气|weather/.test(t)) return '🌤️';
    if (/喝水|水/.test(t)) return '💧';
    if (/药/.test(t)) return '💊';
    if (/会议|开会/.test(t)) return '📅';
    if (/打卡|上班/.test(t)) return '🏢';
    if (/睡觉|晚安/.test(t)) return '😴';
    if (/运动|跑步/.test(t)) return '🏃';
    if (/学习|读书/.test(t)) return '📚';
    if (/吃|饭/.test(t)) return '🍚';
    return '⏰';
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  destroy() {
    this.el?.remove();
  }
}
