import { storage } from '../utils/storage.js';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createEmptyPixels(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(-1));
}

function generateThumbnail(width, height, pixels, palette) {
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, size, size);

  const cellSize = size / Math.max(width, height);
  const offsetX = (size - width * cellSize) / 2;
  const offsetY = (size - height * cellSize) / 2;

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000',
    '#ff8000', '#80ff00', '#00ff80', '#0080ff', '#8000ff', '#ff0080', '#808080', '#c0c0c0',
    '#400000', '#404000', '#004040', '#000040', '#400040', '#004000', '#404000', '#400400',
    '#008080', '#800080', '#808000', '#4466aa', '#66aa44', '#aa4466', '#66aaaa', '#aaaa44', '#aa66aa'];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIndex = pixels[y][x];
      if (colorIndex >= 0) {
        ctx.fillStyle = palette.includes(colorIndex) ? colors[colorIndex] || '#cccccc' : '#cccccc';
        ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

class ProjectManager {
  constructor() {
    this.listeners = {};
  }

  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`project-${event}`, { detail: data }));
  }

  on(event, callback) {
    const handler = (e) => callback(e.detail);
    this.listeners[event] = handler;
    document.addEventListener(`project-${event}`, handler);
  }

  off(event) {
    if (this.listeners[event]) {
      document.removeEventListener(`project-${event}`, this.listeners[event]);
      delete this.listeners[event];
    }
  }

  createProject(width, height, name = '未命名项目') {
    const project = {
      id: generateUUID(),
      name,
      width: Math.max(8, Math.min(128, width)),
      height: Math.max(8, Math.min(128, height)),
      pixels: createEmptyPixels(width, height),
      palette: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      thumbnail: ''
    };

    project.thumbnail = generateThumbnail(project.width, project.height, project.pixels, project.palette);

    storage.saveProject(project);
    this.emit('created', project);
    return project;
  }

  getAllProjects() {
    return storage.getProjects();
  }

  getProject(id) {
    return storage.getProject(id);
  }

  updateProject(id, data) {
    const project = storage.getProject(id);
    if (!project) return null;

    const updated = {
      ...project,
      ...data,
      id: project.id,
      createdAt: project.createdAt,
      updatedAt: Date.now()
    };

    if (data.pixels) {
      updated.thumbnail = generateThumbnail(updated.width, updated.height, updated.pixels, updated.palette);
    }

    storage.saveProject(updated);
    this.emit('updated', updated);
    return updated;
  }

  deleteProject(id) {
    const project = this.getProject(id);
    if (!project) return false;

    storage.deleteProject(id);
    this.emit('deleted', { id });
    return true;
  }

  duplicateProject(id) {
    const original = storage.getProject(id);
    if (!original) return null;

    const duplicate = {
      ...original,
      id: generateUUID(),
      name: `${original.name} (副本)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    duplicate.thumbnail = generateThumbnail(duplicate.width, duplicate.height, duplicate.pixels, duplicate.palette);

    storage.saveProject(duplicate);
    this.emit('duplicated', duplicate);
    return duplicate;
  }

  renameProject(id, newName) {
    return this.updateProject(id, { name: newName });
  }

  searchProjects(query) {
    const projects = this.getAllProjects();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) return projects;

    return projects.filter(p =>
      p.name.toLowerCase().includes(lowerQuery)
    );
  }
}

export const projectManager = new ProjectManager();
