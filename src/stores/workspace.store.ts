import { create } from "zustand";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface WorkspaceState {
  current: Workspace | null;
  workspaces: Workspace[];
  setCurrent: (w: Workspace | null) => void;
  setWorkspaces: (w: Workspace[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  current: null,
  workspaces: [],
  setCurrent: (current) => set({ current }),
  setWorkspaces: (workspaces) => set({ workspaces }),
}));
