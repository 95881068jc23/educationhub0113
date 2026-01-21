
import React, { useState } from 'react';

interface ImportSectionProps {
  onImport: () => void;
  onReset: () => void;
  isImported: boolean;
}

const ImportSection: React.FC<ImportSectionProps> = ({ onImport, onReset, isImported }) => {
  const [loading, setLoading] = useState(false);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onImport();
      }, 1500); // Simulate processing time
    }
  };

  if (isImported) {
    return (
      <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="bg-gold-100 p-2 rounded-full">
            <svg className="w-6 h-6 text-gold-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gold-900">Framework Loaded / 框架已加载</h3>
            <p className="text-sm text-gold-700">MEO/MEV Official Curriculum Data (2024-2025)</p>
          </div>
        </div>
        <button className="text-sm text-gold-700 underline hover:text-gold-900" onClick={onReset}>Reload / 重新加载</button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-navy-200 rounded-xl p-8 text-center bg-navy-50 hover:bg-white hover:border-navy-500 transition-colors cursor-pointer group relative">
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept=".pdf, .xlsx, .xls, .png, .jpg, .jpeg"
        onChange={handleSimulatedUpload}
      />
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
           <svg className="animate-spin h-8 w-8 text-navy-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-navy-700 font-medium">Analyzing File Structure... / 正在分析文件架构...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="bg-navy-100 p-4 rounded-full group-hover:bg-navy-200 transition-colors">
            <svg className="w-8 h-8 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-700">Import Official Curriculum / 导入官方课程体系</h3>
          <p className="text-navy-400 text-sm max-w-sm mx-auto">Supported: PDF, Excel, Image (支持PDF, Excel, 图片)</p>
        </div>
      )}
    </div>
  );
};

export default ImportSection;
