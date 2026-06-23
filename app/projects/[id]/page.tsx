import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CalendarView from '@/components/CalendarView'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { id } = await params
  const { month: monthParam } = await searchParams

  const today = new Date()
  const [year, month] = monthParam
    ? monthParam.split('-').map(Number)
    : [today.getFullYear(), today.getMonth() + 1]

  const sb = createServerClient()
  const [{ data: project }, { data: activities }, { data: participants }] = await Promise.all([
    sb.from('projects').select('id, activity_types').eq('id', id).single(),
    sb.from('activities')
      .select('id, participant_id, type_key, title, date, start_time, status, diary_day')
      .eq('project_id', id)
      .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('date', `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`)
      .order('date')
      .order('start_time'),
    sb.from('participants').select('id, name, age, gender, group').eq('project_id', id),
  ])

  if (!project) notFound()

  const activityTypeLabels: Record<string, string> = {}
  for (const t of project.activity_types ?? []) {
    activityTypeLabels[t.key] = t.label
  }

  return (
    <div className="px-6 pt-5 pb-4">
      <h1 className="text-xl font-bold text-on-surface tracking-tight mb-4">캘린더</h1>
      <Suspense>
        <CalendarView
          projectId={id}
          activities={activities ?? []}
          activityTypeLabels={activityTypeLabels}
          participants={participants ?? []}
          year={year}
          month={month}
        />
      </Suspense>
    </div>
  )
}
