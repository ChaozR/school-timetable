import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useSchedulerStore } from '../store/useSchedulerStore';
import Step1_BasicInfo from './Step1_BasicInfo';
import Step2_Classes from './Step2_Classes';
import Step3_WeeklyPattern from './Step3_WeeklyPattern';
import Step4_Timeline from './Step4_Timeline';
import Step5_Result from './Step5_Result';

const STEPS = [
  { id: 1, title: '학교 정보', component: Step1_BasicInfo },
  { id: 2, title: '학급 정보', component: Step2_Classes },
  { id: 3, title: '주간 시간표', component: Step3_WeeklyPattern },
  { id: 4, title: '수업 일정', component: Step4_Timeline },
  { id: 5, title: '결과', component: Step5_Result },
];

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { schoolInfo, classes, scheduleConfig } = useSchedulerStore();

  const CurrentComponent = STEPS.find(s => s.id === currentStep)?.component || Step1_BasicInfo;

  const handleNext = () => {
    if (currentStep === 1) {
      for (const period of schoolInfo.timeTable) {
        if (period.start >= period.end) {
          toast.error(`${period.period}교시의 시작 시간이 종료 시간보다 늦거나 같습니다.\n시간을 확인해주세요.`);
          return;
        }
      }
    }

    if (currentStep === 4) {
      for (const cls of classes) {
        const setting = scheduleConfig.classSettings[cls.id];
        if (!setting || !setting.startDate) {
          toast.error(`${cls.name} 학급의 시작일을 설정해주세요.`);
          return;
        }
        if (!setting.totalSessions || setting.totalSessions < 1) {
          toast.error(`${cls.name} 학급의 총 수업 시수는 1 이상이어야 합니다.`);
          return;
        }
      }
    }

    if (currentStep < STEPS.length) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-4">
      {/* Stepper Header */}
      <nav aria-label="시간표 작성 단계" className="mb-6 sm:mb-8">
        <ol className="grid grid-cols-5 relative">
          <div
            className="absolute left-[10%] right-[10%] top-4 sm:top-5 h-0.5 bg-slate-200"
            aria-hidden="true"
          />
          <div
            className="absolute left-[10%] top-4 sm:top-5 h-0.5 bg-primary transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 80}%` }}
            aria-hidden="true"
          />
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <li
                key={step.id}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex flex-col items-center px-1 sm:px-2"
              >
                <div
                  className={clsx(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2 transition-all duration-200 relative z-10 tabular-nums",
                    isCompleted && "bg-primary text-white border-primary",
                    isCurrent && "bg-primary text-white border-primary ring-4 ring-primary/15",
                    !isCompleted && !isCurrent && "bg-white text-slate-400 border-slate-300"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" /> : step.id}
                </div>
                <span
                  className={clsx(
                    "mt-2 text-xs sm:text-sm font-medium text-center break-keep",
                    isCurrent && "text-slate-900 font-semibold",
                    isCompleted && "text-primary",
                    !isCompleted && !isCurrent && "text-slate-500"
                  )}
                >
                  {step.title}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(15,23,42,0.05)] p-5 sm:p-8 min-h-[480px]">
        <CurrentComponent />
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="btn-secondary px-5 py-2.5"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          이전으로
        </button>

        {currentStep < STEPS.length && (
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary px-5 py-2.5"
          >
            다음으로
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
