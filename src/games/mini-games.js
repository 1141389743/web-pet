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
   * 21点 (Blackjack)
   */
  blackjack() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    let deck = [], playerHand = [], dealerHand = [], gameOver = false;

    const createDeck = () => {
      deck = [];
      for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s });
      // 洗牌
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    };

    const cardStr = c => `<span style="color:${'♥♦'.includes(c.suit) ? '#e74c3c' : '#333'}">${c.rank}${c.suit}</span>`;

    const handValue = hand => {
      let sum = 0, aces = 0;
      for (const c of hand) {
        if (c.rank === 'A') { sum += 11; aces++; }
        else if ('JQK'.includes(c.rank)) sum += 10;
        else sum += parseInt(c.rank);
      }
      while (sum > 21 && aces > 0) { sum -= 10; aces--; }
      return sum;
    };

    const render = () => {
      const pv = handValue(playerHand);
      const dv = handValue(dealerHand);
      const dealerShow = gameOver ? dealerHand.map(cardStr).join(' ') : cardStr(dealerHand[0]) + ' ?';
      const dealerVal = gameOver ? dv : '?';

      const dealerEl = this.panel.el?.querySelector('#bj-dealer');
      const playerEl = this.panel.el?.querySelector('#bj-player');
      if (!dealerEl || !playerEl) return; // 面板已关闭

      dealerEl.innerHTML =
        `<div style="font-size:12px;color:#999;margin-bottom:4px">庄家 (${dealerVal})</div>` +
        `<div style="font-size:20px;letter-spacing:4px">${dealerShow}</div>`;
      playerEl.innerHTML =
        `<div style="font-size:12px;color:#999;margin-bottom:4px">你的牌 (${pv})</div>` +
        `<div style="font-size:20px;letter-spacing:4px">${playerHand.map(cardStr).join(' ')}</div>`;

      const statusEl = this.panel.el.querySelector('#bj-status');
      const hitBtn = this.panel.el.querySelector('#bj-hit');
      const standBtn = this.panel.el.querySelector('#bj-stand');
      const actionsEl = this.panel.el.querySelector('#bj-actions');
      if (!statusEl || !hitBtn || !standBtn || !actionsEl) return;

      if (gameOver) {
        hitBtn.style.display = 'none';
        standBtn.style.display = 'none';
        actionsEl.style.display = 'block';
        if (pv > 21) { statusEl.textContent = '💥 爆了！你输了'; statusEl.style.color = '#e74c3c'; }
        else if (dv > 21) { statusEl.textContent = '🎉 庄家爆了！你赢了'; statusEl.style.color = '#27ae60'; }
        else if (pv > dv) { statusEl.textContent = '🎉 你赢了！'; statusEl.style.color = '#27ae60'; }
        else if (pv < dv) { statusEl.textContent = '😈 庄家赢了'; statusEl.style.color = '#e74c3c'; }
        else { statusEl.textContent = '🤝 平局'; statusEl.style.color = '#f39c12'; }
      } else {
        if (pv === 21) { statusEl.textContent = '🎯 21点！'; statusEl.style.color = '#27ae60'; gameOver = true; render(); return; }
        statusEl.textContent = '要牌还是停牌？';
        statusEl.style.color = '#666';
      }
    };

    const startGame = () => {
      createDeck();
      playerHand = [deck.pop(), deck.pop()];
      dealerHand = [deck.pop(), deck.pop()];
      gameOver = false;
      this.panel.el.querySelector('#bj-hit').style.display = '';
      this.panel.el.querySelector('#bj-stand').style.display = '';
      this.panel.el.querySelector('#bj-actions').style.display = 'none';
      render();
    };

    this._showGamePanel('🃏 21点', `
      <div style="text-align:center">
        <div id="bj-dealer" style="margin-bottom:16px;padding:12px;background:#f9f9f9;border-radius:10px"></div>
        <div id="bj-player" style="margin-bottom:12px;padding:12px;background:#f0f7ff;border-radius:10px"></div>
        <div id="bj-status" style="font-size:16px;font-weight:600;margin:12px 0"></div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="game-btn" id="bj-hit" style="padding:10px 28px;background:#27ae60;color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer">要牌</button>
          <button class="game-btn" id="bj-stand" style="padding:10px 28px;background:#e67e22;color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer">停牌</button>
        </div>
        <div id="bj-actions" style="display:none">
          <button class="game-btn" id="bj-new" style="padding:10px 28px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer">再来一局</button>
        </div>
      </div>
    `);

    this.panel.el.querySelector('#bj-hit').onclick = () => {
      playerHand.push(deck.pop());
      if (handValue(playerHand) >= 21) { gameOver = true; }
      render();
    };
    this.panel.el.querySelector('#bj-stand').onclick = () => {
      gameOver = true;
      while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());
      render();
    };
    this.panel.el.querySelector('#bj-new').onclick = startGame;
    startGame();
  }

  /**
   * 记忆翻牌
   */
  memoryFlip() {
    const emojis = ['🍎','🍊','🍋','🍇','🍓','🍒','🥝','🍑'];
    let cards = [], flipped = [], matched = [], moves = 0, lockBoard = false;

    const initCards = () => {
      const pairs = [...emojis.slice(0, 6), ...emojis.slice(0, 6)]; // 6对=12张
      cards = pairs.sort(() => Math.random() - 0.5);
      flipped = [];
      matched = [];
      moves = 0;
      lockBoard = false;
    };

    const render = () => {
      const grid = this.panel.el?.querySelector('#mf-grid');
      const info = this.panel.el?.querySelector('#mf-info');
      if (!grid || !info) return;
      grid.innerHTML = cards.map((c, i) => {
        const isFlipped = flipped.includes(i) || matched.includes(i);
        const isMatched = matched.includes(i);
        return `<div class="mf-card" data-idx="${i}" style="
          width:56px;height:56px;display:flex;align-items:center;justify-content:center;
          font-size:24px;border-radius:10px;cursor:pointer;user-select:none;
          transition:transform 0.3s;transform:${isFlipped ? 'rotateY(180deg)' : 'none'};
          background:${isMatched ? '#e8f5e9' : isFlipped ? '#fff' : '#667eea'};
          border:2px solid ${isMatched ? '#81c784' : isFlipped ? '#ddd' : '#556cd6'};
          ${isMatched ? 'opacity:0.7' : ''}
        ">${isFlipped ? c : '❓'}</div>`;
      }).join('');

      info.textContent = `步数: ${moves} | 已配对: ${matched.length / 2}/6`;

      if (matched.length === cards.length) {
        info.textContent = `🎉 完成！共 ${moves} 步`;
        info.style.color = '#27ae60';
        info.style.fontWeight = '600';
      }
    };

    this._showGamePanel('🧠 记忆翻牌', `
      <div style="text-align:center">
        <div id="mf-grid" style="display:grid;grid-template-columns:repeat(4,56px);gap:8px;justify-content:center;margin:12px 0"></div>
        <div id="mf-info" style="font-size:13px;color:#999;margin-top:8px"></div>
        <button class="game-btn" id="mf-reset" style="margin-top:10px;padding:6px 16px;border:1px solid #eee;border-radius:8px;background:#fff;cursor:pointer;font-size:12px">重新开始</button>
      </div>
    `);

    this.panel.el.querySelector('#mf-grid').onclick = (e) => {
      const card = e.target.closest('.mf-card');
      if (!card || lockBoard) return;
      const idx = parseInt(card.dataset.idx);
      if (flipped.includes(idx) || matched.includes(idx)) return;

      flipped.push(idx);
      render();

      if (flipped.length === 2) {
        moves++;
        lockBoard = true;
        const [a, b] = flipped;
        if (cards[a] === cards[b]) {
          matched.push(a, b);
          flipped = [];
          lockBoard = false;
          render();
        } else {
          setTimeout(() => {
            flipped = [];
            lockBoard = false;
            render();
          }, 800);
        }
      }
    };

    this.panel.el.querySelector('#mf-reset').onclick = () => { initCards(); render(); };
    initCards();
    render();
  }

  /**
   * 打地鼠
   */
  whackMole() {
    let score = 0, timeLeft = 15, timer = null, molePos = -1;

    const render = () => {
      const grid = this.panel.el?.querySelector('#wm-grid');
      const info = this.panel.el?.querySelector('#wm-info');
      if (!grid || !info) return;
      grid.innerHTML = Array.from({ length: 9 }, (_, i) => {
        const isMole = i === molePos;
        return `<div class="wm-hole" data-idx="${i}" style="
          width:64px;height:64px;display:flex;align-items:center;justify-content:center;
          font-size:32px;border-radius:50%;cursor:pointer;user-select:none;
          background:${isMole ? '#8B4513' : '#ddd'};
          border:3px solid ${isMole ? '#A0522D' : '#ccc'};
          transition:all 0.15s;
          box-shadow:${isMole ? 'inset 0 4px 8px rgba(0,0,0,0.3)' : 'none'}
        ">${isMole ? '🐹' : '🕳️'}</div>`;
      }).join('');
      info.textContent = `得分: ${score} | 剩余: ${timeLeft}s`;
    };

    const spawnMole = () => {
      molePos = Math.floor(Math.random() * 9);
      render();
      setTimeout(() => {
        if (molePos >= 0) { molePos = -1; render(); }
      }, 800 + Math.random() * 400);
    };

    const startGame = () => {
      score = 0; timeLeft = 15; molePos = -1;
      clearInterval(timer);
      render();

      const spawnTimer = setInterval(() => {
        if (timeLeft > 0) spawnMole();
      }, 1000);

      timer = setInterval(() => {
        timeLeft--;
        render();
        if (timeLeft <= 0) {
          clearInterval(timer);
          clearInterval(spawnTimer);
          molePos = -1;
          render();
          this.panel.el.querySelector('#wm-info').textContent = `🎉 游戏结束！得分: ${score}`;
          this.panel.el.querySelector('#wm-info').style.color = '#27ae60';
          this.panel.el.querySelector('#wm-info').style.fontWeight = '600';
          this.panel.el.querySelector('#wm-actions').style.display = 'block';
        }
      }, 1000);
    };

    this._showGamePanel('🔨 打地鼠', `
      <div style="text-align:center">
        <div id="wm-grid" style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center;margin:12px 0"></div>
        <div id="wm-info" style="font-size:14px;color:#666;margin-top:8px"></div>
        <div id="wm-actions" style="display:none;margin-top:10px">
          <button class="game-btn" id="wm-restart" style="padding:8px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">再来一局</button>
        </div>
      </div>
    `);

    this.panel.el.querySelector('#wm-grid').onclick = (e) => {
      const hole = e.target.closest('.wm-hole');
      if (!hole || molePos < 0) return;
      const idx = parseInt(hole.dataset.idx);
      if (idx === molePos) {
        score += 10;
        molePos = -1;
        // 打中动画
        hole.style.transform = 'scale(0.85)';
        setTimeout(() => hole.style.transform = '', 150);
        render();
      }
    };

    this.panel.el.querySelector('#wm-restart').onclick = () => startGame();
    startGame();
  }

  /**
   * 抛硬币
   */
  coinFlip() {
    this._showGamePanel('🪙 抛硬币', `
      <div style="text-align:center;padding:10px 0">
        <div id="cf-result" style="font-size:64px;margin:20px 0;transition:transform 0.3s">🪙</div>
        <div id="cf-text" style="font-size:18px;font-weight:600;color:#666;margin-bottom:16px">点击抛硬币</div>
        <button class="game-btn" id="cf-flip" style="padding:12px 32px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;border:none;border-radius:12px;font-size:16px;cursor:pointer">抛！</button>
        <div id="cf-history" style="margin-top:12px;font-size:12px;color:#999"></div>
      </div>
    `);

    const history = [];
    this.panel.el.querySelector('#cf-flip').onclick = () => {
      const resultEl = this.panel.el.querySelector('#cf-result');
      const textEl = this.panel.el.querySelector('#cf-text');
      const histEl = this.panel.el.querySelector('#cf-history');

      // 翻转动画
      let count = 0;
      const flip = setInterval(() => {
        resultEl.style.transform = `rotateY(${count * 180}deg)`;
        resultEl.textContent = count % 2 === 0 ? '🟡' : '⚪';
        count++;
        if (count > 8) {
          clearInterval(flip);
          const isHead = Math.random() > 0.5;
          resultEl.textContent = isHead ? '🟡' : '⚪';
          resultEl.style.transform = '';
          textEl.textContent = isHead ? '正面！' : '反面！';
          textEl.style.color = isHead ? '#f39c12' : '#95a5a6';
          history.push(isHead ? '正' : '反');
          if (history.length > 10) history.shift();
          histEl.textContent = '历史: ' + history.join(' ');
        }
      }, 80);
    };
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
