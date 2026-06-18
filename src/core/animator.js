/**
 * 帧动画播放器 - PNG序列帧播放，支持GIF
 */
class PetAnimator {
  constructor(container) {
    this.container = container;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'auto'
    });
    // 默认CSS宠物（无图片时显示）
    this._defaultPet = document.createElement('div');
    Object.assign(this._defaultPet.style, {
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '64px', lineHeight: '1', userSelect: 'none',
      position: 'absolute', top: '0', left: '0'
    });
    this._defaultPet.textContent = '🐱';
    this.el.appendChild(this._defaultPet);
    this._hasCustomImage = false;
    container.el.appendChild(this.el);

    this.frames = [];
    this.frameIndex = 0;
    this.fps = 15;
    this.isGif = false;
    this.isPaused = false;
    this._timer = null;
    this._imgCache = [];
  }

  /**
   * 加载帧动画
   * @param {Array<string>} frameUrls - 帧图片URL数组
   * @param {number} fps - 帧率
   * @param {boolean} loop - 是否循环
   */
  loadFrames(frameUrls, fps = 15, loop = true) {
    this.stop();
    this.frames = frameUrls;
    this.fps = fps;
    this.loop = loop;
    this.frameIndex = 0;
    this.isGif = false;

    if (frameUrls.length === 0) return;

    // 检查是否为GIF
    if (frameUrls.length === 1 && frameUrls[0].toLowerCase().endsWith('.gif')) {
      this.isGif = true;
      this.el.style.backgroundImage = `url(${frameUrls[0]})`;
      return;
    }

    // 预加载帧
    this._imgCache = [];
    let loaded = 0;
    frameUrls.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        this._imgCache[i] = img;
        if (loaded === frameUrls.length) {
          this._showFrame(0);
          this.play();
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded === frameUrls.length && this._imgCache.length > 0) {
          this._showFrame(0);
          this.play();
        }
      };
      img.src = url;
    });
  }

  /**
   * 加载单张静态图
   */
  loadStatic(imageUrl) {
    this.stop();
    this.frames = [imageUrl];
    this.isGif = false;
    this.el.style.backgroundImage = `url(${imageUrl})`;
    this.el.style.backgroundSize = 'contain';
  }

  play() {
    if (this.isGif || this.frames.length <= 1) return;
    this.isPaused = false;
    this._startTimer();
  }

  pause() {
    this.isPaused = true;
    this._stopTimer();
  }

  stop() {
    this.isPaused = true;
    this._stopTimer();
    this.frameIndex = 0;
  }

  _startTimer() {
    this._stopTimer();
    const interval = Math.max(16, Math.round(1000 / this.fps));
    this._timer = setInterval(() => {
      if (this.isPaused) return;
      this.frameIndex++;
      if (this.frameIndex >= this.frames.length) {
        if (this.loop) {
          this.frameIndex = 0;
        } else {
          this._stopTimer();
          if (this.onFinish) this.onFinish();
          return;
        }
      }
      this._showFrame(this.frameIndex);
    }, interval);
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _showFrame(index) {
    const img = this._imgCache[index];
    if (img) {
      this._hasCustomImage = true;
      this._defaultPet.style.display = 'none';
      this.el.style.backgroundImage = `url(${img.src})`;
      this.el.style.backgroundSize = 'contain';
      this.el.style.backgroundPosition = 'center';
      this.el.style.backgroundRepeat = 'no-repeat';
    }
  }

  /**
   * 设置默认emoji宠物
   */
  setDefaultEmoji(emoji) {
    this._defaultPet.textContent = emoji || '🐱';
  }

  /**
   * 显示默认宠物（无自定义图片时）
   */
  showDefault() {
    this._hasCustomImage = false;
    this._defaultPet.style.display = 'flex';
    this.el.style.backgroundImage = 'none';
  }

  /**
   * 通过CSS sprite方式播放（适用于sprite sheet）
   */
  loadSpriteSheet(spriteUrl, frameWidth, frameHeight, totalFrames, fps = 15) {
    this.stop();
    this.fps = fps;
    this.frameIndex = 0;
    this.loop = true;

    const img = new Image();
    img.onload = () => {
      this.el.style.backgroundImage = `url(${spriteUrl})`;
      this.el.style.backgroundSize = `${frameWidth * totalFrames}px ${frameHeight}px`;
      this._spriteFrameWidth = frameWidth;
      this._spriteTotalFrames = totalFrames;
      this.play();
    };
    img.src = spriteUrl;

    this._showSpriteFrame = (index) => {
      const offset = -index * this._spriteFrameWidth;
      this.el.style.backgroundPosition = `${offset}px 0`;
    };

    // Override _showFrame for sprite mode
    this._showFrame = this._showSpriteFrame || this._showFrame;
  }

  destroy() {
    this.stop();
    this.el?.remove();
  }
}
