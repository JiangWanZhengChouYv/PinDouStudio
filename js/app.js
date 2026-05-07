import { themeManager } from './modules/ThemeManager.js';
import { projectManager } from './modules/ProjectManager.js';

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

class App {
  constructor() {
    this.router = null;
    this.views = {};
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
    console.log('Responsive layout changed, mobile:', isMobile);
  }

  setupRouteListener() {
    this.router.onRouteChange((route) => {
      this.handleRouteChange(route);
    });
  }

  handleRouteChange(route) {
    this.hideAllViews();

    switch (route) {
      case ROUTES.HOME:
        this.showView('home');
        break;
      case ROUTES.EDITOR:
        this.showView('editor');
        break;
      case ROUTES.SETTINGS:
        this.showView('settings');
        break;
      default:
        this.showView('home');
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

  hideView(viewName) {
    const view = this.views[viewName];
    if (view) {
      view.classList.remove('active');
      setTimeout(() => {
        if (!view.classList.contains('active')) {
          view.style.display = 'none';
        }
      }, 300);
    }
  }

  start() {
    console.log('Application started');
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
