export class CanvasEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.pixels = [];
    this.palette = [];
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.showGrid = true;
    this.gridColor = '#000000';
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
    this.palette = palette;
    this.pixels = Array(height).fill(null).map(() => Array(width).fill(-1));
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

  setPixel(x, y, colorIndex) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
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
    const { ctx, canvas, width, height, zoom, offsetX, offsetY, showGrid } = this;
    const scaledWidth = width * zoom;
    const scaledHeight = height * zoom;
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = this.pixels[y][x];
        if (colorIndex !== -1 && this.palette[colorIndex]) {
          ctx.fillStyle = this.palette[colorIndex];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = this.gridColor;
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y++) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
    ctx.restore();
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
          thumbnailCtx.fillStyle = this.palette[colorIndex];
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

  getImageData() {
    return this.pixels.map(row => [...row]);
  }

  setImageData(data) {
    this.pixels = data.map(row => [...row]);
    this.saveState();
    this.scheduleRender();
  }

  exportToImage(scale = 1) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.width * scale;
    exportCanvas.height = this.height * scale;
    const exportCtx = exportCanvas.getContext('2d');
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const colorIndex = this.pixels[y][x];
        if (colorIndex !== -1 && this.palette[colorIndex]) {
          exportCtx.fillStyle = this.palette[colorIndex];
          exportCtx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    return exportCanvas.toDataURL('image/png');
  }

  exportToCanvas(scale = 1) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.width * scale;
    exportCanvas.height = this.height * scale;
    const exportCtx = exportCanvas.getContext('2d');
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const colorIndex = this.pixels[y][x];
        if (colorIndex !== -1 && this.palette[colorIndex]) {
          exportCtx.fillStyle = this.palette[colorIndex];
          exportCtx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    return exportCanvas;
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

  floodFill(startX, startY, newColorIndex) {
    if (startX < 0 || startX >= this.width || startY < 0 || startY >= this.height) return;
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

  getCanvasPosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left - this.offsetX) / this.zoom);
    const y = Math.floor((clientY - rect.top - this.offsetY) / this.zoom);
    return { x, y };
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
}

export default CanvasEngine;
