/**
 * 迷你游戏模块 - 右键菜单触发
 */
class MiniGames {
  constructor(bubble, container) {
    this.bubble = bubble;
    this.container = container;
  }

  /**
   * 石头剪刀布
   */
  rockPaperScissors() {
    const choices = [
      { emoji: '✊', name: '石头' },
      { emoji: '✌️', name: '剪刀' },
      { emoji: '🖐️', name: '布' }
    ];

    // 创建选择面板
    this._showGamePanel('✊✌️🖐️ 石头剪刀布', `
      <div style="text-align:center">
        <div id="rps-result" style="font-size:24px;margin:16px 0;min-height:40px">出拳！</div>
        <div style="display:flex;gap:16px;justify-content:center">
          <button class="game-btn rps-choice" data-choice="0" style="font-size:36px;padding:12px;border:2px solid #eee;border-radius:16px;background:#fff;cursor:pointer">✊</button>
          <button class="game-btn rps-choice" data-choice="1" style="font-size:36px;padding:12px;border:2px solid #eee;border-radius:16px;background:#fff;cursor:pointer">✌️</button>
          <button class="game-btn rps-choice" data-choice="2" style="font-size:36px;padding:12px;border:2px solid #eee;border-radius:16px;background:#fff;cursor:pointer">🖐️</button>
        </div>
        <div id="rps-score" style="margin-top:12px;font-size:12px;color:#999">赢0 平0 输0</div>
      </div>
    `);

    let wins = 0, draws = 0, losses = 0;

    this.panel.el.querySelectorAll('.rps-choice').forEach(btn => {
      btn.onclick = () => {
        const player = parseInt(btn.dataset.choice);
        const pet = Math.floor(Math.random() * 3);
        const resultEl = this.panel.el.querySelector('#rps-result');
        const scoreEl = this.panel.el.querySelector('#rps-score');

        // 判定
        let result;
        if (player === pet) { result = '平局！'; draws++; }
        else if ((player + 1) % 3 === pet) { result = '你赢了！🎉'; wins++; }
        else { result = '你输了！😈'; losses++; }

        resultEl.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:12px">
            <span>${choices[player].emoji}</span>
            <span style="font-size:16px">VS</span>
            <span>${choices[pet].emoji}</span>
          </div>
          <div style="font-size:16px;margin-top:8px;font-weight:600">${result}</div>
        `;
        scoreEl.textContent = `赢${wins} 平${draws} 输${losses}`;

        // 按钮反馈
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 150);
      };
    });
  }

  /**
   * 掷骰子
   */
  rollDice() {
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    this._showGamePanel('🎲 掷骰子', `
      <div style="text-align:center">
        <div id="dice-result" style="font-size:64px;margin:20px 0">🎲</div>
        <button class="game-btn" id="dice-roll" style="padding:12px 32px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:12px;font-size:16px;cursor:pointer">掷！</button>
        <div id="dice-history" style="margin-top:12px;font-size:12px;color:#999"></div>
      </div>
    `);

    const history = [];
    this.panel.el.querySelector('#dice-roll').onclick = () => {
      const resultEl = this.panel.el.querySelector('#dice-result');
      const historyEl = this.panel.el.querySelector('#dice-history');

      // 摇骰动画
      let count = 0;
      const shake = setInterval(() => {
        resultEl.textContent = dice[Math.floor(Math.random() * 6)];
        count++;
        if (count > 10) {
          clearInterval(shake);
          const final = Math.floor(Math.random() * 6);
          resultEl.textContent = dice[final];
          history.push(final + 1);
          if (history.length > 5) history.shift();
          historyEl.textContent = '历史: ' + history.join(', ');
        }
      }, 80);
    };
  }

  /**
   * 猜数字
   */
  guessNumber() {
    const target = Math.floor(Math.random() * 100) + 1;
    let attempts = 0;

    this._showGamePanel('🔢 猜数字（1-100）', `
      <div style="text-align:center">
        <div id="gn-hint" style="font-size:18px;margin:16px 0;color:#666">猜一个 1-100 的数字</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
          <input type="number" id="gn-input" min="1" max="100" style="width:80px;padding:8px;border:2px solid #eee;border-radius:10px;font-size:18px;text-align:center;outline:none">
          <button class="game-btn" id="gn-guess" style="padding:8px 20px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:16px;cursor:pointer">猜！</button>
        </div>
        <div id="gn-attempts" style="font-size:12px;color:#999">已猜 0 次</div>
        <button class="game-btn" id="gn-reset" style="margin-top:10px;padding:6px 16px;border:1px solid #eee;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;display:none">再来一局</button>
      </div>
    `);

    const input = this.panel.el.querySelector('#gn-input');
    const hint = this.panel.el.querySelector('#gn-hint');
    const guessBtn = this.panel.el.querySelector('#gn-guess');
    const attemptsEl = this.panel.el.querySelector('#gn-attempts');
    const resetBtn = this.panel.el.querySelector('#gn-reset');

    const doGuess = () => {
      const val = parseInt(input.value);
      if (!val || val < 1 || val > 100) return;
      attempts++;

      if (val === target) {
        hint.innerHTML = `🎉 猜对了！答案就是 <b>${target}</b>`;
        hint.style.color = '#52C41A';
        guessBtn.disabled = true;
        resetBtn.style.display = 'inline-block';
      } else if (val < target) {
        hint.textContent = '📈 太小了！再大一点';
        hint.style.color = '#FF6B81';
      } else {
        hint.textContent = '📉 太大了！再小一点';
        hint.style.color = '#FF6B81';
      }
      attemptsEl.textContent = `已猜 ${attempts} 次`;
      input.value = '';
      input.focus();
    };

    guessBtn.onclick = doGuess;
    input.onkeydown = (e) => { if (e.key === 'Enter') doGuess(); };
    resetBtn.onclick = () => {
      this.guessNumber(); // 重新开始
    };
    input.focus();
  }

  /**
   * 今日运势
   */
  fortune() {
    const fortunes = [
      { level: '大吉', emoji: '🌟', desc: '今天运气爆棚！做什么都顺！', score: 98 },
      { level: '中吉', emoji: '✨', desc: '运势不错，适合出门走走', score: 80 },
      { level: '小吉', emoji: '🌸', desc: '平稳的一天，小确幸不断', score: 65 },
      { level: '吉', emoji: '🍀', desc: '一切顺利，保持好心情', score: 55 },
      { level: '末吉', emoji: '🍃', desc: '需要多努力一点，结果会好的', score: 45 },
      { level: '凶', emoji: '🌧️', desc: '今天小心行事，多喝水早睡觉', score: 30 },
      { level: '大凶', emoji: '⛈️', desc: '建议今天躺平，明天再来！', score: 10 }
    ];
    const lucky = [
      '向东方走会有好运', '穿红色衣服运势UP', '今天适合吃甜食',
      '遇到猫会有好事', '数字7是你的幸运数字', '下午3点后运气转好',
      '今天适合学习新东西', '给朋友发条消息会有惊喜'
    ];

    const f = fortunes[Math.floor(Math.random() * fortunes.length)];
    const l = lucky[Math.floor(Math.random() * lucky.length)];
    const color = f.score >= 60 ? '#52C41A' : f.score >= 40 ? '#FAAD14' : '#FF4D4F';

    this._showGamePanel('🔮 今日运势', `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:48px;margin-bottom:8px">${f.emoji}</div>
        <div style="font-size:28px;font-weight:700;color:${color}">${f.level}</div>
        <div style="font-size:14px;color:#666;margin:8px 0">${f.desc}</div>
        <div style="background:#f5f5f5;border-radius:10px;padding:10px;margin:12px 0">
          <div style="font-size:12px;color:#999">今日宜</div>
          <div style="font-size:14px;margin-top:4px">🍀 ${l}</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:8px">
          <div style="text-align:center">
            <div style="font-size:12px;color:#999">运势指数</div>
            <div style="font-size:20px;font-weight:600;color:${color}">${f.score}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:12px;color:#999">幸运色</div>
            <div style="font-size:20px">🎨</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:12px;color:#999">幸运数</div>
            <div style="font-size:20px;font-weight:600">${Math.floor(Math.random()*9)+1}</div>
          </div>
        </div>
        <button class="game-btn" id="fortune-reroll" style="margin-top:14px;padding:8px 24px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">再测一次</button>
      </div>
    `);

    this.panel.el.querySelector('#fortune-reroll').onclick = () => this.fortune();
  }

  /**
   * 抽卡
   */
  drawCard() {
    const cards = [
      { name: '命运之轮', emoji: '🎡', meaning: '转机将至，把握机会' },
      { name: '太阳', emoji: '☀️', meaning: '光明与成功，正能量满满' },
      { name: '月亮', emoji: '🌙', meaning: '直觉敏锐，注意细节' },
      { name: '星星', emoji: '⭐', meaning: '愿望即将实现' },
      { name: '恋人', emoji: '💕', meaning: '人际关系和谐' },
      { name: '力量', emoji: '💪', meaning: '内心强大，克服困难' },
      { name: '愚者', emoji: '🃏', meaning: '新的开始，勇敢尝试' },
      { name: '魔术师', emoji: '🎩', meaning: '创造力爆发，心想事成' },
      { name: '隐者', emoji: '🏮', meaning: '需要独处思考' },
      { name: '恶魔', emoji: '😈', meaning: '小心诱惑，保持清醒' }
    ];

    const card = cards[Math.floor(Math.random() * cards.length)];
    const isGood = ['命运之轮', '太阳', '星星', '恋人', '力量', '魔术师'].includes(card.name);

    this._showGamePanel('🃏 今日一卡', `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:64px;margin:16px 0">${card.emoji}</div>
        <div style="font-size:20px;font-weight:700">${card.name}</div>
        <div style="font-size:14px;color:#666;margin:8px 0">${card.meaning}</div>
        <div style="background:${isGood ? '#E6FFE6' : '#FFF1F0'};border-radius:10px;padding:10px;margin-top:12px">
          <div style="font-size:13px;color:${isGood ? '#52C41A' : '#FF4D4F'}">${isGood ? '✅ 好兆头' : '⚠️ 需注意'}</div>
        </div>
        <button class="game-btn" id="card-redraw" style="margin-top:14px;padding:8px 24px;background:linear-gradient(135deg,#FF6B81,#FF9A9E);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">再抽一张</button>
      </div>
    `);

    this.panel.el.querySelector('#card-redraw').onclick = () => this.drawCard();
  }

  /**
   * 显示游戏面板
   */
  _showGamePanel(title, content) {
    // 创建或复用面板
    if (!this.panel) {
      this.panel = {
        el: null,
        overlay: null
      };

      this.panel.overlay = document.createElement('div');
      Object.assign(this.panel.overlay.style, {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.3)', zIndex: '2147483647',
        display: 'none'
      });
      this.panel.overlay.onclick = () => this._hideGamePanel();
      document.body.appendChild(this.panel.overlay);

      this.panel.el = document.createElement('div');
      Object.assign(this.panel.el.style, {
        position: 'fixed',
        zIndex: '2147483647',
        width: '320px',
        maxWidth: '90vw',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        color: '#333',
        display: 'none',
        overflow: 'hidden'
      });
      document.body.appendChild(this.panel.el);
    }

    // 定位到屏幕中间
    this.panel.el.innerHTML = `
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:15px;font-weight:600">${title}</span>
        <span style="cursor:pointer;font-size:18px" id="game-close">✕</span>
      </div>
      <div style="padding:16px">${content}</div>
    `;

    this.panel.el.querySelector('#game-close').onclick = () => this._hideGamePanel();

    // 定位
    const x = (window.innerWidth - 320) / 2;
    const y = (window.innerHeight - 400) / 2;
    this.panel.el.style.left = Math.max(10, x) + 'px';
    this.panel.el.style.top = Math.max(10, y) + 'px';
    this.panel.el.style.display = 'block';
    this.panel.overlay.style.display = 'block';
  }

  _hideGamePanel() {
    if (this.panel) {
      this.panel.el.style.display = 'none';
      this.panel.overlay.style.display = 'none';
    }
  }
}
