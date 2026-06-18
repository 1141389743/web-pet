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
    this.el.style.transform = `scale(${this.scale})`;
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
 * 修复：移动超过5px才算拖拽，否则算点击
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

    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);

    this._bindEvents();
  }

  _bindEvents() {
    const el = this.container.el;

    // mousedown - 记录位置，准备拖拽
    el.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this._mouseDownPos = { x: e.clientX, y: e.clientY };
        this._hasMoved = false;

        // 开始监听移动和释放
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
      }
    });

    // touchstart
    el.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this._mouseDownPos = { x: touch.clientX, y: touch.clientY };
      this._hasMoved = false;

      const onTouchMove = (ev) => {
        const t = ev.touches[0];
        const dx = Math.abs(t.clientX - this._mouseDownPos.x);
        const dy = Math.abs(t.clientY - this._mouseDownPos.y);
        if (dx > 5 || dy > 5) {
          this._hasMoved = true;
          if (!this.container.isDragging) {
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
          // 算点击
          this.stateMachine.changeState('clicked');
          if (this.onClick) this.onClick();
        }
        this._mouseDownPos = null;
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
        const rect = el.getBoundingClientRect();
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

    // 右键
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onContextMenu) this.onContextMenu(e);
    });
  }

  _handleMouseMove(e) {
    if (!this._mouseDownPos) return;
    const dx = Math.abs(e.clientX - this._mouseDownPos.x);
    const dy = Math.abs(e.clientY - this._mouseDownPos.y);

    // 移动超过5px才算拖拽
    if (dx > 5 || dy > 5) {
      this._hasMoved = true;
      if (!this.container.isDragging) {
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
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);

    if (this.container.isDragging) {
      // 结束拖拽
      this.container._handleUp(e);
      this.stateMachine.changeState('idle');
    } else if (this._mouseDownPos && !this._hasMoved) {
      // 没移动 = 点击
      const now = Date.now();
      if (now - this._lastClickTime < 350) {
        // 双击
        clearTimeout(this._clickTimer);
        this._handleDoubleClick(e);
      } else {
        // 单击（延迟350ms确认不是双击）
        this._clickTimer = setTimeout(() => this._handleClick(e), 350);
      }
      this._lastClickTime = now;
    }

    this._mouseDownPos = null;
    this._hasMoved = false;
  }

  _handleClick(e) {
    this.stateMachine.changeState('clicked');
    if (this.onClick) this.onClick(e);
  }

  _handleDoubleClick(e) {
    if (this.onDoubleClick) this.onDoubleClick(e);
  }

  destroy() {
    clearTimeout(this._hoverTimer);
    clearTimeout(this._clickTimer);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
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
    // emoji皮肤（默认，不需要图片）
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

    if (skin._isEmoji) {
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

  _startCheck() {
    this._timer = setInterval(() => {
      const now = Date.now();
      for (const r of this.reminders) {
        if (!r.enabled) continue;
        if (now >= r.triggerAt) {
          this._trigger(r);
          if (r.repeat === 'daily') {
            r.triggerAt += 86400000;
          } else {
            r.enabled = false;
          }
        }
      }
      this._save();
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

    // 定位
    const maxX = window.innerWidth - 160;
    const maxY = window.innerHeight - this.el.children.length * 36;
    this.el.style.left = Math.min(x, maxX) + 'px';
    this.el.style.top = Math.min(y, maxY) + 'px';
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
    } catch (e) {
      console.warn('[WebPet] 天气获取失败:', e);
    }
  }

  async _detectCity() {
    // 尝试从localStorage读取用户设置的城市
    try {
      const saved = localStorage.getItem('web_pet_city');
      if (saved) return saved;
    } catch {}

    // 尝试用IP定位
    try {
      const resp = await fetch('https://ipapi.co/json/');
      const data = await resp.json();
      const city = data.city || 'Beijing';
      try { localStorage.setItem('web_pet_city', city); } catch {}
      return city;
    } catch {}

    return 'Beijing'; // 默认
  }

  setCity(city) {
    try { localStorage.setItem('web_pet_city', city); } catch {}
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
      // 单击宠物也弹出快捷面板
      if (this.quickPanel.visible) {
        this.quickPanel.hide();
      }
    };
    this.mouse.onHover = () => this.plugins.trigger('hover');
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
      // 整点也移到中间提示
      this._showReminderCenter(texts[Math.floor(Math.random() * texts.length)]);
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
      onReset: () => this._resetData()
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

    // 天气系统
    this.weather = new WeatherSystem(this.container, this.bubble);

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

    this._contextMenu.show(e.clientX, e.clientY, [
      // 提醒
      { label: '⏰ 快速提醒', isTitle: true },
      { label: '  5 分钟后提醒', action: () => this._setQuickTimer(5) },
      { label: '  10 分钟后提醒', action: () => this._setQuickTimer(10) },
      { label: '  15 分钟后提醒', action: () => this._setQuickTimer(15) },
      { label: '  30 分钟后提醒', action: () => this._setQuickTimer(30) },
      { label: '  1 小时后提醒', action: () => this._setQuickTimer(60) },
      { label: '  自定义提醒...', action: () => this._customTimer() },
      { divider: true },
      // 便签
      { label: '📝 快捷便签', isTitle: true },
      { label: '  新建便签...', action: () => this._addNote() },
      ...pinned.map(n => ({ label: '  📌 ' + n.text, action: () => this.bubble.show('📝 ' + n.text, 3000) })),
      { divider: true },
      // 皮肤
      { label: '🎨 切换皮肤', isTitle: true },
      { label: '  📷 导入图片...', action: () => this._importImage() },
      { label: '  🐱 小猫', action: () => this._switchSkin('emoji_cat') },
      { label: '  🐶 小狗', action: () => this._switchSkin('emoji_dog') },
      { label: '  🐰 兔子', action: () => this._switchSkin('emoji_bunny') },
      { label: '  🐼 熊猫', action: () => this._switchSkin('emoji_panda') },
      { label: '  🦊 狐狸', action: () => this._switchSkin('emoji_fox') },
      { label: '  🐧 企鹅', action: () => this._switchSkin('emoji_penguin') },
      ...customSkins.map(s => ({ label: '  🖼️ ' + s.name, action: () => this._switchSkin(s.id) })),
      { divider: true },
      // 小游戏
      { label: '🎮 小游戏', isTitle: true },
      { label: '  ✊✌️🖐️ 石头剪刀布', action: () => this.games.rockPaperScissors() },
      { label: '  🎲 掷骰子', action: () => this.games.rollDice() },
      { label: '  🔢 猜数字', action: () => this.games.guessNumber() },
      { label: '  🔮 今日运势', action: () => this.games.fortune() },
      { label: '  🃏 今日一卡', action: () => this.games.drawCard() },
      { divider: true },
      // 天气
      { label: '🌤️ 天气', isTitle: true },
      { label: '  ' + (this.weather?.getWeatherInfo() || '获取中...'), action: () => this.weather?._fetchWeather() },
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
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.WebPet = WebPet;
}
