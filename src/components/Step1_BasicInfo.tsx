import { useSchedulerStore } from '../store/useSchedulerStore';
import { Plus, Trash2, Clock } from 'lucide-react';

export default function Step1_BasicInfo() {
  const { schoolInfo, setSchoolName, setTimeTable } = useSchedulerStore();

  const handleAddPeriod = () => {
    const nextPeriod = schoolInfo.timeTable.length + 1;
    setTimeTable([
      ...schoolInfo.timeTable,
      { period: nextPeriod, start: '00:00', end: '00:00' }
    ]);
  };

  const handleRemovePeriod = (index: number) => {
    const newTable = schoolInfo.timeTable.filter((_, i) => i !== index);
    // Renumber periods
    const renumbered = newTable.map((p, i) => ({ ...p, period: i + 1 }));
    setTimeTable(renumbered);
  };

  const handleTimeChange = (index: number, field: 'start' | 'end', value: string) => {
    const newTable = [...schoolInfo.timeTable];
    newTable[index] = { ...newTable[index], [field]: value };
    setTimeTable(newTable);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">학교 정보</h2>
        <p className="text-gray-500 mb-6">학교 이름과 차시 정보를 학교에 맞게 수정해주세요.</p>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">학교 이름</label>
          <input 
            type="text" 
            value={schoolInfo.name}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="학교 이름을 입력해주세요"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500" />
            교시 정보
          </h3>
          <button 
            onClick={handleAddPeriod}
            className="flex items-center text-sm text-primary hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />
            교시 추가
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">교시</div>
            <div className="col-span-4">시작 시간</div>
            <div className="col-span-4">종료 시간</div>
            <div className="col-span-2 text-right">삭제</div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {schoolInfo.timeTable.map((period, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-white transition-colors">
                <div className="col-span-2 font-medium text-gray-900">
                  {period.period} 교시
                </div>
                <div className="col-span-4">
                  <input 
                    type="time" 
                    value={period.start}
                    onChange={(e) => handleTimeChange(index, 'start', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <input 
                    type="time" 
                    value={period.end}
                    onChange={(e) => handleTimeChange(index, 'end', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <button 
                    onClick={() => handleRemovePeriod(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                    title="Remove period"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
