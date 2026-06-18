/**
 * 天气模块 - 获取天气并渲染宠物天气特效
 * 使用 wttr.in 免费API，无需key
 */
class WeatherSystem {
  constructor(container, bubble) {
    this.container = container;
    this.bubble = bubble;
    this.currentWeather = null;
    this.effectEl = null;
    this._timer = null;
    this._updateInterval = 3600000; // 1小时

    this._init();
  }

  _init() {
    // 创建天气特效容器
    this.effectEl = document.createElement('div');
    this.effectEl.className = 'web-pet-weather';
    Object.assign(this.effectEl.style, {
      position: 'absolute',
      top: '-30px',
      left: '-20px',
      right: '-20px',
      bottom: '-10px',
      pointerEvents: 'none',
      zIndex: '0',
      overflow: 'visible'
    });
    this.container.el.insertBefore(this.effectEl, this.container.el.firstChild);

    // 注入动画样式
    this._injectStyles();

    // 首次获取
    this._fetchWeather();
    // 定时更新
    this._timer = setInterval(() => this._fetchWeather(), this._updateInterval);
  }

  async _fetchWeather() {
    try {
      // 先尝试获取位置
      const city = await this._detectCity();
      const url = `https://wttr.in/${city}?format=j1`;

      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();

      const current = data.current_condition?.[0];
      if (!current) return;

      this.currentWeather = {
        temp: parseInt(current.temp_C),
        feelsLike: parseInt(current.FeelsLikeC),
        humidity: parseInt(current.humidity),
        desc: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '',
        code: parseInt(current.weatherCode),
        windSpeed: parseInt(current.windspeedKmph),
        city: city
      };

      this._applyWeatherEffect();
      console.log('[WebPet] 天气更新:', this.currentWeather.desc, this.currentWeather.temp + '°C');

      // 通知外部（天气卡片）
      if (this.onWeatherUpdate) {
        this.onWeatherUpdate(this.currentWeather);
      }
    } catch (e) {
      console.warn('[WebPet] 天气获取失败:', e);
    }
  }

  async _detectCity() {
    // 尝试从 chrome.storage.local 或 localStorage 读取用户设置的城市
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('web_pet_city');
        if (data.web_pet_city) return data.web_pet_city;
      } else {
        const saved = localStorage.getItem('web_pet_city');
        if (saved) return saved;
      }
    } catch {}

    // 尝试用IP定位
    try {
      const resp = await fetch('https://ipapi.co/json/');
      const data = await resp.json();
      const city = data.city || 'Beijing';
      this._saveCity(city);
      return city;
    } catch {}

    return 'Beijing'; // 默认
  }

  _saveCity(city) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ web_pet_city: city });
      } else {
        localStorage.setItem('web_pet_city', city);
      }
    } catch {}
  }

  setCity(city) {
    this._saveCity(city);
    this._fetchWeather();
  }

  _applyWeatherEffect() {
    if (!this.currentWeather) return;
    const w = this.currentWeather;

    // 清除旧特效
    this.effectEl.innerHTML = '';

    // 天气代码映射
    const code = w.code;

    // 晴天
    if ([113].includes(code)) {
      this._renderSunny();
    }
    // 多云
    else if ([116, 119, 122].includes(code)) {
      this._renderCloudy();
    }
    // 雨
    else if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(code)) {
      this._renderRain();
    }
    // 雪
    else if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(code)) {
      this._renderSnow();
    }
    // 雷暴
    else if ([200, 386, 389, 392, 395].includes(code)) {
      this._renderThunder();
    }
    // 雾
    else if ([143, 248, 260].includes(code)) {
      this._renderFog();
    }

    // 天气气泡
    this.bubble.show(`${this._getWeatherEmoji(code)} ${w.desc} ${w.temp}°C`, 3000, 'normal');
  }

  _getWeatherEmoji(code) {
    if (code === 113) return '☀️';
    if ([116, 119, 122].includes(code)) return '⛅';
    if ([176, 263, 266, 293, 296, 299, 302, 305, 308].includes(code)) return '🌧️';
    if ([179, 182, 185, 227, 230].includes(code)) return '🌨️';
    if ([200, 386, 389, 392, 395].includes(code)) return '⛈️';
    if ([143, 248, 260].includes(code)) return '🌫️';
    return '🌤️';
  }

  _renderSunny() {
    const sun = document.createElement('div');
    sun.className = 'weather-sun';
    Object.assign(sun.style, {
      position: 'absolute', top: '-25px', right: '-15px',
      width: '30px', height: '30px',
      background: 'radial-gradient(circle, #FFD700, #FFA500)',
      borderRadius: '50%',
      boxShadow: '0 0 15px rgba(255,215,0,0.6)',
      animation: 'weather-sun-pulse 2s ease-in-out infinite'
    });
    this.effectEl.appendChild(sun);
  }

  _renderCloudy() {
    for (let i = 0; i < 2; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'weather-cloud';
      const size = 20 + i * 10;
      Object.assign(cloud.style, {
        position: 'absolute',
        top: (-20 + i * 8) + 'px',
        left: (i * 30 - 10) + 'px',
        width: size + 'px',
        height: (size * 0.6) + 'px',
        background: 'rgba(200,200,200,0.7)',
        borderRadius: '50%',
        animation: `weather-cloud-drift ${3 + i}s ease-in-out infinite alternate`
      });
      this.effectEl.appendChild(cloud);
    }
  }

  _renderRain() {
    // 乌云
    const cloud = document.createElement('div');
    Object.assign(cloud.style, {
      position: 'absolute', top: '-28px', left: '10%',
      width: '80%', height: '20px',
      background: 'rgba(100,100,120,0.6)',
      borderRadius: '50%'
    });
    this.effectEl.appendChild(cloud);

    // 雨滴
    for (let i = 0; i < 8; i++) {
      const drop = document.createElement('div');
      drop.className = 'weather-rain-drop';
      Object.assign(drop.style, {
        position: 'absolute',
        top: '-10px',
        left: (10 + Math.random() * 80) + '%',
        width: '2px',
        height: '8px',
        background: 'linear-gradient(transparent, rgba(100,150,255,0.6))',
        borderRadius: '0 0 2px 2px',
        animation: `weather-rain-fall ${0.5 + Math.random() * 0.5}s linear ${Math.random() * 0.5}s infinite`
      });
      this.effectEl.appendChild(drop);
    }
  }

  _renderSnow() {
    for (let i = 0; i < 10; i++) {
      const flake = document.createElement('div');
      flake.className = 'weather-snow-flake';
      const size = 3 + Math.random() * 4;
      Object.assign(flake.style, {
        position: 'absolute',
        top: '-10px',
        left: (Math.random() * 100) + '%',
        width: size + 'px',
        height: size + 'px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '50%',
        boxShadow: '0 0 3px rgba(200,220,255,0.5)',
        animation: `weather-snow-fall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`
      });
      this.effectEl.appendChild(flake);
    }
  }

  _renderThunder() {
    // 乌云
    const cloud = document.createElement('div');
    Object.assign(cloud.style, {
      position: 'absolute', top: '-30px', left: '5%',
      width: '90%', height: '22px',
      background: 'rgba(60,60,80,0.7)',
      borderRadius: '50%'
    });
    this.effectEl.appendChild(cloud);

    // 闪电
    const bolt = document.createElement('div');
    bolt.className = 'weather-thunder';
    Object.assign(bolt.style, {
      position: 'absolute', top: '-8px', left: '45%',
      width: '3px', height: '20px',
      background: '#FFD700',
      boxShadow: '0 0 8px rgba(255,215,0,0.8)',
      animation: 'weather-thunder-flash 3s ease-in-out infinite',
      transform: 'rotate(15deg)'
    });
    this.effectEl.appendChild(bolt);

    // 雨滴
    this._renderRain();
  }

  _renderFog() {
    for (let i = 0; i < 3; i++) {
      const fog = document.createElement('div');
      Object.assign(fog.style, {
        position: 'absolute',
        top: (10 + i * 20) + 'px',
        left: '-20px',
        right: '-20px',
        height: '8px',
        background: 'rgba(200,200,200,0.3)',
        borderRadius: '4px',
        animation: `weather-fog-drift ${4 + i}s ease-in-out ${i * 0.5}s infinite alternate`
      });
      this.effectEl.appendChild(fog);
    }
  }

  _injectStyles() {
    if (document.getElementById('weather-styles')) return;
    const style = document.createElement('style');
    style.id = 'weather-styles';
    style.textContent = `
      @keyframes weather-sun-pulse {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      @keyframes weather-cloud-drift {
        0% { transform: translateX(-5px); }
        100% { transform: translateX(5px); }
      }
      @keyframes weather-rain-fall {
        0% { transform: translateY(-10px); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translateY(120px); opacity: 0; }
      }
      @keyframes weather-snow-fall {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateY(130px) rotate(360deg); opacity: 0; }
      }
      @keyframes weather-thunder-flash {
        0%, 45%, 55%, 100% { opacity: 0; }
        48%, 52% { opacity: 1; }
      }
      @keyframes weather-fog-drift {
        0% { transform: translateX(-8px); opacity: 0.2; }
        100% { transform: translateX(8px); opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }

  getWeatherInfo() {
    if (!this.currentWeather) return '天气获取中...';
    const w = this.currentWeather;
    return `${this._getWeatherEmoji(w.code)} ${w.desc} ${w.temp}°C 体感${w.feelsLike}°C 湿度${w.humidity}%`;
  }

  destroy() {
    clearInterval(this._timer);
    this.effectEl?.remove();
  }
}
