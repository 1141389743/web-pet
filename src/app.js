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
      // 同步到 chrome.storage.local（插件跨页面同步）
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ config: cfg });
      }
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

    // 6. 快捷面板
    this.quickPanel = new QuickPanel({
      getReminders: () => this.reminder.getAll(),
      getNotes: () => this.notepad.getAll(),
      getSkins: () => this.skinManager.getSkinList().filter(s => !s.id.startsWith('custom_')),
      getCustomSkins: () => this.skinManager.getSkinList().filter(s => s.id.startsWith('custom_')),
      getCurrentSkinId: () => this.options.skin,
      onAddReminder: (content, triggerAt, minutes) => {
        this.reminder.add(content, triggerAt);
        this.bubble.show('⏰ ' + minutes + '分钟后提醒', 2000);
      },
      onRemoveReminder: (id) => {
        this.reminder.remove(id);
        this.bubble.show('已取消提醒', 1500);
      },
      onAddNote: (text) => {
        this.notepad.add(text);
        this.bubble.show('📝 已添加便签', 1500);
      },
      onToggleNote: (id) => this.notepad.toggleDone(id),
      onPinNote: (id) => this.notepad.togglePin(id),
      onDeleteNote: (id) => this.notepad.remove(id),
      onImportImage: () => this._importImage(),
      onSkinChange: (id) => {
        this.options.skin = id;
        this.skinManager.applySkin(id);
        this._saveConfig();
        this.bubble.show('🎨 已切换皮肤', 1500);
      },
      onSkinDelete: (id) => {
        this.skinManager.removeCustomSkin(id);
        this.bubble.show('已删除皮肤', 1500);
      }
    });

    // 7. 鼠标交互
    this.mouse = new MouseHandler(this.container, this.stateMachine);
    this.mouse.onClick = () => {
      this.plugins.trigger('click');
      this.emotion.onInteract('click');
      this.aiBehavior.reactToInteraction('click');
      if (this.quickPanel.visible) {
        this.quickPanel.hide();
      }
    };
    this.mouse.onHover = () => {
      this.plugins.trigger('hover');
      this.emotion.onInteract('click');
    };
    this.mouse.onDrag = () => {
      this.emotion.onInteract('drag');
    };
    this.mouse.onDoubleClick = () => {
      // 双击打开快捷面板
      const rect = this.container.el.getBoundingClientRect();
      this.quickPanel.show(rect.left, rect.top);
    };
    this.mouse.onContextMenu = (e) => this._showContextMenu(e);

    // 7. 插件系统
    this.plugins = new PluginSystem();
    this._registerBuiltinPlugins();

    // 8. 工具
    this.reminder = new ReminderTool();
    this.reminder.onTrigger = (r) => {
      this._showReminderCenter(r.content);
      this.emotion.onInteract('click');
      this.aiBehavior.reactToInteraction('reminder', r.content);
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
      this._showReminderCenter(texts[Math.floor(Math.random() * texts.length)]);
      this.emotion.onInteract('click');
      if (hour >= 23 || hour < 6) {
        this.aiBehavior.reactToInteraction('night');
      } else if (hour >= 6 && hour < 10) {
        this.aiBehavior.reactToInteraction('morning');
      }
    };

    this.notepad = new NotepadTool();

    // 9. 设置面板
    // （自定义皮肤在_init末尾异步加载）
    this.settings = new SettingsPanel({
      getConfig: () => this.options,
      getSkins: () => this.skinManager.getSkinList(),
      getCurrentSkinId: () => this.options.skin,
      getReminders: () => this.reminder.getAll(),
      onRemoveReminder: (id) => { this.reminder.remove(id); this.settings._render(); },
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
      onReset: () => this._resetData(),
      getChatConfig: () => ({
        endpoint: this.chatEngine.endpoint,
        apiKey: this.chatEngine.apiKey,
        model: this.chatEngine.model,
        systemPrompt: this.chatEngine.systemPrompt
      }),
      onSaveChatConfig: (cfg) => this.chatEngine.configure(cfg),
      onTestChat: async () => {
        if (!this.chatEngine.isConfigured()) throw new Error('请先填写 API 地址和 Key');
        await this.chatEngine.chat('你好');
      }
    });

    // 10. 注入API给插件
    this.plugins.setAPI({
      showBubble: (text, dur) => this.bubble.show(text, dur),
      changeState: (state) => this.stateMachine.changeState(state),
      getContainer: () => this.container
    });

    // 异步加载自定义皮肤，然后应用保存的皮肤
    const savedSkin = this.options.skin || 'emoji_cat';
    this._skinReady = this.skinManager.loadCustomSkins().then(() => {
      this.skinManager.applySkin(savedSkin);
      if (this.onReady) this.onReady();
    });
    this.stateMachine.startIdleScheduler();

    // 迷你游戏
    this.games = new MiniGames(this.bubble, this.container);

    // 情绪引擎
    this.emotion = new EmotionEngine();

    // 聊天引擎
    this.chatEngine = new ChatEngine();

    // 聊天面板
    this.chatPanel = new ChatPanel({
      getPetName: () => '小爪',
      getMessages: () => this.chatEngine.history,
      isConfigured: () => this.chatEngine.isConfigured(),
      onSend: async (text) => {
        this.chatPanel.setLoading(true);
        this.emotion.onInteract('chat');
        try {
          const reply = await this.chatEngine.chat(text);
          this.chatPanel.setLoading(false);
          this.chatPanel.refresh();
          this.bubble.show(reply, 4000);
          this.aiBehavior.reactToInteraction('chat', text).catch(() => {});
        } catch (e) {
          this.chatPanel.setLoading(false);
          this.bubble.show('😿 ' + e.message, 3000);
          this.chatPanel.refresh();
        }
      },
      onClear: () => this.chatEngine.clearHistory(),
      onOpenSettings: () => this.settings.show()
    });

    // 情绪视觉系统（让宠物外观随情绪动态变化）
    this.emotionVisual = new EmotionVisual(this.container, this.emotion);

    // 宠物动作系统
    this.petActions = new PetActions(this.container, this.bubble, this.emotion);

    // AI 行为驱动
    this.aiBehavior = new AIBehavior(this.chatEngine, this.emotion, this.bubble, this.container);
    this.aiBehavior.onAction = (action) => this.petActions.execute(action);
    this.aiBehavior.start();

    // 天气系统
    this.weather = new WeatherSystem(this.container, this.bubble);

    // 天气通知卡片（右上角，显示10秒后自动收起）
    this.weatherWidget = new WeatherWidget();
    this.weather.onWeatherUpdate = (w) => {
      this.emotion.onWeatherChange(w);
      const offset = this.reminderWidget?.getHeight() || 0;
      this.weatherWidget.setTopOffset(12 + offset);
      this.weatherWidget.show(w);
      this.aiBehavior.reactToInteraction('weather', `${w.desc} ${w.temp}°C`);
    };

    // 提醒列表组件（右上角，有提醒时显示，带数量徽章）
    this.reminderWidget = new ReminderWidget(this.reminder);
    this.reminderWidget.onVisibilityChange = (height) => {
      this.weatherWidget?.setTopOffset(12 + height);
    };

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
    const pinned = this.notepad.getPinned();
    const customSkins = this.skinManager.getSkinList().filter(s => s.id.startsWith('custom_'));

    // 用宠物当前位置而非鼠标位置
    const rect = this.container.el.getBoundingClientRect();
    const menuX = rect.left + rect.width / 2;
    const menuY = rect.top;

    this._contextMenu.show(menuX, menuY, [
      // 提醒
      { label: `⏰ 快速提醒 (${this.reminder.getActiveCount()} 个进行中)`, isTitle: true },
      { label: '  5 分钟后提醒', action: () => this._setQuickTimer(5) },
      { label: '  10 分钟后提醒', action: () => this._setQuickTimer(10) },
      { label: '  15 分钟后提醒', action: () => this._setQuickTimer(15) },
      { label: '  30 分钟后提醒', action: () => this._setQuickTimer(30) },
      { label: '  1 小时后提醒', action: () => this._setQuickTimer(60) },
      { label: '  2 小时后提醒', action: () => this._setQuickTimer(120) },
      { label: '  ⏱️ 设闹钟...', action: () => this._setAlarm() },
      { label: '  ✏️ 自定义提醒...', action: () => this._customTimer() },
      { divider: true },
      // 便签
      { label: '📝 快捷便签', isTitle: true },
      { label: '  新建便签...', action: () => this._addNote() },
      ...pinned.map(n => ({ label: '  📌 ' + n.text, action: () => this.bubble.show('📝 ' + n.text, 3000) })),
      { divider: true },
      // 皮肤
      { label: '🎨 切换皮肤', isTitle: true },
      { label: '  📷 导入图片...', action: () => this._importImage() },
      { label: '  🐱 小猫', action: () => this._switchSkin('emoji_cat') },
      { label: '  🐶 小狗', action: () => this._switchSkin('emoji_dog') },
      { label: '  🐰 兔子', action: () => this._switchSkin('emoji_bunny') },
      { label: '  🐼 熊猫', action: () => this._switchSkin('emoji_panda') },
      { label: '  🦊 狐狸', action: () => this._switchSkin('emoji_fox') },
      { label: '  🐧 企鹅', action: () => this._switchSkin('emoji_penguin') },
      ...customSkins.map(s => ({ label: '  🖼️ ' + s.name, action: () => this._switchSkin(s.id) })),
      { divider: true },
      // 聊天
      { label: '💬 和宠物聊天', action: () => {
        const rect = this.container.el.getBoundingClientRect();
        this.chatPanel.show(rect.left, rect.top);
      }},
      { divider: true },
      // 宠物动作
      { label: `🐾 宠物动作 ${this.emotion.getMoodEmoji()}`, isTitle: true },
      { label: '  🌀 影分身', action: () => this.petActions.execute('clone') },
      { label: '  💃 跳舞', action: () => this.petActions.execute('dance') },
      { label: '  🔄 旋转', action: () => this.petActions.execute('spin') },
      { label: '  👋 招手', action: () => this.petActions.execute('wave') },
      { label: '  💤 睡觉', action: () => this.petActions.execute('sleep') },
      { label: '  👀 偷看', action: () => this.petActions.execute('peek') },
      { label: '  🥱 伸懒腰', action: () => this.petActions.execute('stretch') },
      { label: '  💖 爱心', action: () => this.petActions.execute('heart') },
      { label: '  ✨ 闪光', action: () => this.petActions.execute('sparkle') },
      { label: '  🫣 探头', action: () => this.petActions.execute('hide') },
      { divider: true },
      // 小游戏
      { label: '🎮 小游戏', isTitle: true },
      { label: '  ✊✌️🖐️ 石头剪刀布', action: () => this.games.rockPaperScissors() },
      { label: '  🎲 掷骰子', action: () => this.games.rollDice() },
      { label: '  🔢 猜数字', action: () => this.games.guessNumber() },
      { label: '  🃏 21点', action: () => this.games.blackjack() },
      { label: '  🧠 记忆翻牌', action: () => this.games.memoryFlip() },
      { label: '  🔨 打地鼠', action: () => this.games.whackMole() },
      { label: '  🪙 抛硬币', action: () => this.games.coinFlip() },
      { label: '  🔮 今日运势', action: () => this.games.fortune() },
      { label: '  🃏 今日一卡', action: () => this.games.drawCard() },
      { divider: true },
      // 天气
      { label: '🌤️ 天气', isTitle: true },
      { label: '  ' + (this.weather?.getWeatherInfo() || '获取中...'), action: () => this.weather?._fetchWeather() },
      { label: '  📋 显示天气卡片', action: () => { if (this.weather?.currentWeather) this.weatherWidget?.show(this.weather.currentWeather); } },
      { label: '  📍 切换城市...', action: () => this._setWeatherCity() },
      { divider: true },
      // 工具
      { label: '👁️ 显示/隐藏', action: () => this.container.toggle() },
      { label: '📍 重置位置', action: () => this.container.resetPosition() },
      { label: '⚙️ 设置', action: () => this.settings.show() }
    ]);
  }

  _setQuickTimer(minutes) {
    const triggerAt = Date.now() + minutes * 60000;
    this.reminder.add('时间到了~', triggerAt);
    const label = minutes >= 60 ? (minutes/60) + '小时' : minutes + '分钟';
    this.bubble.show('⏰ ' + label + '后提醒', 2000);
  }

  _customTimer() {
    const text = prompt('提醒内容：') || '时间到了~';
    const minStr = prompt('多少分钟后提醒？', '30');
    if (minStr && !isNaN(minStr)) {
      this.reminder.add(text, Date.now() + Number(minStr) * 60000);
      this.bubble.show('⏰ ' + minStr + '分钟后提醒', 2000);
    }
  }

  _setAlarm() {
    const text = prompt('提醒内容：') || '闹钟响了~';
    const timeStr = prompt('设定时间（如 08:30, 14:00）：');
    if (!timeStr) return;
    const parts = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!parts) { alert('时间格式错误，请用 HH:MM 格式'); return; }
    const h = parseInt(parts[1]), m = parseInt(parts[2]);
    if (h > 23 || m > 59) { alert('时间格式错误'); return; }
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= new Date()) target.setDate(target.getDate() + 1);
    const mins = Math.round((target.getTime() - Date.now()) / 60000);
    this.reminder.add(text, target.getTime());
    const label = mins >= 60 ? Math.round(mins / 60) + '小时' : mins + '分钟';
    this.bubble.show('⏰ 闹钟设在 ' + timeStr + '（' + label + '后）', 2500);
  }

  _addNote() {
    const text = prompt('便签内容：');
    if (text) {
      this.notepad.add(text);
      this.bubble.show('📝 已保存', 1500);
    }
  }

  _switchSkin(id) {
    this.options.skin = id;
    this.skinManager.applySkin(id);
    this._saveConfig();
    this.bubble.show('🎨 已切换', 1500);
  }

  _setWeatherCity() {
    const city = prompt('输入城市名（英文，如 Beijing, Shanghai, Tokyo）：', 'Beijing');
    if (city) {
      this.weather.setCity(city);
      this.bubble.show('📍 城市已设为 ' + city, 2000);
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
    this.reminderWidget?.destroy();
    this.weatherWidget?.destroy();
    this.chatPanel?.destroy();
    this.aiBehavior?.destroy();
    this.petActions?.destroy();
    this.emotionVisual?.destroy();
    this.emotion?.destroy();
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.WebPet = WebPet;
}
