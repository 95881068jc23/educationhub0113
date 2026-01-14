import React, { useState, useEffect } from 'react';
import { ExamType, Language, Question } from '../types';
import { generatePlacementTest } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface Props {
  exam: ExamType;
  language: Language;
}

const PlacementTest: React.FC<Props> = ({ exam, language }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const t = TRANSLATIONS[language];

  const fetchTest = async () => {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const q = await generatePlacementTest(exam, language);
      setQuestions(q);
    } catch (e) {
      console.error(e);
      alert('Failed to generate test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  const handleSelect = (qId: number, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswerIndex) score++;
    });
    return score;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 animate-pulse">{t.generating}</p>
        <p className="text-xs text-slate-400">Fetching authoritative data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{exam} {t.placementTest}</h2>
        <button 
          onClick={fetchTest}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          <RefreshCw size={16} /> {t.retry}
        </button>
      </div>

      {questions.map((q, idx) => {
        const isCorrect = answers[q.id] === q.correctAnswerIndex;
        const isSelected = answers[q.id] !== undefined;
        
        return (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium mb-4 text-slate-900">
              <span className="text-slate-400 mr-2">Q{idx + 1}.</span>
              {q.text}
            </h3>
            <div className="space-y-3">
              {q.options.map((opt, optIdx) => {
                let btnClass = "w-full text-left p-3 rounded-md border transition-colors ";
                if (submitted) {
                  if (optIdx === q.correctAnswerIndex) {
                    btnClass += "bg-green-100 border-green-500 text-green-900";
                  } else if (answers[q.id] === optIdx) {
                    btnClass += "bg-red-100 border-red-500 text-red-900";
                  } else {
                    btnClass += "bg-slate-50 border-slate-200 text-slate-400";
                  }
                } else {
                  if (answers[q.id] === optIdx) {
                    btnClass += "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium";
                  } else {
                    btnClass += "bg-white border-slate-200 hover:bg-slate-50 text-slate-700";
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(q.id, optIdx)}
                    className={btnClass}
                    disabled={submitted}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 text-xs
                        ${submitted && optIdx === q.correctAnswerIndex ? 'bg-green-500 border-green-500 text-white' : 
                          submitted && answers[q.id] === optIdx ? 'bg-red-500 border-red-500 text-white' :
                          answers[q.id] === optIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}
                      `}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div className={`mt-4 p-4 rounded-md ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2 font-bold">
                  {isCorrect ? <CheckCircle className="text-green-600" size={20}/> : <XCircle className="text-red-600" size={20}/>}
                  <span className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                    {isCorrect ? t.correct : t.incorrect}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{t.explanation}:</span> {q.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {!submitted && questions.length > 0 && (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length !== questions.length}
          className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-transform active:scale-95"
        >
          {t.submit}
        </button>
      )}

      {submitted && (
        <div className="bg-slate-800 text-white p-6 rounded-xl text-center">
          <p className="text-lg opacity-80">{t.score}</p>
          <p className="text-5xl font-black text-indigo-400 my-2">{calculateScore()} / {questions.length}</p>
        </div>
      )}
    </div>
  );
};

export default PlacementTest;
