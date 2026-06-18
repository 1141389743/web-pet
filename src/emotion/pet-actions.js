/**
 * 宠物动作系统 - 影分身、跳舞、旋转、招手等
 * 纯CSS动画实现，不依赖额外精灵帧
 */
class PetActions {
  constructor(container, bubble, emotion) {
    this.container = container;
    this.bubble = bubble;
    this.emotion = emotion;
    this._activeEffects = [];
    this._injectStyles();
  }

  /**
   * 执行动作
   * @param {string} action - 动作名
   */
  execute(action) {
    const actions = {
      clone: () => this.shadowClone(),
      dance: () => this.dance(),
      spin: () => this.spin(),
      wave: () => this.wave(),
      sleep: () => this.sleep(),
      peek: () => this.peek(),
      stretch: () => this.stretch(),
      bounce: () => this.bounce(),
      shake: () => this.shake(),
      float: () => this.float(),
      sparkle: () => this.sparkle(),
      heart: () => this.showHeart(),
      angry: () => this.angry(),
      hide: () => this.hide_peek(),
      dizzy: () => this.dizzy()
    };

    const fn = actions[action];
    if (fn) fn();
  }

  /**
   * 影分身 - 宠物分裂出多个残影
   */
  shadowClone() {
    const el = this.container.el;
    const rect = el.getBoundingClientRect();
    const clones = 4;

    this.bubble.show('🐾 影分身之术！', 2000);

    for (let i = 0; i < clones; i++) {
      const clone = document.createElement('div');
      clone.className = 'pet-clone';
      Object.assign(clone.style, {
        position: 'fixed',
        left: (rect.left + (i - 1.5) * 60) + 'px',
        top: (rect.top + Math.sin(i) * 30) + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        backgroundImage: el.style.backgroundImage || '',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        opacity: '0',
        zIndex: '2147483640',
        pointerEvents: 'none',
        transition: 'all 0.4s ease'
      });

      // 如果宠物是emoji显示
      const img = el.querySelector('img');
      if (img) {
        clone.style.backgroundImage = `url(${img.src})`;
      } else {
        clone.textContent = el.textContent || '🐱';
        clone.style.display = 'flex';
        clone.style.alignItems = 'center';
        clone.style.justifyContent = 'center';
        clone.style.fontSize = el.style.fontSize || '48px';
      }

      document.body.appendChild(clone);
      this._activeEffects.push(clone);

      // 分身出现动画
      setTimeout(() => {
        clone.style.opacity = '0.6';
        clone.style.transform = `scale(0.8) rotate(${(i - 1.5) * 15}deg)`;
      }, i * 100);

      // 分身消失
      setTimeout(() => {
        clone.style.opacity = '0';
        clone.style.transform = `scale(0.3) rotate(${(i - 1.5) * 30}deg) translateY(-50px)`;
      }, 1200 + i * 150);

      setTimeout(() => clone.remove(), 2000);
    }

    // 本体抖动
    el.style.animation = 'pet-shake 0.15s ease 4';
    setTimeout(() => el.style.animation = '', 600);
  }

  /**
   * 跳舞 - 宠物左右摇摆+弹跳
   */
  dance() {
    const el = this.container.el;
    this.bubble.show('💃 嗨起来~', 2000);
    el.style.animation = 'pet-dance 0.5s ease-in-out 6';
    setTimeout(() => el.style.animation = '', 3000);
  }

  /**
   * 旋转 - 360度旋转
   */
  spin() {
    const el = this.container.el;
    this.bubble.show('🌀 转圈圈~', 1500);
    el.style.animation = 'pet-spin 0.8s ease-in-out 3';
    setTimeout(() => el.style.animation = '', 2400);
  }

  /**
   * 招手 - 左右摆动
   */
  wave() {
    const el = this.container.el;
    this.bubble.show('👋 嗨~', 1500);
    el.style.animation = 'pet-wave 0.4s ease-in-out 5';
    setTimeout(() => el.style.animation = '', 2000);
  }

  /**
   * 睡觉 - ZZZ 动画
   */
  sleep() {
    const el = this.container.el;
    const rect = el.getBoundingClientRect();

    // ZZZ 气泡
    for (let i = 0; i < 3; i++) {
      const z = document.createElement('div');
      z.className = 'pet-zzz';
      z.textContent = 'Z';
      Object.assign(z.style, {
        position: 'fixed',
        left: (rect.right - 10 + i * 12) + 'px',
        top: (rect.top - 10) + 'px',
        fontSize: (14 + i * 6) + 'px',
        fontWeight: '700',
        color: '#667eea',
        opacity: '0',
        zIndex: '2147483645',
        pointerEvents: 'none',
        animation: `pet-zzz-rise ${1.5 + i * 0.3}s ease-out ${i * 0.4}s infinite`
      });
      document.body.appendChild(z);
      this._activeEffects.push(z);
      setTimeout(() => z.remove(), 5000);
    }

    // 宠物微微下垂
    el.style.animation = 'pet-breathe 2s ease-in-out infinite';
    setTimeout(() => el.style.animation = '', 8000);
  }

  /**
   * 偷看 - 宠物缩小然后弹出
   */
  peek() {
    const el = this.container.el;
    this.bubble.show('👀 嘘...我在偷看', 1500);
    el.style.animation = 'pet-peek 1.2s ease-in-out';
    setTimeout(() => el.style.animation = '', 1200);
  }

  /**
   * 伸懒腰
   */
  stretch() {
    const el = this.container.el;
    this.bubble.show('🥱 嗯~伸个懒腰', 1500);
    el.style.animation = 'pet-stretch 1.5s ease-in-out';
    setTimeout(() => el.style.animation = '', 1500);
  }

  /**
   * 弹跳
   */
  bounce() {
    const el = this.container.el;
    this.bubble.show('⬆️ 蹦蹦跳跳~', 1500);
    el.style.animation = 'pet-bounce 0.4s ease 5';
    setTimeout(() => el.style.animation = '', 2000);
  }

  /**
   * 抖动（害怕/冷）
   */
  shake() {
    const el = this.container.el;
    el.style.animation = 'pet-shake 0.1s ease 8';
    setTimeout(() => el.style.animation = '', 800);
  }

  /**
   * 漂浮
   */
  float() {
    const el = this.container.el;
    this.bubble.show('☁️ 飘飘~', 2000);
    el.style.animation = 'pet-float 3s ease-in-out infinite';
    setTimeout(() => el.style.animation = '', 6000);
  }

  /**
   * 闪光特效
   */
  sparkle() {
    const el = this.container.el;
    const rect = el.getBoundingClientRect();

    for (let i = 0; i < 8; i++) {
      const star = document.createElement('div');
      star.textContent = '✨';
      const angle = (i / 8) * Math.PI * 2;
      const radius = 50 + Math.random() * 30;
      Object.assign(star.style, {
        position: 'fixed',
        left: (rect.left + rect.width / 2 + Math.cos(angle) * radius) + 'px',
        top: (rect.top + rect.height / 2 + Math.sin(angle) * radius) + 'px',
        fontSize: '14px',
        opacity: '0',
        zIndex: '2147483645',
        pointerEvents: 'none',
        transition: 'all 0.6s ease-out'
      });
      document.body.appendChild(star);
      this._activeEffects.push(star);

      setTimeout(() => {
        star.style.opacity = '1';
        star.style.transform = `scale(1.5) translate(${Math.cos(angle) * 20}px, ${Math.sin(angle) * 20}px)`;
      }, i * 80);

      setTimeout(() => {
        star.style.opacity = '0';
        star.style.transform = `scale(0) translate(${Math.cos(angle) * 40}px, ${Math.sin(angle) * 40}px)`;
      }, 600 + i * 80);

      setTimeout(() => star.remove(), 1500);
    }
  }

  /**
   * 爱心
   */
  showHeart() {
    const el = this.container.el;
    const rect = el.getBoundingClientRect();
    const hearts = ['❤️', '💕', '💖', '💗'];

    for (let i = 0; i < 5; i++) {
      const heart = document.createElement('div');
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      Object.assign(heart.style, {
        position: 'fixed',
        left: (rect.left + rect.width / 2 + (Math.random() - 0.5) * 40) + 'px',
        top: (rect.top - 10) + 'px',
        fontSize: (16 + Math.random() * 10) + 'px',
        opacity: '0',
        zIndex: '2147483645',
        pointerEvents: 'none',
        animation: `pet-heart-rise ${1.5 + Math.random()}s ease-out ${i * 0.2}s forwards`
      });
      document.body.appendChild(heart);
      this._activeEffects.push(heart);
      setTimeout(() => heart.remove(), 3000);
    }
  }

  /**
   * 生气 - 变红+抖动
   */
  angry() {
    const el = this.container.el;
    this.bubble.show('😤 哼！', 1500);
    el.style.filter = 'hue-rotate(-30deg) saturate(1.5)';
    el.style.animation = 'pet-shake 0.1s ease 6';
    setTimeout(() => {
      el.style.filter = '';
      el.style.animation = '';
    }, 1000);
  }

  /**
   * 探头探脑
   */
  hide_peek() {
    const el = this.container.el;
    this.bubble.show('🫣 嘘...', 1500);
    el.style.animation = 'pet-hide-peek 2s ease-in-out';
    setTimeout(() => el.style.animation = '', 2000);
  }

  /**
   * 晕 - 转圈
   */
  dizzy() {
    const el = this.container.el;
    this.bubble.show('💫 晕了~', 2000);
    el.style.animation = 'pet-dizzy 0.3s linear 10';
    setTimeout(() => el.style.animation = '', 3000);
  }

  _injectStyles() {
    if (document.getElementById('pet-actions-styles')) return;
    const s = document.createElement('style');
    s.id = 'pet-actions-styles';
    s.textContent = `
      @keyframes pet-dance {
        0%, 100% { transform: scale(var(--pet-scale,1)) rotate(0deg); }
        25% { transform: scale(var(--pet-scale,1)) rotate(-15deg) translateY(-10px); }
        50% { transform: scale(var(--pet-scale,1)) rotate(15deg) translateY(-5px); }
        75% { transform: scale(var(--pet-scale,1)) rotate(-10deg) translateY(-10px); }
      }
      @keyframes pet-spin {
        from { transform: scale(var(--pet-scale,1)) rotate(0deg); }
        to { transform: scale(var(--pet-scale,1)) rotate(360deg); }
      }
      @keyframes pet-wave {
        0%, 100% { transform: scale(var(--pet-scale,1)) rotate(0deg); }
        50% { transform: scale(var(--pet-scale,1)) rotate(20deg); }
      }
      @keyframes pet-shake {
        0%, 100% { transform: scale(var(--pet-scale,1)) translateX(0); }
        25% { transform: scale(var(--pet-scale,1)) translateX(-5px); }
        75% { transform: scale(var(--pet-scale,1)) translateX(5px); }
      }
      @keyframes pet-bounce {
        0%, 100% { transform: scale(var(--pet-scale,1)) translateY(0); }
        50% { transform: scale(var(--pet-scale,1)) translateY(-20px); }
      }
      @keyframes pet-peek {
        0% { transform: scale(var(--pet-scale,1)); opacity: 1; }
        30% { transform: scale(calc(var(--pet-scale,1) * 0.3)); opacity: 0.3; }
        60% { transform: scale(calc(var(--pet-scale,1) * 0.3)); opacity: 0.3; }
        100% { transform: scale(var(--pet-scale,1)); opacity: 1; }
      }
      @keyframes pet-stretch {
        0% { transform: scale(var(--pet-scale,1)); }
        30% { transform: scale(calc(var(--pet-scale,1) * 1.3)) scaleY(0.8); }
        60% { transform: scale(calc(var(--pet-scale,1) * 0.9)) scaleY(1.2); }
        100% { transform: scale(var(--pet-scale,1)); }
      }
      @keyframes pet-float {
        0%, 100% { transform: scale(var(--pet-scale,1)) translateY(0); }
        50% { transform: scale(var(--pet-scale,1)) translateY(-15px); }
      }
      @keyframes pet-breathe {
        0%, 100% { transform: scale(var(--pet-scale,1)); }
        50% { transform: scale(calc(var(--pet-scale,1) * 1.03)); }
      }
      @keyframes pet-zzz-rise {
        0% { opacity: 0; transform: translateY(0) scale(0.5); }
        30% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-60px) scale(1.2); }
      }
      @keyframes pet-heart-rise {
        0% { opacity: 0; transform: translateY(0) scale(0.5); }
        20% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
      }
      @keyframes pet-hide-peek {
        0% { transform: scale(var(--pet-scale,1)) translateX(0); }
        20% { transform: scale(var(--pet-scale,1)) translateX(-30px); opacity: 0.3; }
        40% { transform: scale(var(--pet-scale,1)) translateX(-30px); opacity: 0.3; }
        50% { transform: scale(var(--pet-scale,1)) translateX(30px); opacity: 0.3; }
        60% { transform: scale(var(--pet-scale,1)) translateX(30px); opacity: 0.8; }
        80% { transform: scale(var(--pet-scale,1)) translateX(0); opacity: 1; }
        100% { transform: scale(var(--pet-scale,1)); opacity: 1; }
      }
      @keyframes pet-dizzy {
        from { transform: scale(var(--pet-scale,1)) rotate(0deg); }
        to { transform: scale(var(--pet-scale,1)) rotate(360deg); }
      }
    `;
    document.head.appendChild(s);
  }

  /**
   * 清除所有特效
   */
  clearEffects() {
    this._activeEffects.forEach(el => el.remove());
    this._activeEffects = [];
  }

  destroy() {
    this.clearEffects();
  }
}
