'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_ACTIVITY_TYPES = JSON.stringify([
  { key: 'survey', label: '스크리닝 설문' },
  { key: 'diary', label: '유저 다이어리' },
  { key: 'field', label: '현장 관찰' },
  { key: 'idi', label: '심층 인터뷰' },
], null, 2)

const INPUT = 'w-full border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-on-surface placeholder:text-outline/60'
const LABEL = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1.5'

export default function NewProjectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    client: '',
    description: '',
    start_date: '',
    end_date: '',
    participant_groups: '',
    activity_types: DEFAULT_ACTIVITY_TYPES,
    screener_schema: '[]',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const participant_groups = form.participant_groups
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    let activity_types, screener_schema
    try {
      activity_types = JSON.parse(form.activity_types)
      screener_schema = JSON.parse(form.screener_schema)
    } catch {
      setError('activity_types 또는 screener_schema JSON 형식이 올바르지 않습니다')
      setLoading(false)
      return
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        client: form.client,
        description: form.description,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        participant_groups,
        activity_types,
        screener_schema,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '오류가 발생했습니다')
      setLoading(false)
      return
    }

    router.push(`/projects/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="glass-header sticky top-0 z-10 border-b border-outline-variant/60 h-14 flex items-center px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="w-px h-4 bg-outline-variant mx-0.5" />
          <span className="text-sm font-bold text-on-surface">새 프로젝트</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <section className="glass-card rounded-xl p-5 space-y-4">
            <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">기본 정보</h2>
            <div>
              <label className={LABEL}>프로젝트 이름 <span className="text-rose-400">*</span></label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="예: (HMC) Mobile First" className={INPUT} required />
            </div>
            <div>
              <label className={LABEL}>고객사</label>
              <input type="text" value={form.client} onChange={e => set('client', e.target.value)}
                placeholder="예: 현대자동차" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>설명</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={2} className={`${INPUT} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>시작일</label>
                <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>종료일</label>
                <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={INPUT} />
              </div>
            </div>
          </section>

          {/* 참여자 그룹 */}
          <section className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">참여자 그룹</h2>
            <div>
              <label className={LABEL}>그룹 목록</label>
              <input type="text" value={form.participant_groups} onChange={e => set('participant_groups', e.target.value)}
                placeholder="쉼표로 구분 — 예: IVI 중심, Mobile First, Mobile Only" className={INPUT} />
              <p className="text-[10px] text-on-surface-variant mt-1.5 opacity-60">그룹이 없으면 비워두세요</p>
            </div>
          </section>

          {/* Activity 유형 */}
          <section className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">Activity 유형</h2>
            <div>
              <label className={LABEL}>activity_types (JSON)</label>
              <textarea value={form.activity_types} onChange={e => set('activity_types', e.target.value)}
                rows={8} className={`${INPUT} font-mono resize-none text-xs`} />
            </div>
          </section>

          {/* 스크리너 스키마 */}
          <section className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">스크리너 스키마</h2>
            <div>
              <label className={LABEL}>screener_schema (JSON)</label>
              <textarea value={form.screener_schema} onChange={e => set('screener_schema', e.target.value)}
                rows={4} placeholder='[] 또는 AI로 변환한 JSON 붙여넣기'
                className={`${INPUT} font-mono resize-none text-xs`} />
              <p className="text-[10px] text-on-surface-variant mt-1.5 opacity-60">
                스크리너 확정 전에는 [] 그대로 두고 나중에 수정하세요
              </p>
            </div>
          </section>

          {error && (
            <div className="bg-error-container border border-rose-200 text-on-error-container text-xs rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-on-primary text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '저장 중...' : '프로젝트 만들기'}
          </button>
        </form>
      </div>
    </div>
  )
}
