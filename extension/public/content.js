/* AutoApply Content Script v5 — Dynamic Form Reader + File Upload Support
 */
(function () {
  'use strict';

  if (window.__autoapplyLoaded) return;
  window.__autoapplyLoaded = true;

  // ─── Portal Detection ──────────────────────────────────────────────────────
  function detectPortal() {
    const h = window.location.hostname.toLowerCase();
    const u = window.location.href.toLowerCase();
    if (h.includes('workday')         || u.includes('myworkdayjobs'))  return 'workday';
    if (h.includes('greenhouse')      || u.includes('greenhouse.io'))  return 'greenhouse';
    if (h.includes('lever.co'))                                         return 'lever';
    if (h.includes('linkedin'))                                         return 'linkedin';
    if (h.includes('indeed'))                                           return 'indeed';
    if (h.includes('icims'))                                            return 'icims';
    if (h.includes('taleo'))                                            return 'taleo';
    if (h.includes('smartrecruiters'))                                  return 'smartrecruiters';
    if (h.includes('ashbyhq'))                                          return 'ashby';
    if (h.includes('jobvite'))                                          return 'jobvite';
    if (h.includes('successfactors'))                                   return 'successfactors';
    if (h.includes('bamboohr'))                                         return 'bamboohr';
    return 'generic';
  }

  // ─── Visibility ────────────────────────────────────────────────────────────
  function isVisible(el) {
    if (!el) return false;
    try {
      const s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 || r.height > 0 || el.offsetWidth > 0;
    } catch { return true; }
  }

  // ─── Clean Text ────────────────────────────────────────────────────────────
  function clean(t) {
    return (t || '').replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function cleanLabel(t) {
    return clean(t).replace(/[*•:]+/g, '').replace(/required/gi, '').trim();
  }

  // ─── AUTOCOMPLETE → label hint ─────────────────────────────────────────────
  const AC_MAP = {
    'given-name': 'First Name', 'additional-name': 'Middle Name',
    'family-name': 'Last Name', 'name': 'Full Name',
    'email': 'Email', 'tel': 'Phone', 'tel-national': 'Phone',
    'organization': 'Company', 'organization-title': 'Job Title',
    'street-address': 'Address', 'address-line1': 'Address',
    'address-level2': 'City', 'address-level1': 'State',
    'postal-code': 'Zip Code', 'country': 'Country', 'country-name': 'Country',
    'url': 'Website', 'bday': 'Date of Birth', 'sex': 'Gender',
  };

  // ─── Label Resolution ──────────────────────────────────────────────────────
  function resolveLabel(el) {
    if (el.id) {
      try {
        const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl) return cleanLabel(lbl.innerText);
      } catch (_) {}
    }
    const wl = el.closest('label');
    if (wl) {
      const cl = wl.cloneNode(true);
      cl.querySelectorAll('input,select,textarea,button,svg').forEach(n => n.remove());
      const t = cleanLabel(cl.innerText);
      if (t) return t;
    }
    const al = el.getAttribute('aria-label');
    if (al) return cleanLabel(al);
    const alby = el.getAttribute('aria-labelledby');
    if (alby) {
      const parts = alby.split(/\s+/)
        .map(id => cleanLabel(document.getElementById(id)?.innerText || ''))
        .filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    const ac = el.getAttribute('autocomplete');
    if (ac && AC_MAP[ac]) return AC_MAP[ac];

    let node = el.parentElement;
    for (let d = 0; d < 6 && node; d++) {
      const lbls = node.querySelectorAll(
        'label,[class*="label" i],[class*="field-name" i],legend,dt,th'
      );
      for (const lbl of lbls) {
        if (!lbl.contains(el)) {
          const t = cleanLabel(lbl.innerText);
          if (t && t.length < 120) return t;
        }
      }
      node = node.parentElement;
    }
    let cur = el;
    for (let d = 0; d < 4; d++) {
      let prev = cur.previousElementSibling;
      while (prev) {
        if (['INPUT','SELECT','TEXTAREA','BUTTON','FORM'].includes(prev.tagName)) break;
        const t = cleanLabel(prev.innerText || prev.textContent);
        if (t && t.length > 0 && t.length < 100) return t;
        prev = prev.previousElementSibling;
      }
      if (cur.parentElement) cur = cur.parentElement; else break;
    }
    return cleanLabel(el.title) || clean(el.placeholder) || el.name || el.id || '';
  }

  // ─── Detect "Upload" labels for file inputs ────────────────────────────────
  const RESUME_KEYWORDS = /resume|cv|curriculum|document|upload|attach|cover.?letter/i;

  function resolveFileLabel(el) {
    const label = resolveLabel(el);
    // Check accept attribute for type hints
    const accept = el.accept || '';
    const hint = accept.includes('pdf') ? 'PDF' : accept.includes('doc') ? 'Document' : 'File';
    return label || `Upload ${hint}`;
  }

  // ─── Section Context ───────────────────────────────────────────────────────
  function getSection(el) {
    let p = el.parentElement;
    for (let i = 0; i < 8 && p; i++) {
      const h = p.querySelector('h1,h2,h3,h4,h5,legend,[class*="section-title" i]');
      if (h && !h.contains(el)) {
        const t = cleanLabel(h.innerText);
        if (t && t.length < 100) return t;
      }
      p = p.parentElement;
    }
    return '';
  }

  // ─── Form Outline (Dynamic Reading Order) ─────────────────────────────────
  function getFormOutline(taggedFields) {
    const fieldIds = new Set(taggedFields.map(f => f.id));
    const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','NAV','FOOTER','HEADER']);
    const BLOCK = new Set(['DIV','SECTION','FORM','FIELDSET','LI','TD','TH','P',
                           'H1','H2','H3','H4','H5','H6','LEGEND','LABEL','ARTICLE','MAIN']);
    const INPUT = new Set(['INPUT','TEXTAREA','SELECT']);
    const seenText = new Set();
    const parts = [];

    function walk(el) {
      if (!el || SKIP.has(el.tagName)) return;
      if (el.nodeType === Node.TEXT_NODE) {
        const t = clean(el.textContent);
        if (t && !seenText.has(t)) { seenText.add(t); parts.push(t); }
        return;
      }
      if (el.nodeType !== Node.ELEMENT_NODE) return;
      if (!isVisible(el)) return;
      if (INPUT.has(el.tagName)) {
        const id = el.dataset?.aaId;
        if (id && fieldIds.has(id)) {
          const typeHint = el.type || el.tagName.toLowerCase();
          parts.push(`[FIELD:${id}|type:${typeHint}]`);
        }
        return;
      }
      const isBlock = BLOCK.has(el.tagName);
      if (isBlock && parts.length && parts[parts.length-1] !== '|') parts.push('|');
      el.childNodes.forEach(c => walk(c));
      if (isBlock && parts.length && parts[parts.length-1] !== '|') parts.push('|');
    }

    const container =
      document.querySelector('form') ||
      document.querySelector('main,[role="main"],#content,.content,article') ||
      document.body;
    walk(container);
    return parts.join(' ').replace(/\|\s*\|/g, '|').replace(/\s+/g, ' ').trim().slice(0, 3000);
  }

  // ─── Tag Elements ──────────────────────────────────────────────────────────
  let counter = 0;
  function tagElements() {
    const SEL = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      'input:not([type="reset"]):not([type="image"])',
      'input:not([type="checkbox"]):not([type="radio"])',
      'textarea','select',
      '[contenteditable="true"]','[role="textbox"]','[role="combobox"]',
    ].join(',');
    document.querySelectorAll(SEL).forEach(el => {
      if (!el.dataset.aaId) el.dataset.aaId = el.id || el.name || `aa_${++counter}`;
    });
  }

  // ─── Scan Fields ───────────────────────────────────────────────────────────
  function scanFields() {
    tagElements();
    const seen = new Set(), fields = [];

    // 1. ── FILE INPUT FIELDS ──────────────────────────────────────────────────
    // Many sites hide the actual <input type="file"> for styling. Do not check isVisible.
    document.querySelectorAll('input[type="file"]').forEach(el => {
      if (!el.dataset.aaId) el.dataset.aaId = el.id || el.name || `aa_${++counter}`;
      const id = el.dataset.aaId;
      if (seen.has(id)) return;
      seen.add(id);

      const label = resolveFileLabel(el);
      const accept = el.accept || '';
      const isResume = RESUME_KEYWORDS.test(label) || RESUME_KEYWORDS.test(accept) || 
                       el.id.toLowerCase().includes('resume') || el.name.toLowerCase().includes('resume');

      fields.push({
        id,
        elementId:   el.id || null,
        elementName: el.name || null,
        type:        'file',
        label,
        accept,
        isResume,
        multiple:   el.multiple || false,
        section:    getSection(el),
        tagName:    'input',
      });
    });

    // 2. ── DRAG-AND-DROP / CUSTOM UPLOAD ZONES ───────────────────────────────
    const DROP_SEL = [
      '[class*="drop" i][class*="zone" i]',
      '[class*="dropzone" i]',
      '[class*="upload" i][class*="area" i]',
      '[class*="file-upload" i]',
      '[data-testid*="upload" i]',
      'button', '[role="button"]' // We will filter these by text
    ].join(',');

    document.querySelectorAll(DROP_SEL).forEach(el => {
      if (!isVisible(el)) return;
      
      const isBtn = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
      const text = clean(el.innerText || el.getAttribute('aria-label') || '').toLowerCase();
      const hasUploadText = /upload|resume|cv|attach|choose file/i.test(text);

      // If it's a generic button, it must have upload text to be considered a dropzone
      if (isBtn && !hasUploadText) return;

      const id = el.dataset.aaId || `drop_${++counter}`;
      el.dataset.aaId = id;
      if (seen.has(id)) return;
      seen.add(id);
      
      const label = cleanLabel(el.innerText || el.getAttribute('aria-label') || 'File Upload Area');
      fields.push({
        id,
        type:    'dropzone',
        label,
        isResume: RESUME_KEYWORDS.test(label) || hasUploadText,
        section: getSection(el),
        tagName: el.tagName.toLowerCase(),
      });
    });

    // 3. ── STANDARD TEXT/SELECT FIELDS ───────────────────────────────────────
    const TEXT_SEL = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      'input:not([type="reset"]):not([type="image"]):not([type="file"])',
      'input:not([type="checkbox"]):not([type="radio"])',
      'textarea','select',
      '[contenteditable="true"]','[role="textbox"]','[role="combobox"]',
    ].join(',');

    document.querySelectorAll(TEXT_SEL).forEach(el => {
      const id = el.dataset.aaId;
      if (!id || seen.has(id) || !isVisible(el)) return;
      
      const label = resolveLabel(el);
      if (!label) return;

      // Skip read-only dummy text inputs used for file upload styling
      if ((el.readOnly || el.disabled) && RESUME_KEYWORDS.test(label) && !label.toLowerCase().includes('link')) {
        return; 
      }

      seen.add(id);

      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || '';
      let type = 'text';
      if (tag === 'select' || role === 'combobox') type = 'select';
      else if (tag === 'textarea' || role === 'textbox') type = 'textarea';
      else if (el.contentEditable === 'true') type = 'contenteditable';
      else type = el.type || 'text';

      fields.push({
        id,
        elementId:    el.id || null,
        elementName:  el.name || null,
        autocomplete: el.getAttribute('autocomplete') || null,
        role:         role || null,
        type,
        label,
        placeholder:  clean(el.placeholder),
        currentValue: el.value || el.innerText || '',
        section:      getSection(el),
        options:      tag === 'select'
          ? Array.from(el.options).filter(o => o.value).map(o => ({ value: o.value, text: cleanLabel(o.text) }))
          : [],
        tagName: tag,
      });
    });

    // 4. ── RADIO BUTTONS ───────────────────────────────────────────────────
    const radioGroups = {};
    document.querySelectorAll('input[type="radio"]').forEach(el => {
      if (!isVisible(el)) return;
      const name = el.name || 'unnamed_group_' + Math.random().toString(36).slice(2, 7);
      if (!radioGroups[name]) radioGroups[name] = [];
      radioGroups[name].push(el);
    });

    Object.entries(radioGroups).forEach(([name, radios]) => {
      let groupLabel = '';
      
      const fieldset = radios[0].closest('fieldset');
      if (fieldset) {
        const legend = fieldset.querySelector('legend');
        if (legend) groupLabel = cleanLabel(legend.innerText);
      }
      
      if (!groupLabel) {
         let cur = radios[0];
         for (let d = 0; d < 4; d++) {
            let prev = cur.previousElementSibling;
            while(prev) {
               if (['INPUT','SELECT','TEXTAREA','BUTTON','FORM'].includes(prev.tagName)) break;
               const t = cleanLabel(prev.innerText || prev.textContent);
               if (t && t.length > 5) { groupLabel = t; break; }
               prev = prev.previousElementSibling;
            }
            if (groupLabel) break;
            if (cur.parentElement) cur = cur.parentElement; else break;
         }
      }

      if (!groupLabel) groupLabel = getSection(radios[0]) || 'Select Option';

      const options = radios.map(r => {
         let txt = '';
         if (r.labels && r.labels.length) txt = cleanLabel(r.labels[0].innerText);
         if (!txt && r.id) {
           const lbl = document.querySelector(`label[for="${CSS.escape(r.id)}"]`);
           if (lbl) txt = cleanLabel(lbl.innerText);
         }
         if (!txt) {
           const wl = r.closest('label');
           if (wl) {
             const cl = wl.cloneNode(true);
             cl.querySelectorAll('input').forEach(n=>n.remove());
             txt = cleanLabel(cl.innerText);
           }
         }
         if (!txt) txt = r.value || '';
         return { value: r.value || txt, text: txt };
      });

      const groupId = `radio_group_${++counter}`;
      radios.forEach(r => {
        if (!r.dataset.aaId) r.dataset.aaId = `radio_${++counter}`;
        r.dataset.aaGroup = groupId;
        seen.add(r.dataset.aaId);
      });

      const id = radios[0].dataset.aaId;
      fields.push({
        id,
        elementId: radios[0].id || null,
        elementName: name,
        type: 'radio',
        label: groupLabel,
        section: getSection(radios[0]),
        options: options.map(o => ({ value: o.value, text: o.text })),
        tagName: 'input'
      });
    });

    // 5. ── CHECKBOXES ────────────────────────────────────────────────────────
    document.querySelectorAll('input[type="checkbox"]').forEach(el => {
      if (!isVisible(el)) return;
      if (!el.dataset.aaId) el.dataset.aaId = el.id || el.name || `aa_${++counter}`;
      const id = el.dataset.aaId;
      if (seen.has(id)) return;
      seen.add(id);

      let label = '';
      if (el.labels && el.labels.length) label = cleanLabel(el.labels[0].innerText);
      if (!label) label = resolveLabel(el);

      fields.push({
        id,
        elementId: el.id || null,
        elementName: el.name || null,
        type: 'checkbox',
        label,
        section: getSection(el),
        tagName: 'input'
      });
    });

    return fields;
  }

  // ─── Fill Standard Text/Radio/Checkbox Fields ────────────────────────────
  function fillSingleField(el, value) {
    if (!value) return false;
    const tag  = el.tagName?.toLowerCase();
    const role = el.getAttribute('role') || '';

    // Handle Radio Buttons
    if (el.type === 'radio') {
      const groupId = el.dataset.aaGroup;
      if (groupId) {
         const radios = Array.from(document.querySelectorAll(`input[type="radio"][data-aa-group="${groupId}"]`));
         const val = value.toLowerCase();
         const match = radios.find(r => (r.value || '').toLowerCase() === val) ||
                       radios.find(r => {
                          const txt = (r.labels && r.labels[0]?.innerText || r.closest('label')?.innerText || '').toLowerCase();
                          return txt.includes(val) || val.includes(txt);
                       });
         if (match) {
            match.checked = true;
            match.dispatchEvent(new Event('change', { bubbles: true }));
            match.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
         }
      }
      return false;
    }

    // Handle Checkboxes
    if (el.type === 'checkbox') {
      const val = value.toLowerCase();
      const shouldCheck = ['yes', 'true', '1', 'on', 'checked'].includes(val) || val === (el.value || '').toLowerCase();
      if (el.checked !== shouldCheck) {
         el.checked = shouldCheck;
         el.dispatchEvent(new Event('change', { bubbles: true }));
         el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return true;
    }

    if (el.contentEditable === 'true' || role === 'textbox') {
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, value);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
      return true;
    }
    if (tag === 'select') {
      const opts = Array.from(el.options);
      const val  = value.toLowerCase();
      const match =
        opts.find(o => o.value.toLowerCase() === val) ||
        opts.find(o => o.text.toLowerCase()  === val) ||
        opts.find(o => o.text.toLowerCase().includes(val)) ||
        opts.find(o => val.includes(o.text.toLowerCase()));
      if (match) { el.value = match.value; el.dispatchEvent(new Event('change', { bubbles: true })); return true; }
      return false;
    }
    if (role === 'combobox') {
      el.focus();
      const ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (ns) ns.call(el, value); else el.value = value;
      ['input','keydown','keyup'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
      setTimeout(() => {
        const opt = Array.from(document.querySelectorAll('[role="option"]'))
          .find(o => o.innerText?.toLowerCase().includes(value.toLowerCase()));
        opt?.click();
      }, 500);
      return true;
    }
    const iDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    const tDesc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    const setter = (el instanceof HTMLTextAreaElement ? tDesc : iDesc)?.set;
    if (setter) setter.call(el, value); else el.value = value;
    el.dispatchEvent(new FocusEvent('focus',      { bubbles: true }));
    el.dispatchEvent(new InputEvent('input',      { bubbles: true, data: value, inputType: 'insertText' }));
    el.dispatchEvent(new Event('change',          { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: value.slice(-1) }));
    el.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, key: value.slice(-1) }));
    el.dispatchEvent(new FocusEvent('blur',       { bubbles: true }));
    return true;
  }

  // ─── ★ Fill File Input via DataTransfer ────────────────────────────────────
  function fillFileField(el, resumeData) {
    try {
      const { base64, name, mimeType } = resumeData;
      // Decode base64 → Uint8Array
      const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const binary = atob(b64);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      // Build File object
      const blob = new Blob([arr], { type: mimeType || 'application/octet-stream' });
      const file = new File([blob], name, { type: mimeType, lastModified: Date.now() });
      // Inject via DataTransfer (works in Chrome)
      const dt = new DataTransfer();
      dt.items.add(file);
      el.files = dt.files;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      return true;
    } catch (err) {
      console.error('[AutoApply] File inject error:', err);
      return false;
    }
  }

  // Highlight a dropzone and show a tooltip
  function highlightDropzone(el) {
    const prev = { outline: el.style.outline, bg: el.style.backgroundColor, pos: el.style.position };
    el.style.outline         = '2.5px dashed rgba(124,58,237,.85)';
    el.style.backgroundColor = 'rgba(124,58,237,.08)';
    el.style.position        = el.style.position || 'relative';
    // Inject temporary label
    const tip = document.createElement('div');
    tip.innerText = '📄 Click here to upload your resume';
    tip.style.cssText = `
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      background:rgba(124,58,237,.9);color:#fff;padding:6px 14px;border-radius:8px;
      font-size:12px;font-weight:600;pointer-events:none;z-index:99999;white-space:nowrap;
    `;
    el.appendChild(tip);
    setTimeout(() => {
      tip.remove();
      el.style.outline = prev.outline;
      el.style.backgroundColor = prev.bg;
    }, 4000);
  }

  // ─── Fill All Text Fields ──────────────────────────────────────────────────
  function fillFields(mappings) {
    let filled = 0, skipped = 0;
    Object.entries(mappings).forEach(([fid, value], i) => {
      if (!value) { skipped++; return; }
      setTimeout(() => {
        const el =
          document.querySelector(`[data-aa-id="${CSS.escape(fid)}"]`) ||
          (fid ? document.getElementById(fid) : null) ||
          document.querySelector(`[name="${CSS.escape(fid)}"]`);
        if (!el || !isVisible(el)) { skipped++; return; }
        const prev = { o: el.style.outline, bg: el.style.backgroundColor, tr: el.style.transition };
        el.style.transition      = 'outline .25s, background-color .25s';
        el.style.outline         = '2.5px solid rgba(124,58,237,.85)';
        el.style.backgroundColor = 'rgba(124,58,237,.07)';
        setTimeout(() => {
          if (fillSingleField(el, value)) filled++; else skipped++;
          setTimeout(() => {
            el.style.outline = '2px solid rgba(124,58,237,.3)';
            setTimeout(() => {
              el.style.outline = prev.o; el.style.backgroundColor = prev.bg; el.style.transition = prev.tr;
            }, 2500);
          }, 350);
        }, 80);
      }, i * 130);
    });
    return { filled, skipped, total: Object.keys(mappings).length };
  }

  // ─── Message Handler ───────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    try {
      switch (msg.type) {
        case 'PING':
          sendResponse({ status: 'ok', url: window.location.href });
          break;

        case 'SCAN_FIELDS': {
          const fields      = scanFields();
          const formOutline = getFormOutline(fields);
          const pageContext = {
            title:       document.title || '',
            url:         window.location.href,
            hostname:    window.location.hostname,
            description: document.querySelector('meta[name="description"]')?.content || '',
            headings:    Array.from(document.querySelectorAll('h1,h2,h3'))
                           .map(h => clean(h.innerText)).filter(t => t && t.length < 120).slice(0, 5),
            portal:      detectPortal(),
            formOutline,
          };
          sendResponse({ success: true, fields, count: fields.length, pageContext });
          break;
        }

        case 'FILL_FIELDS':
          sendResponse({ success: true, ...fillFields(msg.mappings || {}) });
          break;

        // ★ New: fill file inputs with stored resume
        case 'FILL_FILE_FIELDS': {
          const { fileFieldIds = [], resumeData } = msg;
          let uploaded = 0, highlighted = 0, failed = 0;

          fileFieldIds.forEach(fid => {
            const el =
              document.querySelector(`[data-aa-id="${CSS.escape(fid)}"]`) ||
              (fid ? document.getElementById(fid) : null);
            if (!el) { failed++; return; }

            if (el.tagName === 'INPUT' && el.type === 'file') {
              if (resumeData && fillFileField(el, resumeData)) uploaded++;
              else {
                // Highlight and pulse the field so user can click manually
                el.style.outline         = '2.5px solid rgba(124,58,237,.85)';
                el.style.backgroundColor = 'rgba(124,58,237,.07)';
                el.click(); // Try to open file dialog
                highlighted++;
              }
            } else {
              // Dropzone or custom widget — highlight it
              highlightDropzone(el);
              highlighted++;
            }
          });

          sendResponse({ success: true, uploaded, highlighted, failed });
          break;
        }

        default:
          sendResponse({ error: 'Unknown message: ' + msg.type });
      }
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  });

  console.log('[AutoApply v5] File-upload ready on', window.location.hostname);
})();
