import { create } from 'zustand';
import { format } from 'date-fns';
import type { SchedulerStore, TimePeriod, ClassInfo, ClassSetting, WeeklyPattern } from '../types';
import { DEFAULT_KOREAN_HOLIDAYS } from '../constants/holidays';

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
    holidays: [...DEFAULT_KOREAN_HOLIDAYS],
    classSettings: {},
  },

  setSchoolName: (name: string) => set((state) => ({
    schoolInfo: { ...state.schoolInfo, name }
  })),

  setTimeTable: (periods: TimePeriod[]) => set((state) => ({
    schoolInfo: { ...state.schoolInfo, timeTable: periods }
  })),

  removePeriod: (index: number) => set((state) => {
    const removedPeriod = index + 1;
    const newTable = state.schoolInfo.timeTable
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, period: i + 1 }));

    const nextWeeklyPattern: WeeklyPattern = {};
    for (const [day, daySchedule] of Object.entries(state.weeklyPattern)) {
      const nextDaySchedule: { [period: number]: string[] } = {};
      for (const [pStr, classIds] of Object.entries(daySchedule)) {
        const p = Number(pStr);
        if (p < removedPeriod) {
          nextDaySchedule[p] = classIds;
        } else if (p > removedPeriod) {
          nextDaySchedule[p - 1] = classIds;
        }
      }
      nextWeeklyPattern[day] = nextDaySchedule;
    }

    return {
      schoolInfo: { ...state.schoolInfo, timeTable: newTable },
      weeklyPattern: nextWeeklyPattern,
    };
  }),

  addClass: (cls: ClassInfo) => set((state) => ({
    classes: [...state.classes, cls],
    scheduleConfig: {
      ...state.scheduleConfig,
      classSettings: {
        ...state.scheduleConfig.classSettings,
        [cls.id]: state.scheduleConfig.classSettings[cls.id] ?? {
          startDate: format(new Date(), 'yyyy-MM-dd'),
          totalSessions: 12,
        },
      },
    },
  })),

  removeClass: (id: string) => set((state) => {
    const nextWeeklyPattern: WeeklyPattern = {};
    for (const [day, daySchedule] of Object.entries(state.weeklyPattern)) {
      const nextDaySchedule: { [period: number]: string[] } = {};
      for (const [pStr, classIds] of Object.entries(daySchedule)) {
        const filtered = classIds.filter((cId) => cId !== id);
        if (filtered.length > 0) {
          nextDaySchedule[Number(pStr)] = filtered;
        }
      }
      nextWeeklyPattern[day] = nextDaySchedule;
    }

    const nextClassSettings = { ...state.scheduleConfig.classSettings };
    delete nextClassSettings[id];

    return {
      classes: state.classes.filter((c) => c.id !== id),
      weeklyPattern: nextWeeklyPattern,
      scheduleConfig: {
        ...state.scheduleConfig,
        classSettings: nextClassSettings,
      },
    };
  }),

  updateWeeklyPattern: (day: string, period: number, classIds: string[]) => set((state) => ({
    weeklyPattern: {
      ...state.weeklyPattern,
      [day]: {
        ...state.weeklyPattern[day],
        [period]: classIds
      }
    }
  })),

  moveOrCopyClassInPattern: (classId, from, to, mode) => set((state) => {
    if (from.day === to.day && from.period === to.period) {
      return state;
    }

    const existingTarget = state.weeklyPattern[to.day]?.[to.period] || [];
    if (existingTarget.includes(classId)) {
      return state;
    }

    const nextPattern: WeeklyPattern = { ...state.weeklyPattern };

    if (mode === 'move') {
      const sourceDay = { ...(nextPattern[from.day] || {}) };
      const filtered = (sourceDay[from.period] || []).filter((id) => id !== classId);
      if (filtered.length > 0) {
        sourceDay[from.period] = filtered;
      } else {
        delete sourceDay[from.period];
      }
      nextPattern[from.day] = sourceDay;
    }

    const targetDay = { ...(nextPattern[to.day] || {}) };
    targetDay[to.period] = [...(targetDay[to.period] || []), classId];
    nextPattern[to.day] = targetDay;

    return { weeklyPattern: nextPattern };
  }),

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
