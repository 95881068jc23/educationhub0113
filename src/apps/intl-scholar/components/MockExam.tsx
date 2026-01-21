import React, { useState, useEffect } from 'react';
import { ExamType, MockQuestion } from '../types';
import { getRandom20Questions, calculateMockScore } from '../data/mockQuestions';
import { CheckCircle, XCircle, Clock, Award, Trash2, RefreshCw, BookOpen, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  exam: ExamType;
  onScoreComplete: (score: string) => void;
  onScoreClear: () => void;
  existingScore: string | null;
}

const MockExam: React.FC<Props> = ({ exam, onScoreComplete, onScoreClear, existingScore }) => {
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<string | null>(existingScore);
  const [showReview, setShowReview] = useState(false);

  // Load questions on mount or exam change
  useEffect(() => {
    if (!existingScore) {
        startNewExam();
    } else {
        setScore(existingScore);
        // If restoring a score, we might not have the original questions/answers in this stateless demo.
        // In a real app, these would be persisted. 
        // For now, we allow starting a new exam or clearing.
    }
  }, [exam, existingScore]);

  const startNewExam = () => {
    const qs = getRandom20Questions(exam);
    setQuestions(qs);
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setShowReview(false);
  };

  const handleSelect = (qId: string, optIdx: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
        if(!confirm("You haven't answered all questions. Submit anyway?")) return;
    }

    let correct = 0;
    questions.forEach(q => {
        if (answers[q.id] === q.answer) correct++;
    });

    const finalScore = calculateMockScore(exam, correct);
    setScore(finalScore);
    setIsSubmitted(true);
    setShowReview(true); // Auto-show review or let user click
    onScoreComplete(finalScore);
  };

  const handleClear = () => {
    if(confirm("Are you sure you want to delete this score record?")) {
        setScore(null);
        setIsSubmitted(false);
        setAnswers({});
        setShowReview(false);
        onScoreClear();
        startNewExam();
    }
  };

  // Helper to count correct answers
  const getCorrectCount = () => {
    return questions.filter(q => answers[q.id] === q.answer).length;
  };

  if (score && isSubmitted) {
    // Result View
    return (
        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-sm animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Award className="text-gold-500" /> Mock Exam Result
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Correct: <span className="font-bold text-navy-600">{getCorrectCount()}</span> / {questions.length}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black text-navy-900">{score}</div>
                    <div className="text-xs font-bold text-gold-500 uppercase tracking-wider">Estimated Score</div>
                </div>
            </div>
            
            <div className="bg-navy-50 p-4 rounded-lg text-sm text-navy-900 mb-6">
                <p>This score has been saved. It can be automatically imported into the <strong>Diagnostic Analysis</strong> section.</p>
            </div>

            <div className="flex gap-3 mb-8">
                <button 
                    onClick={() => setShowReview(!showReview)}
                    className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-gold-500 hover:text-navy-900 font-bold flex items-center justify-center gap-2 transition-all"
                >
                    {showReview ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    {showReview ? 'Hide Mistakes' : 'Review Mistakes (查看错题)'}
                </button>
                <button 
                    onClick={startNewExam}
                    className="flex-1 py-3 bg-navy-900 text-white rounded-xl hover:bg-navy-800 font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                    <RefreshCw size={18} /> Retake Exam
                </button>
                <button 
                    onClick={handleClear}
                    className="w-12 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 flex items-center justify-center"
                    title="Delete Score"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* MISTAKE REVIEW SECTION */}
            {showReview && (
                <div className="space-y-6 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Detailed Review</h3>
                    {questions.map((q, idx) => {
                        const isCorrect = answers[q.id] === q.answer;
                        if (isCorrect) return null; // Only show mistakes

                        return (
                            <div key={q.id} className="p-5 bg-red-50/50 rounded-xl border border-red-100 relative">
                                <div className="absolute top-4 right-4 text-red-500 font-bold text-xs flex items-center gap-1">
                                    <XCircle size={14}/> Incorrect
                                </div>
                                
                                {q.context && (
                                    <div className="mb-3 text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                                        Context: {q.context.substring(0, 100)}...
                                    </div>
                                )}

                                <p className="font-bold text-slate-800 mb-3 pr-20">
                                    <span className="text-slate-400 mr-2">Q{idx + 1}.</span>
                                    {q.question}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 bg-white border-2 border-red-200 rounded-lg text-sm">
                                        <span className="text-xs text-red-400 font-bold uppercase block mb-1">Your Answer</span>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold border border-red-200">
                                                {answers[q.id] !== undefined ? String.fromCharCode(65 + answers[q.id]) : '-'}
                                            </span>
                                            {answers[q.id] !== undefined ? q.options[answers[q.id]] : 'Not Answered'}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white border-2 border-gold-200 rounded-lg text-sm">
                                        <span className="text-xs text-gold-600 font-bold uppercase block mb-1">Correct Answer</span>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center text-xs font-bold border border-gold-200">
                                                {String.fromCharCode(65 + q.answer)}
                                            </span>
                                            {q.options[q.answer]}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600">
                                    <div className="flex items-center gap-2 text-navy-700 font-bold text-xs uppercase mb-1">
                                        <AlertCircle size={12} /> Explanation
                                    </div>
                                    {q.explanation}
                                </div>
                            </div>
                        );
                    })}
                    {getCorrectCount() === questions.length && (
                        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <CheckCircle size={40} className="text-gold-500 mx-auto mb-2"/>
                            <p>Perfect Score! No mistakes to review.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
  }

  // Exam View
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
            <h3 className="text-xl font-bold text-slate-800">{exam} Mock Simulation</h3>
            <p className="text-slate-500 text-sm">20 Questions • Randomly Selected from Pool of 100+</p>
        </div>
        <div className="flex items-center gap-2 text-navy-900 bg-navy-50 px-3 py-1 rounded-full text-xs font-bold">
            <Clock size={14} /> Est. 20 mins
        </div>
      </div>

      <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {questions.map((q, idx) => (
            <div key={q.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                
                {/* Reading Context Block */}
                {q.context && (
                    <div className="mb-4 bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-600 leading-relaxed font-serif">
                        <div className="flex items-center gap-2 text-navy-800 font-bold text-xs uppercase mb-2">
                             <BookOpen size={14} /> Reading Passage
                        </div>
                        {q.context}
                    </div>
                )}

                <p className="font-bold text-slate-800 mb-4 text-lg">
                    <span className="text-navy-500 mr-2 font-mono">Q{idx + 1}.</span>
                    {q.question}
                </p>
                <div className="space-y-2.5">
                    {q.options.map((opt, optIdx) => (
                        <label 
                            key={optIdx}
                            className={`flex items-center gap-3 p-3.5 rounded-lg cursor-pointer border transition-all duration-200 ${
                                answers[q.id] === optIdx 
                                ? 'bg-navy-600 border-navy-600 text-white shadow-md' 
                                : 'bg-white border-slate-200 hover:border-navy-300 hover:bg-navy-50/50'
                            }`}
                        >
                            <input 
                                type="radio" 
                                name={q.id} 
                                className="hidden" 
                                checked={answers[q.id] === optIdx} 
                                onChange={() => handleSelect(q.id, optIdx)}
                            />
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                answers[q.id] === optIdx ? 'border-white text-white' : 'border-slate-300 text-slate-400'
                            }`}>
                                {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span className="text-sm font-medium">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
         <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">
                Answered: <span className="text-navy-600 font-bold">{Object.keys(answers).length}</span> / 20
            </span>
            <button 
                onClick={handleSubmit}
                disabled={Object.keys(answers).length === 0}
                className="px-8 py-3 bg-navy-600 text-white rounded-xl font-bold hover:bg-navy-700 disabled:opacity-50 shadow-lg transition-transform active:scale-[0.98]"
            >
                Submit Exam
            </button>
         </div>
      </div>
    </div>
  );
};

export default MockExam;
