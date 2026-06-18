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
    const base = this._getBaseUrl();
    // 默认小猫
    this.skins['default_cat'] = {
      name: '默认小猫',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {
        idle: { frames: [base+'skins/default_cat/idle_01.png', base+'skins/default_cat/idle_02.png'], fps: 8, loop: true },
        clicked: { frames: [base+'skins/default_cat/clicked_01.png'], fps: 5, loop: false },
        dragged: { frames: [base+'skins/default_cat/dragged_01.png'], fps: 5, loop: true },
        happy: { frames: [base+'skins/default_cat/happy_01.png', base+'skins/default_cat/happy_02.png'], fps: 8, loop: false },
        idle_action: { frames: [base+'skins/default_cat/idle_01.png', base+'skins/default_cat/idle_02.png'], fps: 6, loop: false },
        walk: { frames: [base+'skins/default_cat/walk_01.png', base+'skins/default_cat/walk_02.png'], fps: 10, loop: false }
      }
    };

    // 蓝色小鸟
    this.skins['blue_bird'] = {
      name: '蓝色小鸟',
      version: '1.0',
      author: 'system',
      default_scale: 0.8,
      hitbox: { x: 10, y: 10, width: 70, height: 70 },
      animations: {
        idle: { frames: [base+'skins/blue_bird/idle_01.png', base+'skins/blue_bird/idle_02.png'], fps: 6, loop: true },
        clicked: { frames: [base+'skins/blue_bird/clicked_01.png'], fps: 5, loop: false },
        dragged: { frames: [base+'skins/blue_bird/dragged_01.png'], fps: 5, loop: true },
        happy: { frames: [base+'skins/blue_bird/happy_01.png'], fps: 8, loop: false },
        idle_action: { frames: [base+'skins/blue_bird/idle_01.png'], fps: 6, loop: false },
        walk: { frames: [base+'skins/blue_bird/walk_01.png', base+'skins/blue_bird/walk_02.png'], fps: 10, loop: false }
      }
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

    this.stateMachine.loadFromSkin(skin, this._currentBaseUrl);
    this.stateMachine.changeState('idle', true);

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
    // 保存图片到localStorage（小图）
    try {
      const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
      customs[skinId] = { name, imageUrl };
      localStorage.setItem('web_pet_custom_skins', JSON.stringify(customs));
    } catch {}
    return skinId;
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
   * 从localStorage加载用户自定义皮肤
   */
  loadCustomSkins() {
    try {
      const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
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
    } catch {}
  }

  /**
   * 删除自定义皮肤
   */
  removeCustomSkin(skinId) {
    delete this.skins[skinId];
    try {
      const customs = JSON.parse(localStorage.getItem('web_pet_custom_skins') || '{}');
      delete customs[skinId];
      localStorage.setItem('web_pet_custom_skins', JSON.stringify(customs));
    } catch {}
  }
}
