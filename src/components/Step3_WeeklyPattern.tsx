import { useEffect, useRef, useState } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { Check, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getClassColorTheme } from '../utils/classColor';

const DAYS = ['월', '화', '수', '목', '금'];

interface DragPayload {
  classId: string;
  fromDay: string;
  fromPeriod: number;
}

export default function Step3_WeeklyPattern() {
  const { schoolInfo, classes, weeklyPattern, updateWeeklyPattern, moveOrCopyClassInPattern } = useSchedulerStore();
  const [selectedCell, setSelectedCell] = useState<{ day: string; period: number } | null>(null);
  const [dragItem, setDragItem] = useState<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: string; period: number; isCopy: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedCell) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [selectedCell]);

  // Fallback light-dismiss for browsers without <dialog closedby="any"> (e.g. Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;

    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    let pressedOutside = false;
    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = outside(e);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleCellClick = (day: string, period: number) => {
    setSelectedCell({ day, period });
  };

  const toggleClassInCell = (classId: string) => {
    if (!selectedCell) return;
    const { day, period } = selectedCell;
    const currentClasses = weeklyPattern[day]?.[period] || [];

    const newClasses = currentClasses.includes(classId)
      ? currentClasses.filter(id => id !== classId)
      : [...currentClasses, classId];

    updateWeeklyPattern(day, period, newClasses);
  };

  const getCellClasses = (day: string, period: number) => {
    const classIds = weeklyPattern[day]?.[period] || [];
    return classIds.map(id => classes.find(c => c.id === id)).filter(Boolean);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>, day: string, period: number) => {
    if (!dragItem) return;
    e.preventDefault();
    const isCopy = e.ctrlKey;
    e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';

    setDropTarget((prev) => {
      if (prev && prev.day === day && prev.period === period && prev.isCopy === isCopy) {
        return prev;
      }
      return { day, period, isCopy };
    });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableCellElement>, day: string, period: number) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDropTarget((prev) => (prev && prev.day === day && prev.period === period ? null : prev));
  };

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, day: string, period: number) => {
    e.preventDefault();
    let payload: DragPayload | null = dragItem;

    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) payload = JSON.parse(raw) as DragPayload;
      } catch {
        payload = null;
      }
    }

    setDragItem(null);
    setDropTarget(null);

    if (!payload || (payload.fromDay === day && payload.fromPeriod === period)) {
      return;
    }

    const targetClasses = weeklyPattern[day]?.[period] || [];
    if (targetClasses.includes(payload.classId)) {
      toast.error('이미 해당 교시에 배정된 학급입니다.');
      return;
    }

    const mode = e.ctrlKey ? 'copy' : 'move';
    moveOrCopyClassInPattern(
      payload.classId,
      { day: payload.fromDay, period: payload.fromPeriod },
      { day, period },
      mode
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight [text-wrap:balance] mb-2">주간 시간표</h2>
        <p className="text-slate-500 mb-4">
          표를 눌러 각 요일과 교시별로 수업을 듣는 학급을 할당해주세요.
        </p>
      </div>

      <div className="tip-box">
        <strong className="block mb-1.5 text-primary font-semibold">Tip</strong>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            배정된 학급을 드래그하여 다른 교시로 이동할 수 있으며, <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800">Ctrl</kbd> 키를 누른 채 드래그하면 복사됩니다.
          </li>
          <li>원활한 강사 매칭을 위해, 한 요일당 최소 2교시 이상의 수업을 할당해주세요.</li>
          <li>학교별 1명의 강사 파견이 원칙이므로 수강 학급이 너무 많은 등 불가피한 상황이 아니라면 한 교시에 두 학급 이상을 할당하지 말아주세요.</li>
          <li>여러 학급이 같이 수업을 듣는 경우 하나의 대표 학급만 할당해주세요.</li>
        </ul>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" className="p-3 border-b border-r border-slate-200 bg-slate-100/80 text-center w-24 text-xs font-semibold text-slate-600">교시</th>
              {DAYS.map(day => (
                <th key={day} scope="col" className="p-3 border-b border-r last:border-r-0 border-slate-200 bg-slate-100/80 text-center w-40 text-sm font-semibold text-slate-700">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schoolInfo.timeTable.map((period) => (
              <tr key={period.period}>
                <th scope="row" className="p-3 border-b last:border-b-0 border-r border-slate-200 bg-slate-50 font-semibold text-slate-800 text-center tabular-nums">
                  {period.period}교시
                  <div className="text-xs text-slate-500 font-normal mt-1 tabular-nums">
                    {period.start}<br />{period.end}
                  </div>
                </th>
                {DAYS.map(day => {
                  const assignedClasses = getCellClasses(day, period.period);
                  const isSourceCell =
                    dragItem?.fromDay === day && dragItem?.fromPeriod === period.period;
                  const isDropTarget =
                    !isSourceCell &&
                    dropTarget?.day === day &&
                    dropTarget?.period === period.period;

                  return (
                    <td
                      key={day}
                      onDragOver={(e) => handleDragOver(e, day, period.period)}
                      onDragLeave={(e) => handleDragLeave(e, day, period.period)}
                      onDrop={(e) => handleDrop(e, day, period.period)}
                      className={clsx(
                        "relative p-2 border-b border-r last:border-r-0 border-slate-200 h-24 align-top transition-colors",
                        isDropTarget && dropTarget?.isCopy && "bg-emerald-50 ring-2 ring-inset ring-emerald-600",
                        isDropTarget && !dropTarget?.isCopy && "bg-primary-soft ring-2 ring-inset ring-primary"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleCellClick(day, period.period)}
                        aria-label={`${day}요일 ${period.period}교시 수업 학급 선택`}
                        className="absolute inset-0 w-full h-full hover:bg-primary-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      />
                      <div className="relative z-10 flex flex-wrap content-start gap-1.5 pointer-events-none">
                        {assignedClasses.map((cls) => {
                          const isDraggingThis =
                            isSourceCell && dragItem?.classId === cls!.id;
                          const theme = getClassColorTheme(cls!.name);
                          return (
                            <span
                              key={cls!.id}
                              draggable
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellClick(day, period.period);
                              }}
                              onDragStart={(e) => {
                                const payload: DragPayload = {
                                  classId: cls!.id,
                                  fromDay: day,
                                  fromPeriod: period.period,
                                };
                                setDragItem(payload);
                                e.dataTransfer.effectAllowed = 'copyMove';
                                e.dataTransfer.setData('application/json', JSON.stringify(payload));
                              }}
                              onDragEnd={() => {
                                setDragItem(null);
                                setDropTarget(null);
                              }}
                              className={clsx(
                                "pointer-events-auto inline-flex items-center gap-1 cursor-grab active:cursor-grabbing select-none px-2 py-1 rounded-md text-xs font-semibold shadow-sm hover:ring-2 hover:ring-slate-900/15 hover:shadow active:scale-[0.98] transition-all tabular-nums",
                                theme.badge,
                                isDraggingThis && "opacity-50"
                              )}
                            >
                              <GripVertical className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />
                              {cls!.name}
                            </span>
                          );
                        })}
                      </div>
                      {isDropTarget && (
                        <span
                          aria-hidden="true"
                          className={clsx(
                            "pointer-events-none absolute bottom-1.5 right-1.5 z-20 px-1.5 py-0.5 rounded text-xs font-semibold",
                            dropTarget?.isCopy
                              ? "bg-emerald-600 text-white"
                              : "bg-primary text-white"
                          )}
                        >
                          {dropTarget?.isCopy ? '복사' : '이동'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Native Modal Dialog for Class Selection */}
      <dialog
        ref={dialogRef}
        aria-labelledby="class-select-dialog-title"
        onClose={() => setSelectedCell(null)}
        className="p-0 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md bg-white"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        {selectedCell && (
          <div className="p-6">
            <h1 id="class-select-dialog-title" className="text-xl font-bold text-slate-900 mb-4">
              {selectedCell.day}요일 - {selectedCell.period}교시 수업 학급 선택
            </h1>

            {classes.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                등록된 학급이 없습니다. 2단계에서 학급을 먼저 등록해주세요.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-0.5">
                {classes.map((cls) => {
                  const isSelected = Boolean(
                    weeklyPattern[selectedCell.day]?.[selectedCell.period]?.includes(cls.id)
                  );
                  return (
                    <button
                      type="button"
                      key={cls.id}
                      aria-pressed={isSelected}
                      onClick={() => toggleClassInCell(cls.id)}
                      className={clsx(
                        "flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                        isSelected ? "border-primary bg-primary-soft/70" : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <div className="flex items-center">
                        <div
                          className={clsx("w-3 h-3 rounded-full mr-2 shrink-0", getClassColorTheme(cls.name).dot)}
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-slate-800 tabular-nums">{cls.name}</span>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}

            <form method="dialog" className="mt-6 flex justify-end">
              <button
                type="submit"
                className="btn-primary px-5"
              >
                완료
              </button>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}
