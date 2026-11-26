import { useState } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getClassColorTheme } from '../utils/classColor';

export default function Step4_Timeline() {
  const { classes, scheduleConfig, setHolidays, updateClassSetting } = useSchedulerStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [globalStartDate, setGlobalStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [globalTotalSessions, setGlobalTotalSessions] = useState<number>(12);

  const handleBatchStartDate = () => {
    if (!globalStartDate) {
      toast.error('적용할 시작일을 선택해주세요.');
      return;
    }
    classes.forEach(cls => {
      const currentSetting = scheduleConfig.classSettings[cls.id] || { totalSessions: 12 };
      updateClassSetting(cls.id, {
        ...currentSetting,
        startDate: globalStartDate
      });
    });
    toast.success('모든 학급의 시작일이 일괄 적용되었습니다.');
  };

  const handleBatchTotalSessions = () => {
    if (!globalTotalSessions || globalTotalSessions < 1) {
      toast.error('총 수업 시수는 1 이상 입력해주세요.');
      return;
    }
    classes.forEach(cls => {
      const currentSetting = scheduleConfig.classSettings[cls.id] || { startDate: format(new Date(), 'yyyy-MM-dd') };
      updateClassSetting(cls.id, {
        ...currentSetting,
        totalSessions: globalTotalSessions
      });
    });
    toast.success('모든 학급의 총 수업 시수가 일괄 적용되었습니다.');
  };

  const toggleHoliday = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newHolidays = scheduleConfig.holidays.includes(dateStr)
      ? scheduleConfig.holidays.filter(d => d !== dateStr)
      : [...scheduleConfig.holidays, dateStr];
    setHolidays(newHolidays);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const startDay = getDay(startOfMonth(currentMonth)); // 0 = Sun

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar Section */}
      <div className="lg:col-span-1">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-slate-500" aria-hidden="true" />
          휴강일 설정 (선택사항)
        </h3>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              aria-label="이전 달"
              className="p-1.5 hover:bg-slate-200 active:scale-95 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" aria-hidden="true" />
            </button>
            <span className="font-bold text-lg text-slate-900 tabular-nums">{format(currentMonth, 'yyyy년 M월')}</span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              aria-label="다음 달"
              className="p-1.5 hover:bg-slate-200 active:scale-95 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 py-2 border-b border-slate-100">
            <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
          </div>

          <div className="grid grid-cols-7 text-sm">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[2.5rem]" />
            ))}
            {daysInMonth.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isHoliday = scheduleConfig.holidays.includes(dateStr);
              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => toggleHoliday(date)}
                  aria-pressed={isHoliday}
                  aria-label={`${format(date, 'yyyy년 M월 d일')}${isHoliday ? ' (휴강일)' : ''}`}
                  className={clsx(
                    "min-h-[2.5rem] w-full flex items-center justify-center transition-all duration-150 relative tabular-nums active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                    isHoliday ? "bg-red-100 text-red-700 font-bold" : "text-slate-700 hover:bg-slate-100",
                    !isSameMonth(date, currentMonth) && "text-slate-300"
                  )}
                >
                  {format(date, 'd')}
                  {isHoliday && <div className="absolute bottom-1 w-1 h-1 bg-red-600 rounded-full" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2.5 text-center">날짜를 클릭하여 휴강일로 설정해주세요 (빨간색)</p>
        <p className="text-xs text-slate-500 mt-1 text-center">26~27년 공휴일은 자동 적용되어있습니다</p>
      </div>

      {/* Class Settings Section */}
      <div className="lg:col-span-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900">학급별 수업 일정 설정</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 시작일 일괄 적용 */}
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <label htmlFor="batch-start-date" className="text-xs font-semibold text-slate-600 pl-1.5">시작일 일괄:</label>
              <input
                id="batch-start-date"
                type="date"
                value={globalStartDate}
                onChange={(e) => setGlobalStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              />
              <button
                type="button"
                onClick={handleBatchStartDate}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                적용
              </button>
            </div>

            {/* 총 수업 시수 일괄 적용 */}
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <label htmlFor="batch-total-sessions" className="text-xs font-semibold text-slate-600 pl-1.5">시수 일괄:</label>
              <input
                id="batch-total-sessions"
                type="number"
                inputMode="numeric"
                value={globalTotalSessions || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setGlobalTotalSessions(Number.isNaN(val) ? 0 : val);
                }}
                onBlur={() => {
                  if (globalTotalSessions < 1) setGlobalTotalSessions(1);
                }}
                className="w-16 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                min="1"
              />
              <button
                type="button"
                onClick={handleBatchTotalSessions}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                적용
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 tracking-wider">학급</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 tracking-wider">시작일</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 tracking-wider">총 수업 시수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classes.map(cls => {
                  const setting = scheduleConfig.classSettings[cls.id] || { startDate: '', totalSessions: 12 };
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={clsx("w-3 h-3 rounded-full mr-2.5 shrink-0", getClassColorTheme(cls.name).dot)}
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-slate-900 tabular-nums">{cls.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <input
                          type="date"
                          value={setting.startDate}
                          onChange={(e) => updateClassSetting(cls.id, { ...setting, startDate: e.target.value })}
                          aria-label={`${cls.name} 시작일`}
                          className="input-base py-1.5 tabular-nums"
                        />
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={setting.totalSessions || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateClassSetting(cls.id, { ...setting, totalSessions: Number.isNaN(val) ? 0 : val });
                          }}
                          onBlur={() => {
                            if (setting.totalSessions < 1) {
                              updateClassSetting(cls.id, { ...setting, totalSessions: 1 });
                            }
                          }}
                          aria-label={`${cls.name} 총 수업 시수`}
                          className="input-base w-24 py-1.5 tabular-nums"
                          min="1"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {classes.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              등록된 학급이 없습니다. 2단계에서 학급을 추가해주세요.
            </div>
          )}
        </div>

        <div className="tip-box mt-5">
          <strong className="block mb-1.5 text-primary font-semibold">Tip</strong>
          <ul className="list-disc pl-5 space-y-1">
            <li>수업 시작일은 각 학급의 가장 첫 번째 수업이 시작되는 주의 월요일 또는 당일로 설정해주세요.</li>
            <li>한 개의 학급이 중간에 방학 등을 거쳐 1, 2학기에 나누어 수업을 듣는 경우 학기별로 시간표를 별도 생성해주세요.</li>
            <li>수업과 휴강일이 겹치는 경우, 수업은 다음 주로 미루어집니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
