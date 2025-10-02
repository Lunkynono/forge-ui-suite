import { create } from 'zustand';
import { useMockStore } from './useMockStore';

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

export const useProjectStore = create<ProjectStore>((set) => {
  // Get initial projects from mock store
  const mockProjects = useMockStore.getState().projects;
  
  return {
    projects: mockProjects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
    })),
    currentProject: mockProjects[0]?.id || '1',
    setCurrentProject: (id) => {
      set({ currentProject: id });
      // Also update the mock store
      useMockStore.getState().setCurrentProject(id);
    },
    addProject: (project) => set((state) => ({ 
      projects: [...state.projects, project] 
    })),
  };
});
