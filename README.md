# Web 悬浮桌面宠物 🐱

原生 HTML + CSS + JS 实现的轻量悬浮桌面宠物，支持挂件版与浏览器插件版。

## 两种形态

| 形态 | 用途 | 部署方式 |
|------|------|----------|
| **挂件版** | 嵌入任意网页 | 引入一行 `<script>` 即可 |
| **插件版** | 浏览器全局常驻 | 安装 Chrome 扩展 |

## 功能

- 🖱️ 自由拖动、边缘吸附、物理回弹
- 🎬 帧动画状态机（idle/clicked/dragged/happy/walk/idle_action）
- 💬 对话气泡 + 语录池
- 🎨 自定义皮肤系统
- ⏰ 整点报时、定时提醒
- 📝 快捷便签
- 🔌 插件化互动机制
- 💾 localStorage 持久化

## 快速开始

### 挂件版
```html
<script src="web-pet.min.js"></script>
```

### 开发模式
```bash
# 直接打开 index.html 即可
open index.html
```

### 插件版
1. 打开 `chrome://extensions`
2. 开启开发者模式
3. 加载已解压的扩展程序 → 选择 `extension/` 目录

## 皮肤包格式

```
my_skin/
├── config.json
└── frames/
    ├── idle_01.png
    ├── idle_02.png
    └── ...
```

## 目录结构

```
web-pet/
├── index.html              # 挂件版入口 + 演示页
├── src/
│   ├── core/
│   │   ├── container.js    # 悬浮容器
│   │   ├── animator.js     # 帧动画播放器
│   │   └── state-machine.js # 状态机
│   ├── interaction/
│   │   ├── mouse.js        # 鼠标交互
│   │   └── plugin-system.js # 插件机制
│   ├── bubble/
│   │   └── bubble.js       # 对话气泡
│   ├── skins/
│   │   └── skin-manager.js # 皮肤管理
│   ├── tools/
│   │   ├── reminder.js     # 定时提醒
│   │   ├── hourly.js       # 整点报时
│   │   └── notepad.js      # 便签
│   ├── ui/
│   │   ├── settings.js     # 设置面板
│   │   └── context-menu.js # 右键菜单
│   └── app.js              # 主入口
├── skins/                  # 皮肤资源
│   ├── default_cat/
│   └── blue_bird/
└── extension/              # Chrome 插件版
    ├── manifest.json
    ├── background.js
    └── content.js
```
