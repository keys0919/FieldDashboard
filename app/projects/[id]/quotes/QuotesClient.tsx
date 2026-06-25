'use client'

import { useState, useMemo } from 'react'

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

// 같은 발화에 함께 등장한 태그 쌍의 빈도를 계산
function buildCoOccurrence(quotes: QuoteRow[]): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {}
  for (const q of quotes) {
    const tags = q.tags ?? []
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const [a, b] = [tags[i], tags[j]]
        if (!m[a]) m[a] = {}
        if (!m[b]) m[b] = {}
        m[a][b] = (m[a][b] || 0) + 1
        m[b][a] = (m[b][a] || 0) + 1
      }
    }
  }
  return m
}

// 한글/영문 혼합 텍스트 실제 너비 추정
function estimateTextWidth(tag: string, fontSize: number): number {
  let w = 0
  for (const ch of tag) {
    const code = ch.charCodeAt(0)
    const isCJK =
      (code >= 0xac00 && code <= 0xd7af) ||   // 한글
      (code >= 0x4e00 && code <= 0x9fff) ||   // CJK 한자
      (code >= 0x3040 && code <= 0x30ff)       // 히라가나·카타카나
    w += isCJK ? fontSize * 0.88 : fontSize * 0.54
  }
  return w
}

function tagHalfSize(tag: string, fontSize: number) {
  return {
    hw: estimateTextWidth(tag, fontSize) / 2 + 5,
    hh: fontSize * 0.60 + 3,
  }
}

// co-occurrence greedy 순서 — 연관 태그끼리 인접하도록 정렬
function orderByCoOccurrence(items: TagCloudItem[], coOcc: Record<string, Record<string, number>>): TagCloudItem[] {
  if (items.length <= 2) return items
  const remaining = new Map(items.map(it => [it.tag, it]))
  const result: TagCloudItem[] = []
  // 빈도 최고 태그부터 시작
  result.push(items[0])
  remaining.delete(items[0].tag)
  while (remaining.size > 0) {
    const cur = result[result.length - 1].tag
    const nbrs = coOcc[cur] ?? {}
    let best = '', bestScore = -1
    for (const [tag] of remaining) {
      const score = nbrs[tag] ?? 0
      if (score > bestScore) { bestScore = score; best = tag }
    }
    if (!best) best = remaining.keys().next().value as string
    result.push(remaining.get(best)!)
    remaining.delete(best)
  }
  return result
}

// co-occurrence 기반 force-directed 배치 계산
function runForceLayout(
  items: TagCloudItem[],
  coOcc: Record<string, Record<string, number>>,
  W: number,
  H: number,
  fontSizeMap: Record<string, number>,
): Record<string, { x: number; y: number }> {
  if (items.length === 0) return {}

  const tags = items.map(it => it.tag)
  const pos: Record<string, { x: number; y: number; vx: number; vy: number }> = {}

  // 태그 면적 기반 초기 배치: 크기 순으로 격자에 배치
  const sorted = [...items].sort((a, b) => fontSizeMap[b.tag] - fontSizeMap[a.tag])
  const cols = Math.ceil(Math.sqrt(items.length * 1.6))
  sorted.forEach((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const totalRows = Math.ceil(items.length / cols)
    pos[item.tag] = {
      x: (W / (cols + 1)) * (col + 1),
      y: (H / (totalRows + 1)) * (row + 1),
      vx: 0, vy: 0,
    }
  })

  for (let iter = 0; iter < 300; iter++) {
    const alpha = Math.max(0.015, 1 - iter / 280)
    for (const t of tags) { pos[t].vx = 0; pos[t].vy = 0 }

    // 척력: 실제 텍스트 크기 기반
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const a = pos[tags[i]], b = pos[tags[j]]
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const si = tagHalfSize(tags[i], fontSizeMap[tags[i]])
        const sj = tagHalfSize(tags[j], fontSizeMap[tags[j]])
        // x·y 축 분리: 가로 겹침과 세로 겹침 각각 처리
        const overlapX = si.hw + sj.hw + 10 - Math.abs(dx)
        const overlapY = si.hh + sj.hh + 8 - Math.abs(dy)
        if (overlapX > 0 && overlapY > 0) {
          // 실제 겹침 → 강하게 밀어냄
          const force = (overlapX * overlapY) * 0.25 * alpha
          pos[tags[i]].vx -= Math.sign(dx) * force
          pos[tags[i]].vy -= Math.sign(dy) * force * 0.6
          pos[tags[j]].vx += Math.sign(dx) * force
          pos[tags[j]].vy += Math.sign(dy) * force * 0.6
        } else {
          // 겹침 없어도 약한 척력
          const minDist = si.hw + sj.hw + 16
          if (dist < minDist) {
            const force = ((minDist - dist) / minDist) * 8 * alpha
            pos[tags[i]].vx -= (dx / dist) * force
            pos[tags[i]].vy -= (dy / dist) * force
            pos[tags[j]].vx += (dx / dist) * force
            pos[tags[j]].vy += (dy / dist) * force
          }
        }
      }
    }

    // 인력: co-occurrence 쌍 (약하게 — 겹침 방지 우선)
    for (const tagA of tags) {
      const nbrs = coOcc[tagA]
      if (!nbrs) continue
      for (const [tagB, w] of Object.entries(nbrs)) {
        if (!pos[tagB]) continue
        const a = pos[tagA], b = pos[tagB]
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = w * 0.25 * alpha
        pos[tagA].vx += (dx / dist) * force
        pos[tagA].vy += (dy / dist) * force
      }
    }

    // 중심 인력
    for (const t of tags) {
      pos[t].vx += (W / 2 - pos[t].x) * 0.035 * alpha
      pos[t].vy += (H / 2 - pos[t].y) * 0.04 * alpha
    }

    // 위치 업데이트 + 경계 클램프
    for (const t of tags) {
      const { hw, hh } = tagHalfSize(t, fontSizeMap[t])
      pos[t].x = Math.max(hw + 6, Math.min(W - hw - 6, pos[t].x + pos[t].vx))
      pos[t].y = Math.max(hh + 6, Math.min(H - hh - 6, pos[t].y + pos[t].vy))
    }
  }

  return Object.fromEntries(tags.map(t => [t, { x: pos[t].x, y: pos[t].y }]))
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
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)

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

  function toggleTag(tag: string) {
    setSelectedTag(prev => prev === tag ? null : tag)
  }

  function fontSizeFor(count: number) {
    const ratio = max > min ? (count - min) / (max - min) : 0.5
    return Math.round(12 + ratio * 26)   // 12px → 38px
  }

  function fontWeightFor(count: number) {
    const ratio = max > min ? (count - min) / (max - min) : 0.5
    return Math.round(3 + ratio * 5) * 100
  }

  const CLOUD_W = 660
  const CLOUD_H = 360

  const fontSizeMap = useMemo(() => {
    const m: Record<string, number> = {}
    tagCloud.forEach(({ tag, count }) => { m[tag] = fontSizeFor(count) })
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagCloud, min, max])

  const coOccurrence = useMemo(() => buildCoOccurrence(quotes), [quotes])

  const orderedCloud = useMemo(
    () => orderByCoOccurrence(tagCloud, coOccurrence),
    [tagCloud, coOccurrence],
  )

  const positions = useMemo(
    () => runForceLayout(orderedCloud, coOccurrence, CLOUD_W, CLOUD_H, fontSizeMap),
    [orderedCloud, coOccurrence, fontSizeMap],
  )

  // hover 중인 태그와 co-occur하는 태그 Set
  const hoveredRelated = useMemo(() => {
    if (!hoveredTag) return null
    const nbrs = coOccurrence[hoveredTag]
    return nbrs ? new Set(Object.keys(nbrs)) : new Set<string>()
  }, [hoveredTag, coOccurrence])

  return (
    <div className="max-w-3xl space-y-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">발화 · Signals</h1>
        <span className="text-sm text-on-surface-variant font-mono">{quotes.length}개</span>
      </div>

      {/* 태그 클라우드 */}
      {tagCloud.length > 0 && (
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
          <div className="relative mx-4 my-4" style={{ height: `${CLOUD_H}px` }}>
            {orderedCloud.map(({ tag, count }) => {
              const p = positions[tag]
              if (!p) return null
              const isSelected = selectedTag === tag
              const isHovered = hoveredTag === tag
              const isRelated = !!hoveredRelated?.has(tag)

              // 우선순위: 클릭 선택 > hover 연관 > hover 비연관
              let opacity = 1
              if (selectedTag) {
                opacity = isSelected ? 1 : 0.18
              } else if (hoveredTag) {
                opacity = isHovered || isRelated ? 1 : 0.15
              }

              const color = colorMap[tag]
              const showPill = isSelected || (isRelated && !!hoveredTag && !selectedTag)

              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  onMouseEnter={() => setHoveredTag(tag)}
                  onMouseLeave={() => setHoveredTag(null)}
                  style={{
                    position: 'absolute',
                    left: `${((p.x / CLOUD_W) * 100).toFixed(2)}%`,
                    top: `${((p.y / CLOUD_H) * 100).toFixed(2)}%`,
                    transform: `translate(-50%, -50%) scale(${isHovered ? 1.12 : isRelated && hoveredTag ? 1.05 : 1})`,
                    fontSize: `${fontSizeMap[tag]}px`,
                    fontWeight: fontWeightFor(count),
                    lineHeight: 1.2,
                    color: isSelected ? '#fff' : color,
                    opacity,
                    backgroundColor: showPill ? (isSelected ? color : color + '22') : 'transparent',
                    padding: showPill ? '2px 10px' : undefined,
                    borderRadius: showPill ? '9999px' : undefined,
                    outline: isRelated && hoveredTag && !isSelected ? `1px solid ${color}44` : undefined,
                  }}
                  className="leading-none transition-all duration-150 whitespace-nowrap"
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
