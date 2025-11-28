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
  [day: string]: { // "Mon", "Tue", ...
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
  addClass: (cls: ClassInfo) => void;
  removeClass: (id: string) => void;
  updateWeeklyPattern: (day: string, period: number, classIds: string[]) => void;
  setHolidays: (holidays: string[]) => void;
  updateClassSetting: (classId: string, setting: ClassSetting) => void;
}
