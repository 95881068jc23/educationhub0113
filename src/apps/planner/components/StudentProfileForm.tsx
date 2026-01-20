
import React, { useState } from 'react';
import { StudentProfile, CEFRLevel, CourseMode, LearningDirection, CustomContentStrategy } from '../types';
import { COMMON_INDUSTRIES, COMMON_ROLES, COMMON_GOALS, COMMON_INTERESTS } from '../constants';

interface Props {
  profile: StudentProfile;
  onChange: (p: StudentProfile) => void;
  onGenerate: () => void;
  isEditingMode?: boolean;
  onCancel?: () => void;
}

const StudentProfileForm: React.FC<Props> = ({ profile, onChange, onGenerate, isEditingMode = false, onCancel }) => {
  // State for Custom Dropdown Entries
  const [customIndustries, setCustomIndustries] = useState<string[]>([]);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);

  // Input states for custom additions
  const [customIndustryInput, setCustomIndustryInput] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [customInterestInput, setCustomInterestInput] = useState('');

  // Mode states for showing text input
  const [isAddingIndustry, setIsAddingIndustry] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingInterest, setIsAddingInterest] = useState(false);

  const handleChange = (field: keyof StudentProfile, value: any) => {
    onChange({ ...profile, [field]: value });
  };

  const toggleDirection = (dir: LearningDirection) => {
    const current = profile.learningDirections;
    if (current.includes(dir)) {
      handleChange('learningDirections', current.filter(d => d !== dir));
    } else {
      handleChange('learningDirections', [...current, dir]);
    }
  };

  // Helper for Multi-Select (Goals, Interests)
  const toggleItem = (field: 'goals' | 'interests', item: string) => {
    const current = profile[field];
    if (current.includes(item)) {
      handleChange(field, current.filter(i => i !== item));
    } else {
      handleChange(field, [...current, item]);
    }
  };

  const addCustomItem = (
    value: string, 
    setCustomList: React.Dispatch<React.SetStateAction<string[]>>, 
    setIsAdding: (v: boolean) => void,
    onSuccess?: (val: string) => void
  ) => {
    if (value.trim()) {
      setCustomList(prev => [...prev, value.trim()]);
      setIsAdding(false);
      if (onSuccess) onSuccess(value.trim());
    }
  };

  const deleteCustomItem = (
    item: string,
    setCustomList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setCustomList(prev => prev.filter(i => i !== item));
    // Also remove from profile if selected
    if (profile.industry === item) handleChange('industry', '');
    if (profile.role === item) handleChange('role', '');
    if (profile.goals.includes(item)) handleChange('goals', profile.goals.filter(g => g !== item));
    if (profile.interests.includes(item)) handleChange('interests', profile.interests.filter(i => i !== item));
  };

  const cefrOptions = Object.values(CEFRLevel);
  const inputClass = "w-full bg-gray-800 text-white border-gray-600 rounded-md shadow-sm focus:ring-gold-500 focus:border-gold-500 p-2 border placeholder-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  
  // Single Select Component with Custom Support
  const SingleSelectSmart = (
    label: string,
    value: string,
    commonOptions: string[],
    customOptions: string[],
    setCustomOptions: React.Dispatch<React.SetStateAction<string[]>>,
    inputValue: string,
    setInputValue: (v: string) => void,
    isAdding: boolean,
    setIsAdding: (v: boolean) => void,
    field: keyof StudentProfile
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      {!isAdding ? (
        <select
          className={inputClass}
          value={value}
          onChange={(e) => {
            if (e.target.value === 'ADD_NEW') {
              setIsAdding(true);
              setInputValue('');
            } else {
              handleChange(field, e.target.value);
            }
          }}
        >
          <option value="">Select / 请选择</option>
          <optgroup label="Common / 常用">
            {commonOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </optgroup>
          {customOptions.length > 0 && (
             <optgroup label="Custom / 自定义">
               {customOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
             </optgroup>
          )}
          <option value="ADD_NEW" className="font-bold text-gold-400">+ Add Custom...</option>
        </select>
      ) : (
        <div className="flex space-x-2">
          <input
            type="text"
            className={inputClass}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter custom value..."
            autoFocus
          />
          <button onClick={() => addCustomItem(inputValue, setCustomOptions, setIsAdding, (v) => handleChange(field, v))} className="bg-gold-500 hover:bg-gold-600 px-3 rounded text-white font-bold">OK</button>
          <button onClick={() => setIsAdding(false)} className="bg-gray-600 px-3 rounded text-white">X</button>
        </div>
      )}
      {/* List of Custom Items to Delete */}
      {customOptions.length > 0 && !isAdding && (
         <div className="mt-1 flex flex-wrap gap-2">
           {customOptions.map(opt => (
             <span key={opt} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded flex items-center">
               {opt}
               <button onClick={() => deleteCustomItem(opt, setCustomOptions)} className="ml-1 text-red-500 hover:text-red-700 font-bold">×</button>
             </span>
           ))}
         </div>
      )}
    </div>
  );

  // Multi Select Component
  const MultiSelectSmart = (
    label: string,
    selected: string[],
    commonOptions: string[],
    customOptions: string[],
    setCustomOptions: React.Dispatch<React.SetStateAction<string[]>>,
    inputValue: string,
    setInputValue: (v: string) => void,
    isAdding: boolean,
    setIsAdding: (v: boolean) => void,
    field: 'goals' | 'interests'
  ) => (
    <div className="col-span-1 md:col-span-3">
       <label className={labelClass}>{label}</label>
       <div className="flex flex-wrap gap-2 mb-2">
          {selected.map(item => (
            <span key={item} className="bg-gold-100 text-gold-800 px-3 py-1 rounded-full text-sm flex items-center">
              {item}
              <button onClick={() => toggleItem(field, item)} className="ml-2 hover:text-red-500">×</button>
            </span>
          ))}
       </div>
       
       <div className="flex gap-2">
          <select 
             className={inputClass} 
             value="" 
             onChange={(e) => {
               const val = e.target.value;
               if (val === 'ADD_NEW') {
                 setIsAdding(true);
                 setInputValue('');
               } else if (val) {
                 toggleItem(field, val);
               }
             }}
          >
             <option value="">+ Add {field === 'goals' ? 'Goal' : 'Interest'}...</option>
             <optgroup label="Common">
                {commonOptions.filter(o => !selected.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
             </optgroup>
             {customOptions.length > 0 && (
                <optgroup label="Custom">
                   {customOptions.filter(o => !selected.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                </optgroup>
             )}
             <option value="ADD_NEW" className="font-bold text-gold-400">+ Create New...</option>
          </select>
       </div>

       {isAdding && (
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              className={inputClass}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type new ${field}...`}
              autoFocus
            />
            <button 
              onClick={() => addCustomItem(inputValue, setCustomOptions, setIsAdding, (v) => toggleItem(field, v))} 
              className="bg-emerald-600 px-4 rounded text-white font-bold"
            >
              Add
            </button>
            <button onClick={() => setIsAdding(false)} className="bg-gray-600 px-4 rounded text-white">Cancel</button>
          </div>
       )}

       {customOptions.length > 0 && (
         <div className="mt-1 flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 self-center">Custom Tags:</span>
            {customOptions.map(opt => (
              <span key={opt} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center border border-gray-200">
                {opt}
                <button onClick={() => deleteCustomItem(opt, setCustomOptions)} className="ml-1 text-red-400 hover:text-red-600">×</button>
              </span>
            ))}
         </div>
       )}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:border-none print:shadow-none ${isEditingMode ? '' : 'animate-fade-in-up'}`}>
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-b border-gray-100 pb-4">
        <span className="bg-emerald-600 w-2 h-6 mr-3 rounded-sm"></span>
        {isEditingMode ? 'Edit Profile / 编辑档案' : '学员档案 / Student Profile'}
      </h2>
      
      {/* Learning Direction - Multi Select */}
      <div className="mb-6">
        <label className={labelClass}>学习方向 (多选) / Learning Direction (Multi-select)</label>
        <div className="flex flex-wrap gap-3">
          {/* Limited to Life and Business only based on user request */}
          {[LearningDirection.Life, LearningDirection.Business].map(dir => (
            <button
              key={dir}
              onClick={() => toggleDirection(dir)}
              className={`px-4 py-2 rounded-full border transition-all ${
                profile.learningDirections.includes(dir)
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-500'
              }`}
            >
              {dir === LearningDirection.Life && "General/Life (生活)"}
              {dir === LearningDirection.Business && "Business (商务)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Basic Info */}
        <div>
          <label className={labelClass}>学员姓名 / Student Name</label>
          <input
            type="text"
            className={inputClass}
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className={labelClass}>当前级别 / Current Level</label>
          <select
            className={inputClass}
            value={profile.currentLevel}
            onChange={(e) => handleChange('currentLevel', e.target.value)}
          >
            {cefrOptions.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>目标级别 / Target Level</label>
          <select
            className={inputClass}
            value={profile.targetLevel}
            onChange={(e) => handleChange('targetLevel', e.target.value)}
          >
            {cefrOptions.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Smart Selects */}
        {SingleSelectSmart(
          "所在行业 / Industry", profile.industry, COMMON_INDUSTRIES, customIndustries, setCustomIndustries, 
          customIndustryInput, setCustomIndustryInput, isAddingIndustry, setIsAddingIndustry, 'industry'
        )}

        {SingleSelectSmart(
          "具体职位 / Role & Job", profile.role, COMMON_ROLES, customRoles, setCustomRoles, 
          customRoleInput, setCustomRoleInput, isAddingRole, setIsAddingRole, 'role'
        )}

        {/* New Job Description Field with Updated Label and Bilingual Placeholder */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
           <label className={labelClass}>生活/工作内容描述 / Life & Job Context (AI Customization Source)</label>
           <textarea
             className={`${inputClass} h-32 leading-relaxed`}
             value={profile.jobDescription || ''}
             onChange={(e) => handleChange('jobDescription', e.target.value)}
             placeholder={`请详细描述您的日常工作内容、生活场景或具体的英语使用痛点。AI将根据这些信息为您定制专属话题。\n(例如：“我每周需要主持英文会议”、“我想在海外旅行时能自信点餐”...)\n\nPlease describe your daily tasks, life scenarios, or specific English challenges. AI will use this to customize topics for you.\n(e.g., "I need to host weekly meetings", "I want to order food confidently while traveling"...)`}
           />
        </div>

        {/* Multi Selects */}
        {MultiSelectSmart(
          "核心目标 / Core Goals (Multi-select)", profile.goals, COMMON_GOALS, customGoals, setCustomGoals,
          customGoalInput, setCustomGoalInput, isAddingGoal, setIsAddingGoal, 'goals'
        )}

        {MultiSelectSmart(
          "兴趣爱好 / Interests (Multi-select)", profile.interests, COMMON_INTERESTS, customInterests, setCustomInterests,
          customInterestInput, setCustomInterestInput, isAddingInterest, setIsAddingInterest, 'interests'
        )}

        <div className="md:col-span-3 border-t border-gray-100 pt-6 mt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Course Mode */}
          <div>
            <label className={labelClass}>上课模式 / Course Mode</label>
            <select
              className={inputClass}
              value={profile.mode}
              onChange={(e) => handleChange('mode', e.target.value as CourseMode)}
            >
              <option value={CourseMode.Private}>1对1私教 / Private (1-on-1)</option>
              <option value={CourseMode.Group}>班课 / Group Class</option>
              <option value={CourseMode.Combo}>混合模式 / Combo (1v1 + Group)</option>
            </select>
          </div>

          {/* Weekly Frequency */}
          <div>
            <label className={labelClass}>上课频率 / Weekly Frequency</label>
            <select
              className={inputClass}
              value={profile.weeklyFrequency || 2}
              onChange={(e) => handleChange('weeklyFrequency', Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <option key={num} value={num}>{num} Session{num > 1 ? 's': ''} / Week ({num}次/周)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Content Strategy (Only for Private) - Hide in Editing Mode to avoid confusion */}
        {profile.mode === CourseMode.Private && !isEditingMode && (
          <div className="md:col-span-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
             <label className="block text-sm font-bold text-gray-800 mb-2">
               初始内容策略 / Content Initialization Strategy
             </label>
             <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="contentStrategy"
                    checked={profile.customContentStrategy === CustomContentStrategy.HighFrequency}
                    onChange={() => handleChange('customContentStrategy', CustomContentStrategy.HighFrequency)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700 text-sm">高频话题 (预设标化) / High Frequency</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="contentStrategy"
                    checked={profile.customContentStrategy === CustomContentStrategy.PureCustom}
                    onChange={() => handleChange('customContentStrategy', CustomContentStrategy.PureCustom)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700 text-sm">纯定制 (空白) / Pure Custom</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="contentStrategy"
                    checked={profile.customContentStrategy === CustomContentStrategy.Hybrid}
                    onChange={() => handleChange('customContentStrategy', CustomContentStrategy.Hybrid)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700 text-sm">混合 (标化+定制) / Hybrid</span>
                </label>
             </div>
             <p className="text-xs text-gray-500 mt-2">
               * Choose how to populate the initial plan. You can always add/remove topics later.
             </p>
          </div>
        )}
      </div>

      {isEditingMode ? (
        <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-6">
           <button
             onClick={onCancel}
             className="bg-white hover:bg-gray-100 text-gray-600 font-bold py-3 px-6 rounded-lg border border-gray-300 transition-colors"
           >
             Cancel / 取消
           </button>
           <button
             onClick={onGenerate}
             className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
           >
             Save Changes / 保存修改
           </button>
        </div>
      ) : (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onGenerate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            Generate Roadmap / 生成课程规划
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentProfileForm;
