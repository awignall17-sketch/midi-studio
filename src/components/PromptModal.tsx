import React, { useState, useEffect } from 'react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  defaultValue: string;
  inputType?: 'text' | 'number' | 'select';
  options?: { label: string; value: string }[];
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptModal({ isOpen, title, message, defaultValue, inputType = 'text', options, onConfirm, onCancel }: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1b20] border border-[#333] rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-[#8E9299]">{message}</p>
        
        {inputType === 'select' && options ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-[#242424] text-white p-3 rounded-lg border border-[#333] outline-none focus:border-[#FF4444] transition-colors"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-[#242424] text-white p-3 rounded-lg border border-[#333] outline-none focus:border-[#FF4444] transition-colors"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm(value);
              if (e.key === 'Escape') onCancel();
            }}
          />
        )}

        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-bold text-[#8E9299] hover:text-white hover:bg-[#333] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-4 py-2 rounded-lg font-bold bg-[#FF4444] text-white hover:bg-[#ff5555] transition-colors"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
