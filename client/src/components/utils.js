export const extractProblemTitle = () => {
  const url = window.location.href
  const match = /\/problems\/([^/]+)/.exec(url)
  const slug = match ? match[1] : 'unknown-problem' 
  return slug;
}

export const extractProblemStatement = () => {
  const leetcodeEl = document.querySelector('meta[name=description]')
  const gfgEl = document.querySelector('.problem-statement')
  return (leetcodeEl?.getAttribute('content') || gfgEl?.textContent || '').trim()
}

export const extractCode = () => {
  const codeLines = document.querySelectorAll('.view-lines.monaco-mouse-cursor-text')
  return Array.from(codeLines)
    .map(line => line.textContent || '')
    .join('\n')
    .trim()
}

export const extractLanguage = () => {
  const langBtn = document.querySelector("#editor > div.lc-md\\:pl-1.lc-md\\:pr-1.flex.h-8.items-center.justify-between.border-b.py-1.pl-\\[10px\\].pr-\\[10px\\].border-border-quaternary.dark\\:border-border-quaternary > div.flex.h-full.flex-nowrap.items-center > div:nth-child(1) > button")
  return langBtn?.textContent?.trim() || 'Unknown'
}

export const extractTestCases = () => {
  const preEls = document.querySelectorAll(".cm-content")
  return Array.from(preEls)
    .map(pre => pre.textContent || '')
    .filter(Boolean)
 
}


export const extractVerdict=()=>{
    const resultEl = document.querySelector('[data-e2e-locator="submission-result"]');
      if (resultEl) 
      return resultEl.innerText;
}
