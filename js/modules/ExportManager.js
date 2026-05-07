export const EXPORT_OPTIONS = {
  format: 'png',
  scale: 1,
  showGrid: true,
  showLabels: true,
  labelFontSize: 12,
  includeBrandCode: true,
  gridColor: '#000000',
  gridSize: 1,
  pageSize: 'a4',
  margin: 20
};

class ExportManager {
  constructor() {
    this.defaultOptions = { ...EXPORT_OPTIONS };
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  generateFilename(format, projectName = 'project') {
    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `${sanitizedName}_${timestamp}.${format}`;
  }

  renderWithGrid(canvasEngine, scale, gridSize = 1, gridColor = '#000000') {
    const exportCanvas = canvasEngine.exportToCanvas(scale);
    const ctx = exportCanvas.getContext('2d');

    if (gridSize > 0) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = Math.max(1, scale * 0.5);

      for (let x = 0; x <= canvasEngine.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, canvasEngine.height * scale);
        ctx.stroke();
      }

      for (let y = 0; y <= canvasEngine.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(canvasEngine.width * scale, y * scale);
        ctx.stroke();
      }
    }

    return exportCanvas;
  }

  renderColorLabels(ctx, canvasEngine, colorManager, options) {
    const usedColors = this.getUsedColors(canvasEngine);
    if (usedColors.length === 0) return;

    const fontSize = options.labelFontSize || 12;
    const padding = 5;
    const labelHeight = fontSize + padding * 2;
    const colorBoxSize = fontSize;
    const maxLabelWidth = 200;
    let currentY = 10;

    ctx.font = `${fontSize}px Arial, sans-serif`;

    usedColors.forEach((colorInfo) => {
      if (currentY + labelHeight > ctx.canvas.height) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, currentY, maxLabelWidth + 10, labelHeight);

      ctx.fillStyle = colorInfo.hex;
      ctx.fillRect(10, currentY + padding, colorBoxSize, colorBoxSize);

      ctx.strokeStyle = '#000000';
      ctx.strokeRect(10, currentY + padding, colorBoxSize, colorBoxSize);

      ctx.fillStyle = '#000000';
      let labelText = '';
      if (options.includeBrandCode && colorInfo.brand && colorInfo.code) {
        labelText = `${colorInfo.brand.toUpperCase()} ${colorInfo.code}`;
      } else if (colorInfo.code) {
        labelText = colorInfo.code;
      }
      if (colorInfo.name && options.includeBrandCode) {
        labelText += ` - ${colorInfo.name}`;
      } else if (colorInfo.name) {
        labelText = colorInfo.name;
      }

      if (labelText) {
        ctx.fillText(labelText, 10 + colorBoxSize + padding, currentY + padding + fontSize);
      }

      currentY += labelHeight + 5;
    });
  }

  getUsedColors(canvasEngine) {
    const usedColorIndices = new Set();
    const width = canvasEngine.width;
    const height = canvasEngine.height;
    const pixels = canvasEngine.pixels;
    const palette = canvasEngine.palette;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = pixels[y][x];
        if (colorIndex !== -1) {
          usedColorIndices.add(colorIndex);
        }
      }
    }

    const usedColors = [];
    const processedHex = new Set();

    usedColorIndices.forEach(colorIndex => {
      const hex = palette[colorIndex];
      if (hex && !processedHex.has(hex)) {
        processedHex.add(hex);
        const colorInfo = this.findColorInfo(hex);
        usedColors.push({
          hex,
          ...colorInfo
        });
      }
    });

    return usedColors;
  }

  findColorInfo(hex) {
    const brands = [
      { id: 'perler', name: 'Perler' },
      { id: 'artkal', name: 'Artkal' }
    ];

    for (const brand of brands) {
      try {
        const colors = this.getColorsByBrand(brand.id);
        const color = colors.find(c => c.hex.toLowerCase() === hex.toLowerCase());
        if (color) {
          return {
            code: color.code,
            name: color.name,
            brand: brand.id,
            brandName: brand.name
          };
        }
      } catch (e) {
        continue;
      }
    }

    return { code: '', name: '', brand: '', brandName: '' };
  }

  getColorsByBrand(brand) {
    if (brand === 'perler') {
      return this.getPerlerColors();
    } else if (brand === 'artkal') {
      return this.getArtkalColors();
    }
    return [];
  }

  getPerlerColors() {
    try {
      const { perlerColors } = require('../data/perler-colors.js');
      return perlerColors || [];
    } catch (e) {
      return [];
    }
  }

  getArtkalColors() {
    try {
      const { artkalColors } = require('../data/artkal-colors.js');
      return artkalColors || [];
    } catch (e) {
      return [];
    }
  }

  async exportPNG(canvasEngine, colorManager, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    const scale = opts.scale || 1;

    let exportCanvas;
    if (opts.showGrid) {
      exportCanvas = this.renderWithGrid(
        canvasEngine,
        scale,
        opts.gridSize || 1,
        opts.gridColor || '#000000'
      );
    } else {
      exportCanvas = canvasEngine.exportToCanvas(scale);
    }

    if (opts.showLabels) {
      const ctx = exportCanvas.getContext('2d');
      this.renderColorLabels(ctx, canvasEngine, colorManager, opts);
    }

    return new Promise((resolve) => {
      exportCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  async exportPDF(canvasEngine, colorManager, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    const scale = opts.scale || 1;

    const jsPDF = window.jspdf;
    if (!jsPDF) {
      console.error('jsPDF library not loaded');
      return null;
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = opts.margin || 20;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const canvasWidth = canvasEngine.width * scale;
    const canvasHeight = canvasEngine.height * scale;

    const imageData = canvasEngine.exportToCanvas(scale).toDataURL('image/png');

    let exportCanvas = canvasEngine.exportToCanvas(scale);
    if (opts.showGrid) {
      exportCanvas = this.renderWithGrid(
        canvasEngine,
        scale,
        opts.gridSize || 1,
        opts.gridColor || '#000000'
      );
    }
    const gridImageData = exportCanvas.toDataURL('image/png');

    const usedColors = this.getUsedColors(canvasEngine);
    const labelHeight = (opts.labelFontSize || 12) + 10;
    const legendHeight = usedColors.length * labelHeight + margin;

    const totalHeight = canvasHeight + legendHeight + margin * 2;
    const numPages = Math.ceil(totalHeight / contentHeight);

    const pdf = new jsPDF({
      orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let page = 0; page < numPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      const pageOffsetY = page * contentHeight;

      const maxImageWidth = contentWidth;
      const maxImageHeight = contentHeight - legendHeight - margin;

      const aspectRatio = canvasWidth / canvasHeight;
      let imageDisplayWidth = maxImageWidth;
      let imageDisplayHeight = maxImageWidth / aspectRatio;

      if (imageDisplayHeight > maxImageHeight) {
        imageDisplayHeight = maxImageHeight;
        imageDisplayWidth = maxImageHeight * aspectRatio;
      }

      const imageX = margin + (contentWidth - imageDisplayWidth) / 2;
      const imageY = margin;

      const sourceY = pageOffsetY;
      const sourceHeight = maxImageHeight * (canvasHeight / (maxImageHeight + legendHeight));

      pdf.addImage(
        gridImageData,
        'PNG',
        imageX,
        imageY,
        imageDisplayWidth,
        imageDisplayHeight,
        undefined,
        'FAST'
      );

      if (opts.showGrid && opts.gridSize > 0) {
        const gridSpacing = (opts.gridSize * scale * imageDisplayWidth) / canvasWidth;
        pdf.setDrawColor(opts.gridColor === '#000000' ? 0 : 128);

        for (let x = imageX; x <= imageX + imageDisplayWidth; x += gridSpacing) {
          pdf.line(x, imageY, x, imageY + imageDisplayHeight);
        }
        for (let y = imageY; y <= imageY + imageDisplayHeight; y += gridSpacing) {
          pdf.line(imageX, y, imageX + imageDisplayWidth, y);
        }
      }

      if (opts.showLabels && page === numPages - 1) {
        this.addColorLegendToPDF(pdf, usedColors, margin, imageY + imageDisplayHeight + 10, opts);
      }

      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Page ${page + 1} of ${numPages}`, pageWidth - margin, pageHeight - 10);
      pdf.text(`Canvas: ${canvasEngine.width} x ${canvasEngine.height} pixels | Scale: ${scale}x`, margin, pageHeight - 10);
    }

    return pdf.output('blob');
  }

  addColorLegendToPDF(pdf, colors, startX, startY, options) {
    if (!colors || colors.length === 0) return;

    const fontSize = Math.min(options.labelFontSize || 12, 10);
    const rowHeight = fontSize + 4;
    const colorBoxSize = fontSize;
    const maxWidth = 170;

    pdf.setFontSize(fontSize);

    let currentY = startY;

    pdf.setFontSize(Math.min(fontSize + 2, 12));
    pdf.setTextColor(0);
    pdf.setFont(undefined, 'bold');
    pdf.text('Color Legend:', startX, currentY);
    currentY += rowHeight + 2;

    pdf.setFontSize(fontSize);
    pdf.setFont(undefined, 'normal');

    colors.forEach((colorInfo) => {
      if (currentY > 280) return;

      const hex = colorInfo.hex.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      pdf.setFillColor(r, g, b);
      pdf.rect(startX, currentY - colorBoxSize + 2, colorBoxSize, colorBoxSize, 'F');
      pdf.setDrawColor(0);
      pdf.rect(startX, currentY - colorBoxSize + 2, colorBoxSize, colorBoxSize, 'S');

      let labelText = '';
      if (options.includeBrandCode && colorInfo.brand && colorInfo.code) {
        labelText = `${colorInfo.brand.toUpperCase()} ${colorInfo.code}`;
      } else if (colorInfo.code) {
        labelText = colorInfo.code;
      }
      if (colorInfo.name) {
        labelText += labelText ? ` - ${colorInfo.name}` : colorInfo.name;
      }
      labelText += ` (${colorInfo.hex})`;

      pdf.setTextColor(0);
      pdf.text(labelText.substring(0, 40), startX + colorBoxSize + 3, currentY);

      currentY += rowHeight;
    });
  }

  async export(canvasEngine, colorManager, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    const format = opts.format || 'png';

    let blob;
    if (format === 'pdf') {
      blob = await this.exportPDF(canvasEngine, colorManager, opts);
    } else {
      blob = await this.exportPNG(canvasEngine, colorManager, opts);
    }

    if (blob) {
      const filename = this.generateFilename(format, opts.projectName || 'pindou');
      this.downloadBlob(blob, filename);
    }

    return blob;
  }
}

export const exportManager = new ExportManager();
export default exportManager;
