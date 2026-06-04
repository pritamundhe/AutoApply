import { useState } from 'react'
import { mapFields as apiMapFields } from '../services/api'
import { getToken } from '../services/storage'

// step: 'idle' | 'scanning' | 'mapping' | 'reviewing' | 'filling' | 'done' | 'error'

export function useFormFill(profile) {
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState([])
  const [mappings, setMappings] = useState({})
  const [step, setStep] = useState('idle')
  const [error, setError] = useState(null)
  const [fillResult, setFillResult] = useState(null)
  const [pageContext, setPageContext] = useState(null)
  const [mapStats, setMapStats] = useState(null)

  const isExt = typeof chrome !== 'undefined' && !!chrome?.tabs

  const scanAndMap = async () => {
    setLoading(true)
    setStep('scanning')
    setError(null)
    setFields([])
    setMappings({})
    setFillResult(null)
    setPageContext(null)
    setMapStats(null)

    try {
      if (!isExt) throw new Error('Chrome extension APIs not available. Load in Chrome.')

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error('Could not get the active tab.')

      // Ensure content script is ready (inject if needed)
      try {
        const ping = await Promise.race([
          chrome.tabs.sendMessage(tab.id, { type: 'PING' }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500)),
        ])
        if (ping?.status !== 'ok') throw new Error('not ready')
      } catch {
        // Inject content script
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] })
          await new Promise(r => setTimeout(r, 400))
        } catch (injectErr) {
          throw new Error(
            `Cannot access this page. Try navigating to the application form and clicking again. (${injectErr.message})`
          )
        }
      }

      // ─── Scan fields + page context ───────────────────────────────────────
      setStep('scanning')
      const scanRes = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FIELDS' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Page scan timed out')), 8000)),
      ])

      if (!scanRes?.success) {
        throw new Error(scanRes?.error || 'Field scan failed. Refresh the page and try again.')
      }

      const detected = scanRes.fields || []
      const ctx = scanRes.pageContext || {}

      if (!detected.length) {
        throw new Error(
          'No form fields detected on this page.\n\nMake sure you are on a job application form page, not a job listing page.'
        )
      }

      setFields(detected)
      setPageContext(ctx)
      setStep('mapping')

      // ─── AI field mapping ─────────────────────────────────────────────────
      const token = await getToken()
      const result = await apiMapFields(detected, profile, token, ctx)

      setMappings(result.mapping || {})
      setMapStats({
        portal: result.portal,
        fieldsDetected: result.fieldsDetected,
        fieldsMapped: result.fieldsMapped,
      })
      setStep('reviewing')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const fillForm = async (confirmedMappings) => {
    setStep('filling')
    setLoading(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      // 1. Fill standard fields
      const res = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FIELDS',
        mappings: confirmedMappings,
      })

      // 2. Fill file fields
      const fileFields = fields.filter(f => f.type === 'file' || f.type === 'dropzone');
      const resumeFields = fileFields.filter(f => f.isResume);
      
      let fileRes = { uploaded: 0, highlighted: 0, failed: 0 };
      if (resumeFields.length > 0) {
        const { getResume } = await import('../services/storage');
        const resumeData = await getResume();
        
        fileRes = await chrome.tabs.sendMessage(tab.id, {
          type: 'FILL_FILE_FIELDS',
          fileFieldIds: resumeFields.map(f => f.id),
          resumeData: resumeData || null,
        });
      }

      setFillResult({
        ...res,
        uploaded: fileRes.uploaded || 0,
        highlighted: fileRes.highlighted || 0
      })

      // 3. Save memory for future runs
      try {
        const { saveMemory } = await import('../services/api');
        const memoryPayload = Object.entries(confirmedMappings)
          .map(([id, value]) => {
            const field = fields.find(f => f.id === id);
            return field && value ? { label: field.label, value } : null;
          })
          .filter(Boolean);
        
        if (memoryPayload.length > 0) {
          const token = await getToken();
          await saveMemory(memoryPayload, token);
        }
      } catch (memErr) {
        console.error('Failed to save memory:', memErr);
      }

      setStep('done')
    } catch (err) {
      setError(err.message)
      setStep('reviewing')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('idle')
    setFields([])
    setMappings({})
    setError(null)
    setFillResult(null)
    setPageContext(null)
    setMapStats(null)
    setLoading(false)
  }

  return {
    loading, fields, mappings, setMappings,
    step, error, fillResult,
    pageContext, mapStats,
    scanAndMap, fillForm, reset,
  }
}
