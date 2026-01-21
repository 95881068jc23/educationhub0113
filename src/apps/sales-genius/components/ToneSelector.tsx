import React, { useState } from 'react';
import { Smile, Check, Sparkles, Plus } from 'lucide-react';
import { TONE_OPTIONS } from '../constants';

interface ToneSelectorProps {
  selectedTones: string[];
  onChange: (tones: string[]) => void;
  compact?: boolean;
  label?: string;
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({ selectedTones, onChange, compact = false, label }) => {
  const [customToneInput, setCustomToneInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const toggleTone = (toneValue: string) => {
    if (selectedTones.includes(toneValue)) {
      if (selectedTones.length > 1) {
        onChange(selectedTones.filter(t => t !== toneValue));
      }
    } else {
      // Allow multiple selections
      onChange([...selectedTones, toneValue]);
    }
  };

  const handleAddCustomTone = () => {
    if (customToneInput.trim()) {
      const newTone = customToneInput.trim();
      if (!selectedTones.includes(newTone)) {
        onChange([...selectedTones, newTone]);
      }
      setCustomToneInput('');
      setIsAddingCustom(false);
    }
  };

  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`flex items-center justify-center rounded-full ${compact ? 'w-5 h-5 bg-navy-50' : 'w-8 h-8 bg-navy-50'}`}>
          <Smile size={compact ? 12 : 18} className="text-navy-600" />
        </div>
        <label className={`font-bold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {label || 'AI 语气与性格设定 (可多选 & 自定义)'}
        </label>
        {!compact && (
           <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
             已选: {selectedTones.length}
           </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Predefined Tones */}
        {TONE_OPTIONS.map((tone) => {
          const isSelected = selectedTones.includes(tone.value);
          return (
            <button
              key={tone.id}
              onClick={() => toggleTone(tone.value)}
              className={`
                relative flex items-center gap-2 rounded-lg font-bold transition-all duration-200 border
                ${compact 
                  ? 'px-3 py-1.5 text-xs' 
                  : 'px-4 py-2 text-sm shadow-sm hover:-translate-y-0.5'
                }
                ${isSelected
                  ? 'bg-navy-800 text-white border-transparent shadow-navy-200/50 ring-1 ring-gold-500/50'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-navy-50 hover:border-navy-200 hover:text-navy-700'
                }
              `}
            >
              {isSelected && <Check size={compact ? 10 : 14} strokeWidth={3} className="text-gold-400" />}
              {!isSelected && !compact && <span className="w-3.5 h-3.5 rounded-full border border-slate-300"></span>}
              <span>{tone.label.split('(')[0]}</span>
              {isSelected && !compact && (
                <Sparkles size={14} className="absolute -top-1 -right-1 text-gold-400 fill-current animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Render Custom Selected Tones that are NOT in TONE_OPTIONS */}
        {selectedTones.filter(t => !TONE_OPTIONS.some(o => o.value === t)).map((customTone, idx) => (
           <button
              key={`custom-${idx}`}
              onClick={() => toggleTone(customTone)}
              className={`
                relative flex items-center gap-2 rounded-lg font-bold transition-all duration-200 border
                ${compact 
                  ? 'px-3 py-1.5 text-xs' 
                  : 'px-4 py-2 text-sm shadow-sm hover:-translate-y-0.5'
                }
                bg-gold-500 text-white border-transparent shadow-gold-200
              `}
            >
              <Check size={compact ? 10 : 14} strokeWidth={3} />
              <span>{customTone}</span>
              <span className="absolute -top-1 -right-1 bg-white text-gold-600 text-[8px] px-1 rounded-full border border-gold-200">自定义</span>
           </button>
        ))}

        {/* Add Custom Button */}
        {isAddingCustom ? (
          <div className={`flex items-center gap-1 ${compact ? 'h-8' : 'h-10'}`}>
            <input 
              autoFocus
              type="text"
              value={customToneInput}
              onChange={(e) => setCustomToneInput(e.target.value)}
              placeholder="输入自定义人设..."
              className="border border-navy-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-navy-500 w-32 h-full"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTone()}
              onBlur={() => {
                if(!customToneInput) setIsAddingCustom(false);
              }}
            />
            <button 
              onClick={handleAddCustomTone}
              className="bg-navy-600 text-white rounded-lg px-2 h-full hover:bg-navy-700"
            >
              <Check size={14}/>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCustom(true)}
            className={`
              flex items-center gap-1 rounded-lg font-bold text-slate-400 border border-dashed border-slate-300 hover:border-navy-400 hover:text-navy-600 transition-colors
              ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
            `}
          >
            <Plus size={14} /> 自定义
          </button>
        )}
      </div>
    </div>
  );
};