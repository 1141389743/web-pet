/**
 * 情绪视觉系统 - 让宠物外观随情绪动态变化
 * 支持 emoji 形象和自定义导入图片
 */
class EmotionVisual {
  constructor(container, emotionEngine) {
    this.container = container;
    this.emotion = emotionEngine;
    this._indicatorEl = null;
    this._auraEl = null;
    this._currentState = 'neutral';
    this._animFrame = null;
    this._injectStyles();
    this._createOverlay();
    this._startLoop();
  }

  _createOverlay() {
    // 情绪指示器（头顶小表情）
    this._indicatorEl = document.createElement('div');
    this._indicatorEl.className = 'pet-mood-indicator';
    Object.assign(this._indicatorEl.style, {
      position: 'absolute',
      top: '-20px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '16px',
      pointerEvents: 'none',
      zIndex: '2',
      opacity: '0',
      transition: 'opacity 0.5s ease, transform 0.5s ease'
    });
    this.container.el.appendChild(this._indicatorEl);

    // 情绪光环（背后光晕）
    this._auraEl = document.createElement('div');
    this._auraEl.className = 'pet-mood-aura';
    Object.assign(this._auraEl.style, {
      position: 'absolute',
      inset: '-15px',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: '0',
      opacity: '0',
      transition: 'opacity 1s ease'
    });
    this.container.el.insertBefore(this._auraEl, this.container.el.firstChild);
  }

  /**
   * 主循环 - 每秒检查情绪并更新视觉
   */
  _startLoop() {
    const update = () => {
      const mood = this.emotion.currentMood;
      if (mood !== this._currentState) {
        this._applyMood(mood);
        this._currentState = mood;
      }
      this._animFrame = requestAnimationFrame(update);
    };
    // 每秒检查一次
    setInterval(() => {
      const mood = this.emotion.currentMood;
      if (mood !== this._currentState) {
        this._applyMood(mood);
        this._currentState = mood;
      }
    }, 1000);
    this._applyMood(this.emotion.currentMood);
  }

  /**
   * 应用情绪视觉效果
   */
  _applyMood(mood) {
    const el = this.container.el;
    const moods = this.emotion.moods;

    // 清除旧效果
    el.classList.remove(
      'mood-happy', 'mood-excited', 'mood-curious', 'mood-lonely',
      'mood-sleepy', 'mood-tired', 'mood-sad', 'mood-clingy', 'mood-neutral'
    );

    // 应用新情绪类
    el.classList.add('mood-' + mood);

    // 更新指示器
    this._updateIndicator(mood);

    // 更新光环
    this._updateAura(mood);

    // 更新写实宠物表情
    if (this.container.el.querySelector) {
      const animator = this.container._animator;
      if (animator && animator._realisticPetType) {
        animator.updateRealisticMood(mood);
      }
    }

    // CSS 滤镜（影响所有子元素包括图片）
    this._applyFilters(el, mood, moods);

    // 呼吸/微动动画
    this._applyIdleAnimation(el, mood);
  }

  _updateIndicator(mood) {
    const emojis = {
      happy: '😊', excited: '🤩', curious: '🧐', lonely: '🥺',
      sleepy: '💤', tired: '😮‍💨', sad: '😢', clingy: '💕', neutral: ''
    };
    const emoji = emojis[mood] || '';
    this._indicatorEl.textContent = emoji;
    this._indicatorEl.style.opacity = emoji ? '1' : '0';
    this._indicatorEl.style.transform = emoji ? 'translateX(-50%) translateY(-5px)' : 'translateX(-50%) translateY(0)';
  }

  _updateAura(mood) {
    const auras = {
      happy: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
      excited: 'radial-gradient(circle, rgba(255,100,100,0.2) 0%, transparent 70%)',
      curious: 'radial-gradient(circle, rgba(100,200,255,0.15) 0%, transparent 70%)',
      lonely: 'radial-gradient(circle, rgba(150,150,200,0.1) 0%, transparent 70%)',
      sleepy: 'radial-gradient(circle, rgba(100,100,200,0.1) 0%, transparent 70%)',
      sad: 'radial-gradient(circle, rgba(100,100,150,0.1) 0%, transparent 70%)',
      clingy: 'radial-gradient(circle, rgba(255,150,200,0.15) 0%, transparent 70%)',
      tired: 'radial-gradient(circle, rgba(150,150,150,0.1) 0%, transparent 70%)'
    };
    this._auraEl.style.background = auras[mood] || 'none';
    this._auraEl.style.opacity = auras[mood] ? '1' : '0';
  }

  _applyFilters(el, mood, moods) {
    // 重置
    el.style.filter = '';

    const filters = [];

    // 开心 - 暖色调，饱和度提高
    if (mood === 'happy' || mood === 'excited') {
      filters.push('saturate(1.2)');
      filters.push('brightness(1.05)');
    }

    // 兴奋 - 高饱和高亮度
    if (mood === 'excited') {
      filters.push('saturate(1.4)');
      filters.push('brightness(1.1)');
    }

    // 难过 - 去饱和，变暗
    if (mood === 'sad') {
      filters.push('saturate(0.5)');
      filters.push('brightness(0.85)');
    }

    // 孤单 - 轻微去饱和
    if (mood === 'lonely' || mood === 'clingy') {
      filters.push('saturate(0.7)');
    }

    // 困倦 - 暖色偏暗
    if (mood === 'sleepy') {
      filters.push('brightness(0.8)');
      filters.push('sepia(0.2)');
    }

    // 累 - 灰暗
    if (mood === 'tired') {
      filters.push('brightness(0.75)');
      filters.push('saturate(0.6)');
    }

    // 好奇 - 微微提亮
    if (mood === 'curious') {
      filters.push('brightness(1.08)');
      filters.push('contrast(1.05)');
    }

    if (filters.length > 0) {
      el.style.filter = filters.join(' ');
    }
  }

  _applyIdleAnimation(el, mood) {
    const scale = this.container.scale || 1;
    el.style.setProperty('--pet-scale', scale);

    const animations = {
      happy: 'mood-happy-breathe 3s ease-in-out infinite',
      excited: 'mood-excited-bounce 0.8s ease-in-out infinite',
      curious: 'mood-curious-tilt 4s ease-in-out infinite',
      lonely: 'mood-lonely-sway 5s ease-in-out infinite',
      sleepy: 'mood-sleepy-breathe 4s ease-in-out infinite',
      tired: 'mood-tired-droop 3s ease-in-out infinite',
      sad: 'mood-sad-droop 4s ease-in-out infinite',
      clingy: 'mood-clingy-wiggle 2s ease-in-out infinite'
    };

    if (animations[mood]) {
      el.style.animation = animations[mood];
    } else {
      el.style.animation = '';
      el.style.transform = `scale(${scale})`;
    }
  }

  /**
   * 强制触发表情特效（不依赖情绪循环）
   */
  flashEmotion(mood, duration = 2000) {
    this._applyMood(mood);
    setTimeout(() => {
      this._applyMood(this.emotion.currentMood);
    }, duration);
  }

  _injectStyles() {
    if (document.getElementById('pet-mood-styles')) return;
    const s = document.createElement('style');
    s.id = 'pet-mood-styles';
    s.textContent = `
      /* 情绪呼吸动画 - 影响整个容器（包括图片） */
      @keyframes mood-happy-breathe {
        0%, 100% { transform: scale(var(--pet-scale, 1)); }
        50% { transform: scale(calc(var(--pet-scale, 1) * 1.04)); }
      }
      @keyframes mood-excited-bounce {
        0%, 100% { transform: scale(var(--pet-scale, 1)) translateY(0); }
        30% { transform: scale(calc(var(--pet-scale, 1) * 1.05)) translateY(-8px); }
        60% { transform: scale(var(--pet-scale, 1)) translateY(0); }
      }
      @keyframes mood-curious-tilt {
        0%, 100% { transform: scale(var(--pet-scale, 1)) rotate(0deg); }
        25% { transform: scale(var(--pet-scale, 1)) rotate(5deg); }
        75% { transform: scale(var(--pet-scale, 1)) rotate(-5deg); }
      }
      @keyframes mood-lonely-sway {
        0%, 100% { transform: scale(var(--pet-scale, 1)) translateX(0); }
        50% { transform: scale(var(--pet-scale, 1)) translateX(4px); }
      }
      @keyframes mood-sleepy-breathe {
        0%, 100% { transform: scale(var(--pet-scale, 1)); }
        50% { transform: scale(calc(var(--pet-scale, 1) * 1.02)); }
      }
      @keyframes mood-tired-droop {
        0%, 100% { transform: scale(var(--pet-scale, 1)) translateY(0); }
        50% { transform: scale(var(--pet-scale, 1)) translateY(3px); }
      }
      @keyframes mood-sad-droop {
        0%, 100% { transform: scale(var(--pet-scale, 1)) translateY(0) rotate(0deg); }
        50% { transform: scale(calc(var(--pet-scale, 1) * 0.97)) translateY(4px) rotate(-2deg); }
      }
      @keyframes mood-clingy-wiggle {
        0%, 100% { transform: scale(var(--pet-scale, 1)) rotate(0deg); }
        25% { transform: scale(var(--pet-scale, 1)) rotate(3deg); }
        75% { transform: scale(var(--pet-scale, 1)) rotate(-3deg); }
      }

      /* 情绪指示器弹出动画 */
      .pet-mood-indicator {
        animation: mood-indicator-pop 0.4s ease-out;
      }
      @keyframes mood-indicator-pop {
        0% { transform: translateX(-50%) scale(0) translateY(10px); }
        60% { transform: translateX(-50%) scale(1.3) translateY(-5px); }
        100% { transform: translateX(-50%) scale(1) translateY(-5px); }
      }

      /* 光环脉冲 */
      .pet-mood-aura {
        animation: mood-aura-pulse 3s ease-in-out infinite;
      }
      @keyframes mood-aura-pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
      }
    `;
    document.head.appendChild(s);
  }

  destroy() {
    cancelAnimationFrame(this._animFrame);
    this._indicatorEl?.remove();
    this._auraEl?.remove();
  }
}
