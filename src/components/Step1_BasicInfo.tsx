import { useSchedulerStore } from '../store/useSchedulerStore';
import { Plus, Trash2, Clock } from 'lucide-react';
import { addMinutes, format, parse } from 'date-fns';
import toast from 'react-hot-toast';

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

  const handleBatchUpdateTime = () => {
    try {
      const newTable = schoolInfo.timeTable.map(period => {
        // Parse 'HH:mm' string to Date object
        const startDate = parse(period.start, 'HH:mm', new Date());
        const endDate = addMinutes(startDate, 40);
        return {
          ...period,
          end: format(endDate, 'HH:mm')
        };
      });
      setTimeTable(newTable);
      toast.success('모든 교시의 종료 시간이 시작 시간 +40분으로 설정되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('시간 설정 중 오류가 발생했습니다. 시작 시간을 확인해주세요.');
    }
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
          <div className="flex gap-3">
            <button 
              onClick={handleBatchUpdateTime}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center text-sm"
            >
              <Clock className="w-4 h-4 mr-1" />
              종료 시간 일괄 수정 (+40분)
            </button>
            <button 
              onClick={handleAddPeriod}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              교시 추가
            </button>
          </div>
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
        <p className="mt-2 text-sm text-gray-500">
          ※ 종료 시간 일괄 수정: 각 교시의 시작 시간을 기준으로 40분 후를 종료 시간으로 자동 설정합니다.
        </p>
      </div>
    </div>
  );
}
