import React from 'react';
import { ExamType } from '../types';

interface Props {
  id: ExamType;
  label: string;
  icon: string;
  selected: boolean;
  onClick: (id: ExamType) => void;
}

const ExamCard: React.FC<Props> = ({ id, label, icon, selected, onClick }) => {
  return (
    <div
      onClick={() => onClick(id)}
      className={`
        cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 h-32
        ${selected 
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform scale-105' 
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm text-slate-700'}
      `}
    >
      <span className="text-4xl">{icon}</span>
      <span className="font-bold text-sm text-center">{label}</span>
    </div>
  );
};

export default ExamCard;
