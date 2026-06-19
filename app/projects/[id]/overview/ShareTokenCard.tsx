'use client'

import { useState } from 'react'

export default function ShareTokenCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${token}`
    : `/share/${token}`

  async function handleCopy() {
    const fullUrl = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant">
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">link</span>
      <span className="text-[12px] font-mono text-on-surface-variant truncate flex-1">/share/{token}</span>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80 transition-opacity shrink-0"
      >
        <span className="material-symbols-outlined text-[14px]">
          {copied ? 'check' : 'content_copy'}
        </span>
        {copied ? '복사됨' : 'URL 복사'}
      </button>
    </div>
  )
}
