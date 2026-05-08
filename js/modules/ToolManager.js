export const TOOLS = {
  PENCIL: 'pencil',
  ERASER: 'eraser',
  FILL: 'fill',
  PICKER: 'picker'
};

export class ToolManager {
  constructor() {
    this.currentTool = TOOLS.PENCIL;
    this.canvasEngine = null;
    this.settings = {
      pencil: { size: 1, color: null },
      eraser: { size: 1 },
      fill: { color: null },
      picker: {}
    };
    this.listeners = {};
    this.currentColor = null;
    this.init();
  }

  init() {
    this.setupKeyboardShortcuts();
  }

  setCanvasEngine(canvasEngine) {
    this.canvasEngine = canvasEngine;
  }

  selectTool(toolName) {
    if (!TOOLS[Object.keys(TOOLS).find(key => TOOLS[key] === toolName)]) {
      console.warn(`Invalid tool: ${toolName}`);
      return false;
    }

    const previousTool = this.currentTool;
    this.currentTool = toolName;
    
    if (previousTool !== toolName) {
      this.emit('toolChanged', {
        previousTool,
        currentTool: toolName
      });
    }
    
    return true;
  }

  getCurrentTool() {
    return this.currentTool;
  }

  getToolSettings() {
    return { ...this.settings[this.currentTool] };
  }

  setToolSettings(settings) {
    if (!this.settings[this.currentTool]) {
      this.settings[this.currentTool] = {};
    }
    Object.assign(this.settings[this.currentTool], settings);
  }

  executeTool(x, y) {
    switch (this.currentTool) {
      case TOOLS.PENCIL:
        this.executePencil(x, y);
        break;
      case TOOLS.ERASER:
        this.executeEraser(x, y);
        break;
      case TOOLS.FILL:
        this.executeFill(x, y);
        break;
      case TOOLS.PICKER:
        this.executePicker(x, y);
        break;
    }
  }

  executePencil(x, y) {
    if (!this.canvasEngine) return;
    const color = this.settings.pencil.color || this.currentColor;
    if (color) {
      this.canvasEngine.setPixel(x, y, color);
    }
  }

  executeEraser(x, y) {
    if (!this.canvasEngine) return;
    this.canvasEngine.setPixel(x, y, -1);
  }

  executeFill(x, y) {
    if (!this.canvasEngine) return;
    const color = this.settings.fill.color || this.currentColor;
    if (color) {
      this.canvasEngine.floodFill(x, y, color);
    }
  }

  executePicker(x, y) {
    if (!this.canvasEngine) return;
    const colorIndex = this.canvasEngine.getPixel(x, y);
    const color = this.canvasEngine.getColorByIndex ? this.canvasEngine.getColorByIndex(colorIndex) : colorIndex;
    this.emit('colorPicked', { color, colorIndex, x, y });
  }

  setCurrentColor(color) {
    if (!color) return;
    if (typeof color === 'object') {
      this.currentColor = color.hex || '#000000';
      this.settings.pencil.color = this.currentColor;
      this.settings.fill.color = this.currentColor;
    } else {
      this.currentColor = color;
      this.settings.pencil.color = color;
      this.settings.fill.color = color;
    }
  }

  getCurrentColor() {
    return this.currentColor;
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'p':
          this.selectTool(TOOLS.PENCIL);
          break;
        case 'e':
          this.selectTool(TOOLS.ERASER);
          break;
        case 'f':
          this.selectTool(TOOLS.FILL);
          break;
        case 'i':
          this.selectTool(TOOLS.PICKER);
          break;
      }
    });
  }
}

export const toolManager = new ToolManager();
