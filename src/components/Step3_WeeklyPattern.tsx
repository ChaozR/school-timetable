import { useState } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { Check } from 'lucide-react';
import clsx from 'clsx';

const DAYS = ['월', '화', '수', '목', '금'];

export default function Step3_WeeklyPattern() {
  const { schoolInfo, classes, weeklyPattern, updateWeeklyPattern } = useSchedulerStore();
  const [selectedCell, setSelectedCell] = useState<{day: string, period: number} | null>(null);

  const handleCellClick = (day: string, period: number) => {
    setSelectedCell({ day, period });
  };

  const toggleClassInCell = (classId: string) => {
    if (!selectedCell) return;
    const { day, period } = selectedCell;
    const currentClasses = weeklyPattern[day]?.[period] || [];
    
    let newClasses;
    if (currentClasses.includes(classId)) {
      newClasses = currentClasses.filter(id => id !== classId);
    } else {
      newClasses = [...currentClasses, classId];
    }
    
    updateWeeklyPattern(day, period, newClasses);
  };

  const getCellClasses = (day: string, period: number) => {
    const classIds = weeklyPattern[day]?.[period] || [];
    return classIds.map(id => classes.find(c => c.id === id)).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">주간 시간표</h2>
        <p className="text-gray-500 mb-6">표를 눌러 각 요일과 교시별로 수업을 듣는 학급을 할당해주세요.</p>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <strong>Tip:</strong> 원활한 강사 매칭을 위해, 한 요일당 최소 2교시 이상의 수업을 할당해주세요.
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <strong>Tip:</strong> 학교별 1명의 강사 파견이 원칙이므로 수강 학급이 너무 많은 등 불가피한 상황이 아니라면 한 교시에 두 학급 이상을 할당하지 말아주세요.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="p-3 border border-gray-200 bg-gray-50 text-center w-20">교시</th>
              {DAYS.map(day => (
                <th key={day} className="p-3 border border-gray-200 bg-gray-50 text-center w-40">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schoolInfo.timeTable.map((period) => (
              <tr key={period.period}>
                <td className="p-3 border border-gray-200 bg-gray-50 font-medium text-center">
                  {period.period}
                  <div className="text-xs text-gray-400 font-normal mt-1">
                    {period.start}<br/>{period.end}
                  </div>
                </td>
                {DAYS.map(day => {
                  const assignedClasses = getCellClasses(day, period.period);
                  return (
                    <td 
                      key={day} 
                      onClick={() => handleCellClick(day, period.period)}
                      className="p-2 border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors h-24 align-top"
                    >
                      <div className="flex flex-wrap gap-1">
                        {assignedClasses.map((cls) => (
                          <span 
                            key={cls!.id} 
                            className="px-2 py-1 rounded text-xs font-bold text-gray-900 shadow-sm"
                            style={{ backgroundColor: cls!.color }}
                          >
                            {cls!.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Class Selection */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">
              {selectedCell.day}요일 - {selectedCell.period}교시 수업 학급 선택
            </h3>
            
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {classes.map((cls) => {
                const isSelected = weeklyPattern[selectedCell.day]?.[selectedCell.period]?.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    onClick={() => toggleClassInCell(cls.id)}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                      isSelected ? "border-primary bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cls.color }} />
                      <span className="font-medium">{cls.name}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
