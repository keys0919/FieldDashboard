'use client'

import { useState } from 'react'

interface QuoteRow {
  id: string
  participant_id: string
  text: string
  context: string | null
  tags: string[]
  activity_date: string
  activity_type: string
}

interface TagCloudItem {
  tag: string
  count: number
}

interface Props {
  quotes: QuoteRow[]
  tagCloud: TagCloudItem[]
  participantMap: Record<string, string>
  typeLabels: Record<string, string>
}

function fmtDate(d: string) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

function tagFontSize(count: number, min: number, max: number): number {
  if (max === min) return 15
  const ratio = (count - min) / (max - min)
  return Math.round(12 + ratio * 20)
}

function tagOpacity(count: number, min: number, max: number): number {
  if (max === min) return 0.7
  const ratio = (count - min) / (max - min)
  return 0.4 + ratio * 0.6
}

export default function QuotesClient({ quotes, tagCloud, participantMap, typeLabels }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filtered = selectedTag
    ? quotes.filter(q => q.tags.includes(selectedTag))
    : quotes

  const counts = tagCloud.map(t => t.count)
  const min = counts.length ? Math.min(...counts) : 0
  const max = counts.length ? Math.max(...counts) : 0

  function toggleTag(tag: string) {
    setSelectedTag(prev => prev === tag ? null : tag)
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">발화</h1>
        <span className="text-sm text-on-surface-variant font-mono">{quotes.length}개</span>
      </div>

      {/* 태그 클라우드 */}
      {tagCloud.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">태그 클라우드</p>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
                전체 보기
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 justify-center py-3">
            {tagCloud.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  fontSize: `${tagFontSize(count, min, max)}px`,
                  opacity: selectedTag && selectedTag !== tag
                    ? 0.2
                    : tagOpacity(count, min, max),
                }}
                className={`font-medium leading-none transition-all duration-150 hover:opacity-100 ${
                  selectedTag === tag
                    ? 'text-primary font-bold'
                    : 'text-on-surface hover:text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 필터 상태 */}
      <div className="flex items-center justify-between min-h-[20px]">
        {selectedTag ? (
          <p className="text-xs text-on-surface-variant">
            <span className="font-semibold text-primary">#{selectedTag}</span> 태그 · {filtered.length}개
          </p>
        ) : (
          <p className="text-xs text-on-surface-variant">전체 {filtered.length}개</p>
        )}
      </div>

      {/* 발화 목록 */}
      {filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px] opacity-30 mb-3">format_quote</span>
          <p className="text-sm">발화 데이터가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="glass-card rounded-xl p-4 border-l-2 border-primary-fixed">
              <p className="text-sm text-on-surface leading-relaxed mb-3">
                <span className="text-primary-fixed opacity-60 font-serif text-lg leading-none align-top mr-0.5">"</span>
                {q.text}
                <span className="text-primary-fixed opacity-60 font-serif text-lg leading-none align-bottom ml-0.5">"</span>
              </p>
              {q.context && (
                <p className="text-xs text-on-surface-variant italic mb-2">{q.context}</p>
              )}
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                <span className="text-[10px] font-medium text-on-surface-variant">
                  {participantMap[q.participant_id] ?? '참여자'}
                </span>
                {q.activity_type && (
                  <>
                    <span className="text-[10px] text-outline-variant">·</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {typeLabels[q.activity_type] ?? q.activity_type}
                    </span>
                  </>
                )}
                {q.activity_date && (
                  <>
                    <span className="text-[10px] text-outline-variant">·</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">{fmtDate(q.activity_date)}</span>
                  </>
                )}
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-1">
                    {q.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                          selectedTag === tag
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
