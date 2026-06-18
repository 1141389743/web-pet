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
