/**
 * 互动插件系统 - 事件订阅模式
 * 插件格式: { name, trigger(ctx), execute(ctx), priority, enabled }
 */
class PluginSystem {
  constructor() {
    this.plugins = [];
    this._api = null; // 注入的统一API
  }

  /**
   * 注入API供插件调用
   */
  setAPI(api) {
    this._api = api;
  }

  /**
   * 注册插件
   */
  register(plugin) {
    if (!plugin.name || !plugin.execute) return;
    plugin.enabled = plugin.enabled !== false;
    plugin.priority = plugin.priority || 0;
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 触发事件
   * @param {string} eventType - 事件类型: click, hover, drag_start, drag_end, idle, double_click
   * @param {object} context - 事件上下文
   */
  trigger(eventType, context = {}) {
    context.eventType = eventType;
    context.api = this._api;

    for (const plugin of this.plugins) {
      if (!plugin.enabled) continue;
      try {
        if (plugin.trigger && plugin.trigger(context)) {
          plugin.execute(context);
          break; // 第一个命中的插件执行后中断
        }
      } catch (e) {
        console.warn(`[PetPlugin] ${plugin.name} error:`, e);
      }
    }
  }

  enablePlugin(name) {
    const p = this.plugins.find(p => p.name === name);
    if (p) p.enabled = true;
  }

  disablePlugin(name) {
    const p = this.plugins.find(p => p.name === name);
    if (p) p.enabled = false;
  }

  getPluginList() {
    return this.plugins.map(p => ({
      name: p.name, priority: p.priority, enabled: p.enabled
    }));
  }
}

// === 内置插件 ===

const BuiltInPlugins = {
  /** 点击随机语录 */
  clickRandomQuote: {
    name: 'clickRandomQuote',
    priority: 10,
    trigger: (ctx) => ctx.eventType === 'click',
    execute: (ctx) => {
      const quotes = [
        '你好呀~', '别戳我啦！', '嘿嘿~', '今天也要加油！',
        '摸摸头~', '别闹~', '有什么需要帮忙的吗？', '我好开心！'
      ];
      ctx.api.showBubble(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  },

  /** 悬停问候 */
  hoverGreeting: {
    name: 'hoverGreeting',
    priority: 5,
    trigger: (ctx) => ctx.eventType === 'hover',
    execute: (ctx) => {
      const now = new Date().getHours();
      let greeting = now < 12 ? '早上好~' : now < 18 ? '下午好~' : '晚上好~';
      ctx.api.showBubble(greeting, 2000);
    }
  },

  /** 拖拽结束反馈 */
  dragFeedback: {
    name: 'dragFeedback',
    priority: 20,
    trigger: (ctx) => ctx.eventType === 'drag_end',
    execute: (ctx) => {
      const phrases = ['呼~安全了', '哎呀好晕', '换个地方也不错', '被你搬来搬去的'];
      ctx.api.showBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    }
  },

  /** 闲置随机动作 */
  idleRandomAction: {
    name: 'idleRandomAction',
    priority: 1,
    trigger: (ctx) => ctx.eventType === 'idle',
    execute: (ctx) => {
      const actions = [
        { state: 'walk', bubble: '出去溜达溜达~' },
        { state: 'happy', bubble: '心情不错！' },
        { state: 'idle_action', bubble: '' }
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      ctx.api.changeState(action.state);
      if (action.bubble) ctx.api.showBubble(action.bubble, 2000);
    }
  }
};
