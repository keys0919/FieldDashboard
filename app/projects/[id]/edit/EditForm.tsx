'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INPUT = 'w-full border border-outline-variant bg-surface rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/60 placeholder:text-outline/50 transition-colors'
const LABEL = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5'

interface Project {
  id: string
  name: string
  client: string | null
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  screener_schema: unknown[]
  activity_types: unknown[]
  participant_groups: unknown[]
}

function jsonStr(v: unknown) {
  return JSON.stringify(v, null, 2)
}

function tryParse(s: string): { ok: boolean; value?: unknown } {
  try { return { ok: true, value: JSON.parse(s) } }
  catch { return { ok: false } }
}

export default function EditForm({ project }: { project: Project }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: project.name,
    client: project.client ?? '',
    description: project.description ?? '',
    status: project.status,
    start_date: project.start_date ?? '',
    end_date: project.end_date ?? '',
  })

  const [jsonFields, setJsonFields] = useState({
    screener_schema:    jsonStr(project.screener_schema),
    activity_types:     jsonStr(project.activity_types),
    participant_groups: jsonStr(project.participant_groups),
  })

  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({})

  function setField(k: keyof typeof form, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function setJson(k: keyof typeof jsonFields, v: string) {
    setJsonFields(p => ({ ...p, [k]: v }))
    const parsed = tryParse(v)
    setJsonErrors(prev => {
      const next = { ...prev }
      if (parsed.ok) delete next[k]
      else next[k] = 'JSON 형식 오류'
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (Object.keys(jsonErrors).length > 0) {
      setError('JSON 필드를 확인해주세요')
      return
    }

    const screener = tryParse(jsonFields.screener_schema)
    const types    = tryParse(jsonFields.activity_types)
    const groups   = tryParse(jsonFields.participant_groups)
    if (!screener.ok || !types.ok || !groups.ok) {
      setError('JSON 형식을 확인해주세요')
      return
    }

    setSaving(true)
    setError(null)

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        client: form.client,
        description: form.description,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        screener_schema:    screener.value,
        activity_types:     types.value,
        participant_groups: groups.value,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error ?? '저장 실패')
      return
    }

    router.push(`/projects/${project.id}/overview`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* 기본 정보 */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-on-surface">기본 정보</h2>

        <div>
          <label className={LABEL}>프로젝트 이름 *</label>
          <input
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            required
            placeholder="프로젝트 이름"
            className={INPUT}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>고객사</label>
            <input
              value={form.client}
              onChange={e => setField('client', e.target.value)}
              placeholder="고객사명"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>상태</label>
            <select
              value={form.status}
              onChange={e => setField('status', e.target.value)}
              className={INPUT}
            >
              <option value="active">진행 중</option>
              <option value="completed">완료</option>
              <option value="archived">보관</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>시작일</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => setField('start_date', e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>종료일</label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => setField('end_date', e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>설명</label>
          <textarea
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            rows={3}
            placeholder="프로젝트 설명"
            className={`${INPUT} resize-none`}
          />
        </div>
      </div>

      {/* JSON 스키마 */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-on-surface">스키마 설정</h2>
          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant">JSON</span>
        </div>

        {(
          [
            { key: 'screener_schema',    label: '스크리너 질문지' },
            { key: 'activity_types',     label: 'Activity 유형 정의' },
            { key: 'participant_groups', label: '참여자 그룹 값 목록' },
          ] as { key: keyof typeof jsonFields; label: string }[]
        ).map(({ key, label }) => (
          <div key={key}>
            <label className={LABEL}>{label}</label>
            <textarea
              value={jsonFields[key]}
              onChange={e => setJson(key, e.target.value)}
              rows={6}
              spellCheck={false}
              className={`${INPUT} font-mono text-[12px] resize-y ${jsonErrors[key] ? 'border-rose-400 focus:border-rose-400' : ''}`}
            />
            {jsonErrors[key] && (
              <p className="text-[11px] text-rose-500 mt-1">{jsonErrors[key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* 액션 */}
      {error && <p className="text-sm text-rose-500 text-center">{error}</p>}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving || Object.keys(jsonErrors).length > 0}
          className="px-6 py-2 bg-primary text-on-primary text-sm font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
