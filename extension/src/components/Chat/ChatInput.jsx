import React, { useRef, useEffect } from 'react'
import { BsArrowUp as Send } from 'react-icons/bs'

export default function ChatInput({ value, onChange, onSubmit, placeholder, disabled, isTextarea }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="p-3 bg-[#0a0a14] border-t border-[#1e1e3a]">
      <div className="relative flex items-end gap-2 bg-[#141424] rounded-2xl border border-[#2a2a4a] focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all p-1.5 shadow-inner">
        {isTextarea ? (
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            className="flex-1 bg-transparent text-slate-200 text-sm px-3 py-2 outline-none resize-none placeholder:text-slate-500 disabled:opacity-50"
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent text-slate-200 text-sm px-3 py-2.5 outline-none placeholder:text-slate-500 disabled:opacity-50"
          />
        )}
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-[#2a2a4a] disabled:text-slate-500 text-white flex items-center justify-center transition-colors mb-0.5 mr-0.5"
        >
          <Send size={16} className={value.trim() && !disabled ? 'animate-pulse-glow' : ''} />
        </button>
      </div>
    </div>
  )
}
