/**
 * 鼠标交互 - 点击、悬停、拖拽、右键菜单
 */
class MouseHandler {
  constructor(container, stateMachine) {
    this.container = container;
    this.stateMachine = stateMachine;
    this._hoverTimer = null;
    this._clickCount = 0;
    this._clickTimer = null;
    this._lastClickTime = 0;

    this._bindEvents();
  }

  _bindEvents() {
    const el = this.container.el;

    // mousedown - 拖拽开始
    el.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // 左键
        this.container.startDrag(e);
        this.stateMachine.changeState('dragged');
      }
    });

    // touchstart - 移动端拖拽
    el.addEventListener('touchstart', (e) => {
      this.container.startDrag(e.touches[0]);
      this.stateMachine.changeState('dragged');
    }, { passive: true });

    // click - 区分单击/双击
    el.addEventListener('click', (e) => {
      if (this.container.isDragging) return;
      const now = Date.now();
      if (now - this._lastClickTime < 300) {
        this._handleDoubleClick(e);
        this._clickTimer && clearTimeout(this._clickTimer);
      } else {
        this._clickTimer = setTimeout(() => this._handleClick(e), 300);
      }
      this._lastClickTime = now;
    });

    // 拖拽结束回调
    this.container.onDragEnd = () => {
      this.stateMachine.changeState('idle');
    };

    // 悬停
    el.addEventListener('mouseenter', () => {
      this._hoverTimer = setTimeout(() => {
        this.stateMachine.changeState('happy');
        if (this.onHover) this.onHover();
      }, 1000);
      // 吸附状态鼠标靠近弹出
      if (this.container.isSnapped) {
        const rect = el.getBoundingClientRect();
        const targetX = this.container.snapSide === 'left' ? 0 : window.innerWidth - this.container.size * this.container.scale;
        this.container.setPosition(targetX, this.container.position.y);
      }
    });

    el.addEventListener('mouseleave', () => {
      clearTimeout(this._hoverTimer);
      // 吸附状态鼠标离开收回
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
  }
}
