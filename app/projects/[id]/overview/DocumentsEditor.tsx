'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Doc { label: string; url: string; type: string }

const DOC_TYPES = [
  { value: 'plan',    label: '연구 계획서' },
  { value: 'guide',   label: '인터뷰 가이드' },
  { value: 'survey',  label: '설문지' },
  { value: 'consent', label: '동의서' },
  { value: 'other',   label: '기타' },
]

const INPUT = 'border border-outline-variant bg-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-on-surface'

export default function DocumentsEditor({ projectId, initialDocuments }: {
  projectId: string
  initialDocuments: Doc[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ label: '', url: '', type: 'plan' })

  async function saveDocuments(docs: Doc[]) {
    setSaving(true)
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: docs }),
    })
    setSaving(false)
    router.refresh()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim() || !form.url.trim()) return
    await saveDocuments([...initialDocuments, { ...form, label: form.label.trim(), url: form.url.trim() }])
    setForm({ label: '', url: '', type: 'plan' })
    setShowForm(false)
  }

  async function handleDelete(idx: number) {
    await saveDocuments(initialDocuments.filter((_, i) => i !== idx))
  }

  return (
    <div className="print:hidden">
      <button
        onClick={() => setShowForm(v => !v)}
        className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[13px]">{showForm ? 'close' : 'add'}</span>
        {showForm ? '닫기' : '문서 추가'}
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-3 space-y-2 bg-surface-container rounded-xl p-4 border border-outline-variant">
          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className={INPUT}
            >
              {DOC_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              placeholder="문서 이름 *"
              required
              className={`col-span-2 ${INPUT}`}
            />
          </div>
          <input
            value={form.url}
            onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
            placeholder="URL *"
            type="url"
            required
            className={`w-full ${INPUT}`}
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 bg-primary text-on-primary text-[11px] font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? '저장 중...' : '추가'}
          </button>
        </form>
      )}

      {/* 삭제 버튼 (문서가 있을 때) */}
      {initialDocuments.length > 0 && (
        <div className="mt-3 space-y-1">
          {initialDocuments.map((doc, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-surface-container group">
              <span className="text-[11px] text-on-surface-variant truncate">{doc.label}</span>
              <button
                onClick={() => handleDelete(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-rose-500"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
