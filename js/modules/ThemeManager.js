import { storage } from '../utils/storage.js';

export class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.init();
  }

  init() {
    const settings = storage.getSettings();
    this.currentTheme = settings.theme || 'light';
    this.applyTheme(this.currentTheme);
    this.setupToggleListener();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    storage.saveSettings({ theme });
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  setupToggleListener() {
    document.addEventListener('theme-toggle', () => {
      this.toggleTheme();
    });
  }
}

export const themeManager = new ThemeManager();
