import { themeManager } from './modules/ThemeManager.js';
import { projectManager } from './modules/ProjectManager.js';
import { canvasEngine } from './modules/CanvasEngine.js';
import { colorManager } from './modules/ColorManager.js';
import { toolManager } from './modules/ToolManager.js';
import { exportManager, EXPORT_OPTIONS } from './modules/ExportManager.js';

const ROUTES = {
  HOME: '/',
  EDITOR: '/editor',
  SETTINGS: '/settings'
};

class Router {
  constructor() {
    this.currentRoute = ROUTES.HOME;
    this.routeChangeCallbacks = [];
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouteChange());
    this.handleRouteChange();
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || ROUTES.HOME;
    this.currentRoute = hash;
    this.routeChangeCallbacks.forEach(callback => callback(this.currentRoute));
  }

  navigate(path, params = {}) {
    const queryString = Object.keys(params).length > 0
      ? '?' + Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&')
      : '';
    window.location.hash = path + queryString;
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  onRouteChange(callback) {
    this.routeChangeCallbacks.push(callback);
  }
}

class HomeController {
  constructor(router) {
    this.router = router;
    this.elements = {};
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadProjects();
    projectManager.on('project-created', () => this.loadProjects());
    projectManager.on('project-updated', () => this.loadProjects());
    projectManager.on('project-deleted', () => this.loadProjects());
    projectManager.on('project-duplicated', () => this.loadProjects());
  }

  cacheElements() {
    this.elements = {
      projectGrid: document.getElementById('project-grid'),
      emptyState: document.getElementById('empty-state'),
      createModal: document.getElementById('create-modal'),
      renameModal: document.getElementById('rename-modal'),
      deleteModal: document.getElementById('delete-modal'),
      createForm: document.getElementById('create-form'),
      renameForm: document.getElementById('rename-form'),
      createBtn: document.getElementById('create-project-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      cancelCreate: document.getElementById('cancel-create'),
      cancelRename: document.getElementById('cancel-rename'),
      cancelDelete: document.getElementById('cancel-delete'),
      confirmDelete: document.getElementById('confirm-delete'),
      projectNameInput: document.getElementById('project-name'),
      projectWidthInput: document.getElementById('project-width'),
      projectHeightInput: document.getElementById('project-height'),
      presetBtns: document.querySelectorAll('.preset-btn'),
      renameProjectId: document.getElementById('rename-project-id'),
      renameProjectName: document.getElementById('rename-project-name'),
      deleteProjectName: document.getElementById('delete-project-name')
    };
  }

  setupEventListeners() {
    this.elements.createBtn.addEventListener('click', () => this.showModal('create'));
    this.elements.settingsBtn.addEventListener('click', () => this.router.navigate(ROUTES.SETTINGS));
    this.elements.cancelCreate.addEventListener('click', () => this.hideModal('create'));
    this.elements.cancelRename.addEventListener('click', () => this.hideModal('rename'));
    this.elements.cancelDelete.addEventListener('click', () => this.hideModal('delete'));
    this.elements.createForm.addEventListener('submit', (e) => this.handleCreate(e));
    this.elements.renameForm.addEventListener('submit', (e) => this.handleRename(e));
    this.elements.confirmDelete.addEventListener('click', () => this.handleDelete());
    this.elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => this.selectPreset(btn));
    });
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideAllModals();
      });
    });
  }

  loadProjects() {
    const projects = projectManager.getAllProjects();
    this.renderProjects(projects);
  }

  renderProjects(projects) {
    const grid = this.elements.projectGrid;
    grid.innerHTML = '';

    if (projects.length === 0) {
      grid.style.display = 'none';
      this.elements.emptyState.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    this.elements.emptyState.style.display = 'none';

    projects.sort((a, b) => b.updatedAt - a.updatedAt).forEach(project => {
      const card = this.createProjectCard(project);
      grid.appendChild(card);
    });
  }

  createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-thumbnail">
        ${project.thumbnail ? `<img src="${project.thumbnail}" alt="${project.name}">` : '<div class="placeholder">🎨</div>'}
      </div>
      <div class="project-info">
        <h3 class="project-name">${this.escapeHtml(project.name)}</h3>
        <p class="project-meta">${project.width}×${project.height} · ${this.formatDate(project.updatedAt)}</p>
      </div>
      <div class="project-actions">
        <button class="action-btn edit-btn" title="编辑" style="background-color: #3b82f6; color: white;">编辑</button>
        <button class="action-btn delete-btn" title="删除" style="background-color: #ef4444; color: white;">删除</button>
      </div>
    `;

    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.router.navigate(ROUTES.EDITOR, { id: project.id });
    });

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDeleteModal(project.id);
    });

    card.querySelector('.project-thumbnail').addEventListener('click', () => {
      this.router.navigate(ROUTES.EDITOR, { id: project.id });
    });

    return card;
  }

  handleProjectAction(projectId, action) {
    switch (action) {
      case 'rename':
        this.showRenameModal(projectId);
        break;
      case 'duplicate':
        projectManager.duplicateProject(projectId);
        break;
      case 'delete':
        this.showDeleteModal(projectId);
        break;
    }
  }

  showModal(type) {
    this.elements[`${type}Modal`].classList.add('active');
  }

  hideModal(type) {
    this.elements[`${type}Modal`].classList.remove('active');
  }

  hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
  }

  selectPreset(btn) {
    this.elements.projectWidthInput.value = btn.dataset.width;
    this.elements.projectHeightInput.value = btn.dataset.height;
    this.elements.presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  handleCreate(e) {
    e.preventDefault();
    const name = this.elements.projectNameInput.value.trim();
    const width = parseInt(this.elements.projectWidthInput.value);
    const height = parseInt(this.elements.projectHeightInput.value);

    const project = projectManager.createProject(width, height, name);
    this.hideModal('create');
    this.elements.createForm.reset();
    this.elements.projectWidthInput.value = 32;
    this.elements.projectHeightInput.value = 32;
    this.router.navigate(ROUTES.EDITOR, { id: project.id });
  }

  showRenameModal(projectId) {
    const project = projectManager.getProject(projectId);
    if (project) {
      this.elements.renameProjectId.value = projectId;
      this.elements.renameProjectName.value = project.name;
      this.showModal('rename');
    }
  }

  handleRename(e) {
    e.preventDefault();
    const id = this.elements.renameProjectId.value;
    const newName = this.elements.renameProjectName.value.trim();
    if (newName) {
      projectManager.renameProject(id, newName);
      this.hideModal('rename');
    }
  }

  showDeleteModal(projectId) {
    const project = projectManager.getProject(projectId);
    if (project) {
      this.elements.deleteProjectName.textContent = project.name;
      this.elements.confirmDelete.dataset.projectId = projectId;
      this.showModal('delete');
    }
  }

  handleDelete() {
    const projectId = this.elements.confirmDelete.dataset.projectId;
    if (projectId) {
      projectManager.deleteProject(projectId);
      this.hideModal('delete');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN');
  }
}

class EditorController {
  constructor(router) {
    this.router = router;
    this.projectId = null;
    this.elements = {};
    this.isDrawing = false;
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    toolManager.on('toolChanged', (tool) => this.updateToolUI(tool));
    toolManager.on('colorPicked', (color) => this.handleColorPicked(color));
  }

  loadProject(projectId) {
    this.projectId = projectId;
    const project = projectManager.getProject(projectId);
    if (!project) {
      this.router.navigate(ROUTES.HOME);
      return;
    }

    this.elements.projectTitle.value = project.name;
    const canvas = document.getElementById('pixel-canvas');
    const container = this.elements.canvasContainer;

    canvasEngine.init(canvas, project.width, project.height);
    canvasEngine.setPalette(colorManager.getColorsByBrand('artkal'));
    toolManager.setCanvasEngine(canvasEngine);
    
    if (project.pixels && project.pixels.length > 0) {
      canvasEngine.setImageData(project.pixels);
    }
    
    canvasEngine.render();

    const pixelSize = Math.min(
      40,
      Math.floor((container.clientWidth - 40) / project.width),
      Math.floor((container.clientHeight - 40) / project.height)
    );
    canvasEngine.setPixelSize(Math.max(pixelSize, 10));
    
    this.setupColorPanel();
    this.renderProjectColors();
  }

  cacheElements() {
    this.elements = {
      projectTitle: document.getElementById('project-title'),
      backBtn: document.getElementById('back-btn'),
      undoBtn: document.getElementById('undo-btn'),
      redoBtn: document.getElementById('redo-btn'),
      zoomInBtn: document.getElementById('zoom-in-btn'),
      zoomOutBtn: document.getElementById('zoom-out-btn'),
      zoomLevel: document.getElementById('zoom-level'),
      exportBtn: document.getElementById('export-btn'),
      canvasContainer: document.getElementById('canvas-container'),
      colorGrid: document.getElementById('color-grid'),
      currentColorPreview: document.getElementById('current-color-preview'),
      currentColorCode: document.getElementById('current-color-code'),
      currentColorName: document.getElementById('current-color-name'),
      brandTabs: document.querySelectorAll('.brand-tab'),
      colorSearchInput: document.getElementById('color-search-input'),
      hexInput: document.getElementById('hex-input'),
      rInput: document.getElementById('r-input'),
      gInput: document.getElementById('g-input'),
      bInput: document.getElementById('b-input'),
      customColorPreview: document.getElementById('custom-color-preview'),
      addToPaletteBtn: document.getElementById('add-to-palette-btn'),
      projectColorList: document.getElementById('project-color-list'),
      exportModal: document.getElementById('export-modal'),
      exportForm: document.getElementById('export-form'),
      cancelExport: document.getElementById('cancel-export')
    };
  }

  setupEventListeners() {
    this.elements.backBtn.addEventListener('click', () => {
      this.saveProject();
      this.router.navigate(ROUTES.HOME);
    });

    this.elements.projectTitle.addEventListener('change', () => {
      this.saveProject();
    });

    this.elements.undoBtn.addEventListener('click', () => {
      canvasEngine.undo();
    });

    this.elements.redoBtn.addEventListener('click', () => {
      canvasEngine.redo();
    });

    this.elements.zoomInBtn.addEventListener('click', () => {
      canvasEngine.zoomIn();
      this.updateZoomLevel();
    });

    this.elements.zoomOutBtn.addEventListener('click', () => {
      canvasEngine.zoomOut();
      this.updateZoomLevel();
    });

    this.elements.exportBtn.addEventListener('click', () => {
      this.elements.exportModal.classList.add('active');
    });

    this.elements.cancelExport.addEventListener('click', () => {
      this.elements.exportModal.classList.remove('active');
    });

    this.elements.exportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleExport();
    });

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toolManager.selectTool(btn.dataset.tool);
      });
    });

    this.elements.canvasContainer.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDrawing = true;
        const pos = canvasEngine.getCanvasPosition(e.clientX, e.clientY);
        if (pos && pos.x >= 0 && pos.y >= 0 && pos.x < canvasEngine.width && pos.y < canvasEngine.height) {
          toolManager.executeTool(pos.x, pos.y);
        }
      }
    });

    this.elements.canvasContainer.addEventListener('mousemove', (e) => {
      if (this.isDrawing) {
        const pos = canvasEngine.getCanvasPosition(e.clientX, e.clientY);
        if (pos && pos.x >= 0 && pos.y >= 0 && pos.x < canvasEngine.width && pos.y < canvasEngine.height) {
          toolManager.executeTool(pos.x, pos.y);
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.saveProject();
      }
    });

    this.elements.hexInput.addEventListener('input', () => {
      this.updateCustomColorFromHex();
    });

    this.elements.rInput.addEventListener('input', () => this.updateCustomColorFromRGB());
    this.elements.gInput.addEventListener('input', () => this.updateCustomColorFromRGB());
    this.elements.bInput.addEventListener('input', () => this.updateCustomColorFromRGB());

    this.elements.addToPaletteBtn.addEventListener('click', () => {
      const hex = this.elements.hexInput.value;
      if (this.isValidHex(hex)) {
        const rgb = colorManager.hexToRgb(hex);
        colorManager.addToPalette({ hex, rgb: [rgb.r, rgb.g, rgb.b], name: '自定义' });
        this.renderProjectColors();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'p': toolManager.selectTool('pencil'); break;
        case 'e': toolManager.selectTool('eraser'); break;
        case 'f': toolManager.selectTool('fill'); break;
        case 'i': toolManager.selectTool('picker'); break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) canvasEngine.redo();
            else canvasEngine.undo();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.redo();
          }
          break;
      }
    });
  }

  setupColorPanel() {
    this.elements.brandTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.elements.brandTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderColorGrid(tab.dataset.brand);
      });
    });

    this.elements.colorSearchInput.addEventListener('input', () => {
      this.filterColors();
    });

    this.renderColorGrid('artkal');
  }

  renderColorGrid(brand) {
    const colors = colorManager.getColorsByBrand(brand);
    const grid = this.elements.colorGrid;
    grid.innerHTML = '';

    colors.forEach((color, index) => {
      const colorBtn = document.createElement('button');
      colorBtn.className = 'color-item';
      colorBtn.style.backgroundColor = color.hex;
      colorBtn.title = `${color.code} - ${color.name}`;
      colorBtn.addEventListener('click', () => this.selectColor(color));
      grid.appendChild(colorBtn);
    });
  }

  filterColors() {
    const query = this.elements.colorSearchInput.value.toLowerCase();
    const activeBrand = document.querySelector('.brand-tab.active').dataset.brand;
    const colors = colorManager.getColorsByBrand(activeBrand);
    const filtered = colors.filter(c =>
      (c.code && c.code.toLowerCase().includes(query)) ||
      (c.name && c.name.toLowerCase().includes(query))
    );

    const grid = this.elements.colorGrid;
    grid.innerHTML = '';

    filtered.forEach(color => {
      const colorBtn = document.createElement('button');
      colorBtn.className = 'color-item';
      colorBtn.style.backgroundColor = color.hex;
      colorBtn.title = `${color.code} - ${color.name}`;
      colorBtn.addEventListener('click', () => this.selectColor(color));
      grid.appendChild(colorBtn);
    });
  }

  selectColor(color) {
    toolManager.setCurrentColor(color);
    this.elements.currentColorPreview.style.backgroundColor = color.hex;
    this.elements.currentColorCode.textContent = color.code || '-';
    this.elements.currentColorName.textContent = color.name || '自定义';
    this.elements.hexInput.value = color.hex;
    const rgb = colorManager.hexToRgb(color.hex);
    if (rgb) {
      this.elements.rInput.value = rgb.r;
      this.elements.gInput.value = rgb.g;
      this.elements.bInput.value = rgb.b;
    }
    this.elements.customColorPreview.style.backgroundColor = color.hex;
  }

  updateCustomColorFromHex() {
    const hex = this.elements.hexInput.value;
    if (this.isValidHex(hex)) {
      this.elements.customColorPreview.style.backgroundColor = hex;
      const rgb = colorManager.hexToRgb(hex);
      if (rgb) {
        this.elements.rInput.value = rgb.r;
        this.elements.gInput.value = rgb.g;
        this.elements.bInput.value = rgb.b;
      }
    }
  }

  updateCustomColorFromRGB() {
    const r = parseInt(this.elements.rInput.value) || 0;
    const g = parseInt(this.elements.gInput.value) || 0;
    const b = parseInt(this.elements.bInput.value) || 0;
    const hex = colorManager.rgbToHex(r, g, b);
    this.elements.hexInput.value = hex;
    this.elements.customColorPreview.style.backgroundColor = hex;
  }

  isValidHex(hex) {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  }

  renderProjectColors() {
    const palette = colorManager.getPalette();
    const list = this.elements.projectColorList;
    list.innerHTML = '';

    palette.forEach((color, index) => {
      const item = document.createElement('div');
      item.className = 'project-color-item';
      item.style.backgroundColor = color.hex;
      item.title = `${color.code || '自定义'} - ${color.name || '自定义颜色'}`;
      item.addEventListener('click', () => this.selectColor(color));
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-color';
      removeBtn.innerHTML = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorManager.removeFromPalette(index);
        this.renderProjectColors();
      });
      item.appendChild(removeBtn);
      list.appendChild(item);
    });
  }

  handleColorPicked(color) {
    if (color && color.hex) {
      toolManager.setCurrentColor(color.hex);
      this.elements.currentColorPreview.style.backgroundColor = color.hex;
      this.elements.currentColorCode.textContent = color.code || '-';
      this.elements.currentColorName.textContent = color.name || '自定义';
    }
  }

  updateToolUI(tool) {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === (tool.currentTool || tool));
    });
  }

  updateZoomLevel() {
    const zoom = canvasEngine.getZoom();
    this.elements.zoomLevel.textContent = `${zoom}%`;
  }

  async handleExport() {
    const format = document.getElementById('export-format').value;
    const scale = parseInt(document.getElementById('export-scale').value) || 1;
    const showGrid = document.getElementById('export-show-grid').checked;
    const showLabels = document.getElementById('export-show-labels').checked;

    const project = projectManager.getProject(this.projectId);
    const options = {
      format,
      scale,
      showGrid,
      showLabels,
      labelFontSize: 12,
      includeBrandCode: true,
      projectName: project ? project.name : 'pindou'
    };

    try {
      await exportManager.export(canvasEngine, colorManager, options);
      this.elements.exportModal.classList.remove('active');
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  }

  saveProject() {
    if (!this.projectId) return;

    const project = projectManager.getProject(this.projectId);
    if (project) {
      project.name = this.elements.projectTitle.value;
      project.pixels = canvasEngine.getPixels();
      project.thumbnail = canvasEngine.getThumbnailData();
      project.updatedAt = Date.now();
      projectManager.updateProject(this.projectId, project);
    }
  }
}

class SettingsController {
  constructor(router) {
    this.router = router;
    this.elements = {};
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadSettings();
    this.calculateStorageUsage();
  }

  cacheElements() {
    this.elements = {
      backBtn: document.getElementById('back-to-home-btn'),
      darkModeToggle: document.getElementById('dark-mode-toggle'),
      defaultExportFormat: document.getElementById('default-export-format'),
      defaultExportScale: document.getElementById('default-export-scale'),
      clearStorageBtn: document.getElementById('clear-storage-btn'),
      storageUsage: document.getElementById('storage-usage')
    };
  }

  setupEventListeners() {
    this.elements.backBtn.addEventListener('click', () => {
      this.router.navigate(ROUTES.HOME);
    });

    this.elements.darkModeToggle.addEventListener('change', () => {
      const isDark = this.elements.darkModeToggle.checked;
      themeManager.applyTheme(isDark ? 'dark' : 'light');
    });

    this.elements.defaultExportFormat.addEventListener('change', () => {
      this.saveSettings();
    });

    this.elements.defaultExportScale.addEventListener('change', () => {
      this.saveSettings();
    });

    this.elements.clearStorageBtn.addEventListener('click', () => {
      if (confirm('确定要清除所有数据吗？此操作无法撤销。')) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  loadSettings() {
    const data = JSON.parse(localStorage.getItem('pindou_projects') || '{"settings":{}}');
    const settings = data.settings || {};

    this.elements.darkModeToggle.checked = settings.theme === 'dark';
    this.elements.defaultExportFormat.value = settings.defaultExportFormat || 'png';
    this.elements.defaultExportScale.value = settings.defaultExportScale || '4';
  }

  saveSettings() {
    const data = JSON.parse(localStorage.getItem('pindou_projects') || '{}');
    data.settings = {
      theme: this.elements.darkModeToggle.checked ? 'dark' : 'light',
      defaultExportFormat: this.elements.defaultExportFormat.value,
      defaultExportScale: parseInt(this.elements.defaultExportScale.value)
    };
    localStorage.setItem('pindou_projects', JSON.stringify(data));
  }

  calculateStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2;
      }
    }

    const mb = (total / (1024 * 1024)).toFixed(2);
    this.elements.storageUsage.textContent = `已使用 ${mb} MB`;
  }
}

class App {
  constructor() {
    this.router = null;
    this.views = {};
    this.homeController = null;
    this.editorController = null;
    this.settingsController = null;
  }

  async init() {
    this.cacheViews();
    this.setupErrorHandling();
    this.setupResponsiveListener();
    this.router = new Router();
    this.setupRouteListener();
    themeManager.init();
  }

  cacheViews() {
    this.views = {
      home: document.getElementById('home-view'),
      editor: document.getElementById('editor-view'),
      settings: document.getElementById('settings-view')
    };
  }

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }

  setupResponsiveListener() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.addEventListener('change', (e) => {
      this.handleResponsiveChange(e.matches);
    });
  }

  handleResponsiveChange(isMobile) {
    document.body.dataset.mobile = isMobile;
  }

  setupRouteListener() {
    this.router.onRouteChange((route) => {
      this.handleRouteChange(route);
    });
  }

  handleRouteChange(route) {
    this.hideAllViews();

    if (route.startsWith(ROUTES.EDITOR)) {
      this.showView('editor');
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const projectId = params.get('id');
      if (!this.editorController) {
        this.editorController = new EditorController(this.router);
      }
      this.editorController.loadProject(projectId);
    } else if (route === ROUTES.SETTINGS) {
      this.showView('settings');
      if (!this.settingsController) {
        this.settingsController = new SettingsController(this.router);
      }
    } else {
      this.showView('home');
      if (!this.homeController) {
        this.homeController = new HomeController(this.router);
      } else {
        this.homeController.loadProjects();
      }
    }
  }

  hideAllViews() {
    Object.values(this.views).forEach(view => {
      if (view) {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });
  }

  showView(viewName) {
    const view = this.views[viewName];
    if (view) {
      view.style.display = 'block';
      setTimeout(() => view.classList.add('active'), 10);
    }
  }

  start() {
    this.router.navigate(ROUTES.HOME);
    this.showView('home');
  }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init().then(() => {
    app.start();
  }).catch(error => {
    console.error('Failed to initialize application:', error);
  });
});

export { app, Router, App, ROUTES };
