'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Doc {
  label: string
  url: string
  type: string
}

interface Props {
  projectId: string
  documents: Doc[]
}

const TYPE_ICON: Record<string, string> = {
  guide:   'record_voice_over',
  survey:  'assignment',
  consent: 'handshake',
  plan:    'description',
  other:   'link',
}

const TYPE_LABEL: Record<string, string> = {
  guide:   '인터뷰 가이드',
  survey:  '설문지',
  consent: '동의서',
  plan:    '연구 계획서',
  other:   '기타',
}

export default function RefDocsDropdown({ projectId, documents }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors ${
          open
            ? 'border-primary text-primary bg-primary/5'
            : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-[14px]">attach_file</span>
        참조 문서
        <span className="material-symbols-outlined text-[12px] transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden">
          <p className="px-4 py-2.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/50">
            참조 문서
          </p>

          {documents.length === 0 ? (
            <div className="px-4 py-5 flex flex-col gap-2">
              <p className="text-xs text-on-surface-variant">등록된 문서가 없습니다.</p>
              <Link
                href={`/projects/${projectId}/resources`}
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                자료실에서 추가하기 →
              </Link>
            </div>
          ) : (
            <div className="py-1 max-h-72 overflow-y-auto">
              {documents.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors group"
                >
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">
                    {TYPE_ICON[doc.type] ?? 'link'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                      {doc.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">
                      {TYPE_LABEL[doc.type] ?? doc.type}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
                    open_in_new
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
