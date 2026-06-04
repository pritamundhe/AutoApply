import React, { useState, useEffect } from 'react'
import { useFormFill } from '../hooks/useFormFill'
import { useAuth } from '../hooks/useAuth'
import { getResume, setResume, clearResume } from '../services/storage'
import ReviewScreen from '../components/Review/ReviewScreen'
import Button from '../components/UI/Button'
import Spinner from '../components/UI/Spinner'
import Toast from '../components/UI/Toast'
import { BsPerson as User, BsBoxArrowRight as LogOut, BsSearch as Search, BsRobot as Bot, BsCheckCircle as CheckCircle2, BsLightningCharge as Zap, BsPencil as Edit2, BsExclamationTriangle as AlertTriangle, BsFileEarmarkText as FileText, BsStars as Sparkles, BsCloudUpload as UploadCloud } from 'react-icons/bs'

const SKILL_COLORS = ['purple', 'blue', 'indigo', 'violet']

function SkillTag({ skill }) {
  return (
    <span className="px-2 py-0.5 rounded-md bg-[#111111] border border-[#262626] text-white text-[11px] font-medium">
      {skill}
    </span>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#262626] last:border-0">
      <span className="text-slate-500 text-xs font-medium w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-slate-200 text-xs flex-1 break-words leading-relaxed">{value}</span>
    </div>
  )
}

export default function Dashboard({ user, profile, onLogout, onEditProfile }) {
  const { logout } = useAuth()
  const { loading, fields, mappings, setMappings, step, error, fillResult, pageContext, mapStats, scanAndMap, fillForm, reset } = useFormFill(profile)
  const [toast, setToast] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [resume, setResumeState] = useState(null)

  useEffect(() => {
    getResume().then(setResumeState)
  }, [])

  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  const handleFillClick = async () => {
    await scanAndMap()
  }

  const handleConfirm = async (confirmed) => {
    await fillForm(confirmed)
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large. Max 5MB allowed.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const resumeData = {
        base64: reader.result,
        name: file.name,
        mimeType: file.type || 'application/pdf',
        size: file.size,
        updatedAt: Date.now()
      };
      await setResume(resumeData);
      setResumeState(resumeData);
      showToast('Resume saved successfully', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleResumeRemove = async () => {
    await clearResume();
    setResumeState(null);
    showToast('Resume removed', 'info');
  }

  // Show review screen
  if (step === 'reviewing' || step === 'filling' || step === 'done') {
    return (
      <ReviewScreen
        fields={fields}
        mappings={mappings}
        onConfirm={handleConfirm}
        onCancel={reset}
        loading={step === 'filling'}
        fillResult={step === 'done' ? fillResult : null}
        pageContext={pageContext}
        mapStats={mapStats}
      />
    )
  }

  const skills = Array.isArray(profile?.skills) ? profile.skills : []
  const firstName = (user?.name || profile?.fullName || '').split(' ')[0] || 'there'

  return (
    <div className="flex flex-col h-[580px] bg-[#000000]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/>
              <path d="M14.247 14.269c1.01 0 1.587-.857 1.587-2.025v-.21C15.834 10.43 14.64 9 12.52 9h-.035C10.42 9 9 10.36 9 12.432v.214C9 14.82 10.438 16 12.358 16h.044c.594 0 1.018-.074 1.237-.175v-.73c-.245.11-.673.18-1.18.18h-.044c-1.334 0-2.571-.788-2.571-2.655v-.157c0-1.657 1.058-2.724 2.64-2.724h.04c1.535 0 2.484 1.05 2.484 2.326v.118c0 .975-.324 1.39-.639 1.39-.232 0-.41-.148-.41-.42v-2.19h-.906v.569h-.03c-.084-.298-.368-.63-.954-.63-.778 0-1.259.555-1.259 1.4v.528c0 .892.49 1.434 1.26 1.434.471 0 .896-.227 1.014-.643h.043c.118.42.617.648 1.12.648m-2.453-1.588v-.227c0-.546.227-.791.573-.791.297 0 .572.192.572.708v.367c0 .573-.253.744-.564.744-.354 0-.581-.215-.581-.8Z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-extrabold text-white leading-none">AutoApply</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Ready to fill</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowProfile(p => !p)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#262626] transition-all text-sm"
            title="View profile"
          >
            <User size={16} />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="px-4 pt-3">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Welcome */}
        <div className="animate-slide-up">
          <h1 className="text-xl font-bold text-white">
            Hey, {firstName}!
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Open a job application and fill it in one click.
          </p>
        </div>

        {/* CTA Button */}
        <div className="animate-slide-up" style={{ animationDelay: '60ms' }}>
          {(step === 'scanning' || step === 'mapping') ? (
            <div className="glass-card p-5 flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <div className="text-center">
                <p className="text-white font-semibold text-sm">
                  {step === 'scanning' ? 'Scanning page for form fields…' : 'DeepSeek AI is mapping your data…'}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {step === 'scanning'
                    ? 'Detecting inputs, selects, and custom widgets'
                    : `Analyzing ${fields.length} detected field${fields.length !== 1 ? 's' : ''} intelligently`}
                </p>
                {pageContext?.portal && pageContext.portal !== 'generic' && (
                  <span className="mt-2 px-2.5 py-1 rounded-lg bg-white text-black text-[10px] font-semibold uppercase tracking-wide">
                    {pageContext.portal} detected
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              id="fill-form-btn"
              onClick={handleFillClick}
              disabled={loading}
              className="w-full group relative overflow-hidden rounded-2xl p-px bg-[#262626] hover:bg-[#404040] shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div className="relative rounded-[14px] bg-[#0a0a0a] group-hover:bg-[#111111] transition-colors px-6 py-5 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-black shadow-lg">
                  <Sparkles size={24} />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-base">Fill Application Form</p>
                  <p className="text-slate-400 text-xs mt-0.5">AI will detect &amp; fill all fields automatically</p>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <p className="text-white font-bold text-lg leading-none">{skills.length || '—'}</p>
                    <p className="text-slate-600 text-[10px]">Skills</p>
                  </div>
                  <div className="w-px h-6 bg-[#262626]" />
                  <div>
                    <p className="text-white font-bold text-lg leading-none">{profile?.yearsOfExperience?.replace(/[^0-9+]/g, '') || '—'}</p>
                    <p className="text-slate-600 text-[10px]">Yrs Exp</p>
                  </div>
                  <div className="w-px h-6 bg-[#262626]" />
                  <div>
                    <p className="text-white font-bold text-lg leading-none">AI</p>
                    <p className="text-slate-600 text-[10px]">Powered</p>
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Error */}
        {step === 'error' && error && (
          <div className="animate-fade-in flex items-start gap-2 px-3 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
            <span className="shrink-0 mt-0.5"><AlertTriangle size={16} /></span>
            <div>
              <p className="font-semibold mb-0.5">Could not fill form</p>
              <p className="text-red-400/70">{error}</p>
              <button onClick={reset} className="mt-2 text-red-400 underline text-xs">Try again</button>
            </div>
          </div>
        )}

        {/* Profile Summary (collapsible) */}
        {showProfile && (
          <div className="animate-fade-in glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Profile</p>
              <button
                onClick={onEditProfile}
                className="text-white flex items-center gap-1 text-xs hover:text-slate-300 font-medium transition-colors"
              >
                Edit <Edit2 size={12} />
              </button>
            </div>
            <div className="px-4 divide-y divide-[#262626]">
              <InfoRow label="Name" value={profile?.fullName} />
              <InfoRow label="Email" value={profile?.email} />
              <InfoRow label="Phone" value={profile?.phone} />
              <InfoRow label="Location" value={profile?.location} />
              <InfoRow label="Title" value={profile?.currentTitle} />
              <InfoRow label="Experience" value={profile?.yearsOfExperience} />
              <InfoRow label="Degree" value={profile?.education?.degree} />
              <InfoRow label="Institution" value={profile?.education?.institution} />
              {profile?.linkedinUrl && <InfoRow label="LinkedIn" value={profile.linkedinUrl} />}
              {profile?.portfolioUrl && <InfoRow label="Portfolio" value={profile.portfolioUrl} />}
            </div>
            {skills.length > 0 && (
              <div className="px-4 py-3 border-t border-[#262626]">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => <SkillTag key={s} skill={s} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resume Manager */}
        {!showProfile && (
          <div className="animate-slide-up glass-card px-4 py-3" style={{ animationDelay: '90ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Resume</p>
            </div>
            {resume ? (
              <div className="flex items-center justify-between p-2.5 bg-[#111111] rounded-xl border border-[#262626]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-slate-400 shrink-0"><FileText size={20} /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{resume.name}</p>
                    <p className="text-[10px] text-slate-500">Updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <label className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Update Resume">
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </label>
                  <button onClick={handleResumeRemove} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#262626] rounded-xl cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all group">
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud size={16} className="text-slate-400 group-hover:text-white" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Upload your Resume</p>
                <p className="text-[10px] text-slate-500 mt-0.5">PDF, DOC, DOCX up to 5MB</p>
              </label>
            )}
          </div>
        )}


      </div>
    </div>
  )
}
