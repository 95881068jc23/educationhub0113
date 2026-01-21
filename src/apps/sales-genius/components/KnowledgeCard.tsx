import React, { useState } from 'react';
import { KnowledgeItem, KnowledgeCategory } from '../types';
import { ChevronDown, ChevronUp, BookOpen, ShieldAlert, Target, Award } from 'lucide-react';

interface Props {
  item: KnowledgeItem;
}

export const KnowledgeCard: React.FC<Props> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = (cat: KnowledgeCategory) => {
    switch (cat) {
      case KnowledgeCategory.OBJECTION: return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case KnowledgeCategory.PRODUCT: return <BookOpen className="w-5 h-5 text-navy-600" />;
      case KnowledgeCategory.SALES_SKILL: return <Target className="w-5 h-5 text-gold-500" />;
      case KnowledgeCategory.COMPETITOR: return <Award className="w-5 h-5 text-slate-600" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getBgColor = (cat: KnowledgeCategory) => {
    switch (cat) {
      case KnowledgeCategory.OBJECTION: return 'bg-red-50 border-red-100';
      case KnowledgeCategory.PRODUCT: return 'bg-navy-50 border-navy-100';
      case KnowledgeCategory.SALES_SKILL: return 'bg-gold-50 border-gold-100';
      case KnowledgeCategory.COMPETITOR: return 'bg-slate-50 border-slate-100';
      default: return 'bg-white border-slate-200';
    }
  };

  return (
    <div className={`border rounded-xl mb-4 overflow-hidden transition-all duration-200 ${isExpanded ? 'shadow-md' : 'shadow-sm'} ${getBgColor(item.category)}`}>
      <div 
        className="p-4 cursor-pointer flex items-start justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
            {getIcon(item.category)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
            <p className="text-slate-600 text-sm mt-1">{item.summary}</p>
            <div className="flex gap-2 mt-2">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-black/5 text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 mt-1">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="h-px w-full bg-black/5 mb-4"></div>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line bg-white/50 p-4 rounded-lg">
            {item.content}
          </div>
        </div>
      )}
    </div>
  );
};