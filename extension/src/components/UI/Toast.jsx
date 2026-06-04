import React, { useEffect } from 'react'
import { BsCheckCircle as CheckCircle2, BsExclamationCircle as AlertCircle, BsInfoCircle as Info, BsExclamationTriangle as AlertTriangle } from 'react-icons/bs'

const ICONS = { 
  success: <CheckCircle2 size={16} />, 
  error: <AlertCircle size={16} />, 
  info: <Info size={16} />, 
  warning: <AlertTriangle size={16} /> 
}
const COLORS = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  info:    'border-purple-500/30 bg-purple-500/10 text-purple-300',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
}

export default function Toast({ message, type = 'info', onClose, duration = 3500 }) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm animate-fade-in ${COLORS[type] ?? COLORS.info}`}
    >
      <span className="shrink-0">{ICONS[type]}</span>
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={onClose}
        className="shrink-0 opacity-50 hover:opacity-90 transition-opacity text-lg leading-none ml-1"
      >
        ×
      </button>
    </div>
  )
}
