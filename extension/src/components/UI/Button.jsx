import React from 'react'

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon = null,
  fullWidth = false,
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none select-none shrink-0'

  const variantMap = {
    primary:
      'btn-primary text-white',
    secondary:
      'btn-secondary',
    danger:
      'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50',
    ghost:
      'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5',
    success:
      'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20',
  }

  const sizeMap = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-sm gap-2',
    xl: 'px-7 py-3.5 text-base gap-2.5',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variantMap[variant] ?? variantMap.primary} ${sizeMap[size] ?? sizeMap.md} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <svg
          className="animate-spin shrink-0"
          style={{ width: 15, height: 15 }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
