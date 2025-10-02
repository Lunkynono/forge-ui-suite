import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface ProjectStore {
  projects: Project[];
  currentProject: string;
  setCurrentProject: (id: string) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [
    { id: '1', name: 'Analytics Dashboard', description: 'Main analytics project', createdAt: '2025-01-15' },
    { id: '2', name: 'Customer Data', description: 'Customer insights', createdAt: '2025-02-20' },
    { id: '3', name: 'Marketing Metrics', description: 'Campaign performance', createdAt: '2025-03-10' },
  ],
  currentProject: '1',
  setCurrentProject: (id) => set({ currentProject: id }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
}));
