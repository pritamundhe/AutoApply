import React from 'react'
import { BsRobot as Bot, BsPerson as User } from 'react-icons/bs'

// Renders bold **text** markers in a simple inline way
const formatContent = (text) => {
  if (!text) return null
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function Message({ role, content, isTyping }) {
  const isBot = role === 'bot'

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} animate-slide-up`}>
      <div className={`flex gap-3 max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div
          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
            isBot ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : 'bg-[#1e1e3a] text-slate-300'
          }`}
        >
          {isBot ? <Bot size={16} /> : <User size={16} />}
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
            isBot
              ? 'bg-[#1a1a2e] text-slate-300 rounded-tl-sm border border-[#262640]'
              : 'bg-purple-600 text-white rounded-tr-sm'
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 h-5 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{formatContent(content)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
