/**
 * 写实宠物渲染器 - 用 CSS/SVG 绘制更真实的动物形象
 * 支持情绪表情变化、眨眼、耳朵动效
 */
class RealisticPetRenderer {
  constructor() {
    this.pets = {
      cat: { name: '🐱 猫咪', svg: this._catSVG },
      dog: { name: '🐶 狗狗', svg: this._dogSVG },
      rabbit: { name: '🐰 兔子', svg: this._rabbitSVG },
      hamster: { name: '🐹 仓鼠', svg: this._hamsterSVG },
      fox: { name: '🦊 狐狸', svg: this._foxSVG },
      panda: { name: '🐼 熊猫', svg: this._pandaSVG },
      penguin: { name: '🐧 企鹅', svg: this._penguinSVG },
      owl: { name: '🦉 猫头鹰', svg: this._owlSVG }
    };
  }

  /**
   * 获取宠物 SVG HTML
   * @param {string} type - 宠物类型
   * @param {string} mood - 情绪状态
   * @returns {string} SVG HTML
   */
  render(type, mood = 'neutral') {
    const pet = this.pets[type];
    if (!pet) return '';
    return pet.svg.call(this, mood);
  }

  /**
   * 获取所有宠物列表
   */
  getPetList() {
    return Object.entries(this.pets).map(([id, pet]) => ({ id, name: pet.name }));
  }

  /**
   * 创建宠物 DOM 元素
   */
  createPetElement(type, size = 100) {
    const wrapper = document.createElement('div');
    wrapper.className = 'realistic-pet';
    Object.assign(wrapper.style, {
      width: size + 'px',
      height: size + 'px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    });
    wrapper.innerHTML = this.render(type, 'neutral');
    return wrapper;
  }

  /**
   * 更新宠物情绪表情
   */
  updateMood(element, type, mood) {
    if (!element) return;
    element.innerHTML = this.render(type, mood);
  }

  // ========== SVG 绘制 ==========

  _catSVG(mood) {
    const eyes = this._getEyes(mood, 'cat');
    const mouth = this._getMouth(mood);
    const blush = (mood === 'happy' || mood === 'excited') ? '<circle cx="25" cy="58" r="6" fill="#FFB6C1" opacity="0.6"/><circle cx="75" cy="58" r="6" fill="#FFB6C1" opacity="0.6"/>' : '';
    const tailWag = mood === 'excited' || mood === 'happy';

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <!-- 身体 -->
      <ellipse cx="50" cy="65" rx="28" ry="25" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <!-- 肚子 -->
      <ellipse cx="50" cy="70" rx="18" ry="16" fill="#FAEBD7"/>
      <!-- 头 -->
      <circle cx="50" cy="38" r="24" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <!-- 左耳 -->
      <polygon points="30,20 22,2 42,16" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <polygon points="32,18 26,6 40,16" fill="#FFB6C1"/>
      <!-- 右耳 -->
      <polygon points="70,20 78,2 58,16" fill="#F4A460" stroke="#D2691E" stroke-width="1.5"/>
      <polygon points="68,18 74,6 60,16" fill="#FFB6C1"/>
      <!-- 眼睛 -->
      ${eyes}
      <!-- 鼻子 -->
      <ellipse cx="50" cy="44" rx="3" ry="2.5" fill="#FF69B4"/>
      <!-- 嘴巴 -->
      ${mouth}
      <!-- 胡须 -->
      <line x1="18" y1="42" x2="38" y2="44" stroke="#8B7355" stroke-width="0.8"/>
      <line x1="18" y1="48" x2="38" y2="48" stroke="#8B7355" stroke-width="0.8"/>
      <line x1="62" y1="44" x2="82" y2="42" stroke="#8B7355" stroke-width="0.8"/>
      <line x1="62" y1="48" x2="82" y2="48" stroke="#8B7355" stroke-width="0.8"/>
      ${blush}
      <!-- 前爪 -->
      <ellipse cx="35" cy="85" rx="8" ry="5" fill="#F4A460" stroke="#D2691E" stroke-width="1"/>
      <ellipse cx="65" cy="85" rx="8" ry="5" fill="#F4A460" stroke="#D2691E" stroke-width="1"/>
      <!-- 尾巴 -->
      <path d="M 78 65 Q 95 50 90 35" fill="none" stroke="#F4A460" stroke-width="4" stroke-linecap="round">
        ${tailWag ? '<animateTransform attributeName="transform" type="rotate" values="-5 78 65;5 78 65;-5 78 65" dur="0.5s" repeatCount="indefinite"/>' : ''}
      </path>
    </svg>`;
  }

  _dogSVG(mood) {
    const eyes = this._getEyes(mood, 'dog');
    const mouth = mood === 'happy' || mood === 'excited'
      ? '<path d="M 42 52 Q 50 60 58 52" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/><path d="M 48 54 L 50 58 L 52 54" fill="#FF6B81"/>'
      : '<path d="M 44 54 Q 50 58 56 54" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>';
    const tongue = (mood === 'happy' || mood === 'excited') ? '<ellipse cx="50" cy="60" rx="4" ry="6" fill="#FF6B81"/>' : '';
    const tailWag = mood !== 'sad' && mood !== 'sleepy';

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <!-- 身体 -->
      <ellipse cx="50" cy="65" rx="28" ry="25" fill="#C19A6B" stroke="#8B6914" stroke-width="1.5"/>
      <ellipse cx="50" cy="70" rx="18" ry="16" fill="#DEB887"/>
      <!-- 头 -->
      <circle cx="50" cy="38" r="24" fill="#C19A6B" stroke="#8B6914" stroke-width="1.5"/>
      <!-- 左耳（垂耳） -->
      <ellipse cx="28" cy="30" rx="10" ry="18" fill="#A0522D" transform="rotate(-15 28 30)"/>
      <!-- 右耳（垂耳） -->
      <ellipse cx="72" cy="30" rx="10" ry="18" fill="#A0522D" transform="rotate(15 72 30)"/>
      <!-- 脸部毛色 -->
      <ellipse cx="50" cy="42" rx="12" ry="10" fill="#DEB887"/>
      <!-- 眼睛 -->
      ${eyes}
      <!-- 鼻子 -->
      <ellipse cx="50" cy="46" rx="4" ry="3" fill="#333"/>
      <!-- 嘴巴 -->
      ${mouth}
      ${tongue}
      <!-- 前爪 -->
      <ellipse cx="35" cy="85" rx="9" ry="5" fill="#C19A6B" stroke="#8B6914" stroke-width="1"/>
      <ellipse cx="65" cy="85" rx="9" ry="5" fill="#C19A6B" stroke="#8B6914" stroke-width="1"/>
      <!-- 尾巴 -->
      <path d="M 78 60 Q 98 45 92 30" fill="none" stroke="#C19A6B" stroke-width="5" stroke-linecap="round">
        ${tailWag ? '<animateTransform attributeName="transform" type="rotate" values="-8 78 60;8 78 60;-8 78 60" dur="0.4s" repeatCount="indefinite"/>' : ''}
      </path>
    </svg>`;
  }

  _rabbitSVG(mood) {
    const eyes = this._getEyes(mood, 'rabbit');
    const blush = (mood === 'happy') ? '<circle cx="35" cy="52" r="5" fill="#FFB6C1" opacity="0.5"/><circle cx="65" cy="52" r="5" fill="#FFB6C1" opacity="0.5"/>' : '';

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="68" rx="24" ry="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5"/>
      <circle cx="50" cy="42" r="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5"/>
      <ellipse cx="38" cy="12" rx="7" ry="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5" transform="rotate(-8 38 12)"/>
      <ellipse cx="38" cy="12" rx="4" ry="18" fill="#FFB6C1" transform="rotate(-8 38 12)"/>
      <ellipse cx="62" cy="12" rx="7" ry="22" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5" transform="rotate(8 62 12)"/>
      <ellipse cx="62" cy="12" rx="4" ry="18" fill="#FFB6C1" transform="rotate(8 62 12)"/>
      ${eyes}
      <ellipse cx="50" cy="48" rx="3" ry="2" fill="#FFB6C1"/>
      <path d="M 47 50 Q 50 54 53 50" fill="none" stroke="#DDD" stroke-width="1"/>
      ${blush}
      <ellipse cx="36" cy="85" rx="8" ry="5" fill="#F5F5F5" stroke="#DDD" stroke-width="1"/>
      <ellipse cx="64" cy="85" rx="8" ry="5" fill="#F5F5F5" stroke="#DDD" stroke-width="1"/>
    </svg>`;
  }

  _hamsterSVG(mood) {
    const eyes = this._getEyes(mood, 'hamster');
    const cheekPuff = (mood === 'happy' || mood === 'excited') ? 8 : 6;

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="60" rx="32" ry="30" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1.5"/>
      <ellipse cx="50" cy="65" rx="22" ry="20" fill="#FFFACD"/>
      <circle cx="50" cy="38" r="22" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1.5"/>
      <circle cx="30" cy="26" r="7" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1"/>
      <circle cx="30" cy="26" r="4" fill="#FFB6C1"/>
      <circle cx="70" cy="26" r="7" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1"/>
      <circle cx="70" cy="26" r="4" fill="#FFB6C1"/>
      ${eyes}
      <ellipse cx="50" cy="44" rx="3" ry="2" fill="#FFB6C1"/>
      <path d="M 47 46 Q 50 49 53 46" fill="none" stroke="#D2B48C" stroke-width="1"/>
      <circle cx="28" cy="48" r="${cheekPuff}" fill="#FFB6C1" opacity="0.4"/>
      <circle cx="72" cy="48" r="${cheekPuff}" fill="#FFB6C1" opacity="0.4"/>
      <ellipse cx="38" cy="82" rx="7" ry="4" fill="#F5DEB3"/>
      <ellipse cx="62" cy="82" rx="7" ry="4" fill="#F5DEB3"/>
    </svg>`;
  }

  _foxSVG(mood) {
    const eyes = this._getEyes(mood, 'fox');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="65" rx="26" ry="24" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <ellipse cx="50" cy="70" rx="16" ry="14" fill="#FFF8DC"/>
      <circle cx="50" cy="38" r="22" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <polygon points="32,22 20,0 42,16" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <polygon points="34,20 24,4 40,16" fill="#FFF8DC"/>
      <polygon points="68,22 80,0 58,16" fill="#FF8C00" stroke="#E65100" stroke-width="1.5"/>
      <polygon points="66,20 76,4 60,16" fill="#FFF8DC"/>
      <ellipse cx="50" cy="42" rx="10" ry="8" fill="#FFF8DC"/>
      ${eyes}
      <ellipse cx="50" cy="46" rx="3" ry="2" fill="#333"/>
      <path d="M 47 48 Q 50 51 53 48" fill="none" stroke="#333" stroke-width="1"/>
      <ellipse cx="36" cy="85" rx="7" ry="4" fill="#FF8C00"/>
      <ellipse cx="64" cy="85" rx="7" ry="4" fill="#FF8C00"/>
      <path d="M 76 62 Q 96 48 90 30" fill="none" stroke="#FF8C00" stroke-width="5" stroke-linecap="round"/>
      <path d="M 84 36 Q 90 32 90 30" fill="none" stroke="#FFF8DC" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  _pandaSVG(mood) {
    const eyes = this._getEyes(mood, 'panda');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="65" rx="28" ry="25" fill="#F5F5F5" stroke="#333" stroke-width="1.5"/>
      <circle cx="50" cy="38" r="24" fill="#F5F5F5" stroke="#333" stroke-width="1.5"/>
      <circle cx="32" cy="22" r="10" fill="#333"/>
      <circle cx="68" cy="22" r="10" fill="#333"/>
      <ellipse cx="38" cy="40" rx="10" ry="8" fill="#333"/>
      <ellipse cx="62" cy="40" rx="10" ry="8" fill="#333"/>
      <circle cx="38" cy="40" r="4" fill="#F5F5F5"/>
      <circle cx="62" cy="40" r="4" fill="#F5F5F5"/>
      <circle cx="39" cy="40" r="2" fill="#333"/>
      <circle cx="63" cy="40" r="2" fill="#333"/>
      <ellipse cx="50" cy="48" rx="4" ry="3" fill="#333"/>
      <path d="M 46 51 Q 50 55 54 51" fill="none" stroke="#333" stroke-width="1.2"/>
      <ellipse cx="35" cy="85" rx="10" ry="6" fill="#333"/>
      <ellipse cx="65" cy="85" rx="10" ry="6" fill="#333"/>
    </svg>`;
  }

  _penguinSVG(mood) {
    const eyes = this._getEyes(mood, 'penguin');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="55" rx="28" ry="35" fill="#2C3E50"/>
      <ellipse cx="50" cy="58" rx="20" ry="28" fill="#ECF0F1"/>
      <circle cx="50" cy="30" r="20" fill="#2C3E50"/>
      <ellipse cx="50" cy="34" rx="14" ry="12" fill="#ECF0F1"/>
      ${eyes}
      <polygon points="46,38 50,44 54,38" fill="#F39C12"/>
      <ellipse cx="28" cy="55" rx="5" ry="15" fill="#2C3E50" transform="rotate(-10 28 55)"/>
      <ellipse cx="72" cy="55" rx="5" ry="15" fill="#2C3E50" transform="rotate(10 72 55)"/>
      <ellipse cx="40" cy="88" rx="8" ry="4" fill="#F39C12"/>
      <ellipse cx="60" cy="88" rx="8" ry="4" fill="#F39C12"/>
    </svg>`;
  }

  _owlSVG(mood) {
    const eyes = this._getEyes(mood, 'owl');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <ellipse cx="50" cy="60" rx="26" ry="30" fill="#8B6914"/>
      <ellipse cx="50" cy="65" rx="18" ry="20" fill="#DEB887"/>
      <circle cx="50" cy="35" r="22" fill="#8B6914"/>
      <polygon points="32,18 24,4 40,14" fill="#A0522D"/>
      <polygon points="68,18 76,4 60,14" fill="#A0522D"/>
      <circle cx="38" cy="34" r="10" fill="#FFF8DC" stroke="#8B6914" stroke-width="1.5"/>
      <circle cx="62" cy="34" r="10" fill="#FFF8DC" stroke="#8B6914" stroke-width="1.5"/>
      <circle cx="39" cy="34" r="5" fill="#333"/>
      <circle cx="63" cy="34" r="5" fill="#333"/>
      <circle cx="40" cy="33" r="2" fill="#FFF"/>
      <circle cx="64" cy="33" r="2" fill="#FFF"/>
      <polygon points="48,42 50,48 52,42" fill="#F39C12"/>
      <ellipse cx="36" cy="85" rx="7" ry="4" fill="#F39C12"/>
      <ellipse cx="64" cy="85" rx="7" ry="4" fill="#F39C12"/>
    </svg>`;
  }

  // ========== 表情系统 ==========

  _getEyes(mood, type) {
    const eyeColor = type === 'panda' ? '#FFF' : '#333';
    const pupilSize = type === 'owl' ? 3 : 2.5;

    switch (mood) {
      case 'happy':
      case 'excited':
        return `<path d="M 35 36 Q 40 32 45 36" fill="none" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M 55 36 Q 60 32 65 36" fill="none" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round"/>`;
      case 'sleepy':
        return `<line x1="35" y1="36" x2="45" y2="36" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round"/>
                <line x1="55" y1="36" x2="65" y2="36" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round"/>`;
      case 'sad':
        return `<circle cx="40" cy="35" r="4" fill="${eyeColor}"/><circle cx="41" cy="34" r="1.5" fill="#FFF"/>
                <circle cx="60" cy="35" r="4" fill="${eyeColor}"/><circle cx="61" cy="34" r="1.5" fill="#FFF"/>
                <path d="M 34 30 Q 40 28 46 30" fill="none" stroke="${eyeColor}" stroke-width="1.5"/>
                <path d="M 54 30 Q 60 28 66 30" fill="none" stroke="${eyeColor}" stroke-width="1.5"/>`;
      case 'curious':
        return `<circle cx="40" cy="35" r="5" fill="${eyeColor}"/><circle cx="41" cy="34" r="2" fill="#FFF"/>
                <circle cx="60" cy="35" r="5" fill="${eyeColor}"/><circle cx="61" cy="34" r="2" fill="#FFF"/>`;
      case 'angry':
        return `<circle cx="40" cy="36" r="3.5" fill="${eyeColor}"/>
                <circle cx="60" cy="36" r="3.5" fill="${eyeColor}"/>
                <path d="M 34 30 L 46 33" fill="none" stroke="${eyeColor}" stroke-width="2"/>
                <path d="M 66 30 L 54 33" fill="none" stroke="${eyeColor}" stroke-width="2"/>`;
      default: // neutral
        return `<circle cx="40" cy="35" r="4" fill="${eyeColor}"/><circle cx="41" cy="34" r="${pupilSize}" fill="#FFF"/>
                <circle cx="60" cy="35" r="4" fill="${eyeColor}"/><circle cx="61" cy="34" r="${pupilSize}" fill="#FFF"/>`;
    }
  }

  _getMouth(mood) {
    switch (mood) {
      case 'happy':
      case 'excited':
        return '<path d="M 44 50 Q 50 56 56 50" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>';
      case 'sad':
        return '<path d="M 44 54 Q 50 48 56 54" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>';
      case 'sleepy':
        return '<ellipse cx="50" cy="52" rx="3" ry="2" fill="#333"/>';
      default:
        return '<path d="M 46 52 Q 50 54 54 52" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round"/>';
    }
  }
}
