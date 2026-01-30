
import React, { useState } from 'react';
import { GeneratorFormData, LessonPlanResponse, SectionContent, HomeworkCheckResponse } from './types';
import { generateLessonPlan, checkHomework } from './services/geminiService';
import InputForm from './components/InputForm';
import LessonView from './components/LessonView';
import HomeworkResultView from './components/HomeworkResultView';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<LessonPlanResponse | null>(null);
  const [homeworkData, setHomeworkData] = useState<HomeworkCheckResponse | null>(null);
  const [formData, setFormData] = useState<GeneratorFormData | null>(null); // Store form data for "Back"
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Generating...");
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (inputData: GeneratorFormData) => {
    setLoading(true);
    setLoadingText("Analyzing Syllabus & Context...");
    setError(null);
    setFormData(inputData); // Save for later
    
    try {
      if (inputData.mode === 'homework_check') {
         setLoadingText("Reviewing & Correcting...");
         const result = await checkHomework(inputData);
         setHomeworkData(result);
         setData(null);
      } else {
         setLoadingText("Designing Bilingual Courseware...");
         const result = await generateLessonPlan(inputData);
         setData(result);
         setHomeworkData(null);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (additionalPrompt: string) => {
    if (!formData) return;
    setRegenerating(true);
    try {
      const updatedFormData = { ...formData, additionalPrompt };
      const result = await generateLessonPlan(updatedFormData);
      setData(result);
    } catch (err: any) {
      alert("Failed to regenerate: " + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleUpdateLesson = (updated: LessonPlanResponse) => {
    setData(updated);
  };

  // Safe update method to prevent race conditions between Pre-class and Post-class generation
  const handleSectionUpdate = (sectionName: 'preClass' | 'inClass' | 'postClass', content: SectionContent) => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [sectionName]: content
      };
    });
  };

  const handleBack = () => {
    setData(null);
    setHomeworkData(null);
    setError(null);
    // formData is preserved, so InputForm will pick it up via initialValues
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header - Hidden on Print */}
      {!data && !homeworkData && (
        <header className="bg-white border-b border-slate-200 no-print sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 p-2 rounded-lg shadow-brand-200 shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif font-bold text-xl text-slate-800 tracking-tight">麦迩威教育 <span className="font-sans text-slate-400 font-normal text-base border-l border-slate-300 pl-3 ml-1">AI Lesson Architect</span></span>
            </div>
            <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full hidden sm:block border border-brand-100">
              Professional Teacher Edition
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm relative flex items-start gap-3" role="alert">
             <div className="mt-1">⚠️</div>
             <div>
                <strong className="font-bold block">Generation Error</strong>
                <span className="block sm:inline">{error}</span>
             </div>
          </div>
        )}

        {loading && (
           <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
              <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full text-center">
                 <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-brand-600 animate-pulse" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">{loadingText}</h3>
                 <p className="text-sm text-slate-500">Creating tailored bilingual content...</p>
              </div>
           </div>
        )}

        {!data && !homeworkData ? (
          <div className="max-w-5xl mx-auto">
             <div className="text-center mb-10 space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                   Create World-Class Courseware
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Upload your syllabus, customize for your student, and let AI generate a rigorous, pedagogy-driven lesson plan in seconds.
                </p>
             </div>
             <InputForm 
                initialValues={formData} 
                onSubmit={handleFormSubmit} 
                isLoading={loading} 
             />
          </div>
        ) : homeworkData ? (
           <HomeworkResultView 
             data={homeworkData}
             onBack={handleBack}
           />
        ) : (
          <LessonView 
             data={data!} 
             onBack={handleBack} 
             onRegenerate={handleRegenerate}
             isRegenerating={regenerating}
             onUpdateLesson={handleUpdateLesson}
             onSectionUpdate={handleSectionUpdate}
          />
        )}
      </main>
    </div>
  );
};

export default App;
