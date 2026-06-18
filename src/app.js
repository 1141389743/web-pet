/**
 * Web悬浮桌面宠物 - 主入口
 * 一行代码引入即可运行
 */
class WebPet {
  constructor(options = {}) {
    this.options = Object.assign({
      size: 100,
      scale: 1.0,
      opacity: 1.0,
      edgeSnap: true,
      skin: 'emoji_cat',
      idleEnabled: true,
      idleInterval: 8000,
      hourlyEnabled: true,
      silentStart: 23,
      silentEnd: 7
    }, options);

    this._loadConfig();
    this._init();
  }

  _loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem('web_pet_config') || '{}');
      Object.assign(this.options, saved);
    } catch {}
  }

  _saveConfig() {
    try {
      const cfg = {
        scale: this.options.scale,
        opacity: this.options.opacity,
        edgeSnap: this.options.edgeSnap,
        skin: this.options.skin,
        idleEnabled: this.options.idleEnabled,
        idleInterval: this.options.idleInterval,
        hourlyEnabled: this.options.hourlyEnabled,
        silentStart: this.options.silentStart,
        silentEnd: this.options.silentEnd
      };
      localStorage.setItem('web_pet_config', JSON.stringify(cfg));
    } catch {}
  }

  _init() {
    // 1. 容器
    this.container = new PetContainer({
      size: this.options.size,
      scale: this.options.scale,
      opacity: this.options.opacity,
      edgeSnap: this.options.edgeSnap
    });
    this.container.loadPosition();

    // 2. 动画器
    this.animator = new PetAnimator(this.container);

    // 3. 状态机
    this.stateMachine = new PetStateMachine(this.animator);
    this.stateMachine.setIdleEnabled(this.options.idleEnabled);
    this.stateMachine.setIdleInterval(this.options.idleInterval);
    this.stateMachine.onStateChange = (state) => {
      this.plugins.trigger('state_change', { state });
    };

    // 4. 皮肤管理
    this.skinManager = new SkinManager(this.stateMachine);

    // 5. 气泡系统
    this.bubble = new BubbleSystem(this.container);

    // 6. 鼠标交互
    this.mouse = new MouseHandler(this.container, this.stateMachine);
    this.mouse.onClick = () => this.plugins.trigger('click');
    this.mouse.onHover = () => this.plugins.trigger('hover');
    this.mouse.onDoubleClick = () => this.settings.toggle();
    this.mouse.onContextMenu = (e) => this._showContextMenu(e);

    // 7. 插件系统
    this.plugins = new PluginSystem();
    this._registerBuiltinPlugins();

    // 8. 工具
    this.reminder = new ReminderTool();
    this.reminder.onTrigger = (r) => {
      this._showReminderCenter(r.content);
    };

    this.hourly = new HourlyTool();
    this.hourly.enabled = this.options.hourlyEnabled;
    this.hourly.silentStart = this.options.silentStart;
    this.hourly.silentEnd = this.options.silentEnd;
    this.hourly.onChime = (hour) => {
      const texts = [
        `现在是 ${hour}:00`, `${hour}点了~`,
        hour < 12 ? '上午好！' : hour < 18 ? '下午好！' : '晚上好！'
      ];
      // 整点也移到中间提示
      this._showReminderCenter(texts[Math.floor(Math.random() * texts.length)]);
    };

    this.notepad = new NotepadTool();

    // 9. 加载自定义皮肤
    this.skinManager.loadCustomSkins();

    // 10. 设置面板
    this.settings = new SettingsPanel({
      getConfig: () => this.options,
      getSkins: () => this.skinManager.getSkinList(),
      getCurrentSkinId: () => this.options.skin,
      onScaleChange: (v) => { this.options.scale = v; this.container.setScale(v); this._saveConfig(); },
      onOpacityChange: (v) => { this.options.opacity = v; this.container.setOpacity(v); this._saveConfig(); },
      onEdgeSnapChange: (v) => { this.options.edgeSnap = v; this.container.edgeSnap = v; this._saveConfig(); },
      onIdleEnabledChange: (v) => { this.options.idleEnabled = v; this.stateMachine.setIdleEnabled(v); this._saveConfig(); },
      onIdleIntervalChange: (v) => { this.options.idleInterval = v; this.stateMachine.setIdleInterval(v); this._saveConfig(); },
      onHourlyChange: (v) => { this.options.hourlyEnabled = v; this.hourly.setEnabled(v); this._saveConfig(); },
      onSkinChange: (id) => { this.options.skin = id; this.skinManager.applySkin(id); this._saveConfig(); this.settings._render(); },
      onSkinDelete: (id) => { this.skinManager.removeCustomSkin(id); this.settings._render(); },
      onImportImage: () => this._importImage(),
      onExport: () => this._exportData(),
      onImport: () => this._importData(),
      onReset: () => this._resetData()
    });

    // 10. 注入API给插件
    this.plugins.setAPI({
      showBubble: (text, dur) => this.bubble.show(text, dur),
      changeState: (state) => this.stateMachine.changeState(state),
      getContainer: () => this.container
    });

    // 11. 加载皮肤并启动
    const skinId = this.options.skin || 'default_cat';
    this.skinManager.applySkin(skinId);
    this.stateMachine.startIdleScheduler();

    // 检查是否有常驻便签
    this._showPinnedNote();

    // 全屏检测
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) this.container.hide();
      else this.container.show();
    });

    console.log('[WebPet] 🐱 桌面宠物已启动！');
  }

  _registerBuiltinPlugins() {
    for (const plugin of Object.values(BuiltInPlugins)) {
      this.plugins.register({ ...plugin });
    }
  }

  _showContextMenu(e) {
    if (!this._contextMenu) this._contextMenu = new ContextMenu();
    this._contextMenu.show(e.clientX, e.clientY, [
      { label: '👁️ 显示/隐藏', action: () => this.container.toggle() },
      { label: '📍 重置位置', action: () => this.container.resetPosition() },
      { divider: true },
      { label: '💬 随机语录', action: () => this.bubble.show(this.bubble.getRandomQuote('click')) },
      { label: '📝 新建便签', action: () => this._quickNote() },
      { label: '⏰ 新建提醒', action: () => this._quickReminder() },
      { divider: true },
      { label: '⚙️ 设置', action: () => this.settings.show() }
    ]);
  }

  _quickNote() {
    const text = prompt('输入便签内容：');
    if (text) {
      this.notepad.add(text);
      this.bubble.show('📝 已保存便签', 2000);
    }
  }

  _quickReminder() {
    const text = prompt('提醒内容：');
    if (!text) return;
    const minutes = prompt('多少分钟后提醒？', '30');
    if (minutes && !isNaN(minutes)) {
      this.reminder.add(text, Date.now() + Number(minutes) * 60000);
      this.bubble.show(`⏰ ${minutes}分钟后提醒`, 2000);
    }
  }

  _showPinnedNote() {
    const pinned = this.notepad.getPinned();
    if (pinned.length > 0) {
      setTimeout(() => this.bubble.show('📝 ' + pinned[0].text, 4000), 2000);
    }
  }

  /**
   * 提醒触发：宠物移到屏幕中间，大字提示
   */
  _showReminderCenter(content) {
    const el = this.container.el;
    const oldLeft = el.style.left;
    const oldTop = el.style.top;
    const oldTransition = el.style.transition;

    // 保存当前位置
    const savedPos = { ...this.container.position };

    // 移到屏幕中间
    const centerX = (window.innerWidth - this.container.size * this.container.scale) / 2;
    const centerY = (window.innerHeight - this.container.size * this.container.scale) / 2 - 30;

    el.style.transition = 'left 0.6s cubic-bezier(0.34,1.56,0.64,1), top 0.6s cubic-bezier(0.34,1.56,0.64,1)';
    this.container.setPosition(centerX, centerY);
    this.stateMachine.changeState('happy');

    // 显示大号提醒气泡
    setTimeout(() => {
      this.bubble.show('⏰ ' + content, 5000, 'reminder');
      // 晃动动画
      el.style.transition = 'transform 0.15s ease';
      let shakeCount = 0;
      const shake = () => {
        if (shakeCount >= 6) {
          el.style.transform = `scale(${this.container.scale})`;
          return;
        }
        el.style.transform = `scale(${this.container.scale}) rotate(${shakeCount % 2 === 0 ? '8deg' : '-8deg'})`;
        shakeCount++;
        setTimeout(shake, 150);
      };
      shake();
    }, 700);

    // 5秒后自动回到原位
    setTimeout(() => {
      el.style.transition = 'left 0.5s ease, top 0.5s ease, transform 0.3s ease';
      this.container.setPosition(savedPos.x, savedPos.y);
      el.style.transform = `scale(${this.container.scale})`;
      this.stateMachine.changeState('idle');
    }, 6000);
  }

  _importImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.multiple = true; // 支持多选
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (files.length === 1) {
        // 单张图片 - 应用到所有状态
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target.result;
          const skinId = this.skinManager.importSingleImage(url, file.name.replace(/\.\w+$/, ''));
          this.options.skin = skinId;
          this.skinManager.applySkin(skinId);
          this._saveConfig();
          this.bubble.show('🎨 已应用新皮肤！', 2000);
          this.settings.hide();
        };
        reader.readAsDataURL(file);
      } else {
        // 多张图片 - 按文件名匹配状态
        const stateMap = {};
        let loaded = 0;
        files.forEach(file => {
          const name = file.name.replace(/\.\w+$/, '').toLowerCase();
          const reader = new FileReader();
          reader.onload = (ev) => {
            // 尝试从文件名匹配状态
            let matchedState = null;
            for (const state of ['idle', 'clicked', 'dragged', 'happy', 'walk', 'idle_action']) {
              if (name.includes(state) || name.includes(state.replace('_', ''))) {
                matchedState = state;
                break;
              }
            }
            if (!matchedState) {
              // 用序号匹配: 1=idle, 2=clicked, 3=dragged, 4=happy
              const idx = files.indexOf(file);
              const states = ['idle', 'clicked', 'dragged', 'happy', 'walk', 'idle_action'];
              matchedState = states[idx] || 'idle';
            }
            stateMap[matchedState] = ev.target.result;
            loaded++;
            if (loaded === files.length) {
              const skinId = this.skinManager.importMultiFrame(stateMap, '自定义宠物');
              this.options.skin = skinId;
              this.skinManager.applySkin(skinId);
              this._saveConfig();
              this.bubble.show('🎨 已导入多帧皮肤！', 2000);
              this.settings.hide();
            }
          };
          reader.readAsDataURL(file);
        });
      }
    };
    input.click();
  }

  _exportData() {
    const data = {
      config: JSON.parse(localStorage.getItem('web_pet_config') || '{}'),
      reminders: JSON.parse(localStorage.getItem('web_pet_reminders') || '[]'),
      notes: JSON.parse(localStorage.getItem('web_pet_notes') || '[]'),
      quotes: this.bubble.getAllQuotes(),
      exportTime: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'web-pet-backup.json';
    a.click();
  }

  _importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.config) localStorage.setItem('web_pet_config', JSON.stringify(data.config));
        if (data.reminders) localStorage.setItem('web_pet_reminders', JSON.stringify(data.reminders));
        if (data.notes) localStorage.setItem('web_pet_notes', JSON.stringify(data.notes));
        alert('导入成功，刷新页面生效');
      } catch { alert('导入失败，文件格式错误'); }
    };
    input.click();
  }

  _resetData() {
    localStorage.removeItem('web_pet_config');
    localStorage.removeItem('web_pet_position');
    localStorage.removeItem('web_pet_skin');
    localStorage.removeItem('web_pet_reminders');
    localStorage.removeItem('web_pet_notes');
    localStorage.removeItem('web_pet_hourly');
    location.reload();
  }

  // === 公开API ===
  show() { this.container.show(); }
  hide() { this.container.hide(); }
  toggle() { this.container.toggle(); }
  say(text, duration) { this.bubble.show(text, duration); }
  setSkin(id) { this.options.skin = id; this.skinManager.applySkin(id); this._saveConfig(); }

  destroy() {
    this.container.destroy();
    this.animator.destroy();
    this.stateMachine.destroy();
    this.bubble.destroy();
    this.mouse.destroy();
    this.reminder.destroy();
    this.hourly.destroy();
    this.settings.destroy();
    this._contextMenu?.destroy();
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.WebPet = WebPet;
}
