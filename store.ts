// store.ts
import { create } from "zustand";
import { Job, Settings } from "./types";

interface StoreState {
  jobs: Job[];
  settings: Settings[];
  setJobs: (jobs: Job[]) => void;
  setSettings: (settings: Settings[]) => void;
  addJob: (job: Job) => void;
  updateJob: (updatedJob: Job) => void;
  deleteJob: (jobId: string) => void;
  addSetting: (setting: Settings) => void;
  updateSetting: (updatedSetting: Settings) => void;
  deleteSetting: (settingId: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  jobs: [],
  settings: [],

  setJobs: (jobs) => set({ jobs }),
  setSettings: (settings) => set({ settings }),

  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (updatedJob) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.ID === updatedJob.ID ? updatedJob : job
      ),
    })),
  deleteJob: (jobId) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.ID !== jobId),
    })),

  addSetting: (setting) =>
    set((state) => ({ settings: [...state.settings, setting] })),
  updateSetting: (updatedSetting) =>
    set((state) => ({
      settings: state.settings.map((setting) =>
        setting.ID === updatedSetting.ID ? updatedSetting : setting
      ),
    })),
  deleteSetting: (settingId) =>
    set((state) => ({
      settings: state.settings.filter((setting) => setting.ID !== settingId),
    })),
}));
