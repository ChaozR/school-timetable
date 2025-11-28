import { addDays, format, getDay, parseISO } from 'date-fns';
import type { ClassInfo, ClassSetting, WeeklyPattern, TimePeriod } from '../types';

export interface ScheduleItem {
  date: string;
  dayOfWeek: string;
  period: number;
  startTime: string;
  endTime: string;
  className: string;
  classColor: string;
  sessionNumber: number;
}

export const generateSchedule = (
  classes: ClassInfo[],
  classSettings: { [id: string]: ClassSetting },
  weeklyPattern: WeeklyPattern,
  holidays: string[],
  timeTable: TimePeriod[]
): ScheduleItem[] => {
  const schedule: ScheduleItem[] = [];
  // Map getDay() 0-6 to "Sun"-"Sat"
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  classes.forEach(cls => {
    const setting = classSettings[cls.id];
    if (!setting || !setting.startDate) return;

    let currentDate = parseISO(setting.startDate);
    let sessionsScheduled = 0;
    let safetyCounter = 0; // Prevent infinite loops (max 1 year lookahead)

    while (sessionsScheduled < setting.totalSessions && safetyCounter < 365) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayIndex = getDay(currentDate);
      const dayName = DAYS[dayIndex];

      // Map English day names to Korean keys used in UI
      const DAY_MAP: { [key: string]: string } = {
        'Sun': '일', 'Mon': '월', 'Tue': '화', 'Wed': '수', 'Thu': '목', 'Fri': '금', 'Sat': '토'
      };
      const koreanDay = DAY_MAP[dayName];

      // Check if holiday
      if (holidays.includes(dateStr)) {
        currentDate = addDays(currentDate, 1);
        safetyCounter++;
        continue;
      }

      // Check pattern
      const dayPattern = weeklyPattern[koreanDay];
      if (dayPattern) {
        // Get all periods for this day that have this class
        const periodsForClass = Object.entries(dayPattern)
          .filter(([_, classIds]) => classIds.includes(cls.id))
          .map(([p]) => parseInt(p))
          .sort((a, b) => a - b);

        for (const period of periodsForClass) {
          if (sessionsScheduled < setting.totalSessions) {
            const timeInfo = timeTable.find(t => t.period === period);
            sessionsScheduled++;

            schedule.push({
              date: dateStr,
              dayOfWeek: koreanDay,
              period: period,
              startTime: timeInfo?.start || '',
              endTime: timeInfo?.end || '',
              className: cls.name,
              classColor: cls.color,
              sessionNumber: sessionsScheduled
            });
          }
        }
      }

      currentDate = addDays(currentDate, 1);
      safetyCounter++;
    }
  });

  // Sort by Date, then Period
  return schedule.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.period - b.period;
  });
};
