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

// 빈도 높은 순으로 정렬된 배열을 앞/뒤 교차 배치 → 시각적으로 크기 분산
function distributeCloud(items: TagCloudItem[]): TagCloudItem[] {
  const result: TagCloudItem[] = []
  let l = 0, r = items.length - 1
  while (l <= r) {
    result.push(items[l++])
    if (l <= r) result.push(items[r--])
  }
  return result
}

const CLOUD_COLORS = [
  '#7c3aed', // violet
  '#0284c7', // sky
  '#059669', // emerald
  '#d97706', // amber
  '#e11d48', // rose
  '#4f46e5', // indigo
  '#0d9488', // teal
  '#ea580c', // orange
]

function fmtDate(d: string) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

export default function QuotesClient({ quotes, tagCloud, participantMap, typeLabels }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filtered = selectedTag
    ? quotes.filter(q => q.tags.includes(selectedTag))
    : quotes

  const counts = tagCloud.map(t => t.count)
  const min = counts.length ? Math.min(...counts) : 0
  const max = counts.length ? Math.max(...counts) : 0

  // 태그별 색상 고정 (빈도 순위 기준)
  const colorMap: Record<string, string> = {}
  tagCloud.forEach(({ tag }, i) => {
    colorMap[tag] = CLOUD_COLORS[i % CLOUD_COLORS.length]
  })

  const displayCloud = distributeCloud([...tagCloud])

  function toggleTag(tag: string) {
    setSelectedTag(prev => prev === tag ? null : tag)
  }

  function cloudStyle(count: number) {
    const ratio = max > min ? (count - min) / (max - min) : 0.5
    return {
      fontSize: `${Math.round(11 + ratio * 42)}px`,       // 11px → 53px
      fontWeight: Math.round(3 + ratio * 5) * 100,         // 300 → 800
      lineHeight: 1.2,
    }
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">발화 · Signals</h1>
        <span className="text-sm text-on-surface-variant font-mono">{quotes.length}개</span>
      </div>

      {/* 태그 클라우드 */}
      {displayCloud.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-outline-variant/50"
             style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%)' }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tag Cloud</p>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
                전체 보기
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center px-6 py-6">
            {displayCloud.map(({ tag, count }) => {
              const isSelected = selectedTag === tag
              const isDimmed = !!selectedTag && !isSelected
              const color = colorMap[tag]
              const style = cloudStyle(count)

              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    ...style,
                    color: isSelected ? '#fff' : color,
                    opacity: isDimmed ? 0.18 : 1,
                    backgroundColor: isSelected ? color : 'transparent',
                    padding: isSelected ? '2px 8px' : undefined,
                    borderRadius: isSelected ? '9999px' : undefined,
                  }}
                  className="leading-none transition-all duration-150 hover:scale-110"
                >
                  {tag}
                </button>
              )
            })}
          </div>
          {/* 하단 범례 */}
          <div className="px-5 pb-3 flex items-center gap-1.5">
            <span className="text-[9px] text-on-surface-variant opacity-50">크기 = 빈도</span>
            <span className="text-[9px] text-on-surface-variant opacity-30">·</span>
            <span className="text-[9px] text-on-surface-variant opacity-50">클릭하여 필터</span>
          </div>
        </div>
      )}

      {/* 필터 상태 */}
      <div className="flex items-center min-h-[20px]">
        {selectedTag ? (
          <p className="text-xs text-on-surface-variant">
            <span className="font-semibold" style={{ color: colorMap[selectedTag] }}>#{selectedTag}</span>
            {' '}· {filtered.length}개
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
                        style={selectedTag === tag ? { backgroundColor: colorMap[tag], color: '#fff' } : undefined}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                          selectedTag === tag
                            ? ''
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
