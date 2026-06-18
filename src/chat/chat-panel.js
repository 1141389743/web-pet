/**
 * 聊天面板 - 横向宽屏布局，可拖动，宠物实时反应
 */
class ChatPanel {
  constructor(options = {}) {
    this.el = null;
    this.overlay = null;
    this._visible = false;
    this._loading = false;
    this.options = options;
    this._isDragging = false;
    this._dragOffset = { x: 0, y: 0 };
    this._init();
  }

  _init() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.1)', zIndex: '2147483646',
      display: 'none'
    });
    this.overlay.addEventListener('click', () => this.hide());
    document.body.appendChild(this.overlay);

    this.el = document.createElement('div');
    this.el.className = 'web-pet-chat-panel';
    Object.assign(this.el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      width: '480px',
      maxWidth: '92vw',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
      fontSize: '13px',
      color: '#333',
      display: 'none',
      overflow: 'hidden'
    });
    document.body.appendChild(this.el);
  }

  show(x, y) {
    this._visible = true;
    this._render();
    this.el.style.display = 'block';
    this.overlay.style.display = 'block';

    const pw = 480;
    let px = x ? x - pw / 2 : (window.innerWidth - pw) / 2;
    let py = y ? y + 20 : window.innerHeight - 260;
    px = Math.max(8, Math.min(px, window.innerWidth - pw - 8));
    if (py + 250 > window.innerHeight) py = y - 260;
    if (py < 8) py = 8;
    this.el.style.left = px + 'px';
    this.el.style.top = py + 'px';

    setTimeout(() => {
      const input = this.el.querySelector('#cp-input');
      if (input) input.focus();
    }, 100);
  }

  hide() {
    this._visible = false;
    this.el.style.display = 'none';
    this.overlay.style.display = 'none';
  }

  _render() {
    const petName = this.options.getPetName?.() || '小爪';
    const messages = this.options.getMessages?.() || [];
    const isConfigured = this.options.isConfigured?.();

    this.el.innerHTML = `
      <div id="cp-header" style="background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:16px">💬</span>
          <span style="font-size:14px;font-weight:600">和${petName}聊天</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="cursor:pointer;font-size:13px;opacity:0.8" id="cp-clear" title="清空对话">🗑️</span>
          <span style="cursor:pointer;font-size:16px" id="cp-close">✕</span>
        </div>
      </div>

      ${!isConfigured ? `
        <div style="padding:24px;text-align:center">
          <div style="font-size:32px;margin-bottom:8px">🔑</div>
          <div style="font-size:13px;color:#666;margin-bottom:12px">请先配置 AI 接口才能聊天</div>
          <button class="cp-btn" id="cp-goto-settings" style="padding:8px 20px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer">去设置</button>
        </div>
      ` : `
        <div id="cp-messages" style="height:180px;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:8px">
          ${messages.length === 0 ? `
            <div style="text-align:center;color:#ccc;padding:30px 0">
              <div style="font-size:24px;margin-bottom:4px">🐾</div>
              <div style="font-size:12px">说点什么和${petName}聊聊吧~</div>
            </div>
          ` : messages.map(m => this._renderMsg(m, petName)).join('')}
          ${this._loading ? `
            <div style="display:flex;gap:5px;align-items:flex-start">
              <span style="font-size:14px">🐱</span>
              <div style="background:#f5f5f5;padding:6px 10px;border-radius:10px;border-top-left-radius:2px;font-size:12px">
                思考中<span class="cp-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="padding:8px 12px;border-top:1px solid #f0f0f0;display:flex;gap:6px;background:#fafafa">
          <input type="text" id="cp-input" placeholder="说点什么..." style="flex:1;padding:8px 10px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;outline:none;background:#fff" />
          <button id="cp-send" style="padding:8px 14px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;flex-shrink:0">发送</button>
        </div>
      `}
    `;

    this._bindEvents();
    this._bindDrag();
    this._scrollBottom();
    this._injectTypingStyle();
  }

  /**
   * 拖动功能
   */
  _bindDrag() {
    const header = this.el.querySelector('#cp-header');
    if (!header) return;

    const onStart = (e) => {
      e.preventDefault();
      this._isDragging = true;
      const cx = e.clientX || e.touches?.[0]?.clientX || 0;
      const cy = e.clientY || e.touches?.[0]?.clientY || 0;
      const rect = this.el.getBoundingClientRect();
      this._dragOffset = { x: cx - rect.left, y: cy - rect.top };
      this.el.style.transition = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    };

    const onMove = (e) => {
      if (!this._isDragging) return;
      e.preventDefault();
      const cx = e.clientX || e.touches?.[0]?.clientX || 0;
      const cy = e.clientY || e.touches?.[0]?.clientY || 0;
      let x = cx - this._dragOffset.x;
      let y = cy - this._dragOffset.y;
      x = Math.max(0, Math.min(x, window.innerWidth - this.el.offsetWidth));
      y = Math.max(0, Math.min(y, window.innerHeight - this.el.offsetHeight));
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
    };

    const onEnd = () => {
      this._isDragging = false;
      this.el.style.transition = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    header.addEventListener('mousedown', onStart);
    header.addEventListener('touchstart', onStart, { passive: false });
  }

  _renderMsg(msg, petName) {
    const isUser = msg.role === 'user';
    const avatar = isUser ? '👤' : '🐱';
    const bg = isUser ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f5f5f5';
    const color = isUser ? '#fff' : '#333';
    const align = isUser ? 'flex-end' : 'flex-start';
    const radius = isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px';

    return `
      <div style="display:flex;gap:5px;align-items:flex-end;justify-content:${align}">
        ${!isUser ? `<span style="font-size:14px;flex-shrink:0">${avatar}</span>` : ''}
        <div style="max-width:75%">
          <div style="background:${bg};color:${color};padding:6px 10px;border-radius:${radius};white-space:pre-wrap;word-break:break-word;line-height:1.4;font-size:12px">${this._esc(msg.content)}</div>
        </div>
        ${isUser ? `<span style="font-size:14px;flex-shrink:0">${avatar}</span>` : ''}
      </div>
    `;
  }

  _bindEvents() {
    const $ = id => this.el.querySelector('#' + id);

    $('cp-close').onclick = () => this.hide();

    const clearBtn = $('cp-clear');
    if (clearBtn) clearBtn.onclick = () => {
      this.options.onClear?.();
      this._render();
    };

    const gotoSettings = $('cp-goto-settings');
    if (gotoSettings) gotoSettings.onclick = () => {
      this.hide();
      this.options.onOpenSettings?.();
    };

    const input = $('cp-input');
    const sendBtn = $('cp-send');
    if (!input || !sendBtn) return;

    const doSend = () => {
      const text = input.value.trim();
      if (!text || this._loading) return;
      input.value = '';
      this.options.onSend?.(text);
    };

    sendBtn.onclick = doSend;
    input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };
  }

  _scrollBottom() {
    const box = this.el.querySelector('#cp-messages');
    if (box) setTimeout(() => box.scrollTop = box.scrollHeight, 50);
  }

  setLoading(v) {
    this._loading = v;
    if (this._visible) this._render();
  }

  refresh() {
    if (this._visible) this._render();
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _injectTypingStyle() {
    if (document.getElementById('cp-typing-style')) return;
    const s = document.createElement('style');
    s.id = 'cp-typing-style';
    s.textContent = `
      @keyframes cp-blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
      .cp-dots span:nth-child(1) { animation: cp-blink 1.4s 0s infinite; }
      .cp-dots span:nth-child(2) { animation: cp-blink 1.4s 0.2s infinite; }
      .cp-dots span:nth-child(3) { animation: cp-blink 1.4s 0.4s infinite; }
    `;
    document.head.appendChild(s);
  }

  destroy() {
    this.el?.remove();
    this.overlay?.remove();
  }
}
