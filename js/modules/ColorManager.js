import { perlerColors } from '../data/perler-colors.js';
import { artkalColors } from '../data/artkal-colors.js';

class ColorManager {
  constructor() {
    this.palette = [];
    this.recentColors = [];
    this.maxRecentColors = 20;
    this.listeners = {
      paletteChanged: [],
      recentColorsChanged: []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  getAllBrands() {
    return [
      { id: 'perler', name: 'Perler', colors: perlerColors.colors || [] },
      { id: 'artkal', name: 'Artkal', colors: artkalColors.colors || [] }
    ];
  }

  getColorsByBrand(brand) {
    const brandLower = brand.toLowerCase();
    if (brandLower === 'perler') {
      return perlerColors.colors || [];
    } else if (brandLower === 'artkal') {
      return artkalColors.colors || [];
    }
    return [];
  }

  searchByCode(brand, code) {
    const colors = this.getColorsByBrand(brand);
    const codeUpper = code.toUpperCase();
    return colors.filter(color => color.code && color.code.toUpperCase() === codeUpper);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      };
    }
    return null;
  }

  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  colorDistance(c1, c2) {
    const rMean = (c1.r + c2.r) / 2;
    const rDiff = c1.r - c2.r;
    const gDiff = c1.g - c2.g;
    const bDiff = c1.b - c2.b;

    return Math.sqrt(
      (2 + rMean / 256) * rDiff * rDiff +
      4 * gDiff * gDiff +
      (2 + (255 - rMean) / 256) * bDiff * bDiff
    );
  }

  findClosestBrandColor(rgb, brand) {
    const colors = this.getColorsByBrand(brand);
    let closest = null;
    let minDistance = Infinity;

    colors.forEach(color => {
      const colorRgb = this.hexToRgb(color.hex);
      if (colorRgb) {
        const distance = this.colorDistance(rgb, colorRgb);
        if (distance < minDistance) {
          minDistance = distance;
          closest = { ...color, distance };
        }
      }
    });

    return closest;
  }

  getAllClosestColors(rgb) {
    const brands = this.getAllBrands();
    const results = [];

    brands.forEach(brand => {
      const closest = this.findClosestBrandColor(rgb, brand.id);
      if (closest) {
        results.push({
          brand: brand.id,
          brandName: brand.name,
          ...closest
        });
      }
    });

    return results.sort((a, b) => a.distance - b.distance);
  }

  getPalette() {
    return [...this.palette];
  }

  addToPalette(color) {
    const colorHex = typeof color === 'string' ? color : this.rgbToHex(color.r, color.g, color.b);
    const colorRgb = this.hexToRgb(colorHex);

    if (!colorRgb) {
      return false;
    }

    const exists = this.palette.some(c => {
      const existingRgb = typeof c === 'string' ? this.hexToRgb(c) : c;
      return existingRgb &&
        existingRgb.r === colorRgb.r &&
        existingRgb.g === colorRgb.g &&
        existingRgb.b === colorRgb.b;
    });

    if (!exists) {
      this.palette.push({ hex: colorHex, rgb: colorRgb });
      this.emit('paletteChanged', this.getPalette());
      return true;
    }
    return false;
  }

  removeFromPalette(index) {
    if (index >= 0 && index < this.palette.length) {
      this.palette.splice(index, 1);
      this.emit('paletteChanged', this.getPalette());
      return true;
    }
    return false;
  }

  clearPalette() {
    this.palette = [];
    this.emit('paletteChanged', this.getPalette());
  }

  getRecentColors() {
    return [...this.recentColors];
  }

  addRecentColor(color) {
    const colorHex = typeof color === 'string' ? color : this.rgbToHex(color.r, color.g, color.b);
    const colorRgb = this.hexToRgb(colorHex);

    if (!colorRgb) {
      return false;
    }

    this.recentColors = this.recentColors.filter(c => {
      const existingRgb = typeof c === 'string' ? this.hexToRgb(c) : c;
      return existingRgb &&
        (existingRgb.r !== colorRgb.r ||
         existingRgb.g !== colorRgb.g ||
         existingRgb.b !== colorRgb.b);
    });

    this.recentColors.unshift({ hex: colorHex, rgb: colorRgb });

    if (this.recentColors.length > this.maxRecentColors) {
      this.recentColors = this.recentColors.slice(0, this.maxRecentColors);
    }

    this.emit('recentColorsChanged', this.getRecentColors());
    return true;
  }
}

export const colorManager = new ColorManager();
export default colorManager;
