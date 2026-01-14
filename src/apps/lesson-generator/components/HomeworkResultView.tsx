
import React from 'react';
import { HomeworkCheckResponse } from '../types';
import { ArrowLeft, CheckCircle2, AlertCircle, Sparkles, FileText, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  data: HomeworkCheckResponse;
  onBack: () => void;
}

const HomeworkResultView: React.FC<Props> = ({ data, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-brand-600 font-semibold transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Generator
      </button>

      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-100">
         <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
                <div className="bg-brand-100 p-2 rounded-lg">
                   <CheckCircle2 className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                   <h1 className="text-2xl font-bold text-slate-800">Homework Correction Report</h1>
                   <p className="text-slate-500 text-sm">AI-Powered Analysis & Feedback</p>
                </div>
            </div>
            {data.score && (
                <div className="text-center bg-brand-50 px-6 py-3 rounded-xl border border-brand-200">
                    <span className="block text-xs font-bold text-brand-500 uppercase tracking-wider">Score</span>
                    <span className="text-3xl font-extrabold text-brand-700">{data.score}</span>
                </div>
            )}
         </div>

         {/* Overall Feedback */}
         <div className="mb-10 bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
               <Sparkles className="w-4 h-4" /> Overall Feedback (整体评价)
            </h3>
            <div className="prose prose-indigo text-indigo-800 max-w-none leading-relaxed">
               <ReactMarkdown>{data.overallFeedback}</ReactMarkdown>
            </div>
         </div>

         {/* Detailed Analysis */}
         <div className="space-y-6 mb-10">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
               <FileText className="w-5 h-5 text-slate-400" /> Detailed Analysis (逐句解析)
            </h3>
            {data.sentenceAnalysis.map((item, idx) => (
               <div key={idx} className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-brand-200 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div className="space-y-1">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Original / Timestamp</span>
                        <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 text-sm font-medium">
                           {item.original}
                        </div>
                     </div>
                     <div className="space-y-1">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Correction / Better Phrasing</span>
                        <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-100 text-sm font-medium">
                           {item.correction}
                        </div>
                     </div>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                     <p><strong className="text-slate-800">Analysis:</strong> {item.explanation}</p>
                     {item.audioFeedback && (
                        <p className="bg-amber-50 text-amber-800 p-2 rounded border border-amber-100 flex items-start gap-2">
                           <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                           <span><strong>Pronunciation/Speech:</strong> {item.audioFeedback}</span>
                        </p>
                     )}
                  </div>
               </div>
            ))}
         </div>

         {/* Revised Article (Model Answer) */}
         <div className="mb-10 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
               <Pencil className="w-4 h-4 text-slate-500" /> Revised Example (参考范文)
            </h3>
            <div className="prose prose-slate text-slate-700 max-w-none">
               <ReactMarkdown>{data.revisedArticle}</ReactMarkdown>
            </div>
         </div>

         {/* Suggestions */}
         <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl">
             <h3 className="font-bold text-emerald-900 mb-3">Suggested Study Plan (学习建议)</h3>
             <div className="prose prose-emerald text-emerald-800 max-w-none">
                <ReactMarkdown>{data.suggestions}</ReactMarkdown>
             </div>
         </div>
      </div>
    </div>
  );
};

export default HomeworkResultView;
