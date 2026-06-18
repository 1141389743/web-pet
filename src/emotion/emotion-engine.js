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
