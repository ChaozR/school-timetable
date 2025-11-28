import { useState, useEffect } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';

export default function Step4_Timeline() {
  const { classes, scheduleConfig, setHolidays, updateClassSetting } = useSchedulerStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Initialize class settings if empty
  useEffect(() => {
    classes.forEach(cls => {
      if (!scheduleConfig.classSettings[cls.id]) {
        updateClassSetting(cls.id, {
          startDate: format(new Date(), 'yyyy-MM-dd'),
          totalSessions: 12
        });
      }
    });
  }, [classes]);

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
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" />
          휴강일 설정 (선택사항)
        </h3>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-200 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">{format(currentMonth, 'yyyy년 M월')}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-200 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 py-2 border-b border-gray-100">
            <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
          </div>
          
          <div className="grid grid-cols-7 text-sm">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {daysInMonth.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isHoliday = scheduleConfig.holidays.includes(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => toggleHoliday(date)}
                  className={clsx(
                    "h-10 w-full flex items-center justify-center transition-colors relative",
                    isHoliday ? "bg-red-100 text-red-600 font-bold" : "hover:bg-gray-100",
                    !isSameMonth(date, currentMonth) && "text-gray-300"
                  )}
                >
                  {format(date, 'd')}
                  {isHoliday && <div className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">날짜를 클릭하여 휴강일로 설정해주세요 (빨간색)</p>
      </div>

      {/* Class Settings Section */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">학급별 수업 일정 설정</h3>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학급</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시작일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 수업 시수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classes.map(cls => {
                const setting = scheduleConfig.classSettings[cls.id] || { startDate: '', totalSessions: 12 };
                return (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cls.color }} />
                        <span className="font-medium text-gray-900">{cls.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="date"
                        value={setting.startDate}
                        onChange={(e) => updateClassSetting(cls.id, { ...setting, startDate: e.target.value })}
                        className="px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="number"
                        value={setting.totalSessions}
                        onChange={(e) => updateClassSetting(cls.id, { ...setting, totalSessions: parseInt(e.target.value) || 0 })}
                        className="w-20 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                        min="1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {classes.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              등록된 학급이 없습니다. 2단계에서 학급을 추가해주세요.
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <strong>Tip:</strong> 수업 시작일은 각 학급의 가장 첫 번째 수업이 시작되는 일로 설정해주세요.
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <strong>Tip:</strong> 수업과 휴강일이 겹치는 경우, 수업은 다음 주로 미루어집니다.
        </div>
      </div>
    </div>
  );
}
