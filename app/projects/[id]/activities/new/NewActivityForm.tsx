'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ActivityType { key: string; label: string }
interface Participant { id: string; name: string }

interface Props {
  projectId: string
  projectName: string
  activityTypes: ActivityType[]
  participants: Participant[]
  defaultDate: string
}

const INPUT = 'w-full border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-on-surface placeholder:text-outline/60'
const SELECT = 'w-full border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-on-surface'
const LABEL = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1.5'

export default function NewActivityForm({ projectId, projectName, activityTypes, participants, defaultDate }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    participant_id: '',
    type_key: activityTypes[0]?.key ?? '',
    date: defaultDate || new Date().toISOString().slice(0, 10),
    start_time: '',
    end_time: '',
    status: 'scheduled',
    diary_day: '',
  })

  const isDiary = form.type_key.includes('diary')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function getTitle() {
    const p = form.participant_id
    const t = activityTypes.find(a => a.key === form.type_key)?.label ?? form.type_key
    return p ? `${p} ${t}` : t
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch(`/api/projects/${projectId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        title: getTitle(),
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        diary_day: isDiary && form.diary_day ? Number(form.diary_day) : null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '오류가 발생했습니다')
      setLoading(false)
      return
    }

    router.push(`/projects/${projectId}/activities/${data.id}`)
  }

  return (
    <div className="px-6 py-6 max-w-xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors mb-3">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span> 뒤로
        </button>
        <h1 className="text-xl font-bold text-on-surface tracking-tight">Activity 추가</h1>
        <p className="text-xs text-on-surface-variant mt-1">{projectName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 glass-card rounded-xl p-5">
        <div>
          <label className={LABEL}>참여자 <span className="text-rose-400">*</span></label>
          <select value={form.participant_id} onChange={e => set('participant_id', e.target.value)}
            className={SELECT} required>
            <option value="">선택</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Activity 유형 <span className="text-rose-400">*</span></label>
          <select value={form.type_key} onChange={e => set('type_key', e.target.value)}
            className={SELECT} required>
            {activityTypes.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>날짜 <span className="text-rose-400">*</span></label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className={INPUT} required />
        </div>

        {isDiary && (
          <div>
            <label className={LABEL}>다이어리 Day <span className="text-rose-400">*</span></label>
            <input
              type="number" min={1} max={30}
              value={form.diary_day}
              onChange={e => set('diary_day', e.target.value)}
              placeholder="예: 1"
              className={INPUT}
              required={isDiary}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>시작 시간</label>
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>종료 시간</label>
            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={INPUT} />
          </div>
        </div>

        <div>
          <label className={LABEL}>상태</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={SELECT}>
            <option value="scheduled">예정</option>
            <option value="submitted">제출 완료</option>
            <option value="completed">완료</option>
            <option value="not_submitted">미제출</option>
            <option value="delayed">지연</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        {form.participant_id && (
          <p className="text-[10px] text-on-surface-variant font-mono">제목: {getTitle()}</p>
        )}

        {error && (
          <div className="bg-error-container border border-rose-200 text-on-error-container text-xs rounded-lg px-4 py-3">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-primary text-on-primary text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? '저장 중...' : 'Activity 추가'}
        </button>
      </form>
    </div>
  )
}
