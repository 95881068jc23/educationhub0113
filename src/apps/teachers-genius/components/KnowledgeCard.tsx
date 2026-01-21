
import React, { useState } from 'react';
import { KnowledgeItem, KnowledgeCategory } from '../types';
import { ChevronDown, ChevronUp, BookOpen, ShieldAlert, Target, Award, BrainCircuit, Lightbulb } from 'lucide-react';

interface Props {
  item: KnowledgeItem;
}

export const KnowledgeCard: React.FC<Props> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = (cat: string) => {
    switch (cat) {
      case KnowledgeCategory.THEORY: return <BrainCircuit className="w-5 h-5 text-navy-600" />;
      case KnowledgeCategory.TECHNIQUE: return <Target className="w-5 h-5 text-gold-600" />;
      case KnowledgeCategory.ACTIVITY: return <Award className="w-5 h-5 text-navy-400" />;
      case KnowledgeCategory.MANAGEMENT: return <ShieldAlert className="w-5 h-5 text-navy-800" />;
      default: return <BookOpen className="w-5 h-5 text-navy-400" />;
    }
  };

  const getBgColor = (cat: string) => {
    switch (cat) {
      case KnowledgeCategory.THEORY: return 'bg-navy-50 border-navy-100';
      case KnowledgeCategory.TECHNIQUE: return 'bg-gold-50 border-gold-100';
      case KnowledgeCategory.ACTIVITY: return 'bg-navy-50 border-navy-100';
      case KnowledgeCategory.MANAGEMENT: return 'bg-navy-50 border-navy-100';
      default: return 'bg-white border-navy-100';
    }
  };

  return (
    <div className={`border rounded-xl mb-4 overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md' : 'shadow-sm'} ${getBgColor(item.category)}`}>
      <div 
        className="p-4 cursor-pointer flex items-start justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
            {getIcon(item.category)}
          </div>
          <div>
            <h3 className="font-bold text-navy-800 text-lg">{item.title}</h3>
            <p className="text-navy-600 text-sm mt-1">{item.purpose}</p>
          </div>
        </div>
        <button className="text-navy-400 hover:text-navy-600 mt-1 transition-transform duration-300">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="h-px w-full bg-navy-900/5 mb-4"></div>
          <div className="prose prose-sm max-w-none text-navy-700 whitespace-pre-line bg-white/50 p-4 rounded-lg mb-4">
            {item.content}
          </div>
          <div className="flex gap-3 bg-white/60 p-3 rounded-lg border border-navy-100">
             <div className="mt-0.5"><Lightbulb size={16} className="text-gold-500"/></div>
             <div>
                <span className="text-xs font-bold text-navy-500 uppercase">Example</span>
                <p className="text-sm text-navy-800 mt-1">{item.example}</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
