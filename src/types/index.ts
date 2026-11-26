export interface TimePeriod {
  period: number;
  start: string;
  end: string;
}

export interface SchoolInfo {
  name: string;
  timeTable: TimePeriod[];
}

export interface ClassInfo {
  id: string;
  name: string;
  color: string;
}

export interface WeeklyPattern {
  [day: string]: { // "월", "화", "수", "목", "금"
    [period: number]: string[]; // Array of class IDs
  };
}

export interface ClassSetting {
  startDate: string; // YYYY-MM-DD
  totalSessions: number;
}

export interface ScheduleConfig {
  holidays: string[]; // YYYY-MM-DD
  classSettings: {
    [classId: string]: ClassSetting;
  };
}

export interface SchedulerStore {
  schoolInfo: SchoolInfo;
  classes: ClassInfo[];
  weeklyPattern: WeeklyPattern;
  scheduleConfig: ScheduleConfig;

  // Actions
  setSchoolName: (name: string) => void;
  setTimeTable: (periods: TimePeriod[]) => void;
  removePeriod: (index: number) => void;
  addClass: (cls: ClassInfo) => void;
  removeClass: (id: string) => void;
  updateWeeklyPattern: (day: string, period: number, classIds: string[]) => void;
  moveOrCopyClassInPattern: (
    classId: string,
    from: { day: string; period: number },
    to: { day: string; period: number },
    mode: 'move' | 'copy'
  ) => void;
  setHolidays: (holidays: string[]) => void;
  updateClassSetting: (classId: string, setting: ClassSetting) => void;
}
