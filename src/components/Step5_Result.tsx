import { useMemo, useRef, useState } from "react";
import { useSchedulerStore } from "../store/useSchedulerStore";
import { generateSchedule } from "../utils/scheduler";
import { Image as ImageIcon, Calendar, LayoutGrid, FileJson } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  parseISO,
  addMonths,
} from "date-fns";
import html2canvas from "html2canvas";

import toast from "react-hot-toast";

export default function Step5_Result() {
  const store = useSchedulerStore();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

  const schedule = useMemo(() => {
    return generateSchedule(
      store.classes,
      store.scheduleConfig.classSettings,
      store.weeklyPattern,
      store.scheduleConfig.holidays,
      store.schoolInfo.timeTable,
    );
  }, [store.classes, store.scheduleConfig, store.weeklyPattern, store.schoolInfo]);

  // Group by Date for columns
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(schedule.map((s) => s.date))).sort();
    return dates.map((date) => {
      const item = schedule.find((s) => s.date === date);
      return {
        date,
        dayOfWeek: item?.dayOfWeek || "",
      };
    });
  }, [schedule]);

  const chunkedDates = useMemo(() => {
    const chunkSize = 8;
    const chunks = [];
    for (let i = 0; i < uniqueDates.length; i += chunkSize) {
      chunks.push(uniqueDates.slice(i, i + chunkSize));
    }
    return chunks;
  }, [uniqueDates]);

  // Create lookup map: date -> period -> items[]
  const scheduleMap = useMemo(() => {
    const map: Record<string, Record<number, typeof schedule>> = {};
    schedule.forEach((item) => {
      if (!map[item.date]) map[item.date] = {};
      if (!map[item.date][item.period]) map[item.date][item.period] = [];
      map[item.date][item.period].push(item);
    });
    return map;
  }, [schedule]);

  const calendarMonths = useMemo(() => {
    if (schedule.length === 0) return [];

    // Find min and max dates
    const dates = schedule.map((s) => parseISO(s.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const startMonth = startOfMonth(minDate);
    const endMonth = endOfMonth(maxDate);

    const monthIntervals = [];
    let cur = startMonth;
    // Safety check just in case, max 24 months
    let safety = 0;
    while (cur <= endMonth && safety < 24) {
      monthIntervals.push(cur);
      cur = addMonths(cur, 1);
      safety++;
    }
    return monthIntervals;
  }, [schedule]);

  // Groups of periods for calendar text
  const formatPeriods = (periods: number[]) => {
    if (!periods || periods.length === 0) return "";
    const sorted = [...new Set(periods)].sort((a, b) => a - b);
    const result = [];
    let start = sorted[0];
    let end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        if (start === end) result.push(`${start}`);
        else result.push(`${start}~${end}`);
        start = sorted[i];
        end = sorted[i];
      }
    }
    if (start === end) result.push(`${start}`);
    else result.push(`${start}~${end}`);
    return result.join(", ") + "교시";
  };

  const handleExportJSON = () => {
    try {
      // 1. 개별 스케줄 데이터 (classId, classColor 필드 제외)
      const cleanSchedule = schedule.map(({ classId, classColor, ...rest }) => rest);

      // 2. 전체 시작일 & 종료일 계산
      const overallStartDate = schedule[0]?.date || "";
      const overallEndDate = schedule[schedule.length - 1]?.date || "";

      // 3. 대상 학년 추출 (학급명 '학년-반' 형식에서 학년 정보 추출)
      const grades = store.classes
        .map((cls) => {
          const gradePart = cls.name.split("-")[0];
          return gradePart ? `${gradePart}학년` : "";
        })
        .filter(Boolean);
      const targetGrades = [...new Set(grades)].sort();

      // 4. 학급별 상세 메타데이터 및 총 수업차시 계산
      const classDetails = store.classes.map((cls) => {
        const setting = store.scheduleConfig.classSettings[cls.id];
        const clsSchedule = schedule.filter((s) => s.classId === cls.id);

        return {
          className: cls.name,
          totalSessions: setting?.totalSessions || 0,
          startDate: clsSchedule[0]?.date || setting?.startDate || "",
          endDate: clsSchedule[clsSchedule.length - 1]?.date || "",
        };
      });

      const totalSessionsSum = classDetails.reduce((sum, item) => sum + item.totalSessions, 0);

      // 5. 매주 요일별 실제 배치된 교시 정보
      const weeklySchedulePattern: Record<string, number[]> = {};
      ["월", "화", "수", "목", "금"].forEach((day) => {
        const dayPattern = store.weeklyPattern[day] || {};
        const activePeriods = Object.entries(dayPattern)
          .filter(([_, classIds]) => classIds && classIds.length > 0)
          .map(([period]) => parseInt(period))
          .sort((a, b) => a - b);

        if (activePeriods.length > 0) {
          weeklySchedulePattern[day] = activePeriods;
        }
      });

      // 6. 메타데이터와 스케줄 데이터를 묶은 최종 구조체 생성
      const exportData = {
        metadata: {
          schoolName: store.schoolInfo.name,
          targetGrades,
          totalClasses: store.classes.length,
          totalSessionsSum,
          overallStartDate,
          overallEndDate,
          weeklySchedulePattern,
          classDetails,
        },
        schedule: cleanSchedule,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const link = document.createElement("a");
      link.download = "school_schedule.json";
      link.href = dataUri;
      link.click();
      toast.success("구조화된 JSON 파일이 저장되었습니다.");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("JSON 저장 중 오류가 발생했습니다.");
    }
  };

  const handleExportImage = async () => {
    if (!scheduleRef.current) return;

    try {
      // Create a clone of the element
      const element = scheduleRef.current;
      const clone = element.cloneNode(true) as HTMLElement;

      // Style the clone to show full content
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.width = "max-content"; // Ensure full width
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.overflow = "visible";
      clone.style.zIndex = "-1000";

      // Find the scrollable container inside the clone and expand it
      const scrollableContainer = clone.querySelector(".overflow-auto");
      if (scrollableContainer instanceof HTMLElement) {
        scrollableContainer.style.overflow = "visible";
        scrollableContainer.style.height = "auto";
        scrollableContainer.style.flex = "none"; // Disable flex-1
      }

      // Remove sticky positioning from headers and first column in the clone
      // html2canvas struggles with sticky positioning
      const stickyElements = clone.querySelectorAll(".sticky");
      stickyElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.position = "static";
          el.style.left = "auto";
          el.style.top = "auto";
          el.style.zIndex = "auto";
          el.style.boxShadow = "none"; // Remove shadow if any
        }
      });

      // Append to body to render
      document.body.appendChild(clone);

      // Capture
      const canvas = await html2canvas(clone, {
        scale: 2, // Better quality
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });

      // Remove clone
      document.body.removeChild(clone);

      // Download
      const link = document.createElement("a");
      link.download = "school_schedule.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("이미지 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">시간표</h2>
        <div className="flex gap-3 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1 mr-2 shadow-sm border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-blue-700 shadow shadow-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />표
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-blue-700 shadow shadow-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              달력형
            </button>
          </div>
          <button
            onClick={handleExportImage}
            className="flex items-center px-4 py-2 bg-lime-200 text-slate-600 rounded-lg hover:bg-lime-300 shadow-sm text-sm"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            이미지로 저장
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center px-4 py-2 bg-yellow-200 text-slate-600 font-medium rounded-lg hover:bg-yellow-300 shadow-sm transition-colors text-sm"
          >
            <FileJson className="w-4 h-4 mr-2" />
            JSON으로 저장
          </button>
        </div>
      </div>
      <div>
        <p className="font-bold">생성된 시간표를 표 형태의 이미지와 json으로 저장하여 모두 보내주세요.</p>
        <p>※ '달력으로 보기'는 학교 담당 선생님 참고용 기능입니다</p>
      </div>

      <div
        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[80vh]"
        ref={scheduleRef}
      >
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h1 className="text-2xl font-bold text-center text-gray-800">{store.schoolInfo.name} 시간표</h1>
        </div>

        <div className="overflow-auto flex-1 relative">
          {schedule.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              생성된 시간표가 없습니다. 이전 단계에서 필요한 정보들을 기입하였는지 확인해보세요.
            </div>
          ) : viewMode === "grid" ? (
            <div className="space-y-12 pb-8">
              {chunkedDates.map((datesChunk, chunkIdx) => {
                let maxPeriod = 0;
                datesChunk.forEach((d) => {
                  const daySchedule = scheduleMap[d.date];
                  if (daySchedule) {
                    Object.keys(daySchedule).forEach((pStr) => {
                      const p = Number(pStr);
                      if (daySchedule[p] && daySchedule[p].length > 0) {
                        maxPeriod = Math.max(maxPeriod, p);
                      }
                    });
                  }
                });

                const activeTimeTable = store.schoolInfo.timeTable.filter((period) => period.period <= maxPeriod);

                return (
                  <div key={chunkIdx} className="w-full">
                    <table className="w-full border-collapse text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 border-b border-t border-r border-gray-200 bg-gray-100 sticky left-0 z-30 w-24 text-center">
                            교시 / 날짜
                          </th>
                          {datesChunk.map((d) => (
                            <th
                              key={d.date}
                              className="px-4 py-3 border-b border-t border-gray-200 bg-gray-100 min-w-[120px] text-center whitespace-nowrap"
                            >
                              <div className="font-bold text-gray-900">{d.date}</div>
                              <div className="text-gray-500">({d.dayOfWeek})</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                        {activeTimeTable.map((period) => (
                          <tr key={period.period} className="bg-white hover:bg-gray-50">
                            <td className="px-4 py-3 border-r border-gray-200 bg-gray-50 font-medium text-center sticky left-0 z-10">
                              {period.period}교시
                              <div className="text-xs text-gray-400 font-normal mt-1">
                                {period.start}
                                <br />
                                {period.end}
                              </div>
                            </td>
                            {datesChunk.map((d) => {
                              const items = scheduleMap[d.date]?.[period.period] || [];
                              return (
                                <td
                                  key={`${d.date}-${period.period}`}
                                  className="px-2 py-2 border-r border-gray-100 text-center align-top h-24"
                                >
                                  <div className="flex flex-col gap-1">
                                    {items.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="px-2 py-1.5 rounded text-xs text-gray-900 shadow-sm text-left"
                                        style={{ backgroundColor: item.classColor }}
                                      >
                                        <div className="text-[14px] font-bold">{item.className}</div>
                                        <div className="opacity-90 text-[12px]">
                                          {item.sessionNumber}/
                                          {store.scheduleConfig.classSettings[item.classId]?.totalSessions || "?"}차시
                                        </div>
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
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 space-y-12 bg-white">
              {calendarMonths.map((monthDate, idx) => {
                const monthStart = startOfMonth(monthDate);
                const monthEnd = endOfMonth(monthDate);
                const startDate = startOfWeek(monthStart);
                const endDate = endOfWeek(monthEnd);

                const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                return (
                  <div key={idx} className="mb-10 page-break-inside-avoid">
                    <h3 className="text-2xl font-black mb-6 text-center text-gray-800 tracking-tight">
                      {format(monthDate, "yyyy년 M월")}
                    </h3>
                    <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                      <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-300">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day, dayIdx) => (
                          <div
                            key={day}
                            className={`py-3 text-center text-sm font-bold border-r last:border-r-0 border-gray-300
                              ${dayIdx === 0 ? "text-red-500" : dayIdx === 6 ? "text-blue-500" : "text-gray-700"}`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-px bg-gray-300">
                        {calendarDays.map((dayDate, dayIdx) => {
                          const dateStr = format(dayDate, "yyyy-MM-dd");
                          const isCurrentMonth = isSameMonth(dayDate, monthDate);

                          // Get all periods for this specific day
                          const daySchedulePeriods = schedule.filter((s) => s.date === dateStr).map((s) => s.period);

                          const highlightText = formatPeriods(daySchedulePeriods);

                          const isSunday = dayDate.getDay() === 0;
                          const isSaturday = dayDate.getDay() === 6;

                          return (
                            <div
                              key={dayIdx}
                              className={`min-h-[120px] bg-white p-3 flex flex-col ${!isCurrentMonth ? "bg-gray-50" : ""}`}
                            >
                              <div
                                className={`text-md font-bold mb-2 
                                ${
                                  !isCurrentMonth
                                    ? "text-gray-400"
                                    : isSunday
                                      ? "text-red-600"
                                      : isSaturday
                                        ? "text-blue-600"
                                        : "text-gray-800"
                                }`}
                              >
                                {dayDate.getDate()}
                              </div>
                              {highlightText && isCurrentMonth && (
                                <div className="mt-auto mb-auto w-full">
                                  <div className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-2 rounded-lg text-center border-2 border-blue-200 shadow-sm mx-1">
                                    {highlightText}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
