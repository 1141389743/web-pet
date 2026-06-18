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
