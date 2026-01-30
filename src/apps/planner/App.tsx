
import React, { useState } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import ImportSection from './components/ImportSection';
import StudentProfileForm from './components/StudentProfileForm';
import PlanBuilder from './components/PlanBuilder';
import { MarvellousLogo, Watermark } from './components/Icons';
import { StudentProfile, CEFRLevel, CourseMode, LearningDirection } from './types';

const App: React.FC = () => {
  const [isSystemLoaded, setIsSystemLoaded] = useState(false);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    currentLevel: CEFRLevel.A2,
    targetLevel: CEFRLevel.B2,
    learningDirections: [LearningDirection.Life, LearningDirection.Business], // Defaults
    industry: '',
    role: '',
    jobDescription: '', // New field
    interests: [],
    goals: [], // Now array
    sessionDurationMinutes: 60,
    mode: CourseMode.Private,
    weeklyFrequency: 2,
    topicsPerSession: 1
  });

  const handleDownloadPDF = () => {
    // Select the main content area for PDF generation
    const element = document.querySelector('main');
    if (!element) return;

    // Use querySelectorAll to remove any manual styles that might have been applied previously
    const modules = document.querySelectorAll('.module-container');
    modules.forEach((mod) => {
         (mod as HTMLElement).style.pageBreakAfter = '';
    });

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number], // Top, Left, Bottom, Right
      filename: `${profile.name || 'Student'}_Marvellous_Plan.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true, 
        scrollY: 0,
        onclone: (clonedDoc: Document) => {
            // Hide elements marked for exclusion in PDF
            const excluded = clonedDoc.querySelectorAll('.pdf-exclude');
            excluded.forEach((el: any) => el.style.display = 'none');
        }
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      // 'avoid-all' tries to avoid breaking elements, 'css' respects break-inside-avoid
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } 
    };

    // Use html2pdf library
    html2pdf().set(opt as any).from(element).save();
  };

  const handleDownloadImage = async () => {
    const element = document.querySelector('main');
    if (!element) return;

    try {
      const canvas = await html2canvas(element as HTMLElement, { 
          scale: 2, 
          useCORS: true, 
          scrollY: 0,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
              // Hide elements marked for exclusion in Image as well (consistent with PDF)
              const excluded = clonedDoc.querySelectorAll('.pdf-exclude');
              excluded.forEach((el: any) => el.style.display = 'none');
          }
      });
      const link = document.createElement('a');
      link.download = `${profile.name || 'Student'}_Marvellous_Plan.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Image generation failed:", err);
      alert("Could not generate image. Please try again.");
    }
  };

  const handleSystemReset = () => {
    setIsSystemLoaded(false);
    setHasGeneratedPlan(false);
    // Optional: Reset profile or keep it? Keeping it for UX.
  };

  return (
    <div className={`min-h-screen ${isPreviewMode ? 'bg-white' : 'bg-navy-50'} font-sans text-navy-900 pb-24 print:bg-white print:pb-0`}>
      {/* Header - Hidden in Preview */}
      <header className={`${!isPreviewMode ? 'block' : 'hidden'} bg-white shadow-sm sticky top-0 z-30 print:hidden`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <MarvellousLogo className="h-10" />
             <div className="hidden md:block h-6 w-px bg-navy-200"></div>
             <span className="hidden md:block text-navy-400 text-sm font-medium tracking-wide">学员课程规划系统</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-navy-400 hidden sm:block">v5.8.4</div>
            {hasGeneratedPlan && (
               <button 
                onClick={() => setIsPreviewMode(true)}
                className="bg-navy-700 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-800 shadow-md transition-transform transform hover:scale-105"
               >
                 Print Preview / 打印预览 (Export)
               </button>
            )}
          </div>
        </div>
      </header>

      {/* Preview Toolbar - Visible Only in Preview */}
      <div className={`${isPreviewMode ? 'block' : 'hidden'} sticky top-0 z-50 bg-navy-900 text-white p-4 flex justify-between items-center print:hidden`}>
         <div className="font-bold text-xl">Print Preview / 打印预览</div>
         <div className="flex space-x-4">
           <button onClick={handleDownloadPDF} className="bg-navy-600 hover:bg-navy-700 px-4 py-2 rounded font-bold shadow-lg flex items-center text-sm">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             Save PDF / 保存PDF
           </button>
           <button onClick={handleDownloadImage} className="bg-gold-500 hover:bg-gold-600 px-4 py-2 rounded font-bold shadow-lg flex items-center text-sm">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             Save Image / 保存图片
           </button>
           <button onClick={() => setIsPreviewMode(false)} className="bg-navy-400 hover:bg-navy-500 px-6 py-2 rounded text-sm">
             Close / 关闭
           </button>
         </div>
      </div>

      <main className={`mx-auto ${isPreviewMode ? 'max-w-5xl p-8 bg-white relative' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'} space-y-8 print:p-0 print:space-y-6 print:max-w-none print:mt-0`}>
        
        {/* Proposal Header - Visible in Preview */}
        <div className={`${isPreviewMode ? 'block' : 'hidden'} border-b-2 border-navy-800 mb-8 pb-4 pt-2 relative z-10 overflow-hidden break-inside-avoid`}>
           {/* Add Watermark to Header Section */}
           <Watermark />
           
           <div className="flex justify-between items-end mb-6 relative z-10">
              <MarvellousLogo className="h-16" />
              <div className="text-right text-navy-400 text-sm">
                <div>Intelligent Course Planning System</div>
                <div className="font-semibold text-navy-700">https://www.marvelenglish.com.cn/</div>
              </div>
           </div>
           
           <h1 className="text-4xl font-bold text-navy-900 mt-4 relative z-10">Course Proposal / 课程规划书</h1>
           <div className="grid grid-cols-2 gap-4 mt-6 text-navy-700 bg-navy-50 p-6 rounded-lg border border-navy-100 relative z-10">
             <div><strong>Student:</strong> {profile.name}</div>
             <div className="pdf-exclude"><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
             <div><strong>Target:</strong> {profile.currentLevel} → {profile.targetLevel}</div>
             <div><strong>Focus:</strong> {profile.learningDirections.join(', ')}</div>
             <div><strong>Frequency:</strong> {profile.weeklyFrequency}x / week</div>
             {profile.jobDescription && (
                <div className="col-span-2 mt-2 pt-2 border-t border-navy-200 text-sm pdf-exclude">
                   <strong>Job Context:</strong> {profile.jobDescription}
                </div>
             )}
           </div>
        </div>

        {/* Edit Mode Components - Hidden in Preview */}
        <div className={`${!isPreviewMode ? 'block' : 'hidden'} space-y-8`}>
           {/* Step 1: System Init */}
           {!hasGeneratedPlan && (
             <ImportSection 
               onImport={() => setIsSystemLoaded(true)} 
               onReset={handleSystemReset}
               isImported={isSystemLoaded} 
             />
           )}

           {isSystemLoaded && (
             <>
               {/* Step 2: Student Profile */}
               <section className={hasGeneratedPlan ? 'hidden' : 'animate-fade-in-up'}>
                 <StudentProfileForm 
                   profile={profile} 
                   onChange={setProfile} 
                   onGenerate={() => setHasGeneratedPlan(true)}
                 />
               </section>
               
               {/* Generated Profile Summary Card */}
               {hasGeneratedPlan && (
                  <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden">
                    <div className="px-6 py-4 bg-navy-50 border-b border-navy-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="bg-gold-500 w-1.5 h-6 rounded-full"></span>
                            <h2 className="text-lg font-bold text-navy-800">{profile.name}'s Profile</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowEditModal(true)} className="flex items-center px-3 py-1.5 text-sm font-medium text-navy-700 bg-white border border-navy-200 rounded hover:bg-navy-50 transition-colors">
                                <span className="mr-1">✏️</span> Modify Info / 修改信息
                            </button>
                            <button onClick={() => setHasGeneratedPlan(false)} className="flex items-center px-3 py-1.5 text-sm font-medium text-navy-400 hover:text-red-600 transition-colors" title="This will reset current plan">
                                <span className="mr-1">🔄</span> Reset / 重置 <span className="text-[10px] ml-1 opacity-70">(⚠️ Will Reset Plan)</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <div className="text-xs text-navy-400 uppercase tracking-wide font-bold mb-1">Industry & Role / 行业与职位</div>
                            <div className="text-sm font-medium text-navy-900">{profile.industry || 'N/A'}</div>
                            <div className="text-sm text-navy-600">{profile.role || 'N/A'}</div>
                        </div>
                        
                        <div>
                            <div className="text-xs text-navy-400 uppercase tracking-wide font-bold mb-1">Mode & Frequency / 模式与频率</div>
                            <div className="text-sm font-medium text-navy-900">{profile.mode} Course</div>
                            <div className="text-sm text-navy-600">{profile.weeklyFrequency} Sessions / Week</div>
                        </div>

                        <div>
                            <div className="text-xs text-navy-400 uppercase tracking-wide font-bold mb-1">Learning Direction / 学习方向</div>
                            <div className="flex flex-wrap gap-1">
                                {profile.learningDirections.map(d => (
                                    <span key={d} className="px-2 py-0.5 bg-navy-50 text-navy-800 text-xs rounded border border-navy-100">{d}</span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-navy-400 uppercase tracking-wide font-bold mb-1">Core Goals / 核心目标</div>
                            <div className="flex flex-wrap gap-1">
                                {profile.goals.length > 0 ? profile.goals.map(g => (
                                    <span key={g} className="px-2 py-0.5 bg-navy-50 text-navy-700 text-xs rounded border border-navy-100">{g}</span>
                                )) : <span className="text-navy-300 text-xs">None specified</span>}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <div className="text-xs text-navy-400 uppercase tracking-wide font-bold mb-1">Interests / 兴趣爱好</div>
                            <div className="flex flex-wrap gap-1">
                                {profile.interests.length > 0 ? profile.interests.map(i => (
                                    <span key={i} className="px-2 py-0.5 bg-gold-50 text-gold-700 text-xs rounded border border-gold-100">{i}</span>
                                )) : <span className="text-navy-300 text-xs">None specified</span>}
                            </div>
                        </div>

                        {profile.jobDescription && (
                            <div className="col-span-1 md:col-span-2">
                                <div className="text-xs text-navy-400 uppercase tracking-wide font-bold mb-1">Job Description / 工作内容</div>
                                <p className="text-sm text-navy-600 bg-navy-50 p-2 rounded border border-navy-100 italic">
                                    "{profile.jobDescription}"
                                </p>
                            </div>
                        )}
                    </div>
                  </div>
               )}
             </>
           )}
        </div>

        {/* Plan Builder - Always rendered when plan exists to preserve state */}
        {isSystemLoaded && hasGeneratedPlan && (
           <div className={`${!isPreviewMode ? 'animate-fade-in-up' : ''} relative z-10`}>
             {!isPreviewMode && (
               <div className="flex items-center justify-between mb-4 print:mt-8">
                 <h2 className="text-xl font-bold text-navy-800">Course Roadmap / 课程路线图</h2>
                 <div className="text-sm font-bold bg-gold-100 text-gold-800 px-3 py-1 rounded-full">
                   {profile.currentLevel} <span className="text-gold-600 mx-1">➜</span> {profile.targetLevel}
                 </div>
               </div>
             )}
             <PlanBuilder profile={profile} isSystemLoaded={isSystemLoaded} isPreviewMode={isPreviewMode} />
           </div>
        )}

        {/* Safe Edit Modal */}
        {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print:hidden">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <StudentProfileForm 
                        profile={profile}
                        onChange={setProfile}
                        onGenerate={() => setShowEditModal(false)}
                        isEditingMode={true}
                        onCancel={() => setShowEditModal(false)}
                    />
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
