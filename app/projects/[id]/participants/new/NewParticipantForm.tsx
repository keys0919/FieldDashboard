'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScreenerQuestion } from '@/types'

interface Props {
  projectId: string
  projectName: string
  groups: string[]
  screenerSchema: ScreenerQuestion[]
}

const INPUT = 'w-full border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-on-surface placeholder:text-outline/60'
const SELECT = 'w-full border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-on-surface'
const LABEL = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1.5'

function buildTemplate(groups: string[], schema: ScreenerQuestion[]): string {
  const screener_answers: Record<string, string> = {}
  for (const q of schema) screener_answers[q.id] = ''
  return JSON.stringify(
    [
      {
        id: 'P01',
        name: '',
        age: null,
        gender: '',
        group: groups[0] ?? '',
        screener_answers: Object.keys(screener_answers).length > 0 ? screener_answers : {},
      },
    ],
    null,
    2
  )
}

export default function NewParticipantForm({ projectId, projectName, groups, screenerSchema }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const template = buildTemplate(groups, screenerSchema)

  // 개별 추가 state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    id: '', name: '', age: '', gender: '', group: '', screener_answers: '{}',
  })

  // 전체 추가 state
  const [bulkJson, setBulkJson] = useState('')
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSuccess, setBulkSuccess] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let screener_answers
    try {
      screener_answers = JSON.parse(form.screener_answers)
    } catch {
      setError('screener_answers JSON 형식이 올바르지 않습니다')
      setLoading(false)
      return
    }

    const res = await fetch(`/api/projects/${projectId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: form.id,
        name: form.name,
        age: form.age || null,
        gender: form.gender || null,
        group: form.group || null,
        screener_answers,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '오류가 발생했습니다')
      setLoading(false)
      return
    }

    router.push(`/projects/${projectId}/participants/${data.id}`)
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBulkError(null)
    setBulkLoading(true)
    setBulkSuccess(null)

    let parsed
    try {
      parsed = JSON.parse(bulkJson)
    } catch {
      setBulkError('JSON 형식이 올바르지 않습니다')
      setBulkLoading(false)
      return
    }

    if (!Array.isArray(parsed)) {
      setBulkError('JSON 배열 형식이어야 합니다 ([ ... ])')
      setBulkLoading(false)
      return
    }

    const res = await fetch(`/api/projects/${projectId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    })

    const data = await res.json()
    if (!res.ok) {
      setBulkError(data.error ?? '오류가 발생했습니다')
      setBulkLoading(false)
      return
    }

    setBulkSuccess(data.inserted)
    setBulkLoading(false)
    setTimeout(() => router.push(`/projects/${projectId}/participants`), 1500)
  }

  function handleCopy() {
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="px-6 py-6 max-w-xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors mb-3"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span> 뒤로
        </button>
        <h1 className="text-xl font-bold text-on-surface tracking-tight">참여자 추가</h1>
        <p className="text-xs text-on-surface-variant mt-1">{projectName}</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-4 bg-surface-container-low rounded-xl p-1">
        {(['single', 'bulk'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === t
                ? 'bg-white text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t === 'single' ? '개별 추가' : '전체 추가'}
          </button>
        ))}
      </div>

      {/* 개별 추가 */}
      {tab === 'single' && (
        <form onSubmit={handleSingleSubmit} className="space-y-5 glass-card rounded-xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>ID <span className="text-rose-400">*</span></label>
              <input type="text" value={form.id} onChange={e => set('id', e.target.value)}
                placeholder="P01" className={`${INPUT} font-mono`} required />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>이름 <span className="text-rose-400">*</span></label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="홍길동" className={INPUT} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>나이</label>
              <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                placeholder="32" min={1} max={99} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>성별</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className={SELECT}>
                <option value="">선택</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>그룹</label>
              {groups.length > 0 ? (
                <select value={form.group} onChange={e => set('group', e.target.value)} className={SELECT}>
                  <option value="">선택</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <input type="text" value={form.group} onChange={e => set('group', e.target.value)}
                  placeholder="그룹명" className={INPUT} />
              )}
            </div>
          </div>

          <hr className="border-outline-variant/40" />

          <div>
            <label className={LABEL}>스크리너 답변 (JSON)</label>
            <textarea value={form.screener_answers} onChange={e => set('screener_answers', e.target.value)}
              rows={6} className={`${INPUT} font-mono resize-none text-xs`} />
            <p className="text-[10px] text-on-surface-variant mt-1.5 opacity-60">스크리너 확정 전에는 {} 그대로 두고 나중에 수정하세요</p>
          </div>

          {error && (
            <div className="bg-error-container border border-rose-200 text-on-error-container text-xs rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-on-primary text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '저장 중...' : '참여자 추가'}
          </button>
        </form>
      )}

      {/* 전체 추가 */}
      {tab === 'bulk' && (
        <div className="space-y-3">
          {/* 스키마 템플릿 */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className={`${LABEL} mb-0`}>스키마 템플릿</p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:opacity-70 transition-opacity"
              >
                <span className="material-symbols-outlined text-[12px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
            <pre className="text-[10px] font-mono bg-surface-container rounded-lg p-3 overflow-auto max-h-48 text-on-surface-variant leading-relaxed">
              {template}
            </pre>
            {screenerSchema.length > 0 && (
              <div className="pt-2 border-t border-outline-variant/40 space-y-1.5">
                <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">스크리너 질문 ID</p>
                {screenerSchema.map(q => (
                  <div key={q.id} className="flex items-start gap-2">
                    <span className="font-mono text-[10px] text-primary shrink-0">{q.id}</span>
                    <span className="text-[10px] text-on-surface-variant">{q.label}
                      {q.options && q.options.length > 0 && (
                        <span className="text-outline/60"> ({q.options.join(' / ')})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* JSON 입력 */}
          <form onSubmit={handleBulkSubmit} className="glass-card rounded-xl p-5 space-y-4">
            <div>
              <label className={LABEL}>참여자 JSON 붙여넣기 <span className="text-rose-400">*</span></label>
              <textarea
                value={bulkJson}
                onChange={e => setBulkJson(e.target.value)}
                rows={12}
                placeholder={template}
                className={`${INPUT} font-mono resize-y text-xs`}
                required
              />
            </div>

            {bulkError && (
              <div className="bg-error-container border border-rose-200 text-on-error-container text-xs rounded-lg px-4 py-3">
                {bulkError}
              </div>
            )}

            {bulkSuccess !== null && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg px-4 py-3">
                {bulkSuccess}명 추가 완료. 참여자 목록으로 이동합니다...
              </div>
            )}

            <button
              type="submit"
              disabled={bulkLoading || !bulkJson.trim()}
              className="w-full py-2.5 bg-primary text-on-primary text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {bulkLoading ? '저장 중...' : '전체 추가'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
