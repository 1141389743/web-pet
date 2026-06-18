/**
 * 对话气泡系统 - 气泡渲染、语录池、消息队列
 */
class BubbleSystem {
  constructor(container) {
    this.container = container;
    this.el = null;
    this._queue = [];
    this._showing = false;
    this._timer = null;
    this._defaultDuration = 3000;
    this._quotes = {
      click: ['你好呀~', '别戳我啦！', '嘿嘿~', '今天也要加油！', '摸摸头~'],
      hover: ['有什么事吗？', '我在呢~', '嘻嘻', '看着你~'],
      idle: ['有点无聊呢', '打个哈欠~', '好困呀...', '出去玩吧！'],
      reminder: ['⏰ 该休息了', '📋 别忘了待办事项', '💧 记得喝水'],
      hourly: ['', '现在是 {time}', '已经 {time} 了哦~']
    };

    this._init();
  }

  _init() {
    this.el = document.createElement('div');
    this.el.className = 'web-pet-bubble';
    Object.assign(this.el.style, {
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '200px',
      padding: '8px 14px',
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      fontSize: '13px',
      lineHeight: '1.5',
      color: '#333',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      transformOrigin: 'center bottom',
      zIndex: '1',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    });

    // 尖角
    const arrow = document.createElement('div');
    Object.assign(arrow.style, {
      position: 'absolute',
      bottom: '-6px',
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
      width: '12px',
      height: '12px',
      background: 'rgba(255,255,255,0.95)',
      boxShadow: '2px 2px 4px rgba(0,0,0,0.06)'
    });
    this.el.appendChild(arrow);

    this.container.el.appendChild(this.el);
  }

  /**
   * 显示气泡
   * @param {string} text - 文本内容
   * @param {number} duration - 显示时长ms
   * @param {string} type - 类型: normal, reminder, hourly
   */
  show(text, duration = this._defaultDuration, type = 'normal') {
    if (!text) return;

    // 加入队列
    this._queue.push({ text, duration, type });
    if (!this._showing) this._showNext();
  }

  _showNext() {
    if (this._queue.length === 0) {
      this._showing = false;
      return;
    }

    this._showing = true;
    const { text, duration, type } = this._queue.shift();

    // 设置样式
    const colors = {
      normal: { bg: 'rgba(255,255,255,0.95)', color: '#333' },
      reminder: { bg: 'rgba(255,243,224,0.95)', color: '#E65100' },
      hourly: { bg: 'rgba(227,242,253,0.95)', color: '#1565C0' }
    };
    const style = colors[type] || colors.normal;

    this.el.style.background = style.bg;
    this.el.style.color = style.color;
    this.el.querySelector('div').style.background = style.bg; // arrow

    // 设置文本（去掉箭头）
    const arrow = this.el.lastChild;
    this.el.textContent = text;
    this.el.appendChild(arrow);

    // 显示动画
    this.el.style.opacity = '1';
    this.el.style.transform = 'translateX(-50%) translateY(0)';

    // 自动隐藏
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.el.style.opacity = '0';
      this.el.style.transform = 'translateX(-50%) translateY(5px)';
      setTimeout(() => this._showNext(), 300);
    }, duration);
  }

  /**
   * 从语录池随机获取
   */
  getRandomQuote(category) {
    const pool = this._quotes[category];
    if (!pool || pool.length === 0) return '';
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * 添加自定义语录
   */
  addQuote(category, text) {
    if (!this._quotes[category]) this._quotes[category] = [];
    this._quotes[category].push(text);
  }

  /**
   * 设置语录池
   */
  setQuotes(category, quotes) {
    this._quotes[category] = quotes;
  }

  /**
   * 获取所有语录
   */
  getAllQuotes() {
    return { ...this._quotes };
  }

  destroy() {
    clearTimeout(this._timer);
    this.el?.remove();
  }
}
