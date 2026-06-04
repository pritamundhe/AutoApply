import React, { useState } from 'react'
import Button from '../UI/Button'
import Spinner from '../UI/Spinner'
import { BsRobot as Bot, BsCheckCircle as CheckCircle, BsExclamationTriangle as AlertTriangle, BsFileEarmarkText as FileText, BsCheck as Check } from 'react-icons/bs'

export default function ReviewScreen({ fields, mappings, onConfirm, onCancel, loading, fillResult, pageContext, mapStats }) {
  const [editedMappings, setEditedMappings] = useState({ ...mappings })

  const handleChange = (id, value) => {
    setEditedMappings(prev => ({ ...prev, [id]: value }))
  }

  // Done state
  if (fillResult) {
    const totalFilled = (fillResult.filled || 0) + (fillResult.uploaded || 0)
    const hasHighlightedFiles = fillResult.highlighted > 0

    return (
      <div className="flex flex-col h-[580px] bg-[#000000]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262626]">
          <div className="w-5 h-5 rounded bg-white flex items-center justify-center text-black">
            <Bot size={12} />
          </div>
          <p className="text-sm font-bold text-white">AutoApply AI</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#111111] border border-[#262626] flex items-center justify-center text-white animate-slide-up">
            <CheckCircle size={36} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-bold text-white mb-1">Form Filled!</h2>
            <p className="text-slate-400 text-sm">
              Successfully filled <span className="text-white font-semibold">{totalFilled}</span> fields.
            </p>
          </div>
          
          {hasHighlightedFiles && (
            <div className="animate-slide-up w-full mt-2 p-3 rounded-xl bg-[#111111] border border-[#262626] text-left flex items-start gap-3" style={{ animationDelay: '150ms' }}>
              <span className="text-white shrink-0 leading-none mt-0.5"><AlertTriangle size={20} /></span>
              <div>
                <p className="text-xs text-white font-semibold mb-1">Action Required</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  We highlighted <span className="font-semibold text-white">{fillResult.highlighted}</span> file upload area(s) in purple. Please click them to upload your resume manually.
                </p>
              </div>
            </div>
          )}

          <div className="animate-slide-up glass-card px-5 py-4 w-full mt-2" style={{ animationDelay: '200ms' }}>
            <p className="text-slate-400 text-xs text-center leading-relaxed">
              Review the filled values on the page. Make any final edits before submitting your application.
            </p>
          </div>
          <Button
            variant="secondary"
            fullWidth
            onClick={onCancel}
            className="animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            Done
          </Button>
        </div>
      </div>
    )
  }

  const mappedCount = Object.keys(editedMappings).filter(k => editedMappings[k]).length
  const totalCount = fields.length

  return (
    <div className="flex flex-col h-full bg-[#000000] animate-fade-in relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black">
            <Bot size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Review Fields</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-slate-500 leading-none">
                {mappedCount} of {totalCount} mapped
              </p>
              {pageContext?.portal && pageContext.portal !== 'generic' && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase">
                  {pageContext.portal}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-300 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/5"
        >
          Cancel
        </button>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 custom-scrollbar">
        <div className="space-y-3">
          {fields.map((f, i) => {
            const hasVal = !!editedMappings[f.id]
            const isFile = f.type === 'file' || f.type === 'dropzone'
            
            return (
              <div
                key={f.id}
                className="glass-card p-3 animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {f.label} {f.section && <span className="text-[9px] text-slate-500 ml-1 bg-[#1e1e3a] px-1.5 py-0.5 rounded">in {f.section}</span>}
                </label>
                
                {isFile ? (
                   <div className="text-xs text-white bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 flex items-center gap-2">
                     <span className="text-slate-400"><FileText size={14} /></span> Will attempt to upload stored resume
                   </div>
                ) : (f.type === 'select' || f.type === 'radio') ? (
                  <select
                    className="w-full bg-[#151525] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none"
                    value={editedMappings[f.id] || ''}
                    onChange={(e) => handleChange(f.id, e.target.value)}
                  >
                    <option value="">-- Select an option --</option>
                    {f.options?.map(o => (
                      <option key={o.value} value={o.value}>{o.text}</option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    {f.type === 'textarea' ? (
                      <textarea
                        className="w-full bg-[#151525] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none min-h-[60px]"
                        value={editedMappings[f.id] || ''}
                        onChange={(e) => handleChange(f.id, e.target.value)}
                        placeholder="Leave blank"
                      />
                    ) : (
                      <input
                        type="text"
                        className="w-full bg-[#151525] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        value={editedMappings[f.id] || ''}
                        onChange={(e) => handleChange(f.id, e.target.value)}
                        placeholder="Leave blank"
                      />
                    )}
                    {!hasVal && (
                      <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[#4a4a6a]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3a3a5a]"></div>
                        <span className="text-[10px] font-medium uppercase tracking-wider">Empty</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer / Action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a] to-transparent pt-12">
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          onClick={() => onConfirm(editedMappings)}
          className="shadow-lg"
        >
          {loading ? (
            'Filling Form...'
          ) : (
            <span className="flex items-center justify-center gap-2 text-black">
              Confirm & Fill {mappedCount} Fields
              <Check size={16} strokeWidth={2.5} />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
