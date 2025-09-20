import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function MultiSelect({ options, value, onChange, placeholder = 'Select...' }) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleUnselect = (itemToRemove) => {
    onChange(value.filter((item) => item !== itemToRemove));
  };

  const handleSelect = (itemToAdd) => {
    if (!value.includes(itemToAdd)) {
      onChange([...value, itemToAdd]);
    }
    setInputValue('');
  };

  const filteredOptions = options.filter(
    (option) =>
      !value.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex flex-wrap items-center gap-2 p-1 border rounded-md bg-slate-800 border-slate-700 min-h-[40px] cursor-text" 
        onClick={() => {
          setIsOpen(true);
          containerRef.current?.querySelector('input')?.focus();
        }}
      >
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 gap-1">
            {item}
            <button
              type="button"
              className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                handleUnselect(item);
              }}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-grow bg-transparent outline-none text-white placeholder:text-slate-400 p-1"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-white"
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-slate-400">No options found.</div>
          )}
        </div>
      )}
    </div>
  );
}