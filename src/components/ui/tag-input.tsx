"use client";

import React, { useState, KeyboardEvent } from "react";
import { Input } from "./input";
import { Badge } from "./badge";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = "Ketik dan tekan Enter..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim().replace(/,/g, "");
    if (trimmedValue && !tags.includes(trimmedValue)) {
      const newTags = [...tags, trimmedValue];
      onChange(newTags);
      setInputValue("");
    } else {
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-slate-50 rounded-2xl border border-slate-100 items-center">
        {tags.length === 0 && (
          <span className="text-xs text-slate-400 ml-2 italic">Belum ada tag ditambahkan</span>
        )}
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none py-1 pl-3 pr-1 flex items-center gap-1 rounded-xl transition-all animate-in fade-in zoom-in duration-200"
          >
            <span className="text-[10px] font-black uppercase tracking-tight">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="p-0.5 hover:bg-emerald-300/50 rounded-full transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={placeholder}
        className="h-12 rounded-xl border-slate-200 font-semibold px-4 focus:ring-emerald-500"
      />
    </div>
  );
}
