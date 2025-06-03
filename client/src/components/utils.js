export const extractProblemTitle = () => {
  const url = window.location.href
  const match = /\/problems\/([^/]+)/.exec(url)
  const slug = match ? match[1] : 'unknown-problem'

  // const title =
  //   document.querySelector("#\\32 dafdd0d-01b4-ec31-128b-3e1b97529304 > div > div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div.flex.items-start.justify-between.gap-4 > div.flex.items-start.gap-2 > div")?.textContent || slug
   
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
  // const submissionContainer = document.querySelector('div.h-full.overflow-auto');
  //   if (!submissionContainer) return null;

  //   const firstSubmission = submissionContainer.querySelector('a.group');
  //   if (!firstSubmission) return null;

  //   return (firstSubmission.innerText.trim().split('\n'));

    const resultEl = document.querySelector('[data-e2e-locator="submission-result"]');
      if (resultEl) 
      return resultEl.innerText;
}