import React, { useState } from 'react'
import { BsCloudUpload as UploadCloud, BsFileEarmarkText as FileText } from 'react-icons/bs'
import { parseResume } from '../../services/api'
import { getToken } from '../../services/storage'
import Spinner from '../UI/Spinner'

export default function ResumeUpload({ onComplete }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const token = await getToken()
      const profile = await parseResume(file, token)
      
      // Successfully parsed and saved in backend!
      setTimeout(() => {
        onComplete(profile)
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to process resume. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[580px] bg-[#0d0d1a] relative">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20">
          <FileText size={32} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Upload Resume</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Skip the questions! AutoApply AI will automatically read your resume and build your profile instantly.
        </p>
        
        {loading ? (
          <div className="flex flex-col items-center animate-fade-in">
            <Spinner size="lg" />
            <p className="mt-4 font-semibold text-white">Extracting Profile...</p>
            <p className="text-xs text-slate-500 mt-1">AI is mapping your skills & experience</p>
          </div>
        ) : (
          <label className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#2a2a4a] rounded-2xl bg-[#11111a] hover:bg-[#1a1a2a] hover:border-purple-500/50 transition-all cursor-pointer">
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf"
              onChange={handleFileUpload}
            />
            <div className="w-12 h-12 rounded-full bg-[#1e1e3a] flex items-center justify-center mb-3 group-hover:-translate-y-1 transition-transform">
              <UploadCloud size={20} className="text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Click to upload PDF</p>
            <p className="text-xs text-slate-500 mt-1">Max file size: 5MB</p>
          </label>
        )}
        
        {error && (
          <div className="mt-4 px-4 py-3 w-full bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs animate-slide-up text-left">
            <span className="font-semibold block mb-1">Upload failed</span>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
