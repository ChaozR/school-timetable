import { useMemo, useRef, useState } from "react";
import { useSchedulerStore } from "../store/useSchedulerStore";
import { generateSchedule } from "../utils/scheduler";
import { Image as ImageIcon, Calendar, LayoutGrid, Loader2, Send } from "lucide-react";
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
import { getClassColorTheme } from "../utils/classColor";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwEMJgb2G5ie2Xu1MXVPzaeD3tiQgeJkCWASzepAjm2j5p0ddL17zYe5TvEtBsUovLaGw/exec";

const getExportFileName = (schoolName: string, ext: "png") => {
  const safeName = schoolName.trim().replace(/[\\/:*?"<>|]/g, "");
  return safeName ? `${safeName}_시간표.${ext}` : `school_schedule.${ext}`;
};

export default function Step5_Result() {
  const store = useSchedulerStore();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

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

  const buildExportData = () => {
    const cleanSchedule = schedule.map(({ date, dayOfWeek, period, startTime, endTime, className, sessionNumber }) => ({
      date,
      dayOfWeek,
      period,
      startTime,
      endTime,
      className,
      sessionNumber,
    }));

    const overallStartDate = schedule[0]?.date || "";
    const overallEndDate = schedule[schedule.length - 1]?.date || "";

    const grades = store.classes
      .map((cls) => {
        const gradePart = cls.name.split("-")[0];
        return gradePart ? `${gradePart}학년` : "";
      })
      .filter(Boolean);
    const targetGrades = [...new Set(grades)].sort((a, b) =>
      a.localeCompare(b, "ko", { numeric: true }),
    );

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

    const validClassIds = new Set(store.classes.map((c) => c.id));
    const weeklySchedulePattern: Record<string, number[]> = {};
    ["월", "화", "수", "목", "금"].forEach((day) => {
      const dayPattern = store.weeklyPattern[day] || {};
      const activePeriods = Object.entries(dayPattern)
        .filter(([, classIds]) => classIds && classIds.some((id) => validClassIds.has(id)))
        .map(([period]) => parseInt(period, 10))
        .sort((a, b) => a - b);

      if (activePeriods.length > 0) {
        weeklySchedulePattern[day] = activePeriods;
      }
    });

    return {
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
  };

  const captureScheduleImageDataUrl = async (): Promise<string> => {
    if (!scheduleRef.current) {
      throw new Error("Schedule element is not mounted");
    }

    const element = scheduleRef.current;
    const clone = element.cloneNode(true) as HTMLElement;

    try {
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.width = "max-content";
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.overflow = "visible";
      clone.style.zIndex = "-1000";

      const scrollableContainer = clone.querySelector(".overflow-auto");
      if (scrollableContainer instanceof HTMLElement) {
        scrollableContainer.style.overflow = "visible";
        scrollableContainer.style.height = "auto";
        scrollableContainer.style.flex = "none";
      }

      const stickyElements = clone.querySelectorAll(".sticky");
      stickyElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.position = "static";
          el.style.left = "auto";
          el.style.top = "auto";
          el.style.zIndex = "auto";
          el.style.boxShadow = "none";
        }
      });

      // html2canvas fillText가 Pretendard 폰트 메트릭에서 텍스트를 아래로 치우쳐 그리는 현상 보정
      const scheduleCards = clone.querySelectorAll('[data-schedule-card="true"]');
      scheduleCards.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.paddingTop = "3px";
          el.style.paddingBottom = "11px";
        }
      });

      await document.fonts.ready;
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });

      return canvas.toDataURL("image/png");
    } finally {
      clone.remove();
    }
  };

  const handleExportImage = async () => {
    if (!scheduleRef.current || isExportingImage) return;

    setIsExportingImage(true);
    try {
      const dataUrl = await captureScheduleImageDataUrl();
      const link = document.createElement("a");
      link.download = getExportFileName(store.schoolInfo.name, "png");
      link.href = dataUrl;
      link.click();
      toast.success("시간표 이미지가 저장되었습니다.");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleSubmitEmail = async () => {
    if (isSubmittingEmail) return;
    if (schedule.length === 0) {
      toast.error("제출할 시간표가 없습니다. 이전 단계의 입력을 확인해주세요.");
      return;
    }
    if (viewMode !== "grid") {
      setViewMode("grid");
      toast("표 보기 상태로 전환했습니다. 다시 한 번 [메일로 제출]을 눌러주세요.");
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const exportData = buildExportData();
      const imageBase64 = await captureScheduleImageDataUrl();

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          schoolName: store.schoolInfo.name.trim() || "미입력 학교",
          scheduleJson: JSON.stringify(exportData, null, 2),
          imageBase64,
          metadata: exportData.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!result.ok) {
        throw new Error(result.error || "메일 발송 처리에 실패했습니다.");
      }

      toast.success("시간표 이미지와 JSON이 메일로 제출되었습니다.");
    } catch (error) {
      console.error("Email submission failed:", error);
      toast.error("메일 제출 중 오류가 발생했습니다. 이미지로 저장해 직접 전달해주세요.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const isBusy = isExportingImage || isSubmittingEmail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">시간표</h2>
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex bg-slate-100 rounded-xl p-1 mr-1 border border-slate-200/80">
            <button
              type="button"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                viewMode === "grid"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" aria-hidden="true" />표
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "calendar"}
              onClick={() => setViewMode("calendar")}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                viewMode === "calendar"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4 mr-1.5" aria-hidden="true" />
              달력형
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmitEmail}
            disabled={isBusy}
            className="btn-primary"
          >
            {isSubmittingEmail ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                메일 제출 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                메일로 제출
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isBusy}
            className="btn-secondary"
          >
            {isExportingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                이미지 생성 중...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
                이미지로 저장
              </>
            )}
          </button>
        </div>
      </div>

      <div className="tip-box">
        <p className="font-semibold text-slate-900">
          생성된 시간표를 [메일로 제출] 버튼으로 바로 보내주세요. (필요 시 이미지로 개별 저장도 가능합니다.)
        </p>
        <p className="text-slate-600 mt-0.5">※ '달력형' 보기는 학교 담당 선생님 참고용 기능입니다</p>
      </div>

      <div
        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[80vh]"
        ref={scheduleRef}
      >
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <h3 className="text-xl sm:text-2xl font-bold text-center text-slate-900">
            {store.schoolInfo.name ? `${store.schoolInfo.name} 시간표` : "시간표"}
          </h3>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label="생성된 시간표"
          className="overflow-auto flex-1 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          {schedule.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
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
                    <table className="w-full border-separate border-spacing-0 text-sm text-left">
                      <thead className="text-xs text-slate-700 bg-slate-100 sticky top-0 z-20 shadow-sm">
                        <tr>
                          <th scope="col" className="px-4 py-3 border-b border-t border-r border-slate-200 bg-slate-100 sticky left-0 z-30 w-24 text-center">
                            교시 / 날짜
                          </th>
                          {datesChunk.map((d) => (
                            <th
                              key={d.date}
                              scope="col"
                              className="px-4 py-3 border-b border-t border-slate-200 bg-slate-100 min-w-[120px] text-center whitespace-nowrap tabular-nums"
                            >
                              <div className="font-bold text-slate-900">{d.date}</div>
                              <div className="text-slate-600">({d.dayOfWeek})</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {activeTimeTable.map((period) => (
                          <tr key={period.period} className="bg-white hover:bg-slate-50/70">
                            <th scope="row" className="px-4 py-3 border-b border-r border-slate-200 bg-slate-50 font-semibold text-slate-800 text-center sticky left-0 z-10 tabular-nums">
                              {period.period}교시
                              <div className="text-xs text-slate-500 font-normal mt-1 tabular-nums">
                                {period.start}
                                <br />
                                {period.end}
                              </div>
                            </th>
                            {datesChunk.map((d) => {
                              const items = scheduleMap[d.date]?.[period.period] || [];
                              return (
                                <td
                                  key={`${d.date}-${period.period}`}
                                  className="px-2 py-2 border-b border-r border-slate-200/70 text-center align-top h-24"
                                >
                                  <div className="flex flex-col gap-1">
                                    {items.map((item, idx) => {
                                      const theme = getClassColorTheme(item.className);
                                      return (
                                        <div
                                          key={idx}
                                          data-schedule-card="true"
                                          className={`flex flex-col justify-center gap-0.5 px-2.5 py-1.5 rounded-md text-xs leading-tight shadow-sm text-left tabular-nums ${theme.badge}`}
                                        >
                                          <div className="text-sm font-bold leading-tight">{item.className}</div>
                                          <div className="opacity-90 text-xs leading-tight">
                                            {item.sessionNumber}/
                                            {store.scheduleConfig.classSettings[item.classId]?.totalSessions || "?"}차시
                                          </div>
                                        </div>
                                      );
                                    })}
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
            <div className="p-6 sm:p-8 space-y-12 bg-white">
              {calendarMonths.map((monthDate, idx) => {
                const monthStart = startOfMonth(monthDate);
                const monthEnd = endOfMonth(monthDate);
                const startDate = startOfWeek(monthStart);
                const endDate = endOfWeek(monthEnd);

                const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                return (
                  <div key={idx} className="mb-10 page-break-inside-avoid">
                    <h4 className="text-2xl font-bold mb-6 text-center text-slate-900 tracking-tight tabular-nums">
                      {format(monthDate, "yyyy년 M월")}
                    </h4>
                    <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                      <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-300">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day, dayIdx) => (
                          <div
                            key={day}
                            className={`py-3 text-center text-sm font-bold border-r last:border-r-0 border-slate-300
                              ${dayIdx === 0 ? "text-red-600" : dayIdx === 6 ? "text-primary" : "text-slate-700"}`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-px bg-slate-300">
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
                              className={`min-h-[120px] p-3 flex flex-col ${isCurrentMonth ? "bg-white" : "bg-slate-50"}`}
                            >
                              <div
                                className={`text-base font-bold mb-2 tabular-nums
                                ${
                                  !isCurrentMonth
                                    ? "text-slate-400"
                                    : isSunday
                                      ? "text-red-600"
                                      : isSaturday
                                        ? "text-primary"
                                        : "text-slate-800"
                                }`}
                              >
                                {dayDate.getDate()}
                              </div>
                              {highlightText && isCurrentMonth && (
                                <div className="mt-auto mb-auto w-full">
                                  <div className="bg-primary-soft text-primary text-sm font-bold px-3 py-2 rounded-lg text-center border border-primary/20 shadow-sm mx-1 tabular-nums">
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
