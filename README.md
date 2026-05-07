# 拼豆工坊 - PinDou Studio

一款专业级的像素拼豆（Perler Beads / Artkal Beads）设计工具 Web 应用。

![拼豆工坊](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-ff69b4)

## ✨ 功能特点

### 🎨 画布编辑
- **可调节画布尺寸**：支持 8×8 到 128×128 像素的自定义尺寸
- **专业绘图工具**：画笔、橡皮擦、填充桶、取色器
- **网格辅助**：可显示/隐藏网格线，精准对齐
- **缩放平移**：支持画布缩放和拖拽查看

### 🌈 颜色管理
- **多品牌色库**：内置 Perler（154+色）和 Artkal（120+色，含荧光色）品牌色库
- **智能颜色匹配**：自动查找最接近的品牌色
- **多种颜色输入**：支持品牌色码搜索、HEX值、RGB值
- **自定义调色板**：添加和管理项目专属颜色

### 📦 项目管理
- **项目管理**：创建、重命名、复制、删除项目
- **本地存储**：自动保存到浏览器 localStorage
- **项目预览**：缩略图快速识别

### 📤 导出功能
- **PNG 导出**：高分辨率 PNG 图片
- **PDF 导出**：包含网格线和色号标注的专业图纸
- **灵活配置**：可选择导出选项（缩放、网格、标注）

### 🎯 用户体验
- **响应式设计**：完美适配桌面、平板、手机
- **深色/浅色模式**：支持主题切换
- **快捷键支持**：P（画笔）、E（橡皮）、F（填充）、I（取色）
- **撤销/重做**：支持 50+ 步历史操作

## 🚀 快速开始

### 在线使用
直接在浏览器中打开 `index.html` 文件即可使用。

### 本地开发
1. 克隆或下载项目
2. 使用本地服务器运行（推荐）：
   ```bash
   # 使用 Python
   python -m http.server 8000
   
   # 或使用 Node.js
   npx serve .
   ```
3. 打开浏览器访问 `http://localhost:8000`

## 📁 项目结构

```
PinDouStudio/
├── index.html                 # 主入口文件
├── css/
│   ├── main.css              # 全局样式和工具类
│   ├── theme.css             # 主题变量（深色/浅色）
│   ├── components.css         # 通用组件样式
│   └── pages/
│       ├── home.css         # 首页样式
│       ├── editor.css       # 编辑器样式
│       └── settings.css     # 设置页面样式
├── js/
│   ├── app.js               # 应用主入口和路由
│   ├── modules/
│   │   ├── CanvasEngine.js     # 画布引擎
│   │   ├── ColorManager.js     # 颜色管理
│   │   ├── ExportManager.js    # 导出管理
│   │   ├── ProjectManager.js   # 项目管理
│   │   ├── ThemeManager.js    # 主题管理
│   │   └── ToolManager.js     # 工具管理
│   ├── data/
│   │   ├── perler-colors.js   # Perler 色库
│   │   └── artkal-colors.js   # Artkal 色库
│   └── utils/
│       └── storage.js          # 存储工具
└── assets/
    └── icons/                 # 图标资源
```

## 🎮 使用指南

### 创建项目
1. 点击首页的"创建项目"按钮
2. 输入项目名称
3. 设置画布尺寸（宽度和高度 8-128）
4. 或选择预设尺寸快速创建

### 编辑画布
1. 选择绘图工具（画笔/橡皮/填充/取色）
2. 从右侧调色盘选择颜色
3. 在画布上点击或拖拽进行绘制
4. 使用撤销/重做按钮或快捷键

### 颜色选择
1. 切换品牌标签（Artkal/Perler）
2. 通过搜索框搜索色码或颜色名称
3. 或使用 HEX/RGB 输入自定义颜色
4. 点击"添加到调色板"保存到项目

### 导出项目
1. 点击顶部工具栏的"导出"按钮
2. 选择导出格式（PNG/PDF）
3. 配置导出选项
4. 点击导出下载文件

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| P | 画笔工具 |
| E | 橡皮擦工具 |
| F | 填充桶工具 |
| I | 取色器工具 |
| Ctrl + Z | 撤销 |
| Ctrl + Y / Ctrl + Shift + Z | 重做 |
| Ctrl + S | 保存项目 |
| + / - | 放大/缩小 |

## 🛠️ 技术栈

- **HTML5 + CSS3 + JavaScript (ES6+)**
- **HTML5 Canvas API**：像素画布渲染
- **CSS Grid & Flexbox**：响应式布局
- **CSS Variables**：主题系统
- **localStorage**：数据持久化
- **jsPDF**：PDF 文件生成

## 🎨 设计规范

### 配色方案

#### 浅色模式
- 主色：#6366F1（靛蓝紫）
- 次要色：#8B5CF6（紫色）
- 强调色：#F472B6（粉色）
- 背景色：#FAFAFA
- 文字主色：#1F2937

#### 深色模式
- 主色：#818CF8（浅靛蓝紫）
- 次要色：#A78BFA（浅紫色）
- 强调色：#F472B6（粉色）
- 背景色：#111827
- 文字主色：#F9FAFB

### 字体
- 主标题：ZCOOL KuaiLe（站酷快乐体）
- 正文：Noto Sans SC（思源黑体）
- 代码/色号：JetBrains Mono

## 📱 浏览器兼容

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

- 感谢 Perler 和 Artkal 提供颜色参考
- 使用 [jsPDF](https://github.com/MrRio/jsPDF) 生成 PDF
- 使用 Google Fonts 提供字体支持

---

**拼豆工坊** - 让拼豆设计更简单！🎨✨
