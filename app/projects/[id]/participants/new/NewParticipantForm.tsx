'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  projectId: string
  projectName: string
  groups: string[]
}

const INPUT = 'w-full border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-on-surface placeholder:text-outline/60'
const SELECT = 'w-full border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-on-surface'
const LABEL = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1.5'

export default function NewParticipantForm({ projectId, projectName, groups }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    id: '',
    name: '',
    age: '',
    gender: '',
    group: '',
    screener_answers: '{}',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <div className="px-6 py-6 max-w-xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors mb-3">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span> 뒤로
        </button>
        <h1 className="text-xl font-bold text-on-surface tracking-tight">참여자 추가</h1>
        <p className="text-xs text-on-surface-variant mt-1">{projectName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 glass-card rounded-xl p-5">
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
            rows={6} placeholder='AI로 변환한 JSON 붙여넣기 또는 {} 그대로'
            className={`${INPUT} font-mono resize-none text-xs`} />
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
    </div>
  )
}
