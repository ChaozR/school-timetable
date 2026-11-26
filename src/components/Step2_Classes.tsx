import React, { useState } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { Plus, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { getClassColor, getClassColorTheme } from '../utils/classColor';

export default function Step2_Classes() {
  const { classes, addClass, removeClass } = useSchedulerStore();
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');

  const createClassObject = (gradeNum: number, num: number) => {
    return {
      id: crypto.randomUUID(),
      name: `${gradeNum}-${num}`,
      color: getClassColor(gradeNum, num)
    };
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const gradeNum = Number(grade);
    const num = Number(classNum);

    if (!grade || !Number.isInteger(gradeNum) || gradeNum < 1) {
      toast.error('학년은 1 이상의 정수로 입력해주세요.');
      return;
    }
    if (!classNum || !Number.isInteger(num) || num < 1) {
      toast.error('반은 1 이상의 정수로 입력해주세요.');
      return;
    }

    const name = `${gradeNum}-${num}`;
    if (classes.some(c => c.name === name)) {
      toast.error('이미 존재하는 반입니다');
      return;
    }

    addClass(createClassObject(gradeNum, num));
    setGrade('');
    setClassNum('');
  };

  const handleBatchAddClass = () => {
    const gradeNum = Number(grade);
    const maxClassNum = Number(classNum);

    if (!grade || !Number.isInteger(gradeNum) || gradeNum < 1) {
      toast.error('학년은 1 이상의 정수로 입력해주세요.');
      return;
    }
    if (!classNum || !Number.isInteger(maxClassNum) || maxClassNum < 1) {
      toast.error('반(마지막 번호)은 1 이상의 정수로 입력해주세요.');
      return;
    }
    if (maxClassNum > 30) {
      toast.error('일괄 추가는 최대 30반까지 가능합니다.');
      return;
    }

    let addedCount = 0;

    for (let i = 1; i <= maxClassNum; i++) {
      const name = `${gradeNum}-${i}`;
      if (!classes.some(c => c.name === name)) {
        addClass(createClassObject(gradeNum, i));
        addedCount++;
      }
    }

    if (addedCount > 0) {
      toast.success(`${addedCount}개 학급이 일괄 추가되었습니다.`);
      setGrade('');
      setClassNum('');
    } else {
      toast.error('추가할 학급이 없거나 이미 모두 존재합니다.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight [text-wrap:balance] mb-2">학급 정보</h2>
        <p className="text-slate-500 mb-6">수업을 들을 모든 반을 등록해주세요.</p>

        <form onSubmit={handleAddClass} className="grid grid-cols-2 sm:flex sm:items-end gap-3 max-w-2xl">
          <div className="sm:w-32">
            <label htmlFor="class-grade" className="block text-sm font-medium text-slate-700 mb-1.5">학년</label>
            <input
              id="class-grade"
              type="number"
              inputMode="numeric"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="input-base w-full tabular-nums"
              min="1"
            />
          </div>
          <div className="sm:w-32">
            <label htmlFor="class-num" className="block text-sm font-medium text-slate-700 mb-1.5">반</label>
            <input
              id="class-num"
              type="number"
              inputMode="numeric"
              value={classNum}
              onChange={(e) => setClassNum(e.target.value)}
              className="input-base w-full tabular-nums"
              min="1"
            />
          </div>
          <div className="col-span-2 flex gap-2.5 sm:pt-0">
            <button
              type="submit"
              className="btn-primary flex-1 sm:flex-initial px-5"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              추가
            </button>
            <button
              type="button"
              onClick={handleBatchAddClass}
              className="btn-secondary flex-1 sm:flex-initial px-5"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              일괄 추가
            </button>
          </div>
        </form>
        <p className="mt-2.5 text-sm text-slate-500">
          ※ 일괄 추가 예시: 학년 '1', 반 '5' 입력 후 [일괄 추가] 클릭 시 1-1반부터 1-5반까지 한 번에 등록됩니다.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 flex items-center mb-4 tabular-nums">
          <Users className="w-5 h-5 mr-2 text-slate-500" aria-hidden="true" />
          등록된 학급 ({classes.length})
        </h3>

        {classes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-500">
            아직 학급이 등록되지 않았습니다. 학급을 추가해주세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {classes.map((cls) => {
              const theme = getClassColorTheme(cls.name);
              return (
                <div
                  key={cls.id}
                  className={clsx(
                    "flex items-center justify-between p-3 border border-slate-200/80 rounded-xl shadow-sm hover:shadow hover:border-slate-300 transition-all",
                    theme.badge
                  )}
                >
                  <span className="font-bold text-lg tabular-nums">{cls.name}</span>
                  <button
                    type="button"
                    onClick={() => removeClass(cls.id)}
                    aria-label={`${cls.name} 학급 삭제`}
                    className={clsx(
                      "active:scale-95 transition-all p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                      theme.isDark
                        ? "text-white/75 hover:text-white hover:bg-white/15"
                        : "text-slate-500 hover:text-red-600 hover:bg-red-50"
                    )}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
