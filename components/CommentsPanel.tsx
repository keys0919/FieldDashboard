'use client'

import { useState, useEffect, useRef } from 'react'

interface Comment {
  id: string
  author_type: 'researcher' | 'client'
  content: string
  created_at: string
}

interface Props {
  apiBase: string
  objectType: string
  objectId: string
  authorType: 'researcher' | 'client'
}

const AUTHOR_LABEL: Record<string, string> = {
  researcher: '리서처',
  client: '클라이언트',
}

const AUTHOR_CHIP: Record<string, string> = {
  researcher: 'bg-violet-100 text-violet-700',
  client: 'bg-sky-100 text-sky-700',
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function CommentsPanel({ apiBase, objectType, objectId, authorType }: Props) {
  const [open, setOpen]       = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchComments()
  }, [])  // mount 시 카운트 표시용

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}?object_type=${objectType}&object_id=${encodeURIComponent(objectId)}`)
      if (res.ok) setComments(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_type: objectType, object_id: objectId, content: trimmed }),
      })
      if (res.ok) {
        const created = await res.json()
        setComments(prev => [...prev, created])
        setContent('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(cid: string, commentAuthor: string) {
    if (!canDelete(commentAuthor)) return
    await fetch(`${apiBase}/${cid}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== cid))
  }

  function canDelete(commentAuthor: string) {
    if (authorType === 'researcher') return true
    return commentAuthor === 'client'
  }

  return (
    <div className="mt-8 print:hidden border-t border-outline-variant/40 pt-5">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors group"
      >
        <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
        <span>커멘트</span>
        {comments.length > 0 && (
          <span className="text-xs font-mono bg-surface-container-high px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
        <span
          className="material-symbols-outlined text-[14px] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {/* 목록 */}
          {loading ? (
            <p className="text-xs text-on-surface-variant opacity-40">불러오는 중...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-on-surface-variant opacity-40">아직 커멘트가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3 group/item">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full h-fit shrink-0 mt-0.5 ${AUTHOR_CHIP[c.author_type]}`}>
                    {AUTHOR_LABEL[c.author_type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{fmtTime(c.created_at)}</p>
                  </div>
                  {canDelete(c.author_type) && (
                    <button
                      onClick={() => handleDelete(c.id, c.author_type)}
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 self-start mt-0.5 text-on-surface-variant hover:text-rose-500"
                      title="삭제"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 입력 */}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
              }}
              placeholder="커멘트 입력 (Enter 전송 · Shift+Enter 줄바꿈)"
              rows={2}
              className="flex-1 text-sm border border-outline-variant rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary/60 resize-none bg-surface text-on-surface placeholder:text-on-surface-variant/40"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="px-4 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-35 transition-opacity"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
