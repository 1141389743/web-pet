/**
 * 皮肤管理器 - 加载、切换、导入皮肤
 */
class SkinManager {
  constructor(stateMachine) {
    this.stateMachine = stateMachine;
    this.skins = {};
    this.currentSkin = null;
    this._currentBaseUrl = '';

    // 注册内置皮肤
    this._registerBuiltinSkins();
  }

  _getBaseUrl() {
    // 检测是否在浏览器插件环境中
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL('');
    }
    return '';
  }

  _registerBuiltinSkins() {
    // emoji皮肤（默认，不需要图片）
    this.skins['emoji_cat'] = {
      name: '🐱 小猫',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐱',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_dog'] = {
      name: '🐶 小狗',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐶',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_bunny'] = {
      name: '🐰 兔子',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐰',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_panda'] = {
      name: '🐼 熊猫',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐼',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_fox'] = {
      name: '🦊 狐狸',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🦊',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
    this.skins['emoji_penguin'] = {
      name: '🐧 企鹅',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      emoji: '🐧',
      _isEmoji: true,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {}
    };
  }

  /**
   * 加载并应用皮肤
   */
  applySkin(skinId) {
    const skin = this.skins[skinId];
    if (!skin) return false;

    this.currentSkin = skin;
    this._currentBaseUrl = '';

    if (skin._isEmoji) {
      // emoji皮肤：停止动画，显示emoji
      this.stateMachine.animator.stop();
      this.stateMachine.animator.setDefaultEmoji(skin.emoji);
      this.stateMachine.animator.showDefault();
    } else {
      // 图片皮肤：加载帧动画
      this.stateMachine.loadFromSkin(skin, this._currentBaseUrl);
      this.stateMachine.changeState('idle', true);
    }

    try { localStorage.setItem('web_pet_skin', skinId); } catch {}
    return true;
  }

  /**
   * 导入自定义皮肤包
   * @param {object} config - config.json 内容
   * @param {string} baseUrl - 帧图片基础URL
   */
  importSkin(config, baseUrl = '') {
    if (!config.name || !config.animations) return false;

    const skinId = 'custom_' + Date.now();
    this.skins[skinId] = config;
    this.skins[skinId]._baseUrl = baseUrl;

    return skinId;
  }

  /**
   * 通过文件导入皮肤
   */
  async importFromFiles(files) {
    // 解析ZIP或文件夹
    const config = null;
    const frameMap = {};

    for (const file of files) {
      const path = file.webkitRelativePath || file.name;
      if (path.endsWith('config.json')) {
        const text = await file.text();
        config = JSON.parse(text);
      } else if (path.includes('frames/') && (path.endsWith('.png') || path.endsWith('.gif'))) {
        const url = URL.createObjectURL(file);
        const name = path.split('/').pop();
        frameMap[name] = url;
      }
    }

    if (!config) return null;

    // 替换帧文件名为blob URL
    for (const anim of Object.values(config.animations)) {
      anim.frames = anim.frames.map(f => frameMap[f] || f);
    }

    return this.importSkin(config, '');
  }

  getSkinList() {
    return Object.entries(this.skins).map(([id, skin]) => ({
      id, name: skin.name, author: skin.author || ''
    }));
  }

  getCurrentSkinId() {
    try { return localStorage.getItem('web_pet_skin') || 'default_cat'; } catch { return 'default_cat'; }
  }

  /**
   * 快速导入单张图片作为宠物（自动应用到所有状态）
   */
  importSingleImage(imageUrl, name = '自定义宠物') {
    const skinId = 'custom_single_' + Date.now();
    this.skins[skinId] = {
      name: name,
      version: '1.0',
      author: 'user',
      default_scale: 1.0,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {
        idle: { frames: [imageUrl], fps: 1, loop: true },
        clicked: { frames: [imageUrl], fps: 1, loop: false },
        dragged: { frames: [imageUrl], fps: 1, loop: true },
        happy: { frames: [imageUrl], fps: 1, loop: false },
        idle_action: { frames: [imageUrl], fps: 1, loop: false },
        walk: { frames: [imageUrl], fps: 1, loop: false }
      }
    };
    // 保存到 chrome.storage.local（跨页面同步）
    this._saveCustomSkin(skinId, { name, imageUrl });
    return skinId;
  }

  _saveCustomSkin(skinId, data) {
    // 优先用 chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('custom_skins').then(result => {
        const customs = result.custom_skins || {};
        customs[skinId] = data;
        chrome.storage.local.set({ custom_skins: customs });
      });
    } else {
      try {
        const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
        customs[skinId] = data;
        localStorage.setItem('web_pet_custom_skins', JSON.stringify(customs));
      } catch {}
    }
  }

  /**
   * 导入多帧动画（每个状态一张图）
   */
  importMultiFrame(imageMap, name = '自定义宠物') {
    // imageMap: { idle: url, clicked: url, happy: url, ... }
    const skinId = 'custom_multi_' + Date.now();
    const animations = {};
    for (const [state, url] of Object.entries(imageMap)) {
      animations[state] = { frames: [url], fps: 1, loop: state === 'idle' || state === 'dragged' };
    }
    // 填充缺失状态
    const defaultStates = ['idle', 'clicked', 'dragged', 'happy', 'idle_action', 'walk'];
    const fallback = imageMap.idle || Object.values(imageMap)[0];
    for (const s of defaultStates) {
      if (!animations[s]) animations[s] = { frames: [fallback], fps: 1, loop: s === 'idle' || s === 'dragged' };
    }
    this.skins[skinId] = {
      name, version: '1.0', author: 'user',
      default_scale: 1.0,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations
    };
    return skinId;
  }

  /**
   * 加载用户自定义皮肤（支持chrome.storage.local跨页面同步）
   * @returns {Promise}
   */
  loadCustomSkins() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('custom_skins').then(result => {
          const customs = result.custom_skins || {};
          this._applyCustomSkins(customs);
          resolve();
        }).catch(() => resolve());
      } else {
        try {
          const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
          this._applyCustomSkins(customs);
        } catch {}
        resolve();
      }
    });
  }

  _applyCustomSkins(customs) {
    for (const [id, data] of Object.entries(customs)) {
      if (!this.skins[id] && data.imageUrl) {
        this.skins[id] = {
          name: data.name || '自定义',
          version: '1.0', author: 'user',
          default_scale: 1.0,
          hitbox: { x: 10, y: 10, width: 80, height: 80 },
          animations: {
            idle: { frames: [data.imageUrl], fps: 1, loop: true },
            clicked: { frames: [data.imageUrl], fps: 1, loop: false },
            dragged: { frames: [data.imageUrl], fps: 1, loop: true },
            happy: { frames: [data.imageUrl], fps: 1, loop: false },
            idle_action: { frames: [data.imageUrl], fps: 1, loop: false },
            walk: { frames: [data.imageUrl], fps: 1, loop: false }
          }
        };
      }
    }
  }

  /**
   * 删除自定义皮肤
   */
  removeCustomSkin(skinId) {
    delete this.skins[skinId];
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('custom_skins').then(result => {
        const customs = result.custom_skins || {};
        delete customs[skinId];
        chrome.storage.local.set({ custom_skins: customs });
      });
    } else {
      try {
        const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
        delete customs[skinId];
        localStorage.setItem('web_pet_custom_skins', JSON.stringify(customs));
      } catch {}
    }
  }
}
