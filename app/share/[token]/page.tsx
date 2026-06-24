import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CalendarView from '@/components/CalendarView'

export default async function ShareCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { token } = await params
  const { month: monthParam } = await searchParams
  const sb = createServerClient()

  const { data: project } = await sb
    .from('projects')
    .select('id, activity_types')
    .eq('share_token', token)
    .single()

  if (!project) notFound()

  const today = new Date()
  const [year, month] = monthParam
    ? monthParam.split('-').map(Number)
    : [today.getFullYear(), today.getMonth() + 1]

  const [{ data: activities }, { data: participants }] = await Promise.all([
    sb.from('activities')
      .select('id, participant_id, type_key, title, date, start_time, status, diary_day')
      .eq('project_id', project.id)
      .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('date', `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`)
      .order('date').order('start_time'),
    sb.from('participants').select('id, name, age, gender, group').eq('project_id', project.id),
  ])

  const activityTypeLabels: Record<string, string> = {}
  for (const t of project.activity_types ?? []) activityTypeLabels[t.key] = t.label

  return (
    <div className="pt-5 pb-4">
      <h1 className="text-xl font-bold text-on-surface tracking-tight mb-4 px-6">캘린더</h1>
      <Suspense>
        <CalendarView
          projectId={project.id}
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
