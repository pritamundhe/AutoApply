import React from 'react'
import { BsEnvelope as Mail, BsTelephone as Phone, BsLink45Deg as LinkIcon, BsTextLeft as AlignLeft, BsChevronDown as ChevronDown, BsPencil as Edit2 } from 'react-icons/bs'

export default function FieldCard({ field, value, onChange, index }) {
  const isLong = (value || '').length > 60

  const fieldTypeIcon = {
    email: <Mail size={14} />,
    tel: <Phone size={14} />,
    url: <LinkIcon size={14} />,
    textarea: <AlignLeft size={14} />,
    select: <ChevronDown size={14} />,
    text: <Edit2 size={14} />,
  }
  const icon = fieldTypeIcon[field.type] || <Edit2 size={14} />

  return (
    <div className="animate-fade-in glass-card p-3.5 space-y-2" style={{ animationDelay: `${index * 40}ms` }}>
      {/* Field label */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-300 truncate">{field.label}</p>
          <p className="text-[10px] text-slate-600 truncate">
            {field.type} · ID: {field.id}
          </p>
        </div>
        {value ? (
          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-green-500/15 border border-green-500/25 text-green-400 text-[9px] font-semibold uppercase tracking-wide">
            Mapped
          </span>
        ) : (
          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-500/15 border border-slate-500/25 text-slate-500 text-[9px] font-semibold uppercase tracking-wide">
            Empty
          </span>
        )}
      </div>

      {/* Value input */}
      {field.type === 'select' && field.options?.length > 0 ? (
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="input-field text-xs py-2"
        >
          <option value="">— leave blank —</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.text}</option>
          ))}
        </select>
      ) : isLong ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={2}
          className="input-field text-xs py-2 resize-none"
          placeholder="Leave blank to skip…"
          style={{ minHeight: 52 }}
        />
      ) : (
        <input
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="input-field text-xs py-2"
          placeholder="Leave blank to skip this field…"
        />
      )}
    </div>
  )
}
