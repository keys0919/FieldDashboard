'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  projectId: string
}

export default function ProjectCardMenu({ projectId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(prev => !prev)
    setConfirming(false)
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/projects/${projectId}/edit`)
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(true)
  }

  async function handleDeleteConfirm(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    router.refresh()
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(false)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-surface-container transition-colors text-outline hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-36 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden">
          {!confirming ? (
            <>
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-on-surface hover:bg-surface-container transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                편집
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-error hover:bg-error-container transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                삭제
              </button>
            </>
          ) : (
            <div className="p-3 space-y-2">
              <p className="text-[11px] text-on-surface-variant leading-snug">삭제하면 복구할 수 없습니다.</p>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-1.5 text-[11px] font-medium text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-1.5 text-[11px] font-medium text-on-primary bg-error rounded hover:opacity-90 transition-opacity"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
