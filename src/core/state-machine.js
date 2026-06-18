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
