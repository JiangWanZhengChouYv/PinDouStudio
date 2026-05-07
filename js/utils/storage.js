const STORAGE_KEY = 'pindou_projects';

export const storage = {
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { projects: [], settings: {} };
    } catch (e) {
      console.error('Storage getAll error:', e);
      return { projects: [], settings: {} };
    }
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  },

  getProjects() {
    return this.getAll().projects || [];
  },

  saveProjects(projects) {
    const data = this.getAll();
    data.projects = projects;
    return this.save(data);
  },

  getProject(id) {
    const projects = this.getProjects();
    return projects.find(p => p.id === id);
  },

  saveProject(project) {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    return this.saveProjects(projects);
  },

  deleteProject(id) {
    const projects = this.getProjects().filter(p => p.id !== id);
    return this.saveProjects(projects);
  },

  getSettings() {
    return this.getAll().settings || {};
  },

  saveSettings(settings) {
    const data = this.getAll();
    data.settings = { ...data.settings, ...settings };
    return this.save(data);
  }
};
