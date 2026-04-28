import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, ActiveEntry } from '../types';

interface AppState {
  token: string | null;
  username: string | null;
  tasks: Task[];
  activeEntries: ActiveEntry[];

  setAuth: (token: string, username: string) => void;
  logout: () => void;
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (id: number) => void;
  setActiveEntries: (entries: ActiveEntry[]) => void;
  startEntry: (entry: ActiveEntry) => void;
  stopEntry: (taskId: number) => void;
  stopAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      tasks: [],
      activeEntries: [],

      setAuth: (token, username) => {
        localStorage.setItem('token', token);
        set({ token, username });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, username: null, tasks: [], activeEntries: [] });
      },
      setTasks: (tasks) => set({ tasks }),
      upsertTask: (task) =>
        set((s) => ({
          tasks: s.tasks.find((t) => t.id === task.id)
            ? s.tasks.map((t) => (t.id === task.id ? task : t))
            : [...s.tasks, task],
        })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          activeEntries: s.activeEntries.filter((e) => e.taskId !== id),
        })),
      setActiveEntries: (entries) => set({ activeEntries: entries }),
      startEntry: (entry) =>
        set((s) => ({
          activeEntries: [...s.activeEntries.filter((e) => e.taskId !== entry.taskId), entry],
        })),
      stopEntry: (taskId) =>
        set((s) => ({ activeEntries: s.activeEntries.filter((e) => e.taskId !== taskId) })),
      stopAll: () => set({ activeEntries: [] }),
    }),
    { name: 'timetrack-store', partialize: (s) => ({ token: s.token, username: s.username }) }
  )
);
