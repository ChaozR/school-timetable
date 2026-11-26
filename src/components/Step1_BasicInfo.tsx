import { useSchedulerStore } from '../store/useSchedulerStore';
import { Plus, Trash2, Clock } from 'lucide-react';
import { addMinutes, format, parse } from 'date-fns';
import toast from 'react-hot-toast';

export default function Step1_BasicInfo() {
  const { schoolInfo, setSchoolName, setTimeTable, removePeriod } = useSchedulerStore();

  const handleAddPeriod = () => {
    const nextPeriod = schoolInfo.timeTable.length + 1;
    setTimeTable([
      ...schoolInfo.timeTable,
      { period: nextPeriod, start: '00:00', end: '00:00' }
    ]);
  };

  const handleRemovePeriod = (index: number) => {
    removePeriod(index);
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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight [text-wrap:balance] mb-2">학교 정보</h2>
        <p className="text-slate-500 mb-6">학교 이름과 차시 정보를 학교에 맞게 수정해주세요.</p>

        <div className="max-w-md">
          <label htmlFor="school-name" className="block text-sm font-medium text-slate-700 mb-1.5">학교 이름</label>
          <input
            id="school-name"
            type="text"
            value={schoolInfo.name}
            onChange={(e) => setSchoolName(e.target.value)}
            className="input-base w-full"
            placeholder="학교 이름을 입력해주세요"
          />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-slate-500" aria-hidden="true" />
            교시 정보
          </h3>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleBatchUpdateTime}
              className="btn-secondary"
            >
              <Clock className="w-4 h-4" aria-hidden="true" />
              종료 시간 일괄 수정 (+40분)
            </button>
            <button
              type="button"
              onClick={handleAddPeriod}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              교시 추가
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
            <div className="col-span-2">교시</div>
            <div className="col-span-4">시작 시간</div>
            <div className="col-span-4">종료 시간</div>
            <div className="col-span-2 text-right">삭제</div>
          </div>

          <div className="divide-y divide-slate-200">
            {schoolInfo.timeTable.map((period, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 items-center hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center justify-between sm:col-span-2 font-semibold text-slate-900 tabular-nums">
                  <span>{period.period}교시</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePeriod(index)}
                    className="sm:hidden text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    aria-label={`${period.period}교시 삭제`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="sm:col-span-4">
                    <span className="block sm:hidden text-xs font-medium text-slate-500 mb-1">시작 시간</span>
                    <input
                      type="time"
                      value={period.start}
                      onChange={(e) => handleTimeChange(index, 'start', e.target.value)}
                      aria-label={`${period.period}교시 시작 시간`}
                      className="input-base w-full py-1.5 tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <span className="block sm:hidden text-xs font-medium text-slate-500 mb-1">종료 시간</span>
                    <input
                      type="time"
                      value={period.end}
                      onChange={(e) => handleTimeChange(index, 'end', e.target.value)}
                      aria-label={`${period.period}교시 종료 시간`}
                      className="input-base w-full py-1.5 tabular-nums"
                    />
                  </div>
                </div>
                <div className="hidden sm:flex sm:col-span-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemovePeriod(index)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    aria-label={`${period.period}교시 삭제`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2.5 text-sm text-slate-500">
          ※ 종료 시간 일괄 수정: 각 교시의 시작 시간을 기준으로 40분 후를 종료 시간으로 자동 설정합니다.
        </p>
      </div>
    </div>
  );
}
