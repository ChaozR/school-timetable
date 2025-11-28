import { useMemo, useRef } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { generateSchedule } from '../utils/scheduler';
import { Download, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';


export default function Step5_Result() {
  const store = useSchedulerStore();
  const scheduleRef = useRef<HTMLDivElement>(null);

  const schedule = useMemo(() => {
    return generateSchedule(
      store.classes,
      store.scheduleConfig.classSettings,
      store.weeklyPattern,
      store.scheduleConfig.holidays,
      store.schoolInfo.timeTable
    );
  }, [store.classes, store.scheduleConfig, store.weeklyPattern, store.schoolInfo]);

  // Group by Date for columns
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(schedule.map(s => s.date))).sort();
    return dates.map(date => {
      const item = schedule.find(s => s.date === date);
      return {
        date,
        dayOfWeek: item?.dayOfWeek || ''
      };
    });
  }, [schedule]);

  // Create lookup map: date -> period -> items[]
  const scheduleMap = useMemo(() => {
    const map: Record<string, Record<number, typeof schedule>> = {};
    schedule.forEach(item => {
      if (!map[item.date]) map[item.date] = {};
      if (!map[item.date][item.period]) map[item.date][item.period] = [];
      map[item.date][item.period].push(item);
    });
    return map;
  }, [schedule]);

  const handleExportExcel = () => {
    // Excel export logic for Grid View
    // Rows: Period, Cols: Dates
    const data: any[] = [];
    
    // Header Row
    const headerRow: Record<string, string> = { Period: '교시/날짜' };
    uniqueDates.forEach(d => {
      headerRow[d.date] = `${d.date} (${d.dayOfWeek})`;
    });
    data.push(headerRow);

    // Data Rows
    store.schoolInfo.timeTable.forEach(period => {
      const row: any = { Period: `${period.period}교시` };
      uniqueDates.forEach(d => {
        const items = scheduleMap[d.date]?.[period.period] || [];
        if (items.length > 0) {
          row[d.date] = items.map(i => `${i.className} (${i.sessionNumber}차시)`).join(', ');
        } else {
          row[d.date] = '';
        }
      });
      data.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "school_schedule.xlsx");
  };

  const handleExportImage = async () => {
    if (!scheduleRef.current) return;

    try {
      // Create a clone of the element
      const element = scheduleRef.current;
      const clone = element.cloneNode(true) as HTMLElement;

      // Style the clone to show full content
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = 'max-content'; // Ensure full width
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.zIndex = '-1000';

      // Find the scrollable container inside the clone and expand it
      const scrollableContainer = clone.querySelector('.overflow-auto');
      if (scrollableContainer instanceof HTMLElement) {
        scrollableContainer.style.overflow = 'visible';
        scrollableContainer.style.height = 'auto';
        scrollableContainer.style.flex = 'none'; // Disable flex-1
      }

      // Remove sticky positioning from headers and first column in the clone
      // html2canvas struggles with sticky positioning
      const stickyElements = clone.querySelectorAll('.sticky');
      stickyElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.position = 'static';
          el.style.left = 'auto';
          el.style.top = 'auto';
          el.style.zIndex = 'auto';
          el.style.boxShadow = 'none'; // Remove shadow if any
        }
      });

      // Append to body to render
      document.body.appendChild(clone);

      // Capture
      const canvas = await html2canvas(clone, {
        scale: 2, // Better quality
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
      });

      // Remove clone
      document.body.removeChild(clone);

      // Download
      const link = document.createElement('a');
      link.download = 'school_schedule.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">생성된 시간표</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel로 저장
          </button>
          <button 
            onClick={handleExportImage}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            이미지로 저장
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[80vh]" ref={scheduleRef}>
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h1 className="text-2xl font-bold text-center text-gray-800">{store.schoolInfo.name} 시간표</h1>
        </div>
        
        <div className="overflow-auto flex-1 relative">
          {schedule.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              생성된 시간표가 없습니다. 이전 단계에서 필요한 정보들을 기입하였는지 확인해보세요.
            </div>
          ) : (
            <table className="w-full border-collapse text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-4 py-3 border-b border-r border-gray-200 bg-gray-100 sticky left-0 z-30 w-24 text-center">
                    교시 / 날짜
                  </th>
                  {uniqueDates.map(d => (
                    <th key={d.date} className="px-4 py-3 border-b border-gray-200 bg-gray-100 min-w-[120px] text-center whitespace-nowrap">
                      <div className="font-bold text-gray-900">{d.date}</div>
                      <div className="text-gray-500">({d.dayOfWeek})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {store.schoolInfo.timeTable.map((period) => (
                  <tr key={period.period} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 border-r border-gray-200 bg-gray-50 font-medium text-center sticky left-0 z-10">
                      {period.period}교시
                      <div className="text-xs text-gray-400 font-normal mt-1">
                        {period.start}<br/>{period.end}
                      </div>
                    </td>
                    {uniqueDates.map(d => {
                      const items = scheduleMap[d.date]?.[period.period] || [];
                      return (
                        <td key={`${d.date}-${period.period}`} className="px-2 py-2 border-r border-gray-100 text-center align-top h-24">
                          <div className="flex flex-col gap-1">
                            {items.map((item, idx) => (
                              <div 
                                key={idx}
                                className="px-2 py-1.5 rounded text-xs text-gray-900 shadow-sm text-left"
                                style={{ backgroundColor: item.classColor }}
                              >
                                <div className="font-bold">{item.className}</div>
                                <div className="opacity-90 text-[10px]">{item.sessionNumber}차시</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
      <div>
        <p className="text-center font-bold">
        생성된 시간표를 이미지로 저장하여 보내주세요.
        </p>
      </div>
    </div>
  );
}
