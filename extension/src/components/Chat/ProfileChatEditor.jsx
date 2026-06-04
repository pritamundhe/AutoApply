import React, { useState, useRef, useEffect, useCallback } from 'react'
import Message from './Message'
import ChatInput from './ChatInput'
import { chatUpdateProfile } from '../../services/api'
import { getToken } from '../../services/storage'
import { BsRobot as Bot, BsArrowLeft as ArrowLeft } from 'react-icons/bs'

export default function ProfileChatEditor({ profile, onBack, onProfileUpdated }) {
  const [messages, setMessages] = useState([
    { id: 'init', role: 'bot', content: "Hi! I'm ready to update your profile.\n\nTell me what you'd like to change or add (e.g., 'Add React to my skills', 'Change my location to New York')." }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [inputDisabled, setInputDisabled] = useState(false)
  const bottomRef = useRef(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || inputDisabled) return

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }])
    setInputValue('')
    setInputDisabled(true)
    setIsTyping(true)
    scrollToBottom()

    try {
      const token = await getToken()
      const result = await chatUpdateProfile(text, profile, token)
      
      // Add bot reply
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: result.reply }])
      
      if (result.updatesMade) {
        onProfileUpdated(result.profile)
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: "Oops, something went wrong updating your profile. Please try again." }])
    } finally {
      setIsTyping(false)
      setInputDisabled(false)
      scrollToBottom()
    }
  }

  return (
    <div className="flex flex-col h-[580px] bg-[#0d0d1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] bg-[#000000] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#111111] border border-[#262626] text-white hover:bg-[#1a1a1a] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black">
              <Bot size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">AutoApply AI</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Profile Editor</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.map(msg => (
          <Message key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isTyping && <Message role="bot" isTyping />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSend}
        placeholder="Type what to update..."
        disabled={inputDisabled}
        isTextarea={false}
      />
    </div>
  )
}
