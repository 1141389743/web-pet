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
