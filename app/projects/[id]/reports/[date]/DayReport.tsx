'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Activity {
  id: string; participant_id: string; type_key: string; title: string
  date: string; start_time: string | null; status: string
  content: Record<string, unknown>; researcher_note: string | null
}
interface Quote { id: string; activity_id: string; text: string; context: string | null; tags: string[] }
interface Summary {
  id: string; scope: string; submitted_participants: string[]; pending_participants: string[]
  key_patterns: string[]; representative_quotes: string[]
  notable_cases: string | null; next_focus: string | null
}
interface Finding { id: string; type: string; title: string; description: string | null }
interface ParticipantRow { id: string; name: string; age: number | null; gender: string | null; group: string | null }

const STATUS_LABEL: Record<string, string> = {
  scheduled: '예정', submitted: '제출', completed: '완료',
  not_submitted: '미제출', delayed: '지연', cancelled: '취소',
}
const STATUS_CHIP: Record<string, string> = {
  scheduled:     'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  submitted:     'bg-emerald-50 text-emerald-700 border border-emerald-100',
  completed:     'bg-sky-50 text-sky-700 border border-sky-100',
  not_submitted: 'bg-rose-50 text-rose-700 border border-rose-100',
  delayed:       'bg-amber-50 text-amber-700 border border-amber-100',
  cancelled:     'bg-surface-container text-outline border border-outline-variant',
}
const FINDING_TYPE_LABEL: Record<string, string> = {
  observation: '관찰', pattern: '패턴', insight: '인사이트', rqmt_candidate: 'RQMT 후보',
}
const FINDING_CHIP: Record<string, string> = {
  observation:    'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  pattern:        'bg-indigo-50 text-indigo-700 border border-indigo-100',
  insight:        'bg-violet-50 text-violet-700 border border-violet-100',
  rqmt_candidate: 'bg-orange-50 text-orange-700 border border-orange-100',
}

function typeIcon(typeKey: string) {
  return typeKey.includes('diary') ? 'edit_note' : 'location_on'
}

function SectionLabel({ num, title, action }: { num: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="print-section-label flex items-center gap-3 mb-5">
      <span className="text-[10px] font-bold text-on-surface-variant font-mono tracking-widest opacity-50">{num}</span>
      <h2 className="text-sm font-bold text-on-surface tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-outline-variant/50" />
      {action}
    </div>
  )
}

function InputToggleBtn({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1 w-full text-[11px] text-on-surface-variant hover:text-on-surface transition-colors mt-3"
    >
      <span className="material-symbols-outlined text-[13px]">{open ? 'close' : 'upload'}</span>
      {open ? '닫기' : label}
    </button>
  )
}

interface Props {
  projectId: string; projectName: string; projectClient: string | null; date: string
  activities: Activity[]; quotesByActivity: Record<string, Quote[]>
  participantMap: Record<string, ParticipantRow>
  summary: Summary | null; findings: Finding[]; typeLabels: Record<string, string>
  isClientView?: boolean
}

export default function DayReport({
  projectId, projectName, projectClient, date,
  activities, quotesByActivity, participantMap,
  summary: initialSummary, findings: initialFindings, typeLabels,
  isClientView = false,
}: Props) {
  const router = useRouter()

  const [summary, setSummary] = useState(initialSummary)
  const [findings, setFindings] = useState(initialFindings)

  // 발견/요약 통합 입력
  const [showCombinedImport, setShowCombinedImport] = useState(false)
  const [combinedJson, setCombinedJson] = useState('')
  const [combinedError, setCombinedError] = useState<string | null>(null)
  const [savingCombined, setSavingCombined] = useState(false)

  // activity 데이터 입력
  const [importingId, setImportingId] = useState<string | null>(null)
  const [importJson, setImportJson] = useState<Record<string, string>>({})
  const [importError, setImportError] = useState<Record<string, string>>({})
  const [importSaving, setImportSaving] = useState<Record<string, boolean>>({})

  // 이미지 업로드
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  async function handleCombinedImport() {
    setCombinedError(null)
    setSavingCombined(true)
    let parsed: { summary?: Record<string, unknown>; findings?: Array<Record<string, unknown>> }
    try { parsed = JSON.parse(combinedJson) } catch {
      setCombinedError('JSON 형식이 올바르지 않습니다')
      setSavingCombined(false)
      return
    }
    try {
      if (parsed.summary) {
        const res = await fetch(`/api/projects/${projectId}/summaries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, ...parsed.summary }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSummary(data)
      }
      if (Array.isArray(parsed.findings) && parsed.findings.length > 0) {
        const saved: Finding[] = []
        for (const f of parsed.findings) {
          const res = await fetch(`/api/projects/${projectId}/findings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(f),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          saved.push(data)
        }
        setFindings(prev => [...saved, ...prev])
      }
      setShowCombinedImport(false)
      setCombinedJson('')
    } catch (err: unknown) {
      setCombinedError(err instanceof Error ? err.message : '오류가 발생했습니다')
    }
    setSavingCombined(false)
  }

  async function handleImageUpload(activityId: string, file: File) {
    setUploadingId(activityId)
    const formData = new FormData()
    formData.append('file', file)
    await fetch(`/api/projects/${projectId}/activities/${activityId}/images`, {
      method: 'POST',
      body: formData,
    })
    setUploadingId(null)
    router.refresh()
  }

  async function handleImageDelete(activityId: string, url: string) {
    await fetch(`/api/projects/${projectId}/activities/${activityId}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    router.refresh()
  }

  async function handleActivityImport(activityId: string) {
    setImportError(p => ({ ...p, [activityId]: '' }))
    setImportSaving(p => ({ ...p, [activityId]: true }))
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(importJson[activityId] ?? '') } catch {
      setImportError(p => ({ ...p, [activityId]: 'JSON 형식이 올바르지 않습니다' }))
      setImportSaving(p => ({ ...p, [activityId]: false }))
      return
    }
    const res = await fetch(`/api/projects/${projectId}/activities/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    })
    const data = await res.json()
    if (!res.ok) {
      setImportError(p => ({ ...p, [activityId]: data.error ?? '오류가 발생했습니다' }))
      setImportSaving(p => ({ ...p, [activityId]: false }))
      return
    }
    setImportSaving(p => ({ ...p, [activityId]: false }))
    setImportingId(null)
    setImportJson(p => ({ ...p, [activityId]: '' }))
    router.refresh()
  }

  const submitted = activities.filter(a => ['submitted', 'completed'].includes(a.status))
  const researchTypes = [...new Set(activities.map(a => a.type_key))]
  const allQuotes = activities.flatMap(a => quotesByActivity[a.id] ?? [])
  const hasFindings = findings.length > 0 || (summary?.key_patterns ?? []).length > 0
  const hasDoneActivities = submitted.length > 0

  // diary / non-diary 분리
  const diaryActivities    = activities.filter(a => a.type_key.includes('diary'))
  const nonDiaryActivities = activities.filter(a => !a.type_key.includes('diary'))

  // 다이어리 엔트리 집계 (참여자별 → flat list)
  type DiaryEntry = { time?: string; text?: string; image_url?: string; tags?: string[] }
  type FlatEntry  = DiaryEntry & { participant_id: string; activity_id: string; status: string }
  const diaryEntries: FlatEntry[] = diaryActivities.flatMap(a => {
    const entries = (a.content?.entries as DiaryEntry[] | undefined) ?? []
    return entries.map(e => ({ ...e, participant_id: a.participant_id, activity_id: a.id, status: a.status }))
  }).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  let sectionCounter = 2

  return (
    <div className="max-w-3xl">

      {/* ── 문서 헤더 ── */}
      <div className="mb-10 pb-6 border-b border-outline-variant">
        <div className="flex items-start justify-between gap-4">
          <div>
            {projectClient && (
              <p className="text-[10px] font-medium text-on-surface-variant tracking-widest uppercase mb-1">{projectClient}</p>
            )}
            <h1 className="text-xl font-bold text-on-surface tracking-tight">{projectName}</h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-on-surface-variant mb-0.5">조사 일자</p>
            <p className="text-base font-mono font-semibold text-on-surface">{date}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {researchTypes.map(tk => (
            <span key={tk} className="flex items-center gap-1 text-[11px] font-medium text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-[13px]">{typeIcon(tk)}</span>
              {typeLabels[tk] ?? tk}
            </span>
          ))}
          {summary?.scope && (
            <span className="text-[11px] text-on-surface-variant opacity-70">— {summary.scope}</span>
          )}
          {hasDoneActivities && (
            <button
              onClick={() => window.print()}
              className="print:hidden ml-auto flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold bg-primary text-on-primary rounded-full hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              PDF 저장
            </button>
          )}
        </div>
      </div>

      {/* ── 01. 조사 현황 ── */}
      <section className="mb-10">
        <SectionLabel num="01" title="조사 현황" />
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-on-surface tabular-nums">{submitted.length}</span>
          <span className="text-sm text-on-surface-variant">/ {activities.length}명 완료</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {activities.map(a => {
            const p = participantMap[a.participant_id]
            return (
              <Link
                key={a.id}
                href={`/projects/${projectId}/participants/${a.participant_id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold text-on-primary-container font-mono">{a.participant_id}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                    {p?.name ?? a.participant_id}
                  </p>
                  {p && (
                    <p className="text-[9px] text-on-surface-variant">
                      {[p.age && `${p.age}세`, p.gender, p.group].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_CHIP[a.status] ?? STATUS_CHIP.scheduled}`}>
                  {STATUS_LABEL[a.status]}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── 02. 주요 발견 ── */}
      <section className="mb-10">
        <SectionLabel num="02" title="주요 발견" action={isClientView ? undefined :
          <button
            onClick={() => setShowCombinedImport(v => !v)}
            className="print:hidden shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-[11px] font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">
              {showCombinedImport ? 'close' : (hasFindings ? 'edit' : 'add')}
            </span>
            {showCombinedImport ? '닫기' : (hasFindings ? '수정' : '입력')}
          </button>
        } />

        {hasFindings && (
          <div className="space-y-3 mb-2">
            {findings.map(f => (
              <div key={f.id} className="flex gap-4 py-3 border-b border-outline-variant/40 last:border-0">
                <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border h-fit mt-0.5 shrink-0 ${FINDING_CHIP[f.type] ?? FINDING_CHIP.observation}`}>
                  {FINDING_TYPE_LABEL[f.type] ?? f.type}
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-0.5">{f.title}</p>
                  {f.description && <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>}
                </div>
              </div>
            ))}
            {(summary?.key_patterns ?? []).map((p, i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-outline-variant/40 last:border-0">
                <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border h-fit mt-0.5 shrink-0 bg-surface-container-high text-on-surface-variant border-outline-variant">
                  패턴
                </span>
                <p className="text-sm text-on-surface leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        )}

        {/* 대표 발화 */}
        {(summary?.representative_quotes ?? []).length > 0 && allQuotes.length > 0 && (
          <div className="mt-5 space-y-3">
            {summary!.representative_quotes.map(qid => {
              const q = allQuotes.find(x => x.id === qid)
              if (!q) return null
              const act = activities.find(a => a.id === q.activity_id)
              return (
                <blockquote key={qid} className="border-l-2 border-primary pl-4 py-1">
                  <p className="text-sm text-on-surface leading-relaxed italic">"{q.text}"</p>
                  <p className="text-[10px] text-on-surface-variant mt-1 font-mono">
                    {q.id}{act && ` · ${act.participant_id}`}
                  </p>
                </blockquote>
              )
            })}
          </div>
        )}

        {/* 발견/요약 폼 (헤더 버튼 토글) */}
        {showCombinedImport && (
          <div className="print:hidden mt-3 space-y-2 bg-surface-container rounded-xl p-3 border border-outline-variant">
            <p className="text-[10px] text-on-surface-variant font-mono">
              {'{ "summary": { "scope", "key_patterns": [], "next_focus" }, "findings": [{ "type", "title", "description" }] }'}
            </p>
            <textarea
              value={combinedJson}
              onChange={e => setCombinedJson(e.target.value)}
              rows={8}
              placeholder={'{\n  "summary": {\n    "scope": "유저 다이어리 Day 1",\n    "key_patterns": ["패턴 1"],\n    "next_focus": "다음 확인사항"\n  },\n  "findings": [\n    { "type": "insight", "title": "제목", "description": "설명" }\n  ]\n}'}
              className="w-full border border-outline-variant bg-surface rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/50 resize-none text-on-surface"
            />
            {combinedError && <p className="text-[10px] text-rose-600">{combinedError}</p>}
            <button
              onClick={handleCombinedImport}
              disabled={savingCombined || !combinedJson.trim()}
              className="px-4 py-1.5 bg-primary text-on-primary text-[11px] font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {savingCombined ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </section>

      {/* ── 03. 다이어리 엔트리 (diary 활동이 있을 때) ── */}
      {diaryActivities.length > 0 && (() => { sectionCounter++; return (
        <section className="mb-10">
          <SectionLabel num={`0${sectionCounter}`} title="다이어리 엔트리" />

          {/* 제출/미제출 현황 바 */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {diaryActivities.map(a => {
              const p = participantMap[a.participant_id]
              const isDone = ['submitted', 'completed'].includes(a.status)
              return (
                <span key={a.id} className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium ${isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-surface-container text-on-surface-variant border-outline-variant opacity-60'}`}>
                  <span className="font-mono text-[9px]">{a.participant_id}</span>
                  {p?.name ?? a.participant_id}
                  {!isDone && <span className="text-[9px] opacity-70">· {STATUS_LABEL[a.status]}</span>}
                </span>
              )
            })}
          </div>

          {/* 참여자별 다이어리 블록 */}
          <div className="space-y-8">
            {diaryActivities.map(a => {
              const p = participantMap[a.participant_id]
              const entries = (a.content?.entries as Array<{ time?: string; text?: string; tags?: string[] }> | undefined) ?? []
              const images  = (a.content?.images  as string[] | undefined) ?? []
              const hasContent = entries.length > 0 || images.length > 0

              return (
                <div key={a.id} className="print-block pb-8 border-b border-outline-variant/40 last:border-0">
                  {/* 참여자 헤더 */}
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      href={`/projects/${projectId}/participants/${a.participant_id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-on-primary-container font-mono">{a.participant_id}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {p?.name ?? a.participant_id}
                          </span>
                          {p?.group && <span className="text-[10px] text-on-surface-variant">{p.group}</span>}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${STATUS_CHIP[a.status] ?? STATUS_CHIP.scheduled}`}>
                          {STATUS_LABEL[a.status]}
                        </span>
                      </div>
                    </Link>

                    {/* 우측 액션 버튼 그룹 */}
                    <div className={`${isClientView ? 'hidden' : ''} print:hidden flex items-center gap-2 shrink-0`}>
                      <button
                        onClick={() => setImportingId(importingId === a.id ? null : a.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-[11px] font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {importingId === a.id ? 'close' : (hasContent ? 'edit' : 'add')}
                        </span>
                        {importingId === a.id ? '닫기' : (hasContent ? '수정' : '결과 입력')}
                      </button>
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-[11px] font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[13px]">
                          {uploadingId === a.id ? 'hourglass_empty' : 'add_photo_alternate'}
                        </span>
                        {uploadingId === a.id ? '중...' : '이미지'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingId === a.id}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(a.id, file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 텍스트 엔트리 */}
                  {entries.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {entries.map((e, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            {e.time && (
                              <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{e.time}</span>
                            )}
                            {(e.tags ?? []).map((t, j) => (
                              <span key={j} className="text-[10px] text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">#{t}</span>
                            ))}
                          </div>
                          {e.text && <p className="text-sm text-on-surface leading-relaxed">{e.text}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 업로드된 이미지 그리드 */}
                  {images.length > 0 && (
                    <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                      {images.map((url, i) => (
                        <div key={i} className="relative group/img">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt=""
                              className={`w-full object-cover rounded-xl border border-outline-variant hover:opacity-95 transition-opacity ${images.length === 1 ? 'max-h-80' : 'h-36'}`}
                            />
                          </a>
                          <button
                            onClick={() => handleImageDelete(a.id, url)}
                            className="print:hidden absolute top-1.5 right-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
                          >
                            <span className="material-symbols-outlined text-[12px] text-white">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!hasContent && (
                    <p className="text-sm text-on-surface-variant opacity-40">데이터 없음</p>
                  )}

                  {/* 결과 입력 폼 (헤더 버튼 토글) */}
                  {importingId === a.id && (
                    <div className="print:hidden mt-3 space-y-2 bg-surface-container rounded-xl p-3 border border-outline-variant">
                      <textarea
                        value={importJson[a.id] ?? ''}
                        onChange={e => setImportJson(p => ({ ...p, [a.id]: e.target.value }))}
                        rows={10}
                        placeholder={`{\n  "activity": {\n    "participant_id": "${a.participant_id}",\n    "type_key": "${a.type_key}",\n    "date": "${date}",\n    "status": "submitted",\n    "content": {\n      "entries": [\n        { "time": "09:30", "text": "기록 내용", "tags": ["태그"] }\n      ]\n    }\n  },\n  "quotes": []\n}`}
                        className="w-full border border-outline-variant bg-surface rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/50 resize-none text-on-surface"
                      />
                      {importError[a.id] && <p className="text-[10px] text-rose-600">{importError[a.id]}</p>}
                      <button
                        onClick={() => handleActivityImport(a.id)}
                        disabled={importSaving[a.id] || !importJson[a.id]?.trim()}
                        className="px-4 py-1.5 bg-primary text-on-primary text-[11px] font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {importSaving[a.id] ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )})()}

      {/* ── 04. 참여자별 상세 (non-diary 활동) ── */}
      {nonDiaryActivities.length > 0 && (() => { sectionCounter++; return (
        <section className="mb-10">
          <SectionLabel num={`0${sectionCounter}`} title="참여자별 상세" />
          <div className="space-y-8">
            {nonDiaryActivities.map(a => {
              const p = participantMap[a.participant_id]
              const qs = quotesByActivity[a.id] ?? []
              return (
                <div key={a.id} className="print-block">
                  {/* 참여자 헤더: 좌측 = 인물 정보(인라인 링크), 우측 = 결과 입력 버튼 */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-on-primary-container font-mono">{a.participant_id}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/projects/${projectId}/participants/${a.participant_id}`}
                            className="text-sm font-semibold text-primary hover:underline flex items-center gap-0.5"
                          >
                            {p?.name ?? a.participant_id}
                            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                          </Link>
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${STATUS_CHIP[a.status] ?? STATUS_CHIP.scheduled}`}>
                            {STATUS_LABEL[a.status]}
                          </span>
                        </div>
                        {p && (
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {[p.age && `${p.age}세`, p.gender, p.group].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                    {!isClientView && (
                      <button
                        onClick={() => setImportingId(importingId === a.id ? null : a.id)}
                        className="print:hidden shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-[11px] font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {importingId === a.id ? 'close' : (qs.length > 0 ? 'edit' : 'add')}
                        </span>
                        {importingId === a.id ? '닫기' : (qs.length > 0 ? '수정' : '결과 입력')}
                      </button>
                    )}
                  </div>

                  <div className="pl-11">
                    {qs.length > 0 ? (
                      <div className="space-y-3">
                        {qs.map(q => (
                          <blockquote key={q.id} className="border-l-2 border-outline-variant pl-4">
                            <p className="text-sm text-on-surface leading-relaxed">"{q.text}"</p>
                            {q.context && <p className="text-[10px] text-on-surface-variant mt-0.5">{q.context}</p>}
                            <p className="text-[9px] text-outline font-mono mt-1">{q.id}</p>
                          </blockquote>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant opacity-40">발화 없음</p>
                    )}

                    <div className="print:hidden">
                      {importingId === a.id && (
                        <div className="mt-2 space-y-2 bg-surface-container rounded-xl p-3 border border-outline-variant">
                          <textarea
                            value={importJson[a.id] ?? ''}
                            onChange={e => setImportJson(p => ({ ...p, [a.id]: e.target.value }))}
                            rows={7}
                            placeholder={`{\n  "activity": {\n    "participant_id": "${a.participant_id}",\n    "type_key": "${a.type_key}",\n    "date": "${date}",\n    "status": "submitted",\n    "content": {}\n  },\n  "quotes": []\n}`}
                            className="w-full border border-outline-variant bg-surface rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/50 resize-none text-on-surface"
                          />
                          {importError[a.id] && <p className="text-[10px] text-rose-600">{importError[a.id]}</p>}
                          <button
                            onClick={() => handleActivityImport(a.id)}
                            disabled={importSaving[a.id] || !importJson[a.id]?.trim()}
                            className="px-4 py-1.5 bg-primary text-on-primary text-[11px] font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {importSaving[a.id] ? '저장 중...' : '저장'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )})()}

      {/* ── 푸터: 다음 확인사항 ── */}
      {summary?.next_focus && (
        <div className="border-t border-outline-variant pt-6">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">다음 확인사항</p>
          <p className="text-sm text-on-surface leading-relaxed">{summary.next_focus}</p>
        </div>
      )}
    </div>
  )
}
