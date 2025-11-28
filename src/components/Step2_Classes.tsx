import React, { useState } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { Plus, X, Users } from 'lucide-react';
import type { ClassInfo } from '../types';

const PRESET_COLORS = [
  '#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#6ee7b7',
  '#5eead4', '#93c5fd', '#a5b4fc', '#c4b5fd', '#d8b4fe',
  '#f9a8d4', '#fda4af', '#cbd5e1'
];

export default function Step2_Classes() {
  const { classes, addClass, removeClass } = useSchedulerStore();
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) {
      alert('학년을 입력해주세요.');
      return;
    }
    if (!classNum) {
      alert('반을 입력해주세요.');
      return;
    }

    const name = `${grade}-${classNum}`;
    if (classes.some(c => c.name === name)) {
      alert('이미 존재하는 반입니다');
      return;
    }

    const randomColor = PRESET_COLORS[classes.length % PRESET_COLORS.length];
    
    const newClass: ClassInfo = {
      id: crypto.randomUUID(),
      name,
      color: randomColor
    };

    addClass(newClass);
    setGrade('');
    setClassNum('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">학급 정보</h2>
        <p className="text-gray-500 mb-6">수업을 들을 모든 반을 등록해주세요.</p>
        
        <form onSubmit={handleAddClass} className="flex gap-4 items-end max-w-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
            <input 
              type="number" 
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              min="1"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">반</label>
            <input 
              type="number" 
              value={classNum}
              onChange={(e) => setClassNum(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              min="1"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-1" />
            추가
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <Users className="w-5 h-5 mr-2 text-gray-500" />
          등록된 학급 ({classes.length})
        </h3>

        {classes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
            아직 학급이 등록되지 않았습니다. 학급을 추가해주세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: '4px', borderLeftColor: cls.color }}
              >
                <span className="font-bold text-gray-800 text-lg">{cls.name}</span>
                <button 
                  onClick={() => removeClass(cls.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
