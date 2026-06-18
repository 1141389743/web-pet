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

  _registerBuiltinSkins() {
    // 默认小猫
    this.skins['default_cat'] = {
      name: '默认小猫',
      version: '1.0',
      author: 'system',
      default_scale: 1.0,
      hitbox: { x: 10, y: 10, width: 80, height: 80 },
      animations: {
        idle: { frames: ['skins/default_cat/idle_01.png', 'skins/default_cat/idle_02.png'], fps: 8, loop: true },
        clicked: { frames: ['skins/default_cat/clicked_01.png'], fps: 5, loop: false },
        dragged: { frames: ['skins/default_cat/dragged_01.png'], fps: 5, loop: true },
        happy: { frames: ['skins/default_cat/happy_01.png', 'skins/default_cat/happy_02.png'], fps: 8, loop: false },
        idle_action: { frames: ['skins/default_cat/idle_01.png', 'skins/default_cat/idle_02.png'], fps: 6, loop: false },
        walk: { frames: ['skins/default_cat/walk_01.png', 'skins/default_cat/walk_02.png'], fps: 10, loop: false }
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
        idle: { frames: ['skins/blue_bird/idle_01.png', 'skins/blue_bird/idle_02.png'], fps: 6, loop: true },
        clicked: { frames: ['skins/blue_bird/clicked_01.png'], fps: 5, loop: false },
        dragged: { frames: ['skins/blue_bird/dragged_01.png'], fps: 5, loop: true },
        happy: { frames: ['skins/blue_bird/happy_01.png'], fps: 8, loop: false },
        idle_action: { frames: ['skins/blue_bird/idle_01.png'], fps: 6, loop: false },
        walk: { frames: ['skins/blue_bird/walk_01.png', 'skins/blue_bird/walk_02.png'], fps: 10, loop: false }
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
}
