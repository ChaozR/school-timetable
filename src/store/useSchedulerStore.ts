import { create } from 'zustand';
import type { SchedulerStore, TimePeriod, ClassInfo, ClassSetting } from '../types';

const DEFAULT_PERIODS: TimePeriod[] = [
  { period: 1, start: '09:00', end: '09:40' },
  { period: 2, start: '09:50', end: '10:30' },
  { period: 3, start: '10:40', end: '11:20' },
  { period: 4, start: '11:30', end: '12:10' },
  { period: 5, start: '13:00', end: '13:40' },
  { period: 6, start: '13:50', end: '14:30' },
];

export const useSchedulerStore = create<SchedulerStore>((set) => ({
  schoolInfo: {
    name: '',
    timeTable: DEFAULT_PERIODS,
  },
  classes: [],
  weeklyPattern: {
    '월': {}, '화': {}, '수': {}, '목': {}, '금': {},
  },
  scheduleConfig: {
    holidays: [],
    classSettings: {},
  },

  setSchoolName: (name: string) => set((state) => ({
    schoolInfo: { ...state.schoolInfo, name }
  })),

  setTimeTable: (periods: TimePeriod[]) => set((state) => ({
    schoolInfo: { ...state.schoolInfo, timeTable: periods }
  })),

  addClass: (cls: ClassInfo) => set((state) => ({
    classes: [...state.classes, cls]
  })),

  removeClass: (id: string) => set((state) => ({
    classes: state.classes.filter((c) => c.id !== id),
  })),

  updateWeeklyPattern: (day: string, period: number, classIds: string[]) => set((state) => ({
    weeklyPattern: {
      ...state.weeklyPattern,
      [day]: {
        ...state.weeklyPattern[day],
        [period]: classIds
      }
    }
  })),

  setHolidays: (holidays: string[]) => set((state) => ({
    scheduleConfig: { ...state.scheduleConfig, holidays }
  })),

  updateClassSetting: (classId: string, setting: ClassSetting) => set((state) => ({
    scheduleConfig: {
      ...state.scheduleConfig,
      classSettings: {
        ...state.scheduleConfig.classSettings,
        [classId]: setting
      }
    }
  })),
}));
