'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Activity {
  id: string
  project_id: string
  participant_id: string
  type_key: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  status: string
  content: Record<string, unknown>
  researcher_note: string | null
}

interface Quote {
  id: string
  text: string
  context: string | null
  tags: string[]
}

interface Props {
  projectId: string
  activity: Activity
  typeLabel: string
  quotes: Quote[]
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: '예정' },
  { value: 'submitted', label: '제출 완료' },
  { value: 'completed', label: '완료' },
  { value: 'not_submitted', label: '미제출' },
  { value: 'delayed', label: '지연' },
  { value: 'cancelled', label: '취소' },
]

const STATUS_CHIP: Record<string, string> = {
  scheduled: 'bg-surface-container-high text-on-surface-variant',
  submitted: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-sky-50 text-sky-700',
  not_submitted: 'bg-rose-50 text-rose-700',
  delayed: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-surface-container text-outline',
}

export default function ActivityDetail({ projectId, activity, typeLabel, quotes }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(activity.status)
  const [savingStatus, setSavingStatus] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [showImport, setShowImport] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setSavingStatus(true)
    setStatus(newStatus)
    await fetch(`/api/projects/${projectId}/activities/${activity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setSavingStatus(false)
  }

  async function handleImport() {
    setJsonError(null)
    setImporting(true)

    let parsed: { activity?: Record<string, unknown>; quotes?: unknown[] }
    try {
      parsed = JSON.parse(jsonInput)
    } catch {
      setJsonError('JSON 형식이 올바르지 않습니다')
      setImporting(false)
      return
    }

    if (!parsed.activity && !parsed.quotes) {
      setJsonError('{ "activity": {...}, "quotes": [...] } 형식이 필요합니다')
      setImporting(false)
      return
    }

    const updates: Record<string, unknown> = {}
    if (parsed.activity?.content) updates.content = parsed.activity.content
    if (parsed.activity?.status) updates.status = parsed.activity.status
    if (parsed.activity?.researcher_note) updates.researcher_note = parsed.activity.researcher_note

    if (Object.keys(updates).length > 0) {
      const res = await fetch(`/api/projects/${projectId}/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const d = await res.json()
        setJsonError(d.error ?? 'Activity 저장 실패')
        setImporting(false)
        return
      }
    }

    if (parsed.quotes?.length) {
      const res = await fetch(`/api/projects/${projectId}/activities/${activity.id}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotes: parsed.quotes }),
      })
      if (!res.ok) {
        const d = await res.json()
        setJsonError(d.error ?? 'Quote 저장 실패')
        setImporting(false)
        return
      }
    }

    setImporting(false)
    setShowImport(false)
    setJsonInput('')
    router.refresh()
  }

  const hasContent = Object.keys(activity.content).length > 0

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] text-on-surface-variant mb-1.5 font-mono flex items-center gap-1.5 flex-wrap">
            <Link href={`/projects/${projectId}/participants/${activity.participant_id}`}
              className="hover:text-on-surface transition-colors font-bold">
              {activity.participant_id}
            </Link>
            <span className="text-outline">·</span>
            <span>{typeLabel}</span>
            <span className="text-outline">·</span>
            <span>{activity.date}</span>
            {activity.start_time && (
              <><span className="text-outline">·</span><span>{activity.start_time.slice(0, 5)}</span></>
            )}
          </p>
          <h1 className="text-xl font-bold text-on-surface tracking-tight truncate">{activity.title}</h1>
        </div>
        <select
          value={status}
          onChange={e => handleStatusChange(e.target.value)}
          disabled={savingStatus}
          className={`text-[10px] px-2.5 py-1.5 rounded-full border-0 font-bold uppercase tracking-wide cursor-pointer focus:outline-none shrink-0 ${STATUS_CHIP[status] ?? 'bg-surface-container-high text-on-surface-variant'}`}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <section className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">결과 데이터</h2>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-1 text-xs text-secondary hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">{showImport ? 'close' : 'upload'}</span>
            {showImport ? '닫기' : 'JSON 가져오기'}
          </button>
        </div>

        {showImport && (
          <div className="mb-5 space-y-3">
            <textarea
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              rows={10}
              placeholder={'{\n  "activity": { "content": {...} },\n  "quotes": [...]\n}'}
              className="w-full border border-outline-variant bg-surface-container rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 resize-none text-on-surface"
            />
            {jsonError && (
              <div className="bg-error-container border border-rose-200 text-on-error-container text-xs rounded-lg px-4 py-3">
                {jsonError}
              </div>
            )}
            <button
              onClick={handleImport}
              disabled={importing || !jsonInput.trim()}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {importing ? '저장 중...' : '저장'}
            </button>
          </div>
        )}

        {hasContent ? (
          <pre className="text-xs text-on-surface bg-surface-container rounded-lg p-4 overflow-auto whitespace-pre-wrap font-mono leading-relaxed">
            {JSON.stringify(activity.content, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-on-surface-variant opacity-60">데이터 없음 — JSON 가져오기로 입력하세요</p>
        )}
      </section>

      {/* Quotes */}
      <section className="glass-card rounded-xl p-5">
        <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-4">
          발화 ({quotes.length})
        </h2>
        {quotes.length === 0 ? (
          <p className="text-sm text-on-surface-variant opacity-60">없음 — JSON 가져오기에 quotes 포함 시 자동 저장</p>
        ) : (
          <div className="space-y-4">
            {quotes.map(q => (
              <div key={q.id} className="border-l-2 border-primary-fixed pl-4">
                <p className="text-[10px] font-mono text-outline mb-1">{q.id}</p>
                <p className="text-sm text-on-surface leading-relaxed">"{q.text}"</p>
                {q.context && <p className="text-xs text-on-surface-variant mt-1">{q.context}</p>}
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {q.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {activity.researcher_note && (
        <section className="glass-card rounded-xl p-5">
          <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-3">리서처 노트</h2>
          <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{activity.researcher_note}</p>
        </section>
      )}
    </div>
  )
}
