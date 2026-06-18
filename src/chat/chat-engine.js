/**
 * 聊天引擎 - 接入 OpenAI 兼容 API
 * 支持自定义 endpoint、key、model
 */
class ChatEngine {
  constructor() {
    this.endpoint = '';
    this.apiKey = '';
    this.model = 'gpt-3.5-turbo';
    this.systemPrompt = '你是一只可爱的桌面宠物猫猫，名叫小爪。说话简短有趣，喜欢用emoji，语气俏皮温暖。每次回复控制在100字以内。';
    this.history = []; // 对话历史
    this.maxHistory = 20; // 保留最近N轮
    this._ready = false;
    this._load();
  }

  async _load() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('web_pet_chat_config');
        const cfg = data.web_pet_chat_config || {};
        this.endpoint = cfg.endpoint || '';
        this.apiKey = cfg.apiKey || '';
        this.model = cfg.model || 'gpt-3.5-turbo';
        this.systemPrompt = cfg.systemPrompt || this.systemPrompt;
      } else {
        const raw = localStorage.getItem('web_pet_chat_config');
        if (raw) {
          const cfg = JSON.parse(raw);
          this.endpoint = cfg.endpoint || '';
          this.apiKey = cfg.apiKey || '';
          this.model = cfg.model || 'gpt-3.5-turbo';
          this.systemPrompt = cfg.systemPrompt || this.systemPrompt;
        }
      }
    } catch {}
    this._ready = true;
  }

  _save() {
    const cfg = {
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      model: this.model,
      systemPrompt: this.systemPrompt
    };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ web_pet_chat_config: cfg });
      } else {
        localStorage.setItem('web_pet_chat_config', JSON.stringify(cfg));
      }
    } catch {}
  }

  /**
   * 更新配置
   */
  configure({ endpoint, apiKey, model, systemPrompt }) {
    if (endpoint !== undefined) this.endpoint = endpoint;
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (model !== undefined) this.model = model;
    if (systemPrompt !== undefined) this.systemPrompt = systemPrompt;
    this._save();
  }

  /**
   * 是否已配置
   */
  isConfigured() {
    return !!(this.endpoint && this.apiKey);
  }

  /**
   * 发送消息并获取回复
   * @param {string} userMessage
   * @returns {Promise<string>} AI回复
   */
  async chat(userMessage) {
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置 AI 接口');
    }

    // 添加用户消息到历史
    this.history.push({ role: 'user', content: userMessage });

    // 截断历史
    if (this.history.length > this.maxHistory * 2) {
      this.history = this.history.slice(-this.maxHistory * 2);
    }

    // 构建请求
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.history
    ];

    // 标准化 endpoint
    let url = this.endpoint.replace(/\/+$/, '');
    if (!url.endsWith('/chat/completions')) {
      url += '/chat/completions';
    }

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.8,
          max_tokens: 300
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`API 错误 (${resp.status}): ${err.slice(0, 100)}`);
      }

      const data = await resp.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '...';

      // 添加助手回复到历史
      this.history.push({ role: 'assistant', content: reply });

      return reply;
    } catch (e) {
      // 移除失败的用户消息
      this.history.pop();
      throw e;
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.history = [];
  }
}
