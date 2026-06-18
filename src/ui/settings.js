/**
 * 设置面板 - 可视化配置界面
 */
class SettingsPanel {
  constructor(options = {}) {
    this.el = null;
    this.options = options;
    this._visible = false;
    this._init();
  }

  _init() {
    this.el = document.createElement('div');
    this.el.className = 'web-pet-settings';
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '360px', maxWidth: '90vw',
      maxHeight: '80vh',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      zIndex: '2147483647',
      display: 'none',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    });

    // 遮罩
    this._overlay = document.createElement('div');
    Object.assign(this._overlay.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', zIndex: '2147483646',
      display: 'none'
    });
    this._overlay.addEventListener('click', () => this.hide());
    document.body.appendChild(this._overlay);

    document.body.appendChild(this.el);
  }

  show() {
    this._render();
    this.el.style.display = 'block';
    this._overlay.style.display = 'block';
    this._visible = true;
  }

  hide() {
    this.el.style.display = 'none';
    this._overlay.style.display = 'none';
    this._visible = false;
  }

  toggle() {
    this._visible ? this.hide() : this.show();
  }

  _render() {
    const cfg = this.options.getConfig?.() || {};

    this.el.innerHTML = `
      <div style="padding:20px;max-height:80vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;font-size:16px">⚙️ 设置</h3>
          <span style="cursor:pointer;font-size:20px;color:#999" id="sp-close">✕</span>
        </div>

        <div class="sp-section">
          <div class="sp-title">🎨 显示</div>
          <div class="sp-row">
            <span>大小</span>
            <input type="range" id="sp-scale" min="20" max="200" value="${Math.round((cfg.scale||1)*100)}">
            <span id="sp-scale-val">${Math.round((cfg.scale||1)*100)}%</span>
          </div>
          <div class="sp-row">
            <span>透明度</span>
            <input type="range" id="sp-opacity" min="20" max="100" value="${Math.round((cfg.opacity||1)*100)}">
            <span id="sp-opacity-val">${Math.round((cfg.opacity||1)*100)}%</span>
          </div>
          <div class="sp-row">
            <span>边缘吸附</span>
            <input type="checkbox" id="sp-edge-snap" ${cfg.edgeSnap !== false ? 'checked' : ''}>
          </div>
          <div class="sp-row">
            <span>闲置小动作</span>
            <input type="checkbox" id="sp-idle" ${cfg.idleEnabled !== false ? 'checked' : ''}>
          </div>
          <div class="sp-row">
            <span>闲置间隔(秒)</span>
            <input type="number" id="sp-idle-interval" min="5" max="120" value="${Math.round((cfg.idleInterval||8000)/1000)}" style="width:60px">
          </div>
        </div>

        <div class="sp-section">
          <div class="sp-title">🔔 提醒</div>
          <div class="sp-row">
            <span>整点报时</span>
            <input type="checkbox" id="sp-hourly" ${cfg.hourlyEnabled !== false ? 'checked' : ''}>
          </div>
          <div class="sp-row">
            <span>静默时段</span>
            <span>${cfg.silentStart||23}:00 - ${cfg.silentEnd||7}:00</span>
          </div>
          <div id="sp-reminders" style="margin-top:10px">
            <div style="font-size:12px;color:#666;margin-bottom:6px">进行中的提醒</div>
            ${(() => {
              const reminders = this.options.getReminders?.() || [];
              const active = reminders.filter(r => r.enabled);
              if (active.length === 0) return '<div style="font-size:12px;color:#ccc;padding:8px 0">暂无提醒</div>';
              return active.map(r => {
                const mins = Math.max(0, Math.round((r.triggerAt - Date.now()) / 60000));
                const timeText = mins < 60 ? mins + '分钟' : Math.round(mins/60) + '小时';
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f5f5f5">
                  <div>
                    <div style="font-size:13px">${r.content}</div>
                    <div style="font-size:11px;color:#999">还剩 ${timeText}</div>
                  </div>
                  <button class="sp-btn sp-btn-danger sp-rem-cancel" data-id="${r.id}" style="padding:3px 8px;font-size:11px">取消</button>
                </div>`;
              }).join('');
            })()}
          </div>
        </div>

        <div class="sp-section">
          <div class="sp-title">🐾 皮肤</div>
          <div id="sp-skin-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px"></div>
          <div style="margin-top:8px">
            <button class="sp-btn" id="sp-import-img" style="width:100%">📷 导入图片作为宠物</button>
          </div>
          <div style="margin-top:6px;font-size:11px;color:#999">
            支持 PNG / JPG / GIF，建议 100x100 像素的透明背景图片
          </div>
        </div>

        <div class="sp-section">
          <div class="sp-title">💾 数据</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="sp-btn" id="sp-export">导出配置</button>
            <button class="sp-btn" id="sp-import">导入配置</button>
            <button class="sp-btn sp-btn-danger" id="sp-reset">重置数据</button>
          </div>
        </div>
      </div>
    `;

    // 注入样式
    if (!document.getElementById('sp-styles')) {
      const style = document.createElement('style');
      style.id = 'sp-styles';
      style.textContent = `
        .sp-section { margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f0f0f0; }
        .sp-title { font-weight:600;font-size:14px;margin-bottom:10px; }
        .sp-row { display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px; }
        .sp-row input[type=range] { flex:1;margin:0 10px; }
        .sp-btn { padding:6px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:12px; }
        .sp-btn:hover { background:#f5f5f5; }
        .sp-btn-danger { color:#FF4D4F;border-color:#FFCCC7; }
        .sp-btn-danger:hover { background #FFF1F0; }
        .sp-skin-item { padding:6px 12px;border:2px solid #eee;border-radius:8px;cursor:pointer;font-size:12px; }
        .sp-skin-item.active { border-color:#FF6B81;background:#FFE8E8; }
      `;
      document.head.appendChild(style);
    }

    this._bindEvents(cfg);
  }

  _bindEvents(cfg) {
    const $ = id => this.el.querySelector('#' + id);

    $('sp-close').onclick = () => this.hide();

    $('sp-scale').oninput = (e) => {
      const v = e.target.value;
      $('sp-scale-val').textContent = v + '%';
      this.options.onScaleChange?.(v / 100);
    };

    $('sp-opacity').oninput = (e) => {
      const v = e.target.value;
      $('sp-opacity-val').textContent = v + '%';
      this.options.onOpacityChange?.(v / 100);
    };

    $('sp-edge-snap').onchange = (e) => this.options.onEdgeSnapChange?.(e.target.checked);
    $('sp-idle').onchange = (e) => this.options.onIdleEnabledChange?.(e.target.checked);
    $('sp-idle-interval').onchange = (e) => this.options.onIdleIntervalChange?.(e.target.value * 1000);
    $('sp-hourly').onchange = (e) => this.options.onHourlyChange?.(e.target.checked);

    // 皮肤列表
    const skinList = $('sp-skin-list');
    const skins = this.options.getSkins?.() || [];
    const currentId = this.options.getCurrentSkinId?.();
    skins.forEach(s => {
      const item = document.createElement('div');
      item.className = 'sp-skin-item' + (s.id === currentId ? ' active' : '');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '6px';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = s.name;
      item.appendChild(nameSpan);
      // 自定义皮肤显示删除按钮
      if (s.id.startsWith('custom_')) {
        const delBtn = document.createElement('span');
        delBtn.textContent = '✕';
        delBtn.style.cssText = 'font-size:10px;color:#ccc;cursor:pointer;margin-left:4px';
        delBtn.onclick = (e) => { e.stopPropagation(); this.options.onSkinDelete?.(s.id); };
        item.appendChild(delBtn);
      }
      item.onclick = () => this.options.onSkinChange?.(s.id);
      skinList.appendChild(item);
    });

    // 导入图片
    $('sp-import-img').onclick = () => this.options.onImportImage?.();

    // 提醒取消按钮
    this.el.querySelectorAll('.sp-rem-cancel').forEach(btn => {
      btn.onclick = () => this.options.onRemoveReminder?.(btn.dataset.id);
    });

    // 数据操作
    $('sp-export').onclick = () => this.options.onExport?.();
    $('sp-import').onclick = () => this.options.onImport?.();
    $('sp-reset').onclick = () => {
      if (confirm('确定要重置所有数据吗？')) this.options.onReset?.();
    };
  }

  destroy() {
    this.el?.remove();
    this._overlay?.remove();
  }
}
