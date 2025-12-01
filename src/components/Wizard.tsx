import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Step1_BasicInfo from './Step1_BasicInfo'
import Step2_Classes from './Step2_Classes';
import Step3_WeeklyPattern from './Step3_WeeklyPattern';
import Step4_Timeline from './Step4_Timeline';
import Step5_Result from './Step5_Result';
import clsx from 'clsx';

const STEPS = [
  { id: 1, title: '학교 정보', component: Step1_BasicInfo },
  { id: 2, title: '학급 정보', component: Step2_Classes },
  { id: 3, title: '주간 시간표', component: Step3_WeeklyPattern },
  { id: 4, title: '수업 일정', component: Step4_Timeline },
  { id: 5, title: '결과', component: Step5_Result },
];

import { useSchedulerStore } from '../store/useSchedulerStore';
import toast from 'react-hot-toast';

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { schoolInfo } = useSchedulerStore();

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

    if (currentStep < STEPS.length) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10" />
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className={clsx(
                "flex flex-col items-center px-4",
                currentStep >= step.id ? "text-primary" : "text-gray-400"
              )}
            >
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-colors",
                currentStep >= step.id ? "bg-primary text-white border-primary" : "bg-white border-gray-300"
              )}>
                {step.id}
              </div>
              <span className="mt-2 text-sm font-medium">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg p-8 min-h-[500px]">
        <CurrentComponent />
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center px-6 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          이전으로
        </button>
        
        {currentStep < STEPS.length && (
          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 rounded-lg bg-primary text-white hover:bg-blue-600 shadow-md transition-colors"
          >
            다음으로
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
