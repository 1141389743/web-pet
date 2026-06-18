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
