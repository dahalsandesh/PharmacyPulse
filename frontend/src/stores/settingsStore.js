import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
  dateSystem: localStorage.getItem('medstore_date_system') || 'AD',
  setDateSystem: (system) => {
    localStorage.setItem('medstore_date_system', system);
    set({ dateSystem: system });
  },
}));
