/**
 * 聊天面板 - 与宠物对话的浮动窗口
 */
class ChatPanel {
  constructor(options = {}) {
    this.el = null;
    this.overlay = null;
    this._visible = false;
    this._loading = false;
    this.options = options;
    this._init();
  }

  _init() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.15)', zIndex: '2147483646',
      display: 'none'
    });
    this.overlay.addEventListener('click', () => this.hide());
    document.body.appendChild(this.overlay);

    this.el = document.createElement('div');
    this.el.className = 'web-pet-chat-panel';
    Object.assign(this.el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      width: '360px',
      maxWidth: '90vw',
      height: '480px',
      maxHeight: '80vh',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
      fontSize: '13px',
      color: '#333',
      display: 'none',
      overflow: 'hidden',
      flexDirection: 'column'
    });
    document.body.appendChild(this.el);
  }

  show(x, y) {
    this._visible = true;
    this._render();
    this.el.style.display = 'flex';
    this.overlay.style.display = 'block';

    // 定位
    const pw = 360, ph = 480;
    let px = x ? Math.min(x, window.innerWidth - pw - 10) : (window.innerWidth - pw) / 2;
    let py = y ? y - ph - 20 : (window.innerHeight - ph) / 2;
    if (py < 10) py = y ? y + 20 : 10;
    if (px < 10) px = 10;
    this.el.style.left = px + 'px';
    this.el.style.top = py + 'px';

    // 聚焦输入框
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
      <div style="background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">💬</span>
          <span style="font-size:15px;font-weight:600">和${petName}聊天</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="cursor:pointer;font-size:14px;opacity:0.8" id="cp-clear" title="清空对话">🗑️</span>
          <span style="cursor:pointer;font-size:18px" id="cp-close">✕</span>
        </div>
      </div>

      ${!isConfigured ? `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center">
          <div style="font-size:40px;margin-bottom:12px">🔑</div>
          <div style="font-size:14px;color:#666;margin-bottom:16px">请先配置 AI 接口才能聊天</div>
          <button class="cp-btn" id="cp-goto-settings" style="padding:10px 24px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">去设置</button>
        </div>
      ` : `
        <div id="cp-messages" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px">
          ${messages.length === 0 ? `
            <div style="text-align:center;color:#ccc;padding:40px 0">
              <div style="font-size:32px;margin-bottom:8px">🐾</div>
              <div>说点什么和${petName}聊聊吧~</div>
            </div>
          ` : messages.map(m => this._renderMsg(m, petName)).join('')}
          ${this._loading ? `
            <div style="display:flex;gap:6px;align-items:flex-start">
              <span style="font-size:16px">🐱</span>
              <div style="background:#f5f5f5;padding:8px 12px;border-radius:12px;border-top-left-radius:2px">
                <span class="cp-typing">思考中<span class="cp-dots">...</span></span>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="padding:10px 14px;border-top:1px solid #f0f0f0;display:flex;gap:8px;flex-shrink:0;background:#fafafa">
          <input type="text" id="cp-input" placeholder="说点什么..." style="flex:1;padding:10px 12px;border:1px solid #e0e0e0;border-radius:10px;font-size:13px;outline:none;background:#fff" />
          <button id="cp-send" style="padding:10px 16px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer;flex-shrink:0">发送</button>
        </div>
      `}
    `;

    this._bindEvents();
    this._scrollBottom();
    this._injectTypingStyle();
  }

  _renderMsg(msg, petName) {
    const isUser = msg.role === 'user';
    const avatar = isUser ? '👤' : '🐱';
    const name = isUser ? '你' : petName;
    const bg = isUser ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f5f5f5';
    const color = isUser ? '#fff' : '#333';
    const align = isUser ? 'flex-end' : 'flex-start';
    const radius = isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px';

    return `
      <div style="display:flex;gap:6px;align-items:flex-start;justify-content:${align}">
        ${!isUser ? `<span style="font-size:16px;flex-shrink:0">${avatar}</span>` : ''}
        <div style="max-width:80%">
          <div style="font-size:11px;color:#999;margin-bottom:3px;text-align:${isUser ? 'right' : 'left'}">${name}</div>
          <div style="background:${bg};color:${color};padding:8px 12px;border-radius:${radius};white-space:pre-wrap;word-break:break-word;line-height:1.5">${this._esc(msg.content)}</div>
        </div>
        ${isUser ? `<span style="font-size:16px;flex-shrink:0">${avatar}</span>` : ''}
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
