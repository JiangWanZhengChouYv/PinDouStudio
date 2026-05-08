export class CanvasEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.pixels = [];
    this.palette = [];
    this.zoom = 1;
    this.pixelSize = 20;
    this.offsetX = 0;
    this.offsetY = 0;
    this.showGrid = true;
    this.gridColor = '#000000';
    this.showBorderNumbers = true;
    this.numberSize = 24;
    this.thumbnailCanvas = null;
    this.thumbnailCtx = null;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    this.isRendering = false;
    this.pendingRender = false;
    this.animationFrameId = null;
    this.eventListeners = {
      pixelChanged: [],
      canvasRendered: []
    };
  }

  init(canvasElement, width, height, palette = []) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.width = width;
    this.height = height;
    this.palette = palette || [];
    this.pixels = Array(height).fill(null).map(() => Array(width).fill(-1));
    if (this.showBorderNumbers === undefined) {
      this.showBorderNumbers = true;
    }
    if (!this.numberSize) {
      this.numberSize = 24;
    }
    this.initThumbnail();
    this.initEventListeners();
    this.saveState();
  }

  initThumbnail() {
    this.thumbnailCanvas = document.createElement('canvas');
    this.thumbnailCanvas.width = 64;
    this.thumbnailCanvas.height = 64;
    this.thumbnailCtx = this.thumbnailCanvas.getContext('2d');
  }

  initEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
  }

  handleMouseDown(e) {
    this.isDrawing = true;
  }

  handleMouseMove(e) {
    if (!this.isDrawing) return;
  }

  handleMouseUp() {
    this.isDrawing = false;
  }

  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  resize(width, height) {
    const oldPixels = this.pixels;
    this.width = width;
    this.height = height;
    this.pixels = Array(height).fill(null).map((_, y) =>
      Array(width).fill(null).map((_, x) =>
        oldPixels[y] && oldPixels[y][x] !== undefined ? oldPixels[y][x] : -1
      )
    );
    this.saveState();
    this.scheduleRender();
  }

  setPixel(x, y, color) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    let colorIndex = color;
    if (typeof color === 'string') {
      if (color === 'transparent' || color === 'rgba(0,0,0,0)') {
        colorIndex = -1;
      } else {
        colorIndex = this.palette.findIndex(c => c && c.hex === color);
        if (colorIndex === -1) {
          this.palette.push({ hex: color });
          colorIndex = this.palette.length - 1;
        }
      }
    }
    
    if (this.pixels[y][x] === colorIndex) return;
    this.pixels[y][x] = colorIndex;
    this.emit('pixelChanged', { x, y, colorIndex });
    this.scheduleRender();
  }

  getPixel(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
    return this.pixels[y][x];
  }

  clear() {
    this.pixels = Array(this.height).fill(null).map(() => Array(this.width).fill(-1));
    this.saveState();
    this.scheduleRender();
  }

  scheduleRender() {
    if (this.isRendering) {
      this.pendingRender = true;
      return;
    }
    this.isRendering = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(() => {
      this.performRender();
      this.isRendering = false;
      if (this.pendingRender) {
        this.pendingRender = false;
        this.scheduleRender();
      }
    });
  }

  performRender() {
    const { ctx, canvas, width, height, pixelSize, offsetX, offsetY, showGrid, showBorderNumbers, numberSize } = this;
    
    const labelArea = this.getLabelArea();
    const fontSize = Math.max(pixelSize * 0.5, 10);
    
    const scaledWidth = width * pixelSize + labelArea;
    const scaledHeight = height * pixelSize + labelArea;
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    canvas.style.width = scaledWidth + 'px';
    canvas.style.height = scaledHeight + 'px';
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(labelArea, labelArea);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = this.pixels[y][x];
        if (colorIndex !== -1 && this.palette[colorIndex]) {
          const color = this.palette[colorIndex];
          ctx.fillStyle = typeof color === 'object' ? color.hex : color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    
    if (showGrid) {
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, height * pixelSize);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(width * pixelSize, y * pixelSize);
        ctx.stroke();
      }
    }
    
    ctx.restore();
    
    if (showBorderNumbers) {
      ctx.fillStyle = '#666666';
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (let x = 0; x < width; x++) {
        const num = x + 1;
        const centerX = labelArea + x * pixelSize + pixelSize / 2;
        const centerY = labelArea / 2;
        ctx.fillText(num.toString(), centerX, centerY);
      }
      
      for (let y = 0; y < height; y++) {
        const num = y + 1;
        const centerX = labelArea / 2;
        const centerY = labelArea + y * pixelSize + pixelSize / 2;
        ctx.fillText(num.toString(), centerX, centerY);
      }
    }
    
    this.updateThumbnail();
    this.emit('canvasRendered');
  }

  render() {
    this.scheduleRender();
  }

  renderWithGrid() {
    this.showGrid = true;
    this.scheduleRender();
  }

  updateThumbnail() {
    const { thumbnailCtx, thumbnailCanvas, width, height } = this;
    const scale = 64 / Math.max(width, height);
    thumbnailCtx.fillStyle = '#ffffff';
    thumbnailCtx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = this.pixels[y][x];
        if (colorIndex !== -1 && this.palette[colorIndex]) {
          const color = this.palette[colorIndex];
          thumbnailCtx.fillStyle = typeof color === 'object' ? color.hex : color;
          thumbnailCtx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }

  getThumbnailData() {
    return this.thumbnailCanvas.toDataURL('image/png');
  }

  setZoom(level) {
    this.zoom = Math.max(0.1, Math.min(32, level));
    this.scheduleRender();
  }

  setOffset(x, y) {
    this.offsetX = x;
    this.offsetY = y;
    this.scheduleRender();
  }

  setPalette(palette) {
    this.palette = palette;
    this.scheduleRender();
  }

  setGridVisible(visible) {
    this.showGrid = visible;
    this.scheduleRender();
  }

  setGridColor(color) {
    this.gridColor = color;
    this.scheduleRender();
  }

  setBorderNumbersVisible(visible) {
    this.showBorderNumbers = visible !== false;
    this.scheduleRender();
  }

  setNumberSize(size) {
    this.numberSize = Math.max(12, Math.min(48, size));
    this.scheduleRender();
  }

  getImageData() {
    return this.pixels.map(row => [...row]);
  }

  setImageData(data) {
    this.pixels = data.map(row => [...row]);
    this.saveState();
    this.scheduleRender();
  }

  exportToCanvas(scale = 1, options = {}) {
    const { includeNumbers = true, includeGrid = false, includeNumberBorder = false } = options;
    
    const exportCanvas = document.createElement('canvas');
    const numberArea = includeNumbers ? (this.numberSize * scale) : 0;
    
    exportCanvas.width = this.width * scale + numberArea;
    exportCanvas.height = this.height * scale + numberArea;
    const exportCtx = exportCanvas.getContext('2d');
    
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    exportCtx.save();
    exportCtx.translate(numberArea, numberArea);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const colorIndex = this.pixels[y][x];
        if (colorIndex !== -1 && this.palette[colorIndex]) {
          const color = typeof this.palette[colorIndex] === 'object' 
            ? this.palette[colorIndex].hex 
            : this.palette[colorIndex];
          exportCtx.fillStyle = color;
          exportCtx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    
    if (includeGrid) {
      exportCtx.strokeStyle = '#cccccc';
      exportCtx.lineWidth = scale > 2 ? 1 : 0.5;
      for (let x = 0; x <= this.width; x++) {
        exportCtx.beginPath();
        exportCtx.moveTo(x * scale, 0);
        exportCtx.lineTo(x * scale, this.height * scale);
        exportCtx.stroke();
      }
      for (let y = 0; y <= this.height; y++) {
        exportCtx.beginPath();
        exportCtx.moveTo(0, y * scale);
        exportCtx.lineTo(this.width * scale, y * scale);
        exportCtx.stroke();
      }
    }
    
    exportCtx.restore();
    
    if (includeNumbers) {
      exportCtx.fillStyle = '#666666';
      const fontSize = this.numberSize * 0.7 * scale;
      exportCtx.font = `bold ${fontSize}px Arial, sans-serif`;
      exportCtx.textAlign = 'center';
      exportCtx.textBaseline = 'middle';
      
      for (let x = 0; x < this.width; x++) {
        const num = x + 1;
        const centerX = numberArea + x * scale + scale / 2;
        const centerY = numberArea / 2;
        exportCtx.fillText(num.toString(), centerX, centerY);
      }
      
      for (let y = 0; y < this.height; y++) {
        const num = y + 1;
        const centerX = numberArea / 2;
        const centerY = numberArea + y * scale + scale / 2;
        exportCtx.fillText(num.toString(), centerX, centerY);
      }
      
      if (includeNumberBorder) {
        exportCtx.strokeStyle = '#cccccc';
        exportCtx.lineWidth = 1;
        exportCtx.strokeRect(0, 0, numberArea, numberArea);
        exportCtx.strokeRect(0, 0, exportCanvas.width, numberArea);
        exportCtx.strokeRect(0, 0, numberArea, exportCanvas.height);
      }
    }
    
    return exportCanvas;
  }

  exportToImage(scale = 1) {
    const exportCanvas = this.exportToCanvas(scale);
    return exportCanvas.toDataURL('image/png');
  }

  drawPixel(x, y, colorIndex) {
    this.setPixel(x, y, colorIndex);
  }

  drawLine(x0, y0, x1, y1, colorIndex) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let currentX = x0;
    let currentY = y0;
    while (true) {
      this.setPixel(currentX, currentY, colorIndex);
      if (currentX === x1 && currentY === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
    }
  }

  drawRectangle(x, y, width, height, colorIndex, filled = false) {
    if (filled) {
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          this.setPixel(x + dx, y + dy, colorIndex);
        }
      }
    } else {
      this.drawLine(x, y, x + width - 1, y, colorIndex);
      this.drawLine(x, y + height - 1, x + width - 1, y + height - 1, colorIndex);
      this.drawLine(x, y, x, y + height - 1, colorIndex);
      this.drawLine(x + width - 1, y, x + width - 1, y + height - 1, colorIndex);
    }
  }

  floodFill(startX, startY, newColor) {
    if (startX < 0 || startX >= this.width || startY < 0 || startY >= this.height) return;
    
    let newColorIndex = newColor;
    if (typeof newColor === 'string') {
      newColorIndex = this.palette.findIndex(c => c && c.hex === newColor);
      if (newColorIndex === -1) {
        this.palette.push({ hex: newColor });
        newColorIndex = this.palette.length - 1;
      }
    }
    
    const targetColorIndex = this.pixels[startY][startX];
    if (targetColorIndex === newColorIndex) return;
    
    const stack = [[startX, startY]];
    const visited = new Set();
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
      if (this.pixels[y][x] !== targetColorIndex) continue;
      visited.add(key);
      this.pixels[y][x] = newColorIndex;
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
    this.saveState();
    this.scheduleRender();
    this.emit('pixelChanged', { type: 'floodFill', startX, startY, newColorIndex });
  }

  saveState() {
    const state = this.pixels.map(row => [...row]);
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(state);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.pixels = this.history[this.historyIndex].map(row => [...row]);
      this.scheduleRender();
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.pixels = this.history[this.historyIndex].map(row => [...row]);
      this.scheduleRender();
      return true;
    }
    return false;
  }

  canUndo() {
    return this.historyIndex > 0;
  }

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    this.saveState();
  }

  getCanvasPosition(localX, localY) {
    const labelArea = this.getLabelArea();
    
    let x = Math.floor((localX - labelArea) / this.pixelSize);
    let y = Math.floor((localY - labelArea) / this.pixelSize);
    x = Math.max(0, Math.min(x, this.width - 1));
    y = Math.max(0, Math.min(y, this.height - 1));
    return { x, y };
  }

  getLabelArea() {
    if (!this.showBorderNumbers) return 0;
    const maxNum = Math.max(this.width, this.height);
    const digitCount = maxNum.toString().length;
    const fontSize = Math.max(this.pixelSize * 0.5, 10);
    return Math.max(this.numberSize, digitCount * fontSize * 1.2);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.eventListeners = { pixelChanged: [], canvasRendered: [] };
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
  }

  zoomIn() {
    this.pixelSize = Math.min(80, this.pixelSize * 1.25);
    this.scheduleRender();
  }

  zoomOut() {
    this.pixelSize = Math.max(5, this.pixelSize / 1.25);
    this.scheduleRender();
  }

  getZoom() {
    return Math.round(this.pixelSize / 20 * 100);
  }

  getPixels() {
    return this.pixels.map(row => [...row]);
  }

  setPixelSize(size) {
    this.pixelSize = size;
    this.scheduleRender();
  }

  getColorByIndex(index) {
    if (index < 0 || index >= this.palette.length) return null;
    return this.palette[index];
  }
}

export default CanvasEngine;
export const canvasEngine = new CanvasEngine();
