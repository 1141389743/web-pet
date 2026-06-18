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
