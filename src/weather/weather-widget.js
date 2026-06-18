/**
 * 天气通知浮动卡片 - 右上角显示，1分钟后自动收起
 * 每次天气更新时重新弹出
 */
class WeatherWidget {
  constructor() {
    this.el = null;
    this._hideTimer = null;
    this._tickFrame = null;
    this._shownAt = null;
    this.DISPLAY_MS = 60000; // 显示 1 分钟
    this._init();
  }

  _init() {
    this.el = document.createElement('div');
    this.el.className = 'web-pet-weather-widget';
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '12px',
      right: '16px',
      width: '280px',
      zIndex: '2147483639', // 比提醒组件低一级
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
      fontSize: '13px',
      display: 'none',
      opacity: '0',
      transform: 'translateY(-12px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      pointerEvents: 'auto'
    });

    this.el.innerHTML = `
      <div style="
        background: rgba(22,22,30,0.94);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 14px;
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.45);
        overflow: hidden;
        color: #e0e0e0;
      ">
        <div class="ww-header" style="
          display:flex;align-items:center;justify-content:space-between;
          padding:10px 14px;cursor:pointer;user-select:none;
        ">
          <div style="display:flex;align-items:center;gap:7px;font-weight:600;font-size:13px">
            <span class="ww-pulse" style="
              width:7px;height:7px;border-radius:50%;background:#43a047;flex-shrink:0;
              position:relative;
            "></span>
            <span>天气</span>
            <span class="ww-city" style="font-size:11px;color:#666;font-weight:400"></span>
          </div>
          <span class="ww-chevron" style="font-size:10px;color:#666;transition:transform 0.25s">▼</span>
        </div>
        <div class="ww-body" style="overflow:hidden;transition:max-height 0.35s;max-height:200px">
          <div style="padding:12px 14px;display:flex;align-items:center;gap:14px">
            <div class="ww-emoji" style="font-size:36px;flex-shrink:0">🌡️</div>
            <div style="flex:1">
              <div class="ww-temp" style="font-size:22px;font-weight:700;color:#f5f5f5">--°C</div>
              <div class="ww-desc" style="font-size:12px;color:#aaa;margin-top:1px">加载中…</div>
              <div style="display:flex;gap:10px;margin-top:8px;font-size:11px;color:#777">
                <span>💧 <span class="ww-hum">--%</span></span>
                <span>💨 <span class="ww-wind">--km/h</span></span>
                <span>🌡️ <span class="ww-feel">体感 --°</span></span>
              </div>
            </div>
          </div>
          <div class="ww-timer" style="text-align:right;font-size:10px;color:#444;padding:4px 14px 8px"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);

    // 折叠
    const header = this.el.querySelector('.ww-header');
    header.addEventListener('click', () => this._toggle());

    // 脉冲动画
    this._injectPulseStyle();
  }

  _toggle() {
    const body = this.el.querySelector('.ww-body');
    const chev = this.el.querySelector('.ww-chevron');
    const collapsed = body.style.maxHeight === '0px';
    body.style.maxHeight = collapsed ? '200px' : '0';
    chev.style.transform = collapsed ? '' : 'rotate(-90deg)';
  }

  /**
   * 设置顶部偏移（避免与提醒组件重叠）
   */
  setTopOffset(px) {
    this.el.style.top = px + 'px';
  }

  /**
   * 显示天气卡片，1分钟后自动收起
   * @param {Object} weather - { temp, feelsLike, humidity, desc, code, windSpeed, city }
   */
  show(weather) {
    if (!weather) return;

    // 更新内容
    this.el.querySelector('.ww-emoji').textContent = this._emoji(weather.code);
    this.el.querySelector('.ww-temp').textContent = weather.temp + '°C';
    this.el.querySelector('.ww-desc').textContent = weather.desc;
    this.el.querySelector('.ww-hum').textContent = weather.humidity + '%';
    this.el.querySelector('.ww-wind').textContent = weather.windSpeed + 'km/h';
    this.el.querySelector('.ww-feel').textContent = '体感 ' + weather.feelsLike + '°';
    this.el.querySelector('.ww-city').textContent = weather.city || '';

    // 显示
    this.el.style.display = 'block';
    requestAnimationFrame(() => {
      this.el.style.opacity = '1';
      this.el.style.transform = 'translateY(0)';
    });

    // 计时
    this._shownAt = Date.now();
    if (this._hideTimer) clearTimeout(this._hideTimer);
    if (this._tickFrame) cancelAnimationFrame(this._tickFrame);

    this._hideTimer = setTimeout(() => this._hide(), this.DISPLAY_MS);
    this._tickTimer();
  }

  _hide() {
    this.el.style.opacity = '0';
    this.el.style.transform = 'translateY(-12px)';
    setTimeout(() => {
      this.el.style.display = 'none';
      this._shownAt = null;
    }, 400);
  }

  _tickTimer() {
    if (!this._shownAt) return;
    const elapsed = Math.floor((Date.now() - this._shownAt) / 1000);
    const remaining = Math.max(0, 60 - elapsed);
    this.el.querySelector('.ww-timer').textContent = remaining + 's 后自动收起';
    if (remaining > 0) this._tickFrame = requestAnimationFrame(() => this._tickTimer());
  }

  _emoji(code) {
    const map = {
      113:'☀️',116:'⛅',119:'☁️',122:'☁️',143:'🌫️',
      176:'🌦️',179:'🌨️',182:'🌨️',185:'🌨️',200:'⛈️',
      227:'🌨️',230:'❄️',248:'🌫️',260:'🌫️',263:'🌦️',
      266:'🌧️',281:'🌨️',284:'🌨️',293:'🌦️',296:'🌧️',
      299:'🌧️',302:'🌧️',305:'🌧️',308:'🌧️',311:'🌨️',
      314:'🌨️',317:'🌨️',320:'🌨️',323:'🌨️',326:'🌨️',
      329:'❄️',332:'❄️',335:'❄️',338:'❄️',350:'🌨️',
      353:'🌦️',356:'🌧️',359:'🌧️',362:'🌨️',365:'🌨️',
      368:'🌨️',371:'❄️',374:'🌨️',377:'🌨️',386:'⛈️',
      389:'⛈️',392:'⛈️',395:'❄️',
    };
    return map[code] || '🌡️';
  }

  _injectPulseStyle() {
    if (document.getElementById('ww-pulse-style')) return;
    const s = document.createElement('style');
    s.id = 'ww-pulse-style';
    s.textContent = `
      @keyframes ww-pulse-ring {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .ww-pulse::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        border: 2px solid rgba(67,160,71,0.3);
        animation: ww-pulse-ring 2s ease-out infinite;
      }
    `;
    document.head.appendChild(s);
  }

  destroy() {
    clearTimeout(this._hideTimer);
    cancelAnimationFrame(this._tickFrame);
    this.el?.remove();
  }
}
