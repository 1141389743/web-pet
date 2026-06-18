/**
 * 悬浮容器 - 透明无边框、拖动、边缘吸附、层级控制
 */
class PetContainer {
  constructor(options = {}) {
    this.size = options.size || 100;
    this.scale = options.scale || 1.0;
    this.opacity = options.opacity || 1.0;
    this.edgeSnap = options.edgeSnap !== false;
    this.position = options.position || { x: window.innerWidth - 130, y: window.innerHeight - 150 };

    this.el = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isSnapped = false;
    this.snapSide = null;
    this.isVisible = true;

    this._onResize = this._handleResize.bind(this);
    this._onMove = this._handleMove.bind(this);
    this._onUp = this._handleUp.bind(this);

    this._init();
  }

  _init() {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      width: this.size + 'px',
      height: this.size + 'px',
      left: this.position.x + 'px',
      top: this.position.y + 'px',
      cursor: 'grab',
      userSelect: 'none',
      webkitUserSelect: 'none',
      pointerEvents: 'auto',
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      transformOrigin: 'center bottom'
    });

    this.el.classList.add('web-pet-container');
    this._applyScale();
    this._applyOpacity();

    document.body.appendChild(this.el);
    window.addEventListener('resize', this._onResize);
  }

  _applyScale() {
    this.el.style.setProperty('--pet-scale', this.scale);
    // transform 由 CSS 动画或 JS 控制，scale 通过 CSS 变量传递
    if (!this.el.style.animation) {
      this.el.style.transform = `scale(${this.scale})`;
    }
  }

  _applyOpacity() {
    this.el.style.opacity = this.opacity;
  }

  setScale(s) {
    this.scale = Math.max(0.2, Math.min(2, s));
    this._applyScale();
  }

  setOpacity(o) {
    this.opacity = Math.max(0.2, Math.min(1, o));
    this._applyOpacity();
  }

  setPosition(x, y) {
    this.position = { x, y };
    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';
  }

  show() {
    this.isVisible = true;
    this.el.style.display = '';
    this.el.style.opacity = this.opacity;
  }

  hide() {
    this.isVisible = false;
    this.el.style.opacity = '0';
    setTimeout(() => { if (!this.isVisible) this.el.style.display = 'none'; }, 300);
  }

  toggle() {
    this.isVisible ? this.hide() : this.show();
  }

  resetPosition() {
    this.isSnapped = false;
    this.snapSide = null;
    this.setPosition(window.innerWidth - 130, window.innerHeight - 150);
  }

  // 拖动
  startDrag(e) {
    if (this.isSnapped) {
      this.isSnapped = false;
      this.el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    }
    this.isDragging = true;
    const rect = this.el.getBoundingClientRect();
    this.dragOffset = {
      x: (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left,
      y: (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top
    };
    this.el.style.cursor = 'grabbing';
    this.el.style.transition = 'transform 0.1s ease';

    document.addEventListener('mousemove', this._onMove);
    document.addEventListener('mouseup', this._onUp);
    document.addEventListener('touchmove', this._onMove, { passive: false });
    document.addEventListener('touchend', this._onUp);
  }

  _handleMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const cx = e.clientX || e.touches?.[0]?.clientX || 0;
    const cy = e.clientY || e.touches?.[0]?.clientY || 0;
    let x = cx - this.dragOffset.x;
    let y = cy - this.dragOffset.y;

    // 边界限制
    x = Math.max(0, Math.min(window.innerWidth - this.size * this.scale, x));
    y = Math.max(0, Math.min(window.innerHeight - this.size * this.scale, y));

    this.setPosition(x, y);

    // 边缘吸附提示
    if (this.edgeSnap) {
      if (x < 10) this.el.style.transform = `scale(${this.scale}) translateX(-20px)`;
      else if (x > window.innerWidth - this.size * this.scale - 10) this.el.style.transform = `scale(${this.scale}) translateX(20px)`;
      else this.el.style.transform = `scale(${this.scale})`;
    }
  }

  _handleUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.el.style.cursor = 'grab';
    this.el.style.transition = 'transform 0.3s ease, left 0.3s ease, top 0.3s ease, opacity 0.3s ease';

    document.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('mouseup', this._onUp);
    document.removeEventListener('touchmove', this._onMove);
    document.removeEventListener('touchend', this._onUp);

    // 边缘吸附
    if (this.edgeSnap) {
      const cx = this.position.x;
      if (cx < 10) {
        this.isSnapped = true;
        this.snapSide = 'left';
        this.setPosition(-this.size * this.scale * 0.6, this.position.y);
      } else if (cx > window.innerWidth - this.size * this.scale - 10) {
        this.isSnapped = true;
        this.snapSide = 'right';
        this.setPosition(window.innerWidth - this.size * this.scale * 0.4, this.position.y);
      }
    }

    // 回弹动画
    if (!this.isSnapped) {
      this._bounceEffect();
    }

    this._savePosition();

    // 回调
    if (this.onDragEnd) this.onDragEnd(this.position);
  }

  _bounceEffect() {
    this.el.style.transition = 'transform 0.1s ease-in';
    this.el.style.transform = `scale(${this.scale}) translateY(5px)`;
    setTimeout(() => {
      this.el.style.transition = 'transform 0.2s ease-out';
      this.el.style.transform = `scale(${this.scale}) translateY(-3px)`;
      setTimeout(() => {
        this.el.style.transition = 'transform 0.15s ease';
        this.el.style.transform = `scale(${this.scale})`;
      }, 200);
    }, 100);
  }

  _handleResize() {
    // 确保在视口内
    const maxX = window.innerWidth - this.size * this.scale;
    const maxY = window.innerHeight - this.size * this.scale;
    if (this.position.x > maxX || this.position.y > maxY) {
      this.setPosition(Math.min(this.position.x, maxX), Math.min(this.position.y, maxY));
    }
  }

  _savePosition() {
    try {
      localStorage.setItem('web_pet_position', JSON.stringify(this.position));
    } catch {}
  }

  loadPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem('web_pet_position'));
      if (saved && typeof saved.x === 'number') {
        this.setPosition(saved.x, saved.y);
      }
    } catch {}
  }

  // 吸附状态下鼠标靠近时弹出
  checkSnapHover(mouseX) {
    if (!this.isSnapped) return;
    const rect = this.el.getBoundingClientRect();
    const dist = this.snapSide === 'left' ? mouseX - rect.right : rect.left - mouseX;
    if (dist < 30) {
      if (this.snapSide === 'left') this.setPosition(0, this.position.y);
      else this.setPosition(window.innerWidth - this.size * this.scale, this.position.y);
    }
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.el?.remove();
  }
}
/**
 * 帧动画播放器 - PNG序列帧播放，支持GIF
 */
class PetAnimator {
  constructor(container) {
    this.container = container;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'auto'
    });
    // 默认CSS宠物（无图片时显示）
    this._defaultPet = document.createElement('div');
    Object.assign(this._defaultPet.style, {
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '64px', lineHeight: '1', userSelect: 'none',
      position: 'absolute', top: '0', left: '0'
    });
    this._defaultPet.textContent = '🐱';
    this.el.appendChild(this._defaultPet);
    this._hasCustomImage = false;
    container.el.appendChild(this.el);

    this.frames = [];
    this.frameIndex = 0;
    this.fps = 15;
    this.isGif = false;
    this.isPaused = false;
    this._timer = null;
    this._imgCache = [];
  }

  /**
   * 加载帧动画
   * @param {Array<string>} frameUrls - 帧图片URL数组
   * @param {number} fps - 帧率
   * @param {boolean} loop - 是否循环
   */
  loadFrames(frameUrls, fps = 15, loop = true) {
    this.stop();
    this.frames = frameUrls;
    this.fps = fps;
    this.loop = loop;
    this.frameIndex = 0;
    this.isGif = false;

    if (frameUrls.length === 0) return;

    // 检查是否为GIF
    if (frameUrls.length === 1 && frameUrls[0].toLowerCase().endsWith('.gif')) {
      this.isGif = true;
      this.el.style.backgroundImage = `url(${frameUrls[0]})`;
      return;
    }

    // 预加载帧
    this._imgCache = [];
    let loaded = 0;
    frameUrls.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        this._imgCache[i] = img;
        if (loaded === frameUrls.length) {
          this._showFrame(0);
          this.play();
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded === frameUrls.length && this._imgCache.length > 0) {
          this._showFrame(0);
          this.play();
        }
      };
      img.src = url;
    });
  }

  /**
   * 加载单张静态图
   */
  loadStatic(imageUrl) {
    this.stop();
    this.frames = [imageUrl];
    this.isGif = false;
    this.el.style.backgroundImage = `url(${imageUrl})`;
    this.el.style.backgroundSize = 'contain';
  }

  play() {
    if (this.isGif || this.frames.length <= 1) return;
    this.isPaused = false;
    this._startTimer();
  }

  pause() {
    this.isPaused = true;
    this._stopTimer();
  }

  stop() {
    this.isPaused = true;
    this._stopTimer();
    this.frameIndex = 0;
  }

  _startTimer() {
    this._stopTimer();
    const interval = Math.max(16, Math.round(1000 / this.fps));
    this._timer = setInterval(() => {
      if (this.isPaused) return;
      this.frameIndex++;
      if (this.frameIndex >= this.frames.length) {
        if (this.loop) {
          this.frameIndex = 0;
        } else {
          this._stopTimer();
          if (this.onFinish) this.onFinish();
          return;
        }
      }
      this._showFrame(this.frameIndex);
    }, interval);
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _showFrame(index) {
    const img = this._imgCache[index];
    if (img) {
      this._hasCustomImage = true;
      this._defaultPet.style.display = 'none';
      this.el.style.backgroundImage = `url(${img.src})`;
      this.el.style.backgroundSize = 'contain';
      this.el.style.backgroundPosition = 'center';
      this.el.style.backgroundRepeat = 'no-repeat';
    }
  }

  /**
   * 设置默认emoji宠物
   */
  setDefaultEmoji(emoji) {
    this._defaultPet.textContent = emoji || '🐱';
    this._defaultPet.innerHTML = '';
    this._defaultPet.style.fontSize = '';
    this._defaultPet.textContent = emoji || '🐱';
  }

  /**
   * 设置写实 SVG 宠物
   */
  setDefaultSVG(svg, petType, renderer) {
    this._defaultPet.textContent = '';
    this._defaultPet.innerHTML = svg;
    this._defaultPet.style.fontSize = '0';
    this._realisticPetType = petType;
    this._realisticRenderer = renderer;
  }

  /**
   * 更新写实宠物的情绪表情
   */
  updateRealisticMood(mood) {
    if (this._realisticPetType && this._realisticRenderer) {
      const svg = this._realisticRenderer.render(this._realisticPetType, mood);
      this._defaultPet.innerHTML = svg;
    }
  }

  /**
   * 显示默认宠物（无自定义图片时）
   */
  showDefault() {
    this._hasCustomImage = false;
    this._defaultPet.style.display = 'flex';
    this.el.style.backgroundImage = 'none';
  }

  /**
   * 通过CSS sprite方式播放（适用于sprite sheet）
   */
  loadSpriteSheet(spriteUrl, frameWidth, frameHeight, totalFrames, fps = 15) {
    this.stop();
    this.fps = fps;
    this.frameIndex = 0;
    this.loop = true;

    const img = new Image();
    img.onload = () => {
      this.el.style.backgroundImage = `url(${spriteUrl})`;
      this.el.style.backgroundSize = `${frameWidth * totalFrames}px ${frameHeight}px`;
      this._spriteFrameWidth = frameWidth;
      this._spriteTotalFrames = totalFrames;
      this.play();
    };
    img.src = spriteUrl;

    this._showSpriteFrame = (index) => {
      const offset = -index * this._spriteFrameWidth;
      this.el.style.backgroundPosition = `${offset}px 0`;
    };

    // Override _showFrame for sprite mode
    this._showFrame = this._showSpriteFrame || this._showFrame;
  }

  destroy() {
    this.stop();
    this.el?.remove();
  }
}
/**
 * 动画状态机 - 管理宠物动画状态切换
 * 状态优先级: dragged > clicked > happy > idle_action > walk > idle
 */
class PetStateMachine {
  constructor(animator) {
    this.animator = animator;
    this.currentState = 'idle';
    this.previousState = 'idle';
    this.animations = {}; // state -> { urls, fps, loop, priority }
    this.isTransitioning = false;
    this._idleTimer = null;
    this._idleActionInterval = 8000; // 8秒
    this._idleActions = ['idle_action', 'walk'];
    this._idleEnabled = true;

    // 状态优先级
    this._priority = {
      'dragged': 100,
      'clicked': 80,
      'happy': 70,
      'walk': 30,
      'idle_action': 20,
      'idle': 0
    };
  }

  /**
   * 注册状态动画
   */
  registerAnimation(state, urls, fps = 15, loop = true, priority = null) {
    this.animations[state] = {
      urls, fps, loop,
      priority: priority ?? (this._priority[state] || 0)
    };
  }

  /**
   * 从皮肤配置加载所有动画
   */
  loadFromSkin(skinConfig, baseUrl = '') {
    const anims = skinConfig.animations || {};
    for (const [state, cfg] of Object.entries(anims)) {
      const urls = (cfg.frames || []).map(f => baseUrl + f);
      this.registerAnimation(state, urls, cfg.fps || 10, cfg.loop !== false);
    }
  }

  /**
   * 切换状态
   * @param {string} newState - 目标状态
   * @param {boolean} force - 是否强制切换
   */
  changeState(newState, force = false) {
    if (!this.animations[newState]) return;
    if (newState === this.currentState && !force) return;

    // 优先级检查：低优先级不能打断高优先级
    if (!force && this._priority[newState] < (this._priority[this.currentState] || 0)) {
      return;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    const anim = this.animations[newState];
    this.animator.loadFrames(anim.urls, anim.fps, anim.loop);

    // 单次播放动画完成后回到idle
    if (!anim.loop) {
      this.animator.onFinish = () => {
        this.changeState('idle');
      };
    }

    // 通知
    if (this.onStateChange) {
      this.onStateChange(newState, this.previousState);
    }
  }

  /**
   * 启动闲置行为调度
   */
  startIdleScheduler() {
    this._stopIdleScheduler();
    if (!this._idleEnabled) return;

    const schedule = () => {
      const delay = this._idleActionInterval + Math.random() * 4000;
      this._idleTimer = setTimeout(() => {
        if (this.currentState === 'idle') {
          const action = this._idleActions[Math.floor(Math.random() * this._idleActions.length)];
          if (this.animations[action]) {
            this.changeState(action);
          }
        }
        schedule();
      }, delay);
    };
    schedule();
  }

  _stopIdleScheduler() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  setIdleInterval(ms) {
    this._idleActionInterval = Math.max(5000, Math.min(120000, ms));
  }

  setIdleEnabled(enabled) {
    this._idleEnabled = enabled;
    if (!enabled) this._stopIdleScheduler();
    else this.startIdleScheduler();
  }

  destroy() {
    this._stopIdleScheduler();
  }
}
/**
 * 鼠标交互 - 点击、悬停、拖拽、右键菜单
 * 修复：移动超5px才算拖拽，否则算点击；右键始终正常
 */
class MouseHandler {
  constructor(container, stateMachine) {
    this.container = container;
    this.stateMachine = stateMachine;
    this._hoverTimer = null;
    this._clickTimer = null;
    this._lastClickTime = 0;
    this._mouseDownPos = null;
    this._hasMoved = false;
    this._dragStarted = false;

    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);

    this._bindEvents();
  }

  _bindEvents() {
    const el = this.container.el;

    // mousedown - 记录位置，准备拖拽（仅左键）
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // 只处理左键
      e.preventDefault();

      this._mouseDownPos = { x: e.clientX, y: e.clientY };
      this._hasMoved = false;
      this._dragStarted = false;

      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mouseup', this._onMouseUp);
    });

    // touchstart
    el.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this._mouseDownPos = { x: touch.clientX, y: touch.clientY };
      this._hasMoved = false;
      this._dragStarted = false;

      const onTouchMove = (ev) => {
        const t = ev.touches[0];
        const dx = Math.abs(t.clientX - this._mouseDownPos.x);
        const dy = Math.abs(t.clientY - this._mouseDownPos.y);
        if (dx > 5 || dy > 5) {
          this._hasMoved = true;
          if (!this._dragStarted) {
            this._dragStarted = true;
            this.container.startDrag(touch);
            this.stateMachine.changeState('dragged');
          }
        }
        if (this.container.isDragging) {
          this.container._handleMove(ev);
        }
      };

      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        if (this.container.isDragging) {
          this.container._handleUp({});
          this.stateMachine.changeState('idle');
        } else if (this._mouseDownPos) {
          this.stateMachine.changeState('clicked');
          if (this.onClick) this.onClick();
        }
        this._reset();
      };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }, { passive: true });

    // 悬停
    el.addEventListener('mouseenter', () => {
      this._hoverTimer = setTimeout(() => {
        this.stateMachine.changeState('happy');
        if (this.onHover) this.onHover();
      }, 1000);
      if (this.container.isSnapped) {
        const targetX = this.container.snapSide === 'left' ? 0 : window.innerWidth - this.container.size * this.container.scale;
        this.container.setPosition(targetX, this.container.position.y);
      }
    });

    el.addEventListener('mouseleave', () => {
      clearTimeout(this._hoverTimer);
      if (this.container.isSnapped) {
        if (this.container.snapSide === 'left') {
          this.container.setPosition(-this.container.size * this.container.scale * 0.6, this.container.position.y);
        } else {
          this.container.setPosition(window.innerWidth - this.container.size * this.container.scale * 0.4, this.container.position.y);
        }
      }
    });

    // 右键菜单 - 独立绑定，不受拖拽影响
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 强制清理拖拽状态
      this._cleanupDrag();
      if (this.onContextMenu) this.onContextMenu(e);
    });
  }

  _handleMouseMove(e) {
    if (!this._mouseDownPos) return;
    const dx = Math.abs(e.clientX - this._mouseDownPos.x);
    const dy = Math.abs(e.clientY - this._mouseDownPos.y);

    if (dx > 5 || dy > 5) {
      this._hasMoved = true;
      if (!this._dragStarted) {
        this._dragStarted = true;
        this.container.startDrag({
          clientX: this._mouseDownPos.x,
          clientY: this._mouseDownPos.y
        });
        this.stateMachine.changeState('dragged');
      }
      this.container._handleMove(e);
    }
  }

  _handleMouseUp(e) {
    this._removeDocListeners();

    if (this.container.isDragging) {
      this.container._handleUp(e);
      this.stateMachine.changeState('idle');
    } else if (this._mouseDownPos && !this._hasMoved) {
      const now = Date.now();
      if (now - this._lastClickTime < 350) {
        clearTimeout(this._clickTimer);
        this._handleDoubleClick(e);
      } else {
        this._clickTimer = setTimeout(() => this._handleClick(e), 350);
      }
      this._lastClickTime = now;
    }

    this._reset();
  }

  _handleClick(e) {
    this.stateMachine.changeState('clicked');
    if (this.onClick) this.onClick(e);
  }

  _handleDoubleClick(e) {
    if (this.onDoubleClick) this.onDoubleClick(e);
  }

  _cleanupDrag() {
    this._removeDocListeners();
    if (this.container.isDragging) {
      this.container._handleUp({});
      this.stateMachine.changeState('idle');
    }
    this._reset();
  }

  _removeDocListeners() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }

  _reset() {
    this._mouseDownPos = null;
    this._hasMoved = false;
    this._dragStarted = false;
  }

  destroy() {
    clearTimeout(this._hoverTimer);
    clearTimeout(this._clickTimer);
    this._removeDocListeners();
  }
}
/**
 * 互动插件系统 - 事件订阅模式
 * 插件格式: { name, trigger(ctx), execute(ctx), priority, enabled }
 */
class PluginSystem {
  constructor() {
    this.plugins = [];
    this._api = null; // 注入的统一API
  }

  /**
   * 注入API供插件调用
   */
  setAPI(api) {
    this._api = api;
  }

  /**
   * 注册插件
   */
  register(plugin) {
    if (!plugin.name || !plugin.execute) return;
    plugin.enabled = plugin.enabled !== false;
    plugin.priority = plugin.priority || 0;
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 触发事件
   * @param {string} eventType - 事件类型: click, hover, drag_start, drag_end, idle, double_click
   * @param {object} context - 事件上下文
   */
  trigger(eventType, context = {}) {
    context.eventType = eventType;
    context.api = this._api;

    for (const plugin of this.plugins) {
      if (!plugin.enabled) continue;
      try {
        if (plugin.trigger && plugin.trigger(context)) {
          plugin.execute(context);
          break; // 第一个命中的插件执行后中断
        }
      } catch (e) {
        console.warn(`[PetPlugin] ${plugin.name} error:`, e);
      }
    }
  }

  enablePlugin(name) {
    const p = this.plugins.find(p => p.name === name);
    if (p) p.enabled = true;
  }

  disablePlugin(name) {
    const p = this.plugins.find(p => p.name === name);
    if (p) p.enabled = false;
  }

  getPluginList() {
    return this.plugins.map(p => ({
      name: p.name, priority: p.priority, enabled: p.enabled
    }));
  }
}

// === 内置插件 ===

const BuiltInPlugins = {
  /** 点击随机语录 */
  clickRandomQuote: {
    name: 'clickRandomQuote',
    priority: 10,
    trigger: (ctx) => ctx.eventType === 'click',
    execute: (ctx) => {
      const quotes = [
        '你好呀~', '别戳我啦！', '嘿嘿~', '今天也要加油！',
        '摸摸头~', '别闹~', '有什么需要帮忙的吗？', '我好开心！'
      ];
      ctx.api.showBubble(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  },

  /** 悬停问候 */
  hoverGreeting: {
    name: 'hoverGreeting',
    priority: 5,
    trigger: (ctx) => ctx.eventType === 'hover',
    execute: (ctx) => {
      const now = new Date().getHours();
      let greeting = now < 12 ? '早上好~' : now < 18 ? '下午好~' : '晚上好~';
      ctx.api.showBubble(greeting, 2000);
    }
  },

  /** 拖拽结束反馈 */
  dragFeedback: {
    name: 'dragFeedback',
    priority: 20,
    trigger: (ctx) => ctx.eventType === 'drag_end',
    execute: (ctx) => {
      const phrases = ['呼~安全了', '哎呀好晕', '换个地方也不错', '被你搬来搬去的'];
      ctx.api.showBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    }
  },

  /** 闲置随机动作 */
  idleRandomAction: {
    name: 'idleRandomAction',
    priority: 1,
    trigger: (ctx) => ctx.eventType === 'idle',
    execute: (ctx) => {
      const actions = [
        { state: 'walk', bubble: '出去溜达溜达~' },
        { state: 'happy', bubble: '心情不错！' },
        { state: 'idle_action', bubble: '' }
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      ctx.api.changeState(action.state);
      if (action.bubble) ctx.api.showBubble(action.bubble, 2000);
    }
  }
};
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
/**
 * 写实宠物渲染器 - 用 CSS/SVG 绘制更真实的动物形象
 * 支持情绪表情变化、眨眼、耳朵动效
 */
class RealisticPetRenderer {
  constructor() {
    this.pets = {
      cat: { name: '🐱 猫咪', svg: this._catSVG },
      dog: { name: '🐶 狗狗', svg: this._dogSVG },
      rabbit: { name: '🐰 兔子', svg: this._rabbitSVG },
      hamster: { name: '🐹 仓鼠', svg: this._hamsterSVG },
      fox: { name: '🦊 狐狸', svg: this._foxSVG },
      panda: { name: '🐼 熊猫', svg: this._pandaSVG },
      penguin: { name: '🐧 企鹅', svg: this._penguinSVG },
      owl: { name: '🦉 猫头鹰', svg: this._owlSVG }
    };
  }

  /**
   * 获取宠物 SVG HTML
   * @param {string} type - 宠物类型
   * @param {string} mood - 情绪状态
   * @returns {string} SVG HTML
   */
  render(type, mood = 'neutral') {
    const pet = this.pets[type];
    if (!pet) return '';
    return pet.svg.call(this, mood);
  }

  /**
   * 获取所有宠物列表
   */
  getPetList() {
    return Object.entries(this.pets).map(([id, pet]) => ({ id, name: pet.name }));
  }

  /**
   * 创建宠物 DOM 元素
   */
  createPetElement(type, size = 100) {
    const wrapper = document.createElement('div');
    wrapper.className = 'realistic-pet';
    Object.assign(wrapper.style, {
      width: size + 'px',
      height: size + 'px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    });
    wrapper.innerHTML = this.render(type, 'neutral');
    return wrapper;
  }

  /**
   * 更新宠物情绪表情
   */
  updateMood(element, type, mood) {
    if (!element) return;
    element.innerHTML = this.render(type, mood);
  }

  // ========== SVG 绘制 ==========

  _catSVG(mood) {
    const eyes = this._getEyes(mood, 'cat');
    const mouth = this._getMouth(mood);
    const blush = (mood === 'happy' || mood === 'excited') ? '<circle cx="25" cy="58" r="6" fill="#FFB6C1" opacity="0.6"/><circle cx="75" cy="58" r="6" fill="#FFB6C1" opacity="0.6"/>' : '';
    const tailWag = mood === 'excited' || mood === 'happy';

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <!-- 身体 -->
      <ellipse cx="50" cy="65" rx="28" ry="25" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <!-- 肚子 -->
      <ellipse cx="50" cy="70" rx="18" ry="16" fill="#FAEBD7"/>
      <!-- 头 -->
      <circle cx="50" cy="38" r="24" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <!-- 左耳 -->
      <polygon points="30,20 22,2 42,16" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <polygon points="32,18 26,6 40,16" fill="#FFB6C1"/>
      <!-- 右耳 -->
      <polygon points="70,20 78,2 58,16" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <polygon points="68,18 74,6 60,16" fill="#FFB6C1"/>
      <!-- 眼睛 -->
      ${eyes}
      <!-- 鼻子 -->
      <ellipse cx="50" cy="44" rx="3" ry="2.5" fill="#FF69B4"/>
      <!-- 嘴巴 -->
      ${mouth}
      <!-- 胡须 -->
      <line x1="18" y1="42" x2="38" y2="44" stroke="#8B7355" stroke-width="0.8"/>
      <line x1="18" y1="48" x2="38" y2="48" stroke="#8B7355" stroke-width="0.8"/>
      <line x1="62" y1="44" x2="82" y2="42" stroke="#8B7355" stroke-width="0.8"/>
      <line x1="62" y1="48" x2="82" y2="48" stroke="#8B7355" stroke-width="0.8"/>
      ${blush}
      <!-- 前爪 -->
      <ellipse cx="35" cy="85" rx="8" ry="5" fill="#F4A460" stroke="#D2691E" stroke-width="1"/>
      <ellipse cx="65" cy="85" rx="8" ry="5" fill="#F4A460" stroke="#D2691E" stroke-width="1"/>
      <!-- 尾巴 -->
      <path d="M 78 65 Q 95 50 90 35" fill="none" stroke="#F4A460" stroke-width="4" stroke-linecap="round">
        ${tailWag ? '<animateTransform attributeName="transform" type="rotate" values="-5 78 65;5 78 65;-5 78 65" dur="0.5s" repeatCount="indefinite"/>' : ''}
      </path>
    </svg>`;
  }

  _dogSVG(mood) {
    const eyes = this._getEyes(mood, 'dog');
    const mouth = mood === 'happy' || mood === 'excited'
      ? '<path d="M 42 52 Q 50 60 58 52" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/><path d="M 48 54 L 50 58 L 52 54" fill="#FF6B81"/>'
      : '<path d="M 44 54 Q 50 58 56 54" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>';
    const tongue = (mood === 'happy' || mood === 'excited') ? '<ellipse cx="50" cy="60" rx="4" ry="6" fill="#FF6B81"/>' : '';
    const tailWag = mood !== 'sad' && mood !== 'sleepy';

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <!-- 身体 -->
      <ellipse cx="50" cy="65" rx="28" ry="25" fill="#C19A6B" stroke="#8B6914" stroke-width="1.5"/>
      <ellipse cx="50" cy="70" rx="18" ry="16" fill="#DEB887"/>
      <!-- 头 -->
      <circle cx="50" cy="38" r="24" fill="#C19A6B" stroke="#8B6914" stroke-width="1.5"/>
      <!-- 左耳（垂耳） -->
      <ellipse cx="28" cy="30" rx="10" ry="18" fill="#A0522D" transform="rotate(-15 28 30)"/>
      <!-- 右耳（垂耳） -->
      <ellipse cx="72" cy="30" rx="10" ry="18" fill="#A0522D" transform="rotate(15 72 30)"/>
      <!-- 脸部毛色 -->
      <ellipse cx="50" cy="42" rx="12" ry="10" fill="#DEB887"/>
      <!-- 眼睛 -->
      ${eyes}
      <!-- 鼻子 -->
      <ellipse cx="50" cy="46" rx="4" ry="3" fill="#333"/>
      <!-- 嘴巴 -->
      ${mouth}
      ${tongue}
      <!-- 前爪 -->
      <ellipse cx="35" cy="85" rx="9" ry="5" fill="#C19A6B" stroke="#8B6914" stroke-width="1"/>
      <ellipse cx="65" cy="85" rx="9" ry="5" fill="#C19A6B" stroke="#8B6914" stroke-width="1"/>
      <!-- 尾巴 -->
      <path d="M 78 60 Q 98 45 92 30" fill="none" stroke="#C19A6B" stroke-width="5" stroke-linecap="round">
        ${tailWag ? '<animateTransform attributeName="transform" type="rotate" values="-8 78 60;8 78 60;-8 78 60" dur="0.4s" repeatCount="indefinite"/>' : ''}
      </path>
    </svg>`;
  }

  _rabbitSVG(mood) {
    const eyes = this._getEyes(mood, 'rabbit');
    const blush = (mood === 'happy') ? '<circle cx="35" cy="52" r="5" fill="#FFB6C1" opacity="0.5"/><circle cx="65" cy="52" r="5" fill="#FFB6C1" opacity="0.5"/>' : '';

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="68" rx="24" ry="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5"/>
      <circle cx="50" cy="42" r="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5"/>
      <ellipse cx="38" cy="12" rx="7" ry="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5" transform="rotate(-8 38 12)"/>
      <ellipse cx="38" cy="12" rx="4" ry="18" fill="#FFB6C1" transform="rotate(-8 38 12)"/>
      <ellipse cx="62" cy="12" rx="7" ry="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5" transform="rotate(8 62 12)"/>
      <ellipse cx="62" cy="12" rx="4" ry="18" fill="#FFB6C1" transform="rotate(8 62 12)"/>
      ${eyes}
      <ellipse cx="50" cy="48" rx="3" ry="2" fill="#FFB6C1"/>
      <path d="M 47 50 Q 50 54 53 50" fill="none" stroke="#DDD" stroke-width="1"/>
      ${blush}
      <ellipse cx="36" cy="85" rx="8" ry="5" fill="#F5F5F5" stroke="#DDD" stroke-width="1"/>
      <ellipse cx="64" cy="85" rx="8" ry="5" fill="#F5F5F5" stroke="#DDD" stroke-width="1"/>
    </svg>`;
  }

  _hamsterSVG(mood) {
    const eyes = this._getEyes(mood, 'hamster');
    const cheekPuff = (mood === 'happy' || mood === 'excited') ? 8 : 6;

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="60" rx="32" ry="30" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1.5"/>
      <ellipse cx="50" cy="65" rx="22" ry="20" fill="#FFFACD"/>
      <circle cx="50" cy="38" r="22" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1.5"/>
      <circle cx="30" cy="26" r="7" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1"/>
      <circle cx="30" cy="26" r="4" fill="#FFB6C1"/>
      <circle cx="70" cy="26" r="7" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1"/>
      <circle cx="70" cy="26" r="4" fill="#FFB6C1"/>
      ${eyes}
      <ellipse cx="50" cy="44" rx="3" ry="2" fill="#FFB6C1"/>
      <path d="M 47 46 Q 50 49 53 46" fill="none" stroke="#D2B48C" stroke-width="1"/>
      <circle cx="28" cy="48" r="${cheekPuff}" fill="#FFB6C1" opacity="0.4"/>
      <circle cx="72" cy="48" r="${cheekPuff}" fill="#FFB6C1" opacity="0.4"/>
      <ellipse cx="38" cy="82" rx="7" ry="4" fill="#F5DEB3"/>
      <ellipse cx="62" cy="82" rx="7" ry="4" fill="#F5DEB3"/>
    </svg>`;
  }

  _foxSVG(mood) {
    const eyes = this._getEyes(mood, 'fox');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="65" rx="26" ry="24" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <ellipse cx="50" cy="70" rx="16" ry="14" fill="#FFF8DC"/>
      <circle cx="50" cy="38" r="22" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <polygon points="32,22 20,0 42,16" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <polygon points="34,20 24,4 40,16" fill="#FFF8DC"/>
      <polygon points="68,22 80,0 58,16" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <polygon points="66,20 76,4 60,16" fill="#FFF8DC"/>
      <ellipse cx="50" cy="42" rx="10" ry="8" fill="#FFF8DC"/>
      ${eyes}
      <ellipse cx="50" cy="46" rx="3" ry="2" fill="#333"/>
      <path d="M 47 48 Q 50 51 53 48" fill="none" stroke="#333" stroke-width="1"/>
      <ellipse cx="36" cy="85" rx="7" ry="4" fill="#FF8C00"/>
      <ellipse cx="64" cy="85" rx="7" ry="4" fill="#FF8C00"/>
      <path d="M 76 62 Q 96 48 90 30" fill="none" stroke="#FF8C00" stroke-width="5" stroke-linecap="round"/>
      <path d="M 84 36 Q 90 32 90 30" fill="none" stroke="#FFF8DC" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  _pandaSVG(mood) {
    const eyes = this._getEyes(mood, 'panda');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="65" rx="28" ry="25" fill="#F5F5F5" stroke="#333" stroke-width="1.5"/>
      <circle cx="50" cy="38" r="24" fill="#F5F5F5" stroke="#333" stroke-width="1.5"/>
      <circle cx="32" cy="22" r="10" fill="#333"/>
      <circle cx="68" cy="22" r="10" fill="#333"/>
      <ellipse cx="38" cy="40" rx="10" ry="8" fill="#333"/>
      <ellipse cx="62" cy="40" rx="10" ry="8" fill="#333"/>
      <circle cx="38" cy="40" r="4" fill="#F5F5F5"/>
      <circle cx="62" cy="40" r="4" fill="#F5F5F5"/>
      <circle cx="39" cy="40" r="2" fill="#333"/>
      <circle cx="63" cy="40" r="2" fill="#333"/>
      <ellipse cx="50" cy="48" rx="4" ry="3" fill="#333"/>
      <path d="M 46 51 Q 50 55 54 51" fill="none" stroke="#333" stroke-width="1.2"/>
      <ellipse cx="35" cy="85" rx="10" ry="6" fill="#333"/>
      <ellipse cx="65" cy="85" rx="10" ry="6" fill="#333"/>
    </svg>`;
  }

  _penguinSVG(mood) {
    const eyes = this._getEyes(mood, 'penguin');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="55" rx="28" ry="35" fill="#2C3E50"/>
      <ellipse cx="50" cy="58" rx="20" ry="28" fill="#ECF0F1"/>
      <circle cx="50" cy="30" r="20" fill="#2C3E50"/>
      <ellipse cx="50" cy="34" rx="14" ry="12" fill="#ECF0F1"/>
      ${eyes}
      <polygon points="46,38 50,44 54,38" fill="#F39C12"/>
      <ellipse cx="28" cy="55" rx="5" ry="15" fill="#2C3E50" transform="rotate(-10 28 55)"/>
      <ellipse cx="72" cy="55" rx="5" ry="15" fill="#2C3E50" transform="rotate(10 72 55)"/>
      <ellipse cx="40" cy="88" rx="8" ry="4" fill="#F39C12"/>
      <ellipse cx="60" cy="88" rx="8" ry="4" fill="#F39C12"/>
    </svg>`;
  }

  _owlSVG(mood) {
    const eyes = this._getEyes(mood, 'owl');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="60" rx="26" ry="30" fill="#8B6914"/>
      <ellipse cx="50" cy="65" rx="18" ry="20" fill="#DEB887"/>
      <circle cx="50" cy="35" r="22" fill="#8B6914"/>
      <polygon points="32,18 24,4 40,14" fill="#A0522D"/>
      <polygon points="68,18 76,4 60,14" fill="#A0522D"/>
      <circle cx="38" cy="34" r="10" fill="#FFF8DC" stroke="#8B6914" stroke-width="1.5"/>
      <circle cx="62" cy="34" r="10" fill="#FFF8DC" stroke="#8B6914" stroke-width="1.5"/>
      <circle cx="39" cy="34" r="5" fill="#333"/>
      <circle cx="63" cy="34" r="5" fill="#333"/>
      <circle cx="40" cy="33" r="2" fill="#FFF"/>
      <circle cx="64" cy="33" r="2" fill="#FFF"/>
      <polygon points="48,42 50,48 52,42" fill="#F39C12"/>
      <ellipse cx="36" cy="85" rx="7" ry="4" fill="#F39C12"/>
      <ellipse cx="64" cy="85" rx="7" ry="4" fill="#F39C12"/>
    </svg>`;
  }

  // ========== 表情系统 ==========

  _getEyes(mood, type) {
    const eyeColor = type === 'panda' ? '#FFF' : '#333';
    const pupilSize = type === 'owl' ? 3 : 2.5;

    switch (mood) {
      case 'happy':
      case 'excited':
        return `<path d="M 35 36 Q 40 32 45 36" fill="none" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M 55 36 Q 60 32 65 36" fill="none" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round"/>`;
      case 'sleepy':
        return `<line x1="35" y1="36" x2="45" y2="36" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round"/>
                <line x1="55" y1="36" x2="65" y2="36" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round"/>`;
      case 'sad':
        return `<circle cx="40" cy="35" r="4" fill="${eyeColor}"/><circle cx="41" cy="34" r="1.5" fill="#FFF"/>
                <circle cx="60" cy="35" r="4" fill="${eyeColor}"/><circle cx="61" cy="34" r="1.5" fill="#FFF"/>
                <path d="M 34 30 Q 40 28 46 30" fill="none" stroke="${eyeColor}" stroke-width="1.5"/>
                <path d="M 54 30 Q 60 28 66 30" fill="none" stroke="${eyeColor}" stroke-width="1.5"/>`;
      case 'curious':
        return `<circle cx="40" cy="35" r="5" fill="${eyeColor}"/><circle cx="41" cy="34" r="2" fill="#FFF"/>
                <circle cx="60" cy="35" r="5" fill="${eyeColor}"/><circle cx="61" cy="34" r="2" fill="#FFF"/>`;
      case 'angry':
        return `<circle cx="40" cy="36" r="3.5" fill="${eyeColor}"/>
                <circle cx="60" cy="36" r="3.5" fill="${eyeColor}"/>
                <path d="M 34 30 L 46 33" fill="none" stroke="${eyeColor}" stroke-width="2"/>
                <path d="M 66 30 L 54 33" fill="none" stroke="${eyeColor}" stroke-width="2"/>`;
      default: // neutral
        return `<circle cx="40" cy="35" r="4" fill="${eyeColor}"/><circle cx="41" cy="34" r="${pupilSize}" fill="#FFF"/>
                <circle cx="60" cy="35" r="4" fill="${eyeColor}"/><circle cx="61" cy="34" r="${pupilSize}" fill="#FFF"/>`;
    }
  }

  _getMouth(mood) {
    switch (mood) {
      case 'happy':
      case 'excited':
        return '<path d="M 44 50 Q 50 56 56 50" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>';
      case 'sad':
        return '<path d="M 44 54 Q 50 48 56 54" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>';
      case 'sleepy':
        return '<ellipse cx="50" cy="52" rx="3" ry="2" fill="#333"/>';
      default:
        return '<path d="M 46 52 Q 50 54 54 52" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round"/>';
    }
  }
}
/**
 * 皮肤管理器 - 加载、切换、导入皮肤
 */
class SkinManager {
  constructor(stateMachine) {
    this.stateMachine = stateMachine;
    this.skins = {};
    this.currentSkin = null;
    this._currentBaseUrl = '';

    // 注册内置皮肤
    this._registerBuiltinSkins();
  }

  _getBaseUrl() {
    // 检测是否在浏览器插件环境中
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL('');
    }
    return '';
  }

  _registerBuiltinSkins() {
    // 写实 SVG 皮肤
    this._realisticRenderer = new RealisticPetRenderer();
    for (const pet of this._realisticRenderer.getPetList()) {
      this.skins['real_' + pet.id] = {
        name: pet.name,
        version: '1.0',
        author: 'system',
        default_scale: 1.0,
        _isRealistic: true,
        _petType: pet.id,
        hitbox: { x: 10, y: 10, width: 80, height: 80 },
        animations: {}
      };
    }

    // emoji皮肤
    this.skins['emoji_cat'] = {
      name: '🐱 小猫',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐱',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_dog'] = {
      name: '🐶 小狗',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐶',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_bunny'] = {
      name: '🐰 兔子',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐰',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_panda'] = {
      name: '🐼 熊猫',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐼',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_fox'] = {
      name: '🦊 狐狸',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🦊',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_penguin'] = {
      name: '🐧 企鹅',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐧',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
  }

  /**
   * 加载并应用皮肤
   */
  applySkin(skinId) {
    const skin = this.skins[skinId];
    if (!skin) return false;

    this.currentSkin = skin;
    this._currentBaseUrl = '';

    if (skin._isRealistic) {
      // 写实皮肤：渲染 SVG
      this.stateMachine.animator.stop();
      const svg = this._realisticRenderer.render(skin._petType, 'neutral');
      this.stateMachine.animator.setDefaultSVG(svg, skin._petType, this._realisticRenderer);
      this.stateMachine.animator.showDefault();
    } else if (skin._isEmoji) {
      // emoji皮肤：停止动画，显示emoji
      this.stateMachine.animator.stop();
      this.stateMachine.animator.setDefaultEmoji(skin.emoji);
      this.stateMachine.animator.showDefault();
    } else {
      // 图片皮肤：加载帧动画
      this.stateMachine.loadFromSkin(skin, this._currentBaseUrl);
      this.stateMachine.changeState('idle', true);
    }

    try { localStorage.setItem('web_pet_skin', skinId); } catch {}
    return true;
  }

  /**
   * 导入自定义皮肤包
   * @param {object} config - config.json 内容
   * @param {string} baseUrl - 帧图片基础URL
   */
  importSkin(config, baseUrl = '') {
    if (!config.name || !config.animations) return false;

    const skinId = 'custom_' + Date.now();
    this.skins[skinId] = config;
    this.skins[skinId]._baseUrl = baseUrl;

    return skinId;
  }

  /**
   * 通过文件导入皮肤
   */
  async importFromFiles(files) {
    // 解析ZIP或文件夹
    const config = null;
    const frameMap = {};

    for (const file of files) {
      const path = file.webkitRelativePath || file.name;
      if (path.endsWith('config.json')) {
        const text = await file.text();
        config = JSON.parse(text);
      } else if (path.includes('frames/') && (path.endsWith('.png') || path.endsWith('.gif'))) {
        const url = URL.createObjectURL(file);
        const name = path.split('/').pop();
        frameMap[name] = url;
      }
    }

    if (!config) return null;

    // 替换帧文件名为blob URL
    for (const anim of Object.values(config.animations)) {
      anim.frames = anim.frames.map(f => frameMap[f] || f);
    }

    return this.importSkin(config, '');
  }

  getSkinList() {
    return Object.entries(this.skins).map(([id, skin]) => ({
      id, name: skin.name, author: skin.author || ''
    }));
  }

  getCurrentSkinId() {
    try { return localStorage.getItem('web_pet_skin') || 'default_cat'; } catch { return 'default_cat'; }
  }

  /**
   * 快速导入单张图片作为宠物（自动应用到所有状态）
   */
  importSingleImage(imageUrl, name = '自定义宠物') {
    const skinId = 'custom_single_' + Date.now();
    this.skins[skinId] = {
      name: name,
      version: '1.0',
      author: 'user',
      default_scale: 1.0,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {
        idle: { frames: [imageUrl], fps: 1, loop: true },
        clicked: { frames: [imageUrl], fps: 1, loop: false },
        dragged: { frames: [imageUrl], fps: 1, loop: true },
        happy: { frames: [imageUrl], fps: 1, loop: false },
        idle_action: { frames: [imageUrl], fps: 1, loop: false },
        walk: { frames: [imageUrl], fps: 1, loop: false }
      }
    };
    // 保存到 chrome.storage.local（跨页面同步）
    this._saveCustomSkin(skinId, { name, imageUrl });
    return skinId;
  }

  _saveCustomSkin(skinId, data) {
    // 优先用 chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('custom_skins').then(result => {
        const customs = result.custom_skins || {};
        customs[skinId] = data;
        chrome.storage.local.set({ custom_skins: customs });
      });
    } else {
      try {
        const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
        customs[skinId] = data;
        localStorage.setItem('web_pet_custom_skins', JSON.stringify(customs));
      } catch {}
    }
  }

  /**
   * 导入多帧动画（每个状态一张图）
   */
  importMultiFrame(imageMap, name = '自定义宠物') {
    // imageMap: { idle: url, clicked: url, happy: url, ... }
    const skinId = 'custom_multi_' + Date.now();
    const animations = {};
    for (const [state, url] of Object.entries(imageMap)) {
      animations[state] = { frames: [url], fps: 1, loop: state === 'idle' || state === 'dragged' };
    }
    // 填充缺失状态
    const defaultStates = ['idle', 'clicked', 'dragged', 'happy', 'idle_action', 'walk'];
    const fallback = imageMap.idle || Object.values(imageMap)[0];
    for (const s of defaultStates) {
      if (!animations[s]) animations[s] = { frames: [fallback], fps: 1, loop: s === 'idle' || s === 'dragged' };
    }
    this.skins[skinId] = {
      name, version: '1.0', author: 'user',
      default_scale: 1.0,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations
    };
    return skinId;
  }

  /**
   * 加载用户自定义皮肤（支持chrome.storage.local跨页面同步）
   * @returns {Promise}
   */
  loadCustomSkins() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('custom_skins').then(result => {
          const customs = result.custom_skins || {};
          this._applyCustomSkins(customs);
          resolve();
        }).catch(() => resolve());
      } else {
        try {
          const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
          this._applyCustomSkins(customs);
        } catch {}
        resolve();
      }
    });
  }

  _applyCustomSkins(customs) {
    for (const [id, data] of Object.entries(customs)) {
      if (!this.skins[id] && data.imageUrl) {
        this.skins[id] = {
          name: data.name || '自定义',
          version: '1.0', author: 'user',
          default_scale: 1.0,
          hitbox: { x: 10, y: 10, width: 80, height: 80 },
          animations: {
            idle: { frames: [data.imageUrl], fps: 1, loop: true },
            clicked: { frames: [data.imageUrl], fps: 1, loop: false },
            dragged: { frames: [data.imageUrl], fps: 1, loop: true },
            happy: { frames: [data.imageUrl], fps: 1, loop: false },
            idle_action: { frames: [data.imageUrl], fps: 1, loop: false },
            walk: { frames: [data.imageUrl], fps: 1, loop: false }
          }
        };
      }
    }
  }

  /**
   * 删除自定义皮肤
   */
  removeCustomSkin(skinId) {
    delete this.skins[skinId];
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('custom_skins').then(result => {
        const customs = result.custom_skins || {};
        delete customs[skinId];
        chrome.storage.local.set({ custom_skins: customs });
      });
    } else {
      try {
        const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
        delete customs[skinId];
        localStorage.setItem('web_pet_custom_skins', JSON.stringify(customs));
      } catch {}
    }
  }
}
/**
 * 定时提醒
 */
class ReminderTool {
  constructor() {
    this.reminders = [];
    this._timer = null;
    this._load();
    this._startCheck();
  }

  _load() {
    try {
      this.reminders = JSON.parse(localStorage.getItem('web_pet_reminders') || '[]');
    } catch { this.reminders = []; }
  }

  _save() {
    try { localStorage.setItem('web_pet_reminders', JSON.stringify(this.reminders)); } catch {}
  }

  /**
   * 添加提醒
   * @param {string} content - 提醒内容
   * @param {number} triggerAt - 触发时间戳ms
   * @param {string} repeat - none | daily
   */
  add(content, triggerAt, repeat = 'none') {
    const reminder = {
      id: Date.now().toString(36),
      content,
      triggerAt,
      repeat,
      enabled: true
    };
    this.reminders.push(reminder);
    this._save();
    return reminder.id;
  }

  remove(id) {
    this.reminders = this.reminders.filter(r => r.id !== id);
    this._save();
  }

  toggle(id) {
    const r = this.reminders.find(r => r.id === id);
    if (r) { r.enabled = !r.enabled; this._save(); }
  }

  getAll() {
    return [...this.reminders];
  }

  getActive() {
    return this.reminders.filter(r => r.enabled);
  }

  getActiveCount() {
    return this.reminders.filter(r => r.enabled).length;
  }

  _startCheck() {
    this._timer = setInterval(() => {
      const now = Date.now();
      const toRemove = [];
      for (const r of this.reminders) {
        if (!r.enabled) continue;
        if (now >= r.triggerAt) {
          this._trigger(r);
          if (r.repeat === 'daily') {
            r.triggerAt += 86400000;
          } else {
            r.enabled = false;
            toRemove.push(r.id);
          }
        }
      }
      // 延迟移除，避免遍历时修改数组
      for (const id of toRemove) this.remove(id);
      if (toRemove.length === 0) this._save();
    }, 10000); // 每10秒检查
  }

  _trigger(reminder) {
    if (this.onTrigger) {
      this.onTrigger(reminder);
    }
  }

  destroy() {
    clearInterval(this._timer);
  }
}
/**
 * 整点报时
 */
class HourlyTool {
  constructor() {
    this.enabled = true;
    this.silentStart = 23; // 静默开始时间（24小时制）
    this.silentEnd = 7;    // 静默结束时间
    this._timer = null;
    this._lastHour = -1;

    this._load();
    this._startCheck();
  }

  _load() {
    try {
      const cfg = JSON.parse(localStorage.getItem('web_pet_hourly') || '{}');
      this.enabled = cfg.enabled !== false;
      this.silentStart = cfg.silentStart ?? 23;
      this.silentEnd = cfg.silentEnd ?? 7;
    } catch {}
  }

  _save() {
    try {
      localStorage.setItem('web_pet_hourly', JSON.stringify({
        enabled: this.enabled,
        silentStart: this.silentStart,
        silentEnd: this.silentEnd
      }));
    } catch {}
  }

  setEnabled(v) { this.enabled = v; this._save(); }
  setSilentRange(start, end) { this.silentStart = start; this.silentEnd = end; this._save(); }

  _startCheck() {
    this._timer = setInterval(() => {
      if (!this.enabled) return;
      const now = new Date();
      const hour = now.getHours();

      if (hour === this._lastHour) return;
      this._lastHour = hour;

      // 静默时段检查
      if (this.silentStart > this.silentEnd) {
        if (hour >= this.silentStart || hour < this.silentEnd) return;
      } else {
        if (hour >= this.silentStart && hour < this.silentEnd) return;
      }

      if (this.onChime) {
        this.onChime(hour);
      }
    }, 30000); // 每30秒检查
  }

  destroy() {
    clearInterval(this._timer);
  }
}
/**
 * 快捷便签
 */
class NotepadTool {
  constructor() {
    this.notes = [];
    this._load();
  }

  _load() {
    try { this.notes = JSON.parse(localStorage.getItem('web_pet_notes') || '[]'); } catch { this.notes = []; }
  }

  _save() {
    try { localStorage.setItem('web_pet_notes', JSON.stringify(this.notes)); } catch {}
  }

  add(text, pinned = false) {
    const note = { id: Date.now().toString(36), text, pinned, done: false, createdAt: Date.now() };
    this.notes.unshift(note);
    this._save();
    return note.id;
  }

  remove(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    this._save();
  }

  toggleDone(id) {
    const n = this.notes.find(n => n.id === id);
    if (n) { n.done = !n.done; this._save(); }
  }

  togglePin(id) {
    const n = this.notes.find(n => n.id === id);
    if (n) { n.pinned = !n.pinned; this._save(); }
  }

  edit(id, text) {
    const n = this.notes.find(n => n.id === id);
    if (n) { n.text = text; this._save(); }
  }

  getAll() { return [...this.notes]; }
  getPinned() { return this.notes.filter(n => n.pinned && !n.done); }
  clear() { this.notes = []; this._save(); }
}
/**
 * 右键快捷菜单
 */
class ContextMenu {
  constructor() {
    this.el = null;
    this._init();
  }

  _init() {
    this.el = document.createElement('div');
    this.el.className = 'web-pet-context-menu';
    Object.assign(this.el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      background: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      padding: '6px 0',
      minWidth: '180px',
      maxHeight: '80vh',
      overflowY: 'auto',
      display: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px'
    });
    document.body.appendChild(this.el);

    // 点击外部关闭
    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', () => this.hide());
  }

  show(x, y, items) {
    this.el.innerHTML = '';
    // 确保坐标有效
    if (typeof x !== 'number' || typeof y !== 'number') {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }
    items.forEach(item => {
      if (item.divider) {
        const div = document.createElement('div');
        Object.assign(div.style, { height: '1px', background: '#eee', margin: '4px 0' });
        this.el.appendChild(div);
        return;
      }
      const row = document.createElement('div');
      row.textContent = item.label;
      if (item.isTitle) {
        Object.assign(row.style, {
          padding: '6px 16px 2px',
          fontSize: '11px',
          color: '#999',
          fontWeight: '600',
          cursor: 'default'
        });
      } else {
        Object.assign(row.style, {
          padding: '7px 16px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          fontSize: '13px'
        });
        row.addEventListener('mouseenter', () => row.style.background = '#f5f5f5');
        row.addEventListener('mouseleave', () => row.style.background = '');
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hide();
          if (item.action) item.action();
        });
      }
      this.el.appendChild(row);
    });

    // 定位，确保不超出屏幕
    const menuW = this.el.offsetWidth || 180;
    const menuH = this.el.children.length * 36;
    const maxX = window.innerWidth - menuW - 8;
    const maxY = window.innerHeight - menuH - 8;
    this.el.style.left = Math.max(8, Math.min(x, maxX)) + 'px';
    this.el.style.top = Math.max(8, Math.min(y, maxY)) + 'px';
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }

  destroy() {
    this.el?.remove();
  }
}
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
          <div class="qp-tab" data-tab="skin" style="flex:1;padding:10px;text-align:center;cursor:pointer;font-size:13px;color:#999">🎨 皮肤</div>
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

      <div id="qp-tab-skin" style="padding:14px;max-height:320px;overflow-y:auto;display:none">
        <div style="margin-bottom:10px">
          <button id="qp-import-img" style="width:100%;padding:12px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600">📷 导入图片作为宠物</button>
          <div style="font-size:11px;color:#999;margin-top:6px;text-align:center">支持 PNG / JPG / GIF，建议透明背景</div>
        </div>
        <div style="font-size:12px;color:#666;margin-bottom:8px">切换默认形象</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${this.options.getSkins?.().map(s => `
            <div class="qp-skin-item" data-id="${s.id}" style="text-align:center;padding:10px 6px;border:2px solid ${s.id === this.options.getCurrentSkinId?.() ? '#FF6B81' : '#eee'};border-radius:10px;cursor:pointer;background:${s.id === this.options.getCurrentSkinId?.() ? '#FFE8E8' : '#fff'}">
              <div style="font-size:28px">${s.name.match(/^[^\s]+/)?.[0] || '🐾'}</div>
              <div style="font-size:11px;margin-top:4px;color:#666">${s.name.replace(/^[^\s]+\s*/, '')}</div>
            </div>
          `).join('') || ''}
        </div>
        ${this.options.getCustomSkins?.().length > 0 ? `
          <div style="font-size:12px;color:#666;margin:12px 0 8px">自定义皮肤</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${this.options.getCustomSkins?.().map(s => `
              <div class="qp-skin-item" data-id="${s.id}" style="text-align:center;padding:10px 6px;border:2px solid #eee;border-radius:10px;cursor:pointer;position:relative">
                <div style="font-size:28px">🖼️</div>
                <div style="font-size:11px;margin-top:4px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name}</div>
                <span class="qp-skin-del" data-id="${s.id}" style="position:absolute;top:4px;right:6px;font-size:10px;color:#ccc;cursor:pointer">✕</span>
              </div>
            `).join('') || ''}
          </div>
        ` : ''}
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const $ = id => this.el.querySelector('#' + id);

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
        $('qp-tab-skin').style.display = tab.dataset.tab === 'skin' ? 'block' : 'none';
      };
    });

    // 导入图片
    const importBtn = $('qp-import-img');
    if (importBtn) importBtn.onclick = () => { this.options.onImportImage?.(); this.hide(); };

    // 切换皮肤
    this.el.querySelectorAll('.qp-skin-item').forEach(item => {
      item.onclick = () => {
        this.options.onSkinChange?.(item.dataset.id);
        this.hide();
      };
    });

    // 删除自定义皮肤
    this.el.querySelectorAll('.qp-skin-del').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.options.onSkinDelete?.(btn.dataset.id);
        this._render();
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
          <div class="sp-title">🤖 AI 配置</div>
          <div style="font-size:12px;color:#666;margin-bottom:8px">接入 AI 大模型，驱动宠物聊天对话 + 自主行为 + 情绪反应</div>
          <div class="sp-row">
            <span>厂商</span>
            <select id="sp-ai-provider" style="width:170px;padding:4px 6px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none;background:#fff">
              <option value="">-- 选择厂商 --</option>
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="qwen">通义千问</option>
              <option value="zhipu">智谱 GLM</option>
              <option value="moonshot">Moonshot (Kimi)</option>
              <option value="minimax">MiniMax</option>
              <option value="baichuan">百川</option>
              <option value="spark">讯飞星火</option>
              <option value="ollama">Ollama (本地)</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="sp-row">
            <span>API 地址</span>
            <input type="text" id="sp-ai-endpoint" placeholder="选择厂商自动填入" style="width:170px;padding:4px 8px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none">
          </div>
          <div class="sp-row">
            <span>API Key</span>
            <input type="password" id="sp-ai-key" placeholder="sk-..." style="width:170px;padding:4px 8px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none">
          </div>
          <div class="sp-row">
            <span>模型</span>
            <select id="sp-ai-model-select" style="width:170px;padding:4px 6px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none;background:#fff;display:none"></select>
            <input type="text" id="sp-ai-model" placeholder="gpt-3.5-turbo" style="width:170px;padding:4px 8px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none">
          </div>
          <div class="sp-row">
            <span>人设提示词</span>
          </div>
          <textarea id="sp-ai-prompt" rows="3" style="width:100%;padding:6px 8px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none;resize:vertical;font-family:inherit"></textarea>
          <div style="margin-top:8px;display:flex;gap:6px">
            <button class="sp-btn" id="sp-ai-save" style="background:#FF6B81;color:#fff;border-color:#FF6B81">保存配置</button>
            <button class="sp-btn" id="sp-ai-test">测试连接</button>
          </div>
          <div id="sp-ai-status" style="font-size:11px;margin-top:6px;color:#999"></div>
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

    // AI 厂商配置表（防御性初始化）
    if (!$('sp-ai-provider')) return; // AI 区块不存在则跳过
    const AI_PROVIDERS = {
      openai: {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
      },
      deepseek: {
        name: 'DeepSeek',
        endpoint: 'https://api.deepseek.com/v1',
        models: ['deepseek-chat', 'deepseek-reasoner']
      },
      qwen: {
        name: '通义千问',
        endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long']
      },
      zhipu: {
        name: '智谱 GLM',
        endpoint: 'https://open.bigmodel.cn/api/paas/v4',
        models: ['glm-4-flash', 'glm-4', 'glm-4-plus', 'glm-3-turbo']
      },
      moonshot: {
        name: 'Moonshot (Kimi)',
        endpoint: 'https://api.moonshot.cn/v1',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
      },
      minimax: {
        name: 'MiniMax',
        endpoint: 'https://api.minimax.chat/v1',
        models: ['abab6.5-chat', 'abab6.5s-chat', 'abab5.5-chat']
      },
      baichuan: {
        name: '百川',
        endpoint: 'https://api.baichuan-ai.com/v1',
        models: ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan2-Turbo']
      },
      spark: {
        name: '讯飞星火',
        endpoint: 'https://spark-api-open.xf-yun.com/v1',
        models: ['generalv3.5', 'generalv3', '4.0Ultra']
      },
      ollama: {
        name: 'Ollama (本地)',
        endpoint: 'http://localhost:11434/v1',
        models: ['qwen2.5', 'llama3', 'mistral', 'deepseek-r1']
      }
    };

    // AI 聊天配置
    const chatCfg = this.options.getChatConfig?.() || {};
    const providerSelect = $('sp-ai-provider');
    const epInput = $('sp-ai-endpoint');
    const keyInput = $('sp-ai-key');
    const modelInput = $('sp-ai-model');
    const modelSelect = $('sp-ai-model-select');
    const promptInput = $('sp-ai-prompt');

    if (!providerSelect || !epInput || !keyInput || !modelInput) return; // 元素不存在则跳过

    // 根据已保存的 endpoint 反推厂商
    let matchedProvider = 'custom';
    for (const [k, v] of Object.entries(AI_PROVIDERS)) {
      if (chatCfg.endpoint === v.endpoint) { matchedProvider = k; break; }
    }
    providerSelect.value = matchedProvider;
    epInput.value = chatCfg.endpoint || '';
    keyInput.value = chatCfg.apiKey || '';
    modelInput.value = chatCfg.model || 'gpt-3.5-turbo';
    if (promptInput) promptInput.value = chatCfg.systemPrompt || '';

    // 厂商下拉切换
    if (providerSelect) {
      providerSelect.onchange = () => {
        const key = providerSelect.value;
        const p = AI_PROVIDERS[key];
        if (p && key !== 'custom') {
          epInput.value = p.endpoint;
          // 显示模型下拉
          if (modelSelect && p.models) {
            modelSelect.innerHTML = p.models.map(m => `<option value="${m}">${m}</option>`).join('');
            modelSelect.style.display = '';
            modelInput.style.display = 'none';
            modelInput.value = p.models[0];
          }
        } else {
          if (modelSelect) modelSelect.style.display = 'none';
          modelInput.style.display = '';
        }
      };
      // 触发一次以初始化模型下拉
      providerSelect.onchange();
    }

    // 模型下拉同步到隐藏的 model input
    if (modelSelect) {
      modelSelect.onchange = () => { modelInput.value = modelSelect.value; };
    }

    const saveBtn = $('sp-ai-save');
    if (saveBtn) saveBtn.onclick = () => {
      const modelVal = modelSelect && modelSelect.style.display !== 'none' ? modelSelect.value : modelInput.value;
      this.options.onSaveChatConfig?.({
        endpoint: epInput.value.trim(),
        apiKey: keyInput.value.trim(),
        model: (modelVal || '').trim() || 'gpt-3.5-turbo',
        systemPrompt: promptInput ? promptInput.value.trim() : ''
      });
      const status = $('sp-ai-status');
      if (status) { status.textContent = '✅ 已保存'; status.style.color = '#52C41A'; }
    };

    const testBtn = $('sp-ai-test');
    if (testBtn) testBtn.onclick = async () => {
      const status = $('sp-ai-status');
      if (status) { status.textContent = '⏳ 测试中...'; status.style.color = '#999'; }
      try {
        await this.options.onTestChat?.();
        if (status) { status.textContent = '✅ 连接成功'; status.style.color = '#52C41A'; }
      } catch (e) {
        if (status) { status.textContent = '❌ ' + e.message; status.style.color = '#FF4D4F'; }
      }
    };
  }

  destroy() {
    this.el?.remove();
    this._overlay?.remove();
  }
}
/**
 * 提醒列表浮动组件 - 右上角显示，带数量徽章
 * 显示10秒后自动收起，点击标题可重新展开
 */
class ReminderWidget {
  constructor(reminderTool) {
    this.reminder = reminderTool;
    this.el = null;
    this._collapsed = false;
    this._hideTimer = null;
    this._tickFrame = null;
    this._shownAt = null;
    this.DISPLAY_MS = 10000; // 10秒自动收起
    this._lastCount = -1; // 上次提醒数量，-1 表示首次加载
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
      display: 'none',
      opacity: '0',
      transform: 'translateY(-12px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
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
          <div style="display:flex;align-items:center;gap:8px">
            <span class="rw-timer" style="font-size:10px;color:#444"></span>
            <span class="rw-chevron" style="font-size:10px;color:#666;transition:transform 0.25s">▼</span>
          </div>
        </div>
        <div class="rw-body" style="max-height:300px;overflow:hidden;transition:max-height 0.35s">
          <div class="rw-scroll" style="max-height:260px;overflow-y:auto;padding-bottom:4px"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);

    // 点击标题：如果已收起则展开并重新计时
    const header = this.el.querySelector('.rw-header');
    header.addEventListener('click', () => {
      if (this._collapsed) {
        this._collapsed = false;
        this.el.querySelector('.rw-body').style.maxHeight = '300px';
        this.el.querySelector('.rw-chevron').style.transform = '';
        this._startAutoHide();
      } else {
        this._hide();
      }
    });

    // 定时刷新列表
    setInterval(() => this.refresh(), 10000);
    this.refresh(); // 首次调用会设置 _lastCount 但不会弹出
  }

  /**
   * 显示卡片并启动10秒倒计时
   */
  _show() {
    this.el.style.display = 'block';
    requestAnimationFrame(() => {
      this.el.style.opacity = '1';
      this.el.style.transform = 'translateY(0)';
    });
    this._startAutoHide();
  }

  /**
   * 隐藏卡片
   */
  _hide() {
    this.el.style.opacity = '0';
    this.el.style.transform = 'translateY(-12px)';
    clearTimeout(this._hideTimer);
    cancelAnimationFrame(this._tickFrame);
    this._hideTimer = null;
    this._tickFrame = null;
    this._shownAt = null;
    this.el.querySelector('.rw-timer').textContent = '';
    setTimeout(() => {
      this.el.style.display = 'none';
      // 通知天气组件位置变化
      if (this.onVisibilityChange) this.onVisibilityChange(0);
    }, 350);
  }

  /**
   * 启动10秒自动隐藏计时器
   */
  _startAutoHide() {
    clearTimeout(this._hideTimer);
    cancelAnimationFrame(this._tickFrame);
    this._shownAt = Date.now();

    this._hideTimer = setTimeout(() => this._hide(), this.DISPLAY_MS);
    this._tickTimer();
  }

  _tickTimer() {
    if (!this._shownAt) return;
    const elapsed = Math.floor((Date.now() - this._shownAt) / 1000);
    const remaining = Math.max(0, 10 - elapsed);
    this.el.querySelector('.rw-timer').textContent = remaining + 's';
    if (remaining > 0) this._tickFrame = requestAnimationFrame(() => this._tickTimer());
  }

  /**
   * 获取组件当前高度，供天气组件定位参考
   */
  getHeight() {
    if (!this.el || this.el.style.display === 'none') return 0;
    return this.el.offsetHeight + 8;
  }

  refresh() {
    const all = this.reminder.getAll();
    const active = all.filter(r => r.enabled);
    const badge = this.el.querySelector('.rw-badge');
    const scroll = this.el.querySelector('.rw-scroll');

    badge.textContent = active.length;

    const wasVisible = this.el.style.display !== 'none' && this.el.style.opacity !== '0';
    const nowVisible = active.length > 0;
    const countChanged = this._lastCount !== active.length;
    const isFirstLoad = this._lastCount === -1;
    this._lastCount = active.length;

    if (isFirstLoad) {
      // 首次加载：只更新徽章数字，不弹出
      if (this.onVisibilityChange) this.onVisibilityChange(0);
      return;
    }

    if (countChanged && nowVisible && !wasVisible) {
      // 提醒从无到有，或数量变化，弹出显示
      this._collapsed = false;
      this.el.querySelector('.rw-body').style.maxHeight = '300px';
      this.el.querySelector('.rw-chevron').style.transform = '';
      this._show();
      if (this.onVisibilityChange) this.onVisibilityChange(this.getHeight());
    } else if (!nowVisible && wasVisible) {
      this._hide();
    } else if (countChanged && nowVisible) {
      // 数量变化但卡片仍在显示，刷新内容并重启计时
      this._startAutoHide();
      if (this.onVisibilityChange) this.onVisibilityChange(this.getHeight());
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
    clearTimeout(this._hideTimer);
    cancelAnimationFrame(this._tickFrame);
    this.el?.remove();
  }
}
/**
 * 迷你游戏模块 - 右键菜单触发
 */
class MiniGames {
  constructor(bubble, container) {
    this.bubble = bubble;
    this.container = container;
  }

  /**
   * 石头剪刀布
   */
  rockPaperScissors() {
    const choices = [
      { emoji: '✊', name: '石头' },
      { emoji: '✌️', name: '剪刀' },
      { emoji: '🖐️', name: '布' }
    ];

    // 创建选择面板
    this._showGamePanel('✊✌️🖐️ 石头剪刀布', `
      <div style="text-align:center">
        <div id="rps-result" style="font-size:24px;margin:16px 0;min-height:40px">出拳！</div>
        <div style="display:flex;gap:16px;justify-content:center">
          <button class="game-btn rps-choice" data-choice="0" style="font-size:36px;padding:12px;border:2px solid #eee;border-radius:16px;background:#fff;cursor:pointer">✊</button>
          <button class="game-btn rps-choice" data-choice="1" style="font-size:36px;padding:12px;border:2px solid #eee;border-radius:16px;background:#fff;cursor:pointer">✌️</button>
          <button class="game-btn rps-choice" data-choice="2" style="font-size:36px;padding:12px;border:2px solid #eee;border-radius:16px;background:#fff;cursor:pointer">🖐️</button>
        </div>
        <div id="rps-score" style="margin-top:12px;font-size:12px;color:#999">赢0 平0 输0</div>
      </div>
    `);

    let wins = 0, draws = 0, losses = 0;

    this.panel.el.querySelectorAll('.rps-choice').forEach(btn => {
      btn.onclick = () => {
        const player = parseInt(btn.dataset.choice);
        const pet = Math.floor(Math.random() * 3);
        const resultEl = this.panel.el.querySelector('#rps-result');
        const scoreEl = this.panel.el.querySelector('#rps-score');

        // 判定
        let result;
        if (player === pet) { result = '平局！'; draws++; }
        else if ((player + 1) % 3 === pet) { result = '你赢了！🎉'; wins++; }
        else { result = '你输了！😈'; losses++; }

        resultEl.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:12px">
            <span>${choices[player].emoji}</span>
            <span style="font-size:16px">VS</span>
            <span>${choices[pet].emoji}</span>
          </div>
          <div style="font-size:16px;margin-top:8px;font-weight:600">${result}</div>
        `;
        scoreEl.textContent = `赢${wins} 平${draws} 输${losses}`;

        // 按钮反馈
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 150);
      };
    });
  }

  /**
   * 掷骰子
   */
  rollDice() {
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    this._showGamePanel('🎲 掷骰子', `
      <div style="text-align:center">
        <div id="dice-result" style="font-size:64px;margin:20px 0">🎲</div>
        <button class="game-btn" id="dice-roll" style="padding:12px 32px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:12px;font-size:16px;cursor:pointer">掷！</button>
        <div id="dice-history" style="margin-top:12px;font-size:12px;color:#999"></div>
      </div>
    `);

    const history = [];
    this.panel.el.querySelector('#dice-roll').onclick = () => {
      const resultEl = this.panel.el.querySelector('#dice-result');
      const historyEl = this.panel.el.querySelector('#dice-history');

      // 摇骰动画
      let count = 0;
      const shake = setInterval(() => {
        resultEl.textContent = dice[Math.floor(Math.random() * 6)];
        count++;
        if (count > 10) {
          clearInterval(shake);
          const final = Math.floor(Math.random() * 6);
          resultEl.textContent = dice[final];
          history.push(final + 1);
          if (history.length > 5) history.shift();
          historyEl.textContent = '历史: ' + history.join(', ');
        }
      }, 80);
    };
  }

  /**
   * 猜数字
   */
  guessNumber() {
    const target = Math.floor(Math.random() * 100) + 1;
    let attempts = 0;

    this._showGamePanel('🔢 猜数字（1-100）', `
      <div style="text-align:center">
        <div id="gn-hint" style="font-size:18px;margin:16px 0;color:#666">猜一个 1-100 的数字</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
          <input type="number" id="gn-input" min="1" max="100" style="width:80px;padding:8px;border:2px solid #eee;border-radius:10px;font-size:18px;text-align:center;outline:none">
          <button class="game-btn" id="gn-guess" style="padding:8px 20px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:16px;cursor:pointer">猜！</button>
        </div>
        <div id="gn-attempts" style="font-size:12px;color:#999">已猜 0 次</div>
        <button class="game-btn" id="gn-reset" style="margin-top:10px;padding:6px 16px;border:1px solid #eee;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;display:none">再来一局</button>
      </div>
    `);

    const input = this.panel.el.querySelector('#gn-input');
    const hint = this.panel.el.querySelector('#gn-hint');
    const guessBtn = this.panel.el.querySelector('#gn-guess');
    const attemptsEl = this.panel.el.querySelector('#gn-attempts');
    const resetBtn = this.panel.el.querySelector('#gn-reset');

    const doGuess = () => {
      const val = parseInt(input.value);
      if (!val || val < 1 || val > 100) return;
      attempts++;

      if (val === target) {
        hint.innerHTML = `🎉 猜对了！答案就是 <b>${target}</b>`;
        hint.style.color = '#52C41A';
        guessBtn.disabled = true;
        resetBtn.style.display = 'inline-block';
      } else if (val < target) {
        hint.textContent = '📈 太小了！再大一点';
        hint.style.color = '#FF6B81';
      } else {
        hint.textContent = '📉 太大了！再小一点';
        hint.style.color = '#FF6B81';
      }
      attemptsEl.textContent = `已猜 ${attempts} 次`;
      input.value = '';
      input.focus();
    };

    guessBtn.onclick = doGuess;
    input.onkeydown = (e) => { if (e.key === 'Enter') doGuess(); };
    resetBtn.onclick = () => {
      this.guessNumber(); // 重新开始
    };
    input.focus();
  }

  /**
   * 今日运势
   */
  fortune() {
    const fortunes = [
      { level: '大吉', emoji: '🌟', desc: '今天运气爆棚！做什么都顺！', score: 98 },
      { level: '中吉', emoji: '✨', desc: '运势不错，适合出门走走', score: 80 },
      { level: '小吉', emoji: '🌸', desc: '平稳的一天，小确幸不断', score: 65 },
      { level: '吉', emoji: '🍀', desc: '一切顺利，保持好心情', score: 55 },
      { level: '末吉', emoji: '🍃', desc: '需要多努力一点，结果会好的', score: 45 },
      { level: '凶', emoji: '🌧️', desc: '今天小心行事，多喝水早睡觉', score: 30 },
      { level: '大凶', emoji: '⛈️', desc: '建议今天躺平，明天再来！', score: 10 }
    ];
    const lucky = [
      '向东方走会有好运', '穿红色衣服运势UP', '今天适合吃甜食',
      '遇到猫会有好事', '数字7是你的幸运数字', '下午3点后运气转好',
      '今天适合学习新东西', '给朋友发条消息会有惊喜'
    ];

    const f = fortunes[Math.floor(Math.random() * fortunes.length)];
    const l = lucky[Math.floor(Math.random() * lucky.length)];
    const color = f.score >= 60 ? '#52C41A' : f.score >= 40 ? '#FAAD14' : '#FF4D4F';

    this._showGamePanel('🔮 今日运势', `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:48px;margin-bottom:8px">${f.emoji}</div>
        <div style="font-size:28px;font-weight:700;color:${color}">${f.level}</div>
        <div style="font-size:14px;color:#666;margin:8px 0">${f.desc}</div>
        <div style="background:#f5f5f5;border-radius:10px;padding:10px;margin:12px 0">
          <div style="font-size:12px;color:#999">今日宜</div>
          <div style="font-size:14px;margin-top:4px">🍀 ${l}</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:8px">
          <div style="text-align:center">
            <div style="font-size:12px;color:#999">运势指数</div>
            <div style="font-size:20px;font-weight:600;color:${color}">${f.score}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:12px;color:#999">幸运色</div>
            <div style="font-size:20px">🎨</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:12px;color:#999">幸运数</div>
            <div style="font-size:20px;font-weight:600">${Math.floor(Math.random()*9)+1}</div>
          </div>
        </div>
        <button class="game-btn" id="fortune-reroll" style="margin-top:14px;padding:8px 24px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">再测一次</button>
      </div>
    `);

    this.panel.el.querySelector('#fortune-reroll').onclick = () => this.fortune();
  }

  /**
   * 抽卡
   */
  drawCard() {
    const cards = [
      { name: '命运之轮', emoji: '🎡', meaning: '转机将至，把握机会' },
      { name: '太阳', emoji: '☀️', meaning: '光明与成功，正能量满满' },
      { name: '月亮', emoji: '🌙', meaning: '直觉敏锐，注意细节' },
      { name: '星星', emoji: '⭐', meaning: '愿望即将实现' },
      { name: '恋人', emoji: '💕', meaning: '人际关系和谐' },
      { name: '力量', emoji: '💪', meaning: '内心强大，克服困难' },
      { name: '愚者', emoji: '🃏', meaning: '新的开始，勇敢尝试' },
      { name: '魔术师', emoji: '🎩', meaning: '创造力爆发，心想事成' },
      { name: '隐者', emoji: '🏮', meaning: '需要独处思考' },
      { name: '恶魔', emoji: '😈', meaning: '小心诱惑，保持清醒' }
    ];

    const card = cards[Math.floor(Math.random() * cards.length)];
    const isGood = ['命运之轮', '太阳', '星星', '恋人', '力量', '魔术师'].includes(card.name);

    this._showGamePanel('🃏 今日一卡', `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:64px;margin:16px 0">${card.emoji}</div>
        <div style="font-size:20px;font-weight:700">${card.name}</div>
        <div style="font-size:14px;color:#666;margin:8px 0">${card.meaning}</div>
        <div style="background:${isGood ? '#E6FFE6' : '#FFF1F0'};border-radius:10px;padding:10px;margin-top:12px">
          <div style="font-size:13px;color:${isGood ? '#52C41A' : '#FF4D4F'}">${isGood ? '✅ 好兆头' : '⚠️ 需注意'}</div>
        </div>
        <button class="game-btn" id="card-redraw" style="margin-top:14px;padding:8px 24px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">再抽一张</button>
      </div>
    `);

    this.panel.el.querySelector('#card-redraw').onclick = () => this.drawCard();
  }

  /**
   * 21点 (Blackjack)
   */
  blackjack() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    let deck = [], playerHand = [], dealerHand = [], gameOver = false;

    const createDeck = () => {
      deck = [];
      for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s });
      // 洗牌
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    };

    const cardStr = c => `<span style="color:${'♥♦'.includes(c.suit) ? '#e74c3c' : '#333'}">${c.rank}${c.suit}</span>`;

    const handValue = hand => {
      let sum = 0, aces = 0;
      for (const c of hand) {
        if (c.rank === 'A') { sum += 11; aces++; }
        else if ('JQK'.includes(c.rank)) sum += 10;
        else sum += parseInt(c.rank);
      }
      while (sum > 21 && aces > 0) { sum -= 10; aces--; }
      return sum;
    };

    const render = () => {
      const pv = handValue(playerHand);
      const dv = handValue(dealerHand);
      const dealerShow = gameOver ? dealerHand.map(cardStr).join(' ') : cardStr(dealerHand[0]) + ' ?';
      const dealerVal = gameOver ? dv : '?';

      const dealerEl = this.panel.el?.querySelector('#bj-dealer');
      const playerEl = this.panel.el?.querySelector('#bj-player');
      if (!dealerEl || !playerEl) return; // 面板已关闭

      dealerEl.innerHTML =
        `<div style="font-size:12px;color:#999;margin-bottom:4px">庄家 (${dealerVal})</div>` +
        `<div style="font-size:20px;letter-spacing:4px">${dealerShow}</div>`;
      playerEl.innerHTML =
        `<div style="font-size:12px;color:#999;margin-bottom:4px">你的牌 (${pv})</div>` +
        `<div style="font-size:20px;letter-spacing:4px">${playerHand.map(cardStr).join(' ')}</div>`;

      const statusEl = this.panel.el.querySelector('#bj-status');
      const hitBtn = this.panel.el.querySelector('#bj-hit');
      const standBtn = this.panel.el.querySelector('#bj-stand');
      const actionsEl = this.panel.el.querySelector('#bj-actions');
      if (!statusEl || !hitBtn || !standBtn || !actionsEl) return;

      if (gameOver) {
        hitBtn.style.display = 'none';
        standBtn.style.display = 'none';
        actionsEl.style.display = 'block';
        if (pv > 21) { statusEl.textContent = '💥 爆了！你输了'; statusEl.style.color = '#e74c3c'; }
        else if (dv > 21) { statusEl.textContent = '🎉 庄家爆了！你赢了'; statusEl.style.color = '#27ae60'; }
        else if (pv > dv) { statusEl.textContent = '🎉 你赢了！'; statusEl.style.color = '#27ae60'; }
        else if (pv < dv) { statusEl.textContent = '😈 庄家赢了'; statusEl.style.color = '#e74c3c'; }
        else { statusEl.textContent = '🤝 平局'; statusEl.style.color = '#f39c12'; }
      } else {
        if (pv === 21) { statusEl.textContent = '🎯 21点！'; statusEl.style.color = '#27ae60'; gameOver = true; render(); return; }
        statusEl.textContent = '要牌还是停牌？';
        statusEl.style.color = '#666';
      }
    };

    const startGame = () => {
      createDeck();
      playerHand = [deck.pop(), deck.pop()];
      dealerHand = [deck.pop(), deck.pop()];
      gameOver = false;
      this.panel.el.querySelector('#bj-hit').style.display = '';
      this.panel.el.querySelector('#bj-stand').style.display = '';
      this.panel.el.querySelector('#bj-actions').style.display = 'none';
      render();
    };

    this._showGamePanel('🃏 21点', `
      <div style="text-align:center">
        <div id="bj-dealer" style="margin-bottom:16px;padding:12px;background:#f9f9f9;border-radius:10px"></div>
        <div id="bj-player" style="margin-bottom:12px;padding:12px;background:#f0f7ff;border-radius:10px"></div>
        <div id="bj-status" style="font-size:16px;font-weight:600;margin:12px 0"></div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="game-btn" id="bj-hit" style="padding:10px 28px;background:#27ae60;color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer">要牌</button>
          <button class="game-btn" id="bj-stand" style="padding:10px 28px;background:#e67e22;color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer">停牌</button>
        </div>
        <div id="bj-actions" style="display:none">
          <button class="game-btn" id="bj-new" style="padding:10px 28px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer">再来一局</button>
        </div>
      </div>
    `);

    this.panel.el.querySelector('#bj-hit').onclick = () => {
      playerHand.push(deck.pop());
      if (handValue(playerHand) >= 21) { gameOver = true; }
      render();
    };
    this.panel.el.querySelector('#bj-stand').onclick = () => {
      gameOver = true;
      while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());
      render();
    };
    this.panel.el.querySelector('#bj-new').onclick = startGame;
    startGame();
  }

  /**
   * 记忆翻牌
   */
  memoryFlip() {
    const emojis = ['🍎','🍊','🍋','🍇','🍓','🍒','🥝','🍑'];
    let cards = [], flipped = [], matched = [], moves = 0, lockBoard = false;

    const initCards = () => {
      const pairs = [...emojis.slice(0, 6), ...emojis.slice(0, 6)]; // 6对=12张
      cards = pairs.sort(() => Math.random() - 0.5);
      flipped = [];
      matched = [];
      moves = 0;
      lockBoard = false;
    };

    const render = () => {
      const grid = this.panel.el?.querySelector('#mf-grid');
      const info = this.panel.el?.querySelector('#mf-info');
      if (!grid || !info) return;
      grid.innerHTML = cards.map((c, i) => {
        const isFlipped = flipped.includes(i) || matched.includes(i);
        const isMatched = matched.includes(i);
        return `<div class="mf-card" data-idx="${i}" style="
          width:56px;height:56px;display:flex;align-items:center;justify-content:center;
          font-size:24px;border-radius:10px;cursor:pointer;user-select:none;
          transition:transform 0.3s;transform:${isFlipped ? 'rotateY(180deg)' : 'none'};
          background:${isMatched ? '#e8f5e9' : isFlipped ? '#fff' : '#667eea'};
          border:2px solid ${isMatched ? '#81c784' : isFlipped ? '#ddd' : '#556cd6'};
          ${isMatched ? 'opacity:0.7' : ''}
        ">${isFlipped ? c : '❓'}</div>`;
      }).join('');

      info.textContent = `步数: ${moves} | 已配对: ${matched.length / 2}/6`;

      if (matched.length === cards.length) {
        info.textContent = `🎉 完成！共 ${moves} 步`;
        info.style.color = '#27ae60';
        info.style.fontWeight = '600';
      }
    };

    this._showGamePanel('🧠 记忆翻牌', `
      <div style="text-align:center">
        <div id="mf-grid" style="display:grid;grid-template-columns:repeat(4,56px);gap:8px;justify-content:center;margin:12px 0"></div>
        <div id="mf-info" style="font-size:13px;color:#999;margin-top:8px"></div>
        <button class="game-btn" id="mf-reset" style="margin-top:10px;padding:6px 16px;border:1px solid #eee;border-radius:8px;background:#fff;cursor:pointer;font-size:12px">重新开始</button>
      </div>
    `);

    this.panel.el.querySelector('#mf-grid').onclick = (e) => {
      const card = e.target.closest('.mf-card');
      if (!card || lockBoard) return;
      const idx = parseInt(card.dataset.idx);
      if (flipped.includes(idx) || matched.includes(idx)) return;

      flipped.push(idx);
      render();

      if (flipped.length === 2) {
        moves++;
        lockBoard = true;
        const [a, b] = flipped;
        if (cards[a] === cards[b]) {
          matched.push(a, b);
          flipped = [];
          lockBoard = false;
          render();
        } else {
          setTimeout(() => {
            flipped = [];
            lockBoard = false;
            render();
          }, 800);
        }
      }
    };

    this.panel.el.querySelector('#mf-reset').onclick = () => { initCards(); render(); };
    initCards();
    render();
  }

  /**
   * 打地鼠
   */
  whackMole() {
    let score = 0, timeLeft = 15, timer = null, molePos = -1;

    const render = () => {
      const grid = this.panel.el?.querySelector('#wm-grid');
      const info = this.panel.el?.querySelector('#wm-info');
      if (!grid || !info) return;
      grid.innerHTML = Array.from({ length: 9 }, (_, i) => {
        const isMole = i === molePos;
        return `<div class="wm-hole" data-idx="${i}" style="
          width:64px;height:64px;display:flex;align-items:center;justify-content:center;
          font-size:32px;border-radius:50%;cursor:pointer;user-select:none;
          background:${isMole ? '#8B4513' : '#ddd'};
          border:3px solid ${isMole ? '#A0522D' : '#ccc'};
          transition:all 0.15s;
          box-shadow:${isMole ? 'inset 0 4px 8px rgba(0,0,0,0.3)' : 'none'}
        ">${isMole ? '🐹' : '🕳️'}</div>`;
      }).join('');
      info.textContent = `得分: ${score} | 剩余: ${timeLeft}s`;
    };

    const spawnMole = () => {
      molePos = Math.floor(Math.random() * 9);
      render();
      setTimeout(() => {
        if (molePos >= 0) { molePos = -1; render(); }
      }, 800 + Math.random() * 400);
    };

    const startGame = () => {
      score = 0; timeLeft = 15; molePos = -1;
      clearInterval(timer);
      render();

      const spawnTimer = setInterval(() => {
        if (timeLeft > 0) spawnMole();
      }, 1000);

      timer = setInterval(() => {
        timeLeft--;
        render();
        if (timeLeft <= 0) {
          clearInterval(timer);
          clearInterval(spawnTimer);
          molePos = -1;
          render();
          this.panel.el.querySelector('#wm-info').textContent = `🎉 游戏结束！得分: ${score}`;
          this.panel.el.querySelector('#wm-info').style.color = '#27ae60';
          this.panel.el.querySelector('#wm-info').style.fontWeight = '600';
          this.panel.el.querySelector('#wm-actions').style.display = 'block';
        }
      }, 1000);
    };

    this._showGamePanel('🔨 打地鼠', `
      <div style="text-align:center">
        <div id="wm-grid" style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center;margin:12px 0"></div>
        <div id="wm-info" style="font-size:14px;color:#666;margin-top:8px"></div>
        <div id="wm-actions" style="display:none;margin-top:10px">
          <button class="game-btn" id="wm-restart" style="padding:8px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">再来一局</button>
        </div>
      </div>
    `);

    this.panel.el.querySelector('#wm-grid').onclick = (e) => {
      const hole = e.target.closest('.wm-hole');
      if (!hole || molePos < 0) return;
      const idx = parseInt(hole.dataset.idx);
      if (idx === molePos) {
        score += 10;
        molePos = -1;
        // 打中动画
        hole.style.transform = 'scale(0.85)';
        setTimeout(() => hole.style.transform = '', 150);
        render();
      }
    };

    this.panel.el.querySelector('#wm-restart').onclick = () => startGame();
    startGame();
  }

  /**
   * 抛硬币
   */
  coinFlip() {
    this._showGamePanel('🪙 抛硬币', `
      <div style="text-align:center;padding:10px 0">
        <div id="cf-result" style="font-size:64px;margin:20px 0;transition:transform 0.3s">🪙</div>
        <div id="cf-text" style="font-size:18px;font-weight:600;color:#666;margin-bottom:16px">点击抛硬币</div>
        <button class="game-btn" id="cf-flip" style="padding:12px 32px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;border:none;border-radius:12px;font-size:16px;cursor:pointer">抛！</button>
        <div id="cf-history" style="margin-top:12px;font-size:12px;color:#999"></div>
      </div>
    `);

    const history = [];
    this.panel.el.querySelector('#cf-flip').onclick = () => {
      const resultEl = this.panel.el.querySelector('#cf-result');
      const textEl = this.panel.el.querySelector('#cf-text');
      const histEl = this.panel.el.querySelector('#cf-history');

      // 翻转动画
      let count = 0;
      const flip = setInterval(() => {
        resultEl.style.transform = `rotateY(${count * 180}deg)`;
        resultEl.textContent = count % 2 === 0 ? '🟡' : '⚪';
        count++;
        if (count > 8) {
          clearInterval(flip);
          const isHead = Math.random() > 0.5;
          resultEl.textContent = isHead ? '🟡' : '⚪';
          resultEl.style.transform = '';
          textEl.textContent = isHead ? '正面！' : '反面！';
          textEl.style.color = isHead ? '#f39c12' : '#95a5a6';
          history.push(isHead ? '正' : '反');
          if (history.length > 10) history.shift();
          histEl.textContent = '历史: ' + history.join(' ');
        }
      }, 80);
    };
  }

  /**
   * 显示游戏面板
   */
  _showGamePanel(title, content) {
    // 创建或复用面板
    if (!this.panel) {
      this.panel = {
        el: null,
        overlay: null
      };

      this.panel.overlay = document.createElement('div');
      Object.assign(this.panel.overlay.style, {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.3)', zIndex: '2147483647',
        display: 'none'
      });
      this.panel.overlay.onclick = () => this._hideGamePanel();
      document.body.appendChild(this.panel.overlay);

      this.panel.el = document.createElement('div');
      Object.assign(this.panel.el.style, {
        position: 'fixed',
        zIndex: '2147483647',
        width: '320px',
        maxWidth: '90vw',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        color: '#333',
        display: 'none',
        overflow: 'hidden'
      });
      document.body.appendChild(this.panel.el);
    }

    // 定位到屏幕中间
    this.panel.el.innerHTML = `
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:15px;font-weight:600">${title}</span>
        <span style="cursor:pointer;font-size:18px" id="game-close">✕</span>
      </div>
      <div style="padding:16px">${content}</div>
    `;

    this.panel.el.querySelector('#game-close').onclick = () => this._hideGamePanel();

    // 定位
    const x = (window.innerWidth - 320) / 2;
    const y = (window.innerHeight - 400) / 2;
    this.panel.el.style.left = Math.max(10, x) + 'px';
    this.panel.el.style.top = Math.max(10, y) + 'px';
    this.panel.el.style.display = 'block';
    this.panel.overlay.style.display = 'block';
  }

  _hideGamePanel() {
    if (this.panel) {
      this.panel.el.style.display = 'none';
      this.panel.overlay.style.display = 'none';
    }
  }
}
/**
 * 情绪引擎 - 宠物有情绪、性格、能量
 * 情绪会影响动画、气泡语录、AI回复风格
 */
class EmotionEngine {
  constructor() {
    // 基础情绪值 (0-100)
    this.moods = {
      happy: 50,     // 开心
      energy: 70,    // 精力
      curious: 40,   // 好奇
      lonely: 30,    // 孤独（长时间没互动会上升）
      sleepy: 20     // 困倦（深夜会上升）
    };

    // 当前主导情绪
    this.currentMood = 'neutral';
    this._decayTimer = null;
    this._lastInteraction = Date.now();
    this._load();
    this._startDecay();
  }

  _load() {
    try {
      const saved = localStorage.getItem('web_pet_emotions');
      if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this.moods, data.moods || {});
        this._lastInteraction = data.lastInteraction || Date.now();
      }
    } catch {}
  }

  _save() {
    try {
      localStorage.setItem('web_pet_emotions', JSON.stringify({
        moods: this.moods,
        lastInteraction: this._lastInteraction
      }));
    } catch {}
  }

  /**
   * 情绪自然衰减 - 每分钟调整一次
   */
  _startDecay() {
    this._decayTimer = setInterval(() => {
      const now = Date.now();
      const hour = new Date().getHours();
      const minsSinceInteract = (now - this._lastInteraction) / 60000;

      // 精力随时间下降
      this.moods.energy = Math.max(5, this.moods.energy - 0.3);

      // 孤独感随不互动时间上升
      if (minsSinceInteract > 10) {
        this.moods.lonely = Math.min(100, this.moods.lonely + 0.5);
      }

      // 深夜困倦
      if (hour >= 23 || hour < 6) {
        this.moods.sleepy = Math.min(100, this.moods.sleepy + 1);
      } else {
        this.moods.sleepy = Math.max(0, this.moods.sleepy - 0.5);
      }

      // 开心自然衰减
      this.moods.happy = Math.max(20, this.moods.happy - 0.2);

      // 好奇心衰减
      this.moods.curious = Math.max(10, this.moods.curious - 0.15);

      this._updateCurrentMood();
      this._save();
    }, 60000);
  }

  /**
   * 交互事件 - 影响情绪
   */
  onInteract(type) {
    this._lastInteraction = Date.now();
    this.moods.lonely = Math.max(0, this.moods.lonely - 15);

    switch (type) {
      case 'click':
        this.moods.happy = Math.min(100, this.moods.happy + 8);
        this.moods.curious = Math.min(100, this.moods.curious + 3);
        break;
      case 'drag':
        this.moods.happy = Math.min(100, this.moods.happy + 5);
        this.moods.energy = Math.min(100, this.moods.energy + 3);
        break;
      case 'chat':
        this.moods.happy = Math.min(100, this.moods.happy + 12);
        this.moods.lonely = Math.max(0, this.moods.lonely - 20);
        this.moods.curious = Math.min(100, this.moods.curious + 10);
        break;
      case 'game':
        this.moods.happy = Math.min(100, this.moods.happy + 10);
        this.moods.energy = Math.min(100, this.moods.energy + 8);
        this.moods.curious = Math.min(100, this.moods.curious + 5);
        break;
      case 'feed':
        this.moods.energy = Math.min(100, this.moods.energy + 20);
        this.moods.happy = Math.min(100, this.moods.happy + 6);
        break;
      case 'ignore':
        // 长时间不互动
        this.moods.lonely = Math.min(100, this.moods.lonely + 5);
        this.moods.happy = Math.max(0, this.moods.happy - 3);
        break;
    }

    this._updateCurrentMood();
    this._save();
  }

  /**
   * 天气影响情绪
   */
  onWeatherChange(weather) {
    if (!weather) return;
    const code = weather.code;

    // 晴天开心
    if (code === 113) {
      this.moods.happy = Math.min(100, this.moods.happy + 5);
      this.moods.energy = Math.min(100, this.moods.energy + 3);
    }
    // 雨天有点低落
    else if ([176, 263, 266, 293, 296, 299, 302, 305, 308].includes(code)) {
      this.moods.happy = Math.max(0, this.moods.happy - 3);
      this.moods.sleepy = Math.min(100, this.moods.sleepy + 5);
    }
    // 雷暴紧张
    else if ([200, 386, 389, 392, 395].includes(code)) {
      this.moods.energy = Math.min(100, this.moods.energy + 10);
      this.moods.curious = Math.min(100, this.moods.curious + 8);
    }
    // 雪兴奋
    else if ([179, 182, 185, 227, 230].includes(code)) {
      this.moods.happy = Math.min(100, this.moods.happy + 8);
      this.moods.curious = Math.min(100, this.moods.curious + 10);
    }

    this._updateCurrentMood();
    this._save();
  }

  /**
   * 根据情绪值计算主导情绪
   */
  _updateCurrentMood() {
    const m = this.moods;

    if (m.sleepy > 70) { this.currentMood = 'sleepy'; return; }
    if (m.lonely > 70) { this.currentMood = 'lonely'; return; }
    if (m.happy > 75 && m.energy > 60) { this.currentMood = 'excited'; return; }
    if (m.happy > 60) { this.currentMood = 'happy'; return; }
    if (m.curious > 65) { this.currentMood = 'curious'; return; }
    if (m.energy < 25) { this.currentMood = 'tired'; return; }
    if (m.happy < 30) { this.currentMood = 'sad'; return; }
    if (m.lonely > 50) { this.currentMood = 'clingy'; return; }

    this.currentMood = 'neutral';
  }

  /**
   * 获取当前情绪描述（供AI使用）
   */
  getMoodDescription() {
    const desc = {
      happy: '心情很好，活泼开朗',
      excited: '超级兴奋，精力充沛，想玩',
      curious: '充满好奇，想探索新事物',
      lonely: '有点孤单，想要陪伴',
      sleepy: '困了，想睡觉',
      tired: '有点累，需要休息',
      sad: '心情低落，需要安慰',
      clingy: '粘人，想引起注意',
      neutral: '平静正常'
    };
    return desc[this.currentMood] || '平静正常';
  }

  /**
   * 获取情绪对应的动画状态
   */
  getMoodAnimation() {
    const map = {
      happy: 'happy',
      excited: 'happy',
      curious: 'idle_action',
      lonely: 'idle',
      sleepy: 'idle',
      tired: 'idle',
      sad: 'idle',
      clingy: 'idle_action',
      neutral: 'idle'
    };
    return map[this.currentMood] || 'idle';
  }

  /**
   * 获取情绪 emoji
   */
  getMoodEmoji() {
    const map = {
      happy: '😊',
      excited: '🤩',
      curious: '🧐',
      lonely: '🥺',
      sleepy: '😴',
      tired: '😮‍💨',
      sad: '😢',
      clingy: '😿',
      neutral: '😺'
    };
    return map[this.currentMood] || '😺';
  }

  /**
   * 重置情绪
   */
  reset() {
    this.moods = { happy: 50, energy: 70, curious: 40, lonely: 20, sleepy: 20 };
    this.currentMood = 'neutral';
    this._lastInteraction = Date.now();
    this._save();
  }

  destroy() {
    clearInterval(this._decayTimer);
  }
}
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
/**
 * AI 行为驱动 - 通过大模型让宠物有自主行为
 * 结合情绪、天气、时间、交互历史，生成上下文感知的行为
 */
class AIBehavior {
  constructor(chatEngine, emotionEngine, bubble, container) {
    this.chat = chatEngine;
    this.emotion = emotionEngine;
    this.bubble = bubble;
    this.container = container;
    this._thinkTimer = null;
    this._lastThink = 0;
    this._thinkInterval = 3 * 60000; // 每3分钟自主思考一次
    this._actionQueue = [];
    this._isActing = false;

    // 行为回调
    this.onAction = null; // (action) => void
    this.onStateChange = null; // (state) => void
  }

  /**
   * 启动自主行为循环
   */
  start() {
    this._stop();
    const loop = () => {
      const delay = this._thinkInterval + Math.random() * 60000;
      this._thinkTimer = setTimeout(() => {
        this._autonomousThink();
        loop();
      }, delay);
    };
    loop();
  }

  _stop() {
    clearTimeout(this._thinkTimer);
  }

  /**
   * 自主思考 - 根据当前状态决定行为
   */
  async _autonomousThink() {
    if (!this.chat.isConfigured()) return;
    if (this._isActing) return;

    const now = Date.now();
    if (now - this._lastThink < 60000) return;
    this._lastThink = now;

    const context = this._buildContext();
    try {
      const response = await this.chat.chat(
        `[系统] 你是桌面宠物，请根据当前状态决定行为。` +
        `只回复JSON格式：{"action":"行为名","msg":"要说的话","emotion":"情绪"}` +
        `可用行为：idle, walk, happy, dance, spin, wave, sleep, peek, clone, stretch, curios` +
        `当前状态：${context}`
      );

      const parsed = this._parseResponse(response);
      if (parsed) {
        this._executeBehavior(parsed);
      }
    } catch (e) {
      // 静默失败
      console.warn('[AIBehavior] think fail:', e.message);
    }
  }

  /**
   * 用户交互后的即时反应
   */
  async reactToInteraction(type, detail) {
    if (!this.chat.isConfigured()) return;

    const moodDesc = this.emotion.getMoodDescription();
    const prompt = this._buildReactionPrompt(type, detail, moodDesc);

    try {
      const response = await this.chat.chat(prompt);
      const parsed = this._parseResponse(response);
      if (parsed) {
        this._executeBehavior(parsed);
      }
    } catch (e) {
      // 降级：用情绪系统生成反应
      this._fallbackReaction(type);
    }
  }

  _buildReactionPrompt(type, detail, mood) {
    const prompts = {
      click: `[系统] 用户点击了你。你${mood}。回复JSON：{"msg":"要说的话","emotion":"情绪","action":"动作"}`,
      drag: `[系统] 用户把你拖来拖去。你${mood}。回复JSON：{"msg":"反应","emotion":"情绪"}`,
      chat: `[系统] 用户说：「${detail}」。你${mood}。以宠物身份回复JSON：{"msg":"回复","emotion":"情绪","action":"动作"}`,
      game_win: `[系统] 用户赢了游戏。你${mood}。回复JSON：{"msg":"反应","emotion":"情绪"}`,
      game_lose: `[系统] 用户输了游戏。你${mood}。回复JSON：{"msg":"安慰","emotion":"情绪"}`,
      reminder: `[系统] 提醒触发了：${detail}。你${mood}。回复JSON：{"msg":"提醒内容","emotion":"情绪","action":"动作"}`,
      weather: `[系统] 天气变了：${detail}。你${mood}。回复JSON：{"msg":"天气反应","emotion":"情绪"}`,
      morning: `[系统] 早上好，新的一天。你${mood}。回复JSON：{"msg":"早安","emotion":"情绪","action":"happy"}`,
      night: `[系统] 很晚了。你${mood}。回复JSON：{"msg":"晚安","emotion":"情绪","action":"sleep"}`
    };
    return prompts[type] || `[系统] ${type}。你${mood}。回复JSON：{"msg":"反应","emotion":"情绪"}`;
  }

  _buildContext() {
    const m = this.emotion.moods;
    const hour = new Date().getHours();
    const timeDesc = hour < 6 ? '深夜' : hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';
    return `情绪:${this.emotion.getMoodDescription()}, 精力:${Math.round(m.energy)}, 开心:${Math.round(m.happy)}, ` +
      `孤独:${Math.round(m.lonely)}, 困倦:${Math.round(m.sleepy)}, 时间:${timeDesc}(${hour}点)`;
  }

  _parseResponse(text) {
    try {
      // 尝试提取JSON
      const match = text.match(/\{[^}]+\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        return {
          action: data.action || null,
          msg: data.msg || '',
          emotion: data.emotion || null
        };
      }
    } catch {}
    // 降级：纯文本作为消息
    return { msg: text.slice(0, 100), action: null, emotion: null };
  }

  _executeBehavior(behavior) {
    // 更新情绪
    if (behavior.emotion) {
      this._applyEmotionWord(behavior.emotion);
    }

    // 执行动作
    if (behavior.action && this.onAction) {
      this.onAction(behavior.action);
    }

    // 说话
    if (behavior.msg) {
      const duration = Math.max(3000, behavior.msg.length * 150);
      this.bubble.show(this.emotion.getMoodEmoji() + ' ' + behavior.msg, duration);
    }
  }

  _applyEmotionWord(word) {
    const w = word.toLowerCase();
    if (/开心|高兴|happy|开心/.test(w)) {
      this.emotion.moods.happy = Math.min(100, this.emotion.moods.happy + 10);
    }
    if (/兴奋|excited|激动/.test(w)) {
      this.emotion.moods.energy = Math.min(100, this.emotion.moods.energy + 10);
      this.emotion.moods.happy = Math.min(100, this.emotion.moods.happy + 5);
    }
    if (/困|sleepy|累|tired/.test(w)) {
      this.emotion.moods.sleepy = Math.min(100, this.emotion.moods.sleepy + 10);
    }
    if (/孤单|lonely|无聊/.test(w)) {
      this.emotion.moods.lonely = Math.min(100, this.emotion.moods.lonely + 5);
    }
    if (/好奇|curious|interesting/.test(w)) {
      this.emotion.moods.curious = Math.min(100, this.emotion.moods.curious + 10);
    }
  }

  _fallbackReaction(type) {
    const mood = this.emotion.currentMood;
    const reactions = {
      click: {
        happy: ['你好呀~', '嘿嘿~', '摸摸头~', '今天心情不错！'],
        excited: ['哇！来找我玩！', '我好开心！', '🎉'],
        lonely: ['你终于来了...', '想你了', '别走开好不好'],
        sleepy: ['嗯...打个哈欠~', '好困...', 'zzZ'],
        sad: ['...嗯', '有点难过', '😢'],
        curious: ['嗯？什么？', '你在做什么呀？', '让我看看！']
      },
      drag: {
        happy: ['哇~飞起来了！', ' wheee~', '好刺激！'],
        excited: ['再来再来！', '转圈圈！', '🎉'],
        lonely: ['别放开我...', '你要带我去哪？'],
        sleepy: ['别闹...困...', '嗯...'],
        default: ['放我下来！', '晕了晕了~', '救命~']
      }
    };

    const pool = reactions[type]?.[mood] || reactions[type]?.default || ['~'];
    const msg = pool[Math.floor(Math.random() * pool.length)];
    this.bubble.show(this.emotion.getMoodEmoji() + ' ' + msg, 3000);
  }

  destroy() {
    this._stop();
  }
}
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
/**
 * 聊天引擎 - 接入 OpenAI 兼容 API
 * 支持自定义 endpoint、key、model
 */
class ChatEngine {
  constructor() {
    this.endpoint = '';
    this.apiKey = '';
    this.model = 'gpt-3.5-turbo';
    this.systemPrompt = '你是一只可爱的桌面宠物猫猫，名叫小爪。说话简短有趣，喜欢用emoji，语气俏皮温暖。每次回复控制在100字以内。';
    this.history = []; // 对话历史
    this.maxHistory = 20; // 保留最近N轮
    this._ready = false;
    this._load();
  }

  async _load() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('web_pet_chat_config');
        const cfg = data.web_pet_chat_config || {};
        this.endpoint = cfg.endpoint || '';
        this.apiKey = cfg.apiKey || '';
        this.model = cfg.model || 'gpt-3.5-turbo';
        this.systemPrompt = cfg.systemPrompt || this.systemPrompt;
      } else {
        const raw = localStorage.getItem('web_pet_chat_config');
        if (raw) {
          const cfg = JSON.parse(raw);
          this.endpoint = cfg.endpoint || '';
          this.apiKey = cfg.apiKey || '';
          this.model = cfg.model || 'gpt-3.5-turbo';
          this.systemPrompt = cfg.systemPrompt || this.systemPrompt;
        }
      }
    } catch {}
    this._ready = true;
  }

  _save() {
    const cfg = {
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      model: this.model,
      systemPrompt: this.systemPrompt
    };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ web_pet_chat_config: cfg });
      } else {
        localStorage.setItem('web_pet_chat_config', JSON.stringify(cfg));
      }
    } catch {}
  }

  /**
   * 更新配置
   */
  configure({ endpoint, apiKey, model, systemPrompt }) {
    if (endpoint !== undefined) this.endpoint = endpoint;
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (model !== undefined) this.model = model;
    if (systemPrompt !== undefined) this.systemPrompt = systemPrompt;
    this._save();
  }

  /**
   * 是否已配置
   */
  isConfigured() {
    return !!(this.endpoint && this.apiKey);
  }

  /**
   * 发送消息并获取回复
   * @param {string} userMessage
   * @returns {Promise<string>} AI回复
   */
  async chat(userMessage) {
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置 AI 接口');
    }

    // 添加用户消息到历史
    this.history.push({ role: 'user', content: userMessage });

    // 截断历史
    if (this.history.length > this.maxHistory * 2) {
      this.history = this.history.slice(-this.maxHistory * 2);
    }

    // 构建请求
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.history
    ];

    // 标准化 endpoint
    let url = this.endpoint.replace(/\/+$/, '');
    if (!url.endsWith('/chat/completions')) {
      url += '/chat/completions';
    }

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.8,
          max_tokens: 300
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`API 错误 (${resp.status}): ${err.slice(0, 100)}`);
      }

      const data = await resp.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '...';

      // 添加助手回复到历史
      this.history.push({ role: 'assistant', content: reply });

      return reply;
    } catch (e) {
      // 移除失败的用户消息
      this.history.pop();
      throw e;
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.history = [];
  }
}
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
    this.DISPLAY_MS = 10000; // 显示 10 秒
    this._lastWeatherKey = ''; // 上次展示的天气摘要
    this._ready = false; // 是否已从存储加载
    this._init();
    this._loadLastKey();
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
  async _loadLastKey() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('web_pet_last_weather_key');
        this._lastWeatherKey = data.web_pet_last_weather_key || '';
      } else {
        this._lastWeatherKey = localStorage.getItem('web_pet_last_weather_key') || '';
      }
    } catch {}
    this._ready = true;
  }

  _saveLastKey(key) {
    this._lastWeatherKey = key;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ web_pet_last_weather_key: key });
      } else {
        localStorage.setItem('web_pet_last_weather_key', key);
      }
    } catch {}
  }

  show(weather) {
    if (!weather) return;

    // 构建天气摘要，数据未变化则不重新弹出
    const key = `${weather.temp}|${weather.desc}|${weather.code}`;
    if (key === this._lastWeatherKey) return;
    this._saveLastKey(key);

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
    const remaining = Math.max(0, Math.round(this.DISPLAY_MS / 1000) - elapsed);
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
/**
 * Web悬浮桌面宠物 - 主入口
 * 一行代码引入即可运行
 */
class WebPet {
  constructor(options = {}) {
    this.options = Object.assign({
      size: 100,
      scale: 1.0,
      opacity: 1.0,
      edgeSnap: true,
      skin: 'emoji_cat',
      idleEnabled: true,
      idleInterval: 8000,
      hourlyEnabled: true,
      silentStart: 23,
      silentEnd: 7
    }, options);

    this._loadConfig();
    this._init();
  }

  _loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem('web_pet_config') || '{}');
      Object.assign(this.options, saved);
    } catch {}
  }

  _saveConfig() {
    try {
      const cfg = {
        scale: this.options.scale,
        opacity: this.options.opacity,
        edgeSnap: this.options.edgeSnap,
        skin: this.options.skin,
        idleEnabled: this.options.idleEnabled,
        idleInterval: this.options.idleInterval,
        hourlyEnabled: this.options.hourlyEnabled,
        silentStart: this.options.silentStart,
        silentEnd: this.options.silentEnd
      };
      localStorage.setItem('web_pet_config', JSON.stringify(cfg));
      // 同步到 chrome.storage.local（插件跨页面同步）
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ config: cfg });
      }
    } catch {}
  }

  _init() {
    // 1. 容器
    this.container = new PetContainer({
      size: this.options.size,
      scale: this.options.scale,
      opacity: this.options.opacity,
      edgeSnap: this.options.edgeSnap
    });
    this.container.loadPosition();

    // 2. 动画器
    this.animator = new PetAnimator(this.container);
    this.container._animator = this.animator; // 供情绪视觉系统访问

    // 3. 状态机
    this.stateMachine = new PetStateMachine(this.animator);
    this.stateMachine.setIdleEnabled(this.options.idleEnabled);
    this.stateMachine.setIdleInterval(this.options.idleInterval);
    this.stateMachine.onStateChange = (state) => {
      this.plugins.trigger('state_change', { state });
    };

    // 4. 皮肤管理
    this.skinManager = new SkinManager(this.stateMachine);

    // 5. 气泡系统
    this.bubble = new BubbleSystem(this.container);

    // 6. 快捷面板
    this.quickPanel = new QuickPanel({
      getReminders: () => this.reminder.getAll(),
      getNotes: () => this.notepad.getAll(),
      getSkins: () => this.skinManager.getSkinList().filter(s => !s.id.startsWith('custom_')),
      getCustomSkins: () => this.skinManager.getSkinList().filter(s => s.id.startsWith('custom_')),
      getCurrentSkinId: () => this.options.skin,
      onAddReminder: (content, triggerAt, minutes) => {
        this.reminder.add(content, triggerAt);
        this.bubble.show('⏰ ' + minutes + '分钟后提醒', 2000);
      },
      onRemoveReminder: (id) => {
        this.reminder.remove(id);
        this.bubble.show('已取消提醒', 1500);
      },
      onAddNote: (text) => {
        this.notepad.add(text);
        this.bubble.show('📝 已添加便签', 1500);
      },
      onToggleNote: (id) => this.notepad.toggleDone(id),
      onPinNote: (id) => this.notepad.togglePin(id),
      onDeleteNote: (id) => this.notepad.remove(id),
      onImportImage: () => this._importImage(),
      onSkinChange: (id) => {
        this.options.skin = id;
        this.skinManager.applySkin(id);
        this._saveConfig();
        this.bubble.show('🎨 已切换皮肤', 1500);
      },
      onSkinDelete: (id) => {
        this.skinManager.removeCustomSkin(id);
        this.bubble.show('已删除皮肤', 1500);
      }
    });

    // 7. 鼠标交互
    this.mouse = new MouseHandler(this.container, this.stateMachine);
    this.mouse.onClick = () => {
      this.plugins.trigger('click');
      this.emotion.onInteract('click');
      this.aiBehavior.reactToInteraction('click');
      if (this.quickPanel.visible) {
        this.quickPanel.hide();
      }
    };
    this.mouse.onHover = () => {
      this.plugins.trigger('hover');
      this.emotion.onInteract('click');
    };
    this.mouse.onDrag = () => {
      this.emotion.onInteract('drag');
    };
    this.mouse.onDoubleClick = () => {
      // 双击打开快捷面板
      const rect = this.container.el.getBoundingClientRect();
      this.quickPanel.show(rect.left, rect.top);
    };
    this.mouse.onContextMenu = (e) => this._showContextMenu(e);

    // 7. 插件系统
    this.plugins = new PluginSystem();
    this._registerBuiltinPlugins();

    // 8. 工具
    this.reminder = new ReminderTool();
    this.reminder.onTrigger = (r) => {
      this._showReminderCenter(r.content);
      this.emotion.onInteract('click');
      this.aiBehavior.reactToInteraction('reminder', r.content);
    };

    this.hourly = new HourlyTool();
    this.hourly.enabled = this.options.hourlyEnabled;
    this.hourly.silentStart = this.options.silentStart;
    this.hourly.silentEnd = this.options.silentEnd;
    this.hourly.onChime = (hour) => {
      const texts = [
        `现在是 ${hour}:00`, `${hour}点了~`,
        hour < 12 ? '上午好！' : hour < 18 ? '下午好！' : '晚上好！'
      ];
      this._showReminderCenter(texts[Math.floor(Math.random() * texts.length)]);
      this.emotion.onInteract('click');
      if (hour >= 23 || hour < 6) {
        this.aiBehavior.reactToInteraction('night');
      } else if (hour >= 6 && hour < 10) {
        this.aiBehavior.reactToInteraction('morning');
      }
    };

    this.notepad = new NotepadTool();

    // 9. 设置面板
    // （自定义皮肤在_init末尾异步加载）
    this.settings = new SettingsPanel({
      getConfig: () => this.options,
      getSkins: () => this.skinManager.getSkinList(),
      getCurrentSkinId: () => this.options.skin,
      getReminders: () => this.reminder.getAll(),
      onRemoveReminder: (id) => { this.reminder.remove(id); this.settings._render(); },
      onScaleChange: (v) => { this.options.scale = v; this.container.setScale(v); this._saveConfig(); },
      onOpacityChange: (v) => { this.options.opacity = v; this.container.setOpacity(v); this._saveConfig(); },
      onEdgeSnapChange: (v) => { this.options.edgeSnap = v; this.container.edgeSnap = v; this._saveConfig(); },
      onIdleEnabledChange: (v) => { this.options.idleEnabled = v; this.stateMachine.setIdleEnabled(v); this._saveConfig(); },
      onIdleIntervalChange: (v) => { this.options.idleInterval = v; this.stateMachine.setIdleInterval(v); this._saveConfig(); },
      onHourlyChange: (v) => { this.options.hourlyEnabled = v; this.hourly.setEnabled(v); this._saveConfig(); },
      onSkinChange: (id) => { this.options.skin = id; this.skinManager.applySkin(id); this._saveConfig(); this.settings._render(); },
      onSkinDelete: (id) => { this.skinManager.removeCustomSkin(id); this.settings._render(); },
      onImportImage: () => this._importImage(),
      onExport: () => this._exportData(),
      onImport: () => this._importData(),
      onReset: () => this._resetData(),
      getChatConfig: () => ({
        endpoint: this.chatEngine.endpoint,
        apiKey: this.chatEngine.apiKey,
        model: this.chatEngine.model,
        systemPrompt: this.chatEngine.systemPrompt
      }),
      onSaveChatConfig: (cfg) => this.chatEngine.configure(cfg),
      onTestChat: async () => {
        if (!this.chatEngine.isConfigured()) throw new Error('请先填写 API 地址和 Key');
        await this.chatEngine.chat('你好');
      }
    });

    // 10. 注入API给插件
    this.plugins.setAPI({
      showBubble: (text, dur) => this.bubble.show(text, dur),
      changeState: (state) => this.stateMachine.changeState(state),
      getContainer: () => this.container
    });

    // 异步加载自定义皮肤，然后应用保存的皮肤
    const savedSkin = this.options.skin || 'emoji_cat';
    this._skinReady = this.skinManager.loadCustomSkins().then(() => {
      this.skinManager.applySkin(savedSkin);
      if (this.onReady) this.onReady();
    });
    this.stateMachine.startIdleScheduler();

    // 迷你游戏
    this.games = new MiniGames(this.bubble, this.container);

    // 情绪引擎
    this.emotion = new EmotionEngine();

    // 聊天引擎
    this.chatEngine = new ChatEngine();

    // 聊天面板
    this.chatPanel = new ChatPanel({
      getPetName: () => '小爪',
      getMessages: () => this.chatEngine.history,
      isConfigured: () => this.chatEngine.isConfigured(),
      onSend: async (text) => {
        this.chatPanel.setLoading(true);
        this.emotion.onInteract('chat');
        // 宠物思考动画
        this.petActions.execute('peek');
        try {
          const reply = await this.chatEngine.chat(text);
          this.chatPanel.setLoading(false);
          this.chatPanel.refresh();
          this.bubble.show(reply, 4000);
          // 根据回复内容触发宠物动作
          this._reactChatToAction(reply);
          this.aiBehavior.reactToInteraction('chat', text).catch(() => {});
        } catch (e) {
          this.chatPanel.setLoading(false);
          this.bubble.show('😿 ' + e.message, 3000);
          this.chatPanel.refresh();
        }
      },
      onClear: () => this.chatEngine.clearHistory(),
      onOpenSettings: () => this.settings.show()
    });

    // 情绪视觉系统（让宠物外观随情绪动态变化）
    this.emotionVisual = new EmotionVisual(this.container, this.emotion);

    // 宠物动作系统
    this.petActions = new PetActions(this.container, this.bubble, this.emotion);

    // AI 行为驱动
    this.aiBehavior = new AIBehavior(this.chatEngine, this.emotion, this.bubble, this.container);
    this.aiBehavior.onAction = (action) => this.petActions.execute(action);
    this.aiBehavior.start();

    // 天气系统
    this.weather = new WeatherSystem(this.container, this.bubble);

    // 天气通知卡片（右上角，显示10秒后自动收起）
    this.weatherWidget = new WeatherWidget();
    this.weather.onWeatherUpdate = (w) => {
      this.emotion.onWeatherChange(w);
      const offset = this.reminderWidget?.getHeight() || 0;
      this.weatherWidget.setTopOffset(12 + offset);
      this.weatherWidget.show(w);
      this.aiBehavior.reactToInteraction('weather', `${w.desc} ${w.temp}°C`);
    };

    // 提醒列表组件（右上角，有提醒时显示，带数量徽章）
    this.reminderWidget = new ReminderWidget(this.reminder);
    this.reminderWidget.onVisibilityChange = (height) => {
      this.weatherWidget?.setTopOffset(12 + height);
    };

    // 检查是否有常驻便签
    this._showPinnedNote();

    // 全屏检测
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) this.container.hide();
      else this.container.show();
    });

    console.log('[WebPet] 🐱 桌面宠物已启动！');
  }

  _registerBuiltinPlugins() {
    for (const plugin of Object.values(BuiltInPlugins)) {
      this.plugins.register({ ...plugin });
    }
  }

  _showContextMenu(e) {
    if (!this._contextMenu) this._contextMenu = new ContextMenu();
    const pinned = this.notepad.getPinned();
    const customSkins = this.skinManager.getSkinList().filter(s => s.id.startsWith('custom_'));

    // 用宠物当前位置而非鼠标位置
    const rect = this.container.el.getBoundingClientRect();
    const menuX = rect.left + rect.width / 2;
    const menuY = rect.top;

    this._contextMenu.show(menuX, menuY, [
      // 提醒
      { label: `⏰ 快速提醒 (${this.reminder.getActiveCount()} 个进行中)`, isTitle: true },
      { label: '  5 分钟后提醒', action: () => this._setQuickTimer(5) },
      { label: '  10 分钟后提醒', action: () => this._setQuickTimer(10) },
      { label: '  15 分钟后提醒', action: () => this._setQuickTimer(15) },
      { label: '  30 分钟后提醒', action: () => this._setQuickTimer(30) },
      { label: '  1 小时后提醒', action: () => this._setQuickTimer(60) },
      { label: '  2 小时后提醒', action: () => this._setQuickTimer(120) },
      { label: '  ⏱️ 设闹钟...', action: () => this._setAlarm() },
      { label: '  ✏️ 自定义提醒...', action: () => this._customTimer() },
      { divider: true },
      // 便签
      { label: '📝 快捷便签', isTitle: true },
      { label: '  新建便签...', action: () => this._addNote() },
      ...pinned.map(n => ({ label: '  📌 ' + n.text, action: () => this.bubble.show('📝 ' + n.text, 3000) })),
      { divider: true },
      // 皮肤
      { label: '🎨 切换皮肤', isTitle: true },
      { label: '  📷 导入图片...', action: () => this._importImage() },
      { label: '  — 写实形象 —', isTitle: true },
      { label: '  🐱 猫咪', action: () => this._switchSkin('real_cat') },
      { label: '  🐶 狗狗', action: () => this._switchSkin('real_dog') },
      { label: '  🐰 兔子', action: () => this._switchSkin('real_rabbit') },
      { label: '  🐹 仓鼠', action: () => this._switchSkin('real_hamster') },
      { label: '  🦊 狐狸', action: () => this._switchSkin('real_fox') },
      { label: '  🐼 熊猫', action: () => this._switchSkin('real_panda') },
      { label: '  🐧 企鹅', action: () => this._switchSkin('real_penguin') },
      { label: '  🦉 猫头鹰', action: () => this._switchSkin('real_owl') },
      { label: '  — emoji 形象 —', isTitle: true },
      { label: '  🐱 小猫', action: () => this._switchSkin('emoji_cat') },
      { label: '  🐶 小狗', action: () => this._switchSkin('emoji_dog') },
      { label: '  🐰 兔子', action: () => this._switchSkin('emoji_bunny') },
      { label: '  🐼 熊猫', action: () => this._switchSkin('emoji_panda') },
      { label: '  🦊 狐狸', action: () => this._switchSkin('emoji_fox') },
      { label: '  🐧 企鹅', action: () => this._switchSkin('emoji_penguin') },
      ...customSkins.map(s => ({ label: '  🖼️ ' + s.name, action: () => this._switchSkin(s.id) })),
      { divider: true },
      // 聊天
      { label: '💬 和宠物聊天', action: () => {
        const rect = this.container.el.getBoundingClientRect();
        this.chatPanel.show(rect.left, rect.top);
      }},
      { divider: true },
      // 宠物动作
      { label: `🐾 宠物动作 ${this.emotion.getMoodEmoji()}`, isTitle: true },
      { label: '  🌀 影分身', action: () => this.petActions.execute('clone') },
      { label: '  💃 跳舞', action: () => this.petActions.execute('dance') },
      { label: '  🔄 旋转', action: () => this.petActions.execute('spin') },
      { label: '  👋 招手', action: () => this.petActions.execute('wave') },
      { label: '  💤 睡觉', action: () => this.petActions.execute('sleep') },
      { label: '  👀 偷看', action: () => this.petActions.execute('peek') },
      { label: '  🥱 伸懒腰', action: () => this.petActions.execute('stretch') },
      { label: '  💖 爱心', action: () => this.petActions.execute('heart') },
      { label: '  ✨ 闪光', action: () => this.petActions.execute('sparkle') },
      { label: '  🫣 探头', action: () => this.petActions.execute('hide') },
      { divider: true },
      // 小游戏
      { label: '🎮 小游戏', isTitle: true },
      { label: '  ✊✌️🖐️ 石头剪刀布', action: () => this.games.rockPaperScissors() },
      { label: '  🎲 掷骰子', action: () => this.games.rollDice() },
      { label: '  🔢 猜数字', action: () => this.games.guessNumber() },
      { label: '  🃏 21点', action: () => this.games.blackjack() },
      { label: '  🧠 记忆翻牌', action: () => this.games.memoryFlip() },
      { label: '  🔨 打地鼠', action: () => this.games.whackMole() },
      { label: '  🪙 抛硬币', action: () => this.games.coinFlip() },
      { label: '  🔮 今日运势', action: () => this.games.fortune() },
      { label: '  🃏 今日一卡', action: () => this.games.drawCard() },
      { divider: true },
      // 天气
      { label: '🌤️ 天气', isTitle: true },
      { label: '  ' + (this.weather?.getWeatherInfo() || '获取中...'), action: () => this.weather?._fetchWeather() },
      { label: '  📋 显示天气卡片', action: () => { if (this.weather?.currentWeather) this.weatherWidget?.show(this.weather.currentWeather); } },
      { label: '  📍 切换城市...', action: () => this._setWeatherCity() },
      { divider: true },
      // 工具
      { label: '👁️ 显示/隐藏', action: () => this.container.toggle() },
      { label: '📍 重置位置', action: () => this.container.resetPosition() },
      { label: '⚙️ 设置', action: () => this.settings.show() }
    ]);
  }

  _setQuickTimer(minutes) {
    const triggerAt = Date.now() + minutes * 60000;
    this.reminder.add('时间到了~', triggerAt);
    const label = minutes >= 60 ? (minutes/60) + '小时' : minutes + '分钟';
    this.bubble.show('⏰ ' + label + '后提醒', 2000);
  }

  _customTimer() {
    const text = prompt('提醒内容：') || '时间到了~';
    const minStr = prompt('多少分钟后提醒？', '30');
    if (minStr && !isNaN(minStr)) {
      this.reminder.add(text, Date.now() + Number(minStr) * 60000);
      this.bubble.show('⏰ ' + minStr + '分钟后提醒', 2000);
    }
  }

  _setAlarm() {
    const text = prompt('提醒内容：') || '闹钟响了~';
    const timeStr = prompt('设定时间（如 08:30, 14:00）：');
    if (!timeStr) return;
    const parts = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!parts) { alert('时间格式错误，请用 HH:MM 格式'); return; }
    const h = parseInt(parts[1]), m = parseInt(parts[2]);
    if (h > 23 || m > 59) { alert('时间格式错误'); return; }
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= new Date()) target.setDate(target.getDate() + 1);
    const mins = Math.round((target.getTime() - Date.now()) / 60000);
    this.reminder.add(text, target.getTime());
    const label = mins >= 60 ? Math.round(mins / 60) + '小时' : mins + '分钟';
    this.bubble.show('⏰ 闹钟设在 ' + timeStr + '（' + label + '后）', 2500);
  }

  _addNote() {
    const text = prompt('便签内容：');
    if (text) {
      this.notepad.add(text);
      this.bubble.show('📝 已保存', 1500);
    }
  }

  _switchSkin(id) {
    this.options.skin = id;
    this.skinManager.applySkin(id);
    this._saveConfig();
    this.bubble.show('🎨 已切换', 1500);
  }

  /**
   * 根据 AI 回复内容触发宠物动作
   */
  _reactChatToAction(text) {
    const t = text.toLowerCase();
    const actions = [
      [/[开心|高兴|哈哈|嘿嘿|嘻嘻|太好|不错|棒|赞|耶|🎉|😄|😊]/, ['dance', 'bounce', 'heart']],
      [/[生气|哼|讨厌|烦|气死|😤|😡|💢]/, ['angry', 'shake']],
      [/[困|累|睡觉|晚安|休息|💤|😴|🥱]/, ['sleep', 'stretch']],
      [/[好奇|想知道|什么|为什么|怎么|真的吗|🤔|🧐]/, ['peek', 'curious']],
      [/[飞|旋转|转圈|飘|🌀]/, ['spin', 'float']],
      [/[嗨|你好|嘿|👋|在吗|来了]/, ['wave', 'bounce']],
      [/[爱|喜欢|❤|💕|💖|抱]/, ['heart', 'sparkle']],
      [/[厉害|wow|amazing|太强|分身|影分身|忍术]/, ['clone', 'sparkle']],
      [/[冷|怕|抖|😨|🥶]/, ['shake']],
      [/[无聊|闷|没意思]/, ['dance', 'spin']],
    ];

    for (const [pattern, acts] of actions) {
      if (pattern.test(text)) {
        const action = acts[Math.floor(Math.random() * acts.length)];
        this.petActions.execute(action);
        return;
      }
    }

    // 默认：随机小动作
    if (Math.random() > 0.5) {
      this.petActions.execute(['wave', 'bounce', 'stretch'][Math.floor(Math.random() * 3)]);
    }
  }

  _setWeatherCity() {
    const city = prompt('输入城市名（英文，如 Beijing, Shanghai, Tokyo）：', 'Beijing');
    if (city) {
      this.weather.setCity(city);
      this.bubble.show('📍 城市已设为 ' + city, 2000);
    }
  }

  _showPinnedNote() {
    const pinned = this.notepad.getPinned();
    if (pinned.length > 0) {
      setTimeout(() => this.bubble.show('📝 ' + pinned[0].text, 4000), 2000);
    }
  }

  /**
   * 提醒触发：宠物移到屏幕中间，大字提示
   */
  _showReminderCenter(content) {
    const el = this.container.el;
    const oldLeft = el.style.left;
    const oldTop = el.style.top;
    const oldTransition = el.style.transition;

    // 保存当前位置
    const savedPos = { ...this.container.position };

    // 移到屏幕中间
    const centerX = (window.innerWidth - this.container.size * this.container.scale) / 2;
    const centerY = (window.innerHeight - this.container.size * this.container.scale) / 2 - 30;

    el.style.transition = 'left 0.6s cubic-bezier(0.34,1.56,0.64,1), top 0.6s cubic-bezier(0.34,1.56,0.64,1)';
    this.container.setPosition(centerX, centerY);
    this.stateMachine.changeState('happy');

    // 显示大号提醒气泡
    setTimeout(() => {
      this.bubble.show('⏰ ' + content, 5000, 'reminder');
      // 晃动动画
      el.style.transition = 'transform 0.15s ease';
      let shakeCount = 0;
      const shake = () => {
        if (shakeCount >= 6) {
          el.style.transform = `scale(${this.container.scale})`;
          return;
        }
        el.style.transform = `scale(${this.container.scale}) rotate(${shakeCount % 2 === 0 ? '8deg' : '-8deg'})`;
        shakeCount++;
        setTimeout(shake, 150);
      };
      shake();
    }, 700);

    // 5秒后自动回到原位
    setTimeout(() => {
      el.style.transition = 'left 0.5s ease, top 0.5s ease, transform 0.3s ease';
      this.container.setPosition(savedPos.x, savedPos.y);
      el.style.transform = `scale(${this.container.scale})`;
      this.stateMachine.changeState('idle');
    }, 6000);
  }

  _importImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.multiple = true; // 支持多选
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (files.length === 1) {
        // 单张图片 - 应用到所有状态
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target.result;
          const skinId = this.skinManager.importSingleImage(url, file.name.replace(/\.\w+$/, ''));
          this.options.skin = skinId;
          this.skinManager.applySkin(skinId);
          this._saveConfig();
          this.bubble.show('🎨 已应用新皮肤！', 2000);
          this.settings.hide();
        };
        reader.readAsDataURL(file);
      } else {
        // 多张图片 - 按文件名匹配状态
        const stateMap = {};
        let loaded = 0;
        files.forEach(file => {
          const name = file.name.replace(/\.\w+$/, '').toLowerCase();
          const reader = new FileReader();
          reader.onload = (ev) => {
            // 尝试从文件名匹配状态
            let matchedState = null;
            for (const state of ['idle', 'clicked', 'dragged', 'happy', 'walk', 'idle_action']) {
              if (name.includes(state) || name.includes(state.replace('_', ''))) {
                matchedState = state;
                break;
              }
            }
            if (!matchedState) {
              // 用序号匹配: 1=idle, 2=clicked, 3=dragged, 4=happy
              const idx = files.indexOf(file);
              const states = ['idle', 'clicked', 'dragged', 'happy', 'walk', 'idle_action'];
              matchedState = states[idx] || 'idle';
            }
            stateMap[matchedState] = ev.target.result;
            loaded++;
            if (loaded === files.length) {
              const skinId = this.skinManager.importMultiFrame(stateMap, '自定义宠物');
              this.options.skin = skinId;
              this.skinManager.applySkin(skinId);
              this._saveConfig();
              this.bubble.show('🎨 已导入多帧皮肤！', 2000);
              this.settings.hide();
            }
          };
          reader.readAsDataURL(file);
        });
      }
    };
    input.click();
  }

  _exportData() {
    const data = {
      config: JSON.parse(localStorage.getItem('web_pet_config') || '{}'),
      reminders: JSON.parse(localStorage.getItem('web_pet_reminders') || '[]'),
      notes: JSON.parse(localStorage.getItem('web_pet_notes') || '[]'),
      quotes: this.bubble.getAllQuotes(),
      exportTime: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'web-pet-backup.json';
    a.click();
  }

  _importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.config) localStorage.setItem('web_pet_config', JSON.stringify(data.config));
        if (data.reminders) localStorage.setItem('web_pet_reminders', JSON.stringify(data.reminders));
        if (data.notes) localStorage.setItem('web_pet_notes', JSON.stringify(data.notes));
        alert('导入成功，刷新页面生效');
      } catch { alert('导入失败，文件格式错误'); }
    };
    input.click();
  }

  _resetData() {
    localStorage.removeItem('web_pet_config');
    localStorage.removeItem('web_pet_position');
    localStorage.removeItem('web_pet_skin');
    localStorage.removeItem('web_pet_reminders');
    localStorage.removeItem('web_pet_notes');
    localStorage.removeItem('web_pet_hourly');
    location.reload();
  }

  // === 公开API ===
  show() { this.container.show(); }
  hide() { this.container.hide(); }
  toggle() { this.container.toggle(); }
  say(text, duration) { this.bubble.show(text, duration); }
  setSkin(id) { this.options.skin = id; this.skinManager.applySkin(id); this._saveConfig(); }

  destroy() {
    this.container.destroy();
    this.animator.destroy();
    this.stateMachine.destroy();
    this.bubble.destroy();
    this.mouse.destroy();
    this.reminder.destroy();
    this.hourly.destroy();
    this.settings.destroy();
    this._contextMenu?.destroy();
    this.reminderWidget?.destroy();
    this.weatherWidget?.destroy();
    this.chatPanel?.destroy();
    this.aiBehavior?.destroy();
    this.petActions?.destroy();
    this.emotionVisual?.destroy();
    this.emotion?.destroy();
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.WebPet = WebPet;
}
