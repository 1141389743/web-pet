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
