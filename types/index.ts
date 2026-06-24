export type ProjectStatus = 'active' | 'completed' | 'archived'
export type ParticipantStatus = 'active' | 'completed' | 'dropped' | 'replaced'
export type ActivityStatus = 'scheduled' | 'submitted' | 'completed' | 'not_submitted' | 'delayed' | 'cancelled'
export type FindingType = 'observation' | 'pattern' | 'insight' | 'rqmt_candidate'

export interface ScreenerQuestion {
  id: string
  label: string
  type: 'single_choice' | 'multi_choice' | 'text' | 'number'
  options?: string[]
}

export interface ActivityType {
  key: string
  label: string
}

export interface Project {
  id: string
  name: string
  client: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  share_token: string
  participant_groups: string[]
  activity_types: ActivityType[]
  screener_schema: ScreenerQuestion[]
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  project_id: string
  name: string
  age: number | null
  gender: string | null
  group: string | null
  status: ParticipantStatus
  screener_answers: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  project_id: string
  participant_id: string
  type_key: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  status: ActivityStatus
  content: Record<string, unknown>
  assets: { label: string; url: string; type: string }[]
  researcher_note: string | null
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  project_id: string
  activity_id: string
  participant_id: string
  text: string
  context: string | null
  tags: string[]
  created_at: string
}

export interface Summary {
  id: string
  project_id: string
  date: string
  scope: string
  submitted_participants: string[]
  pending_participants: string[]
  key_patterns: string[]
  representative_quotes: string[]
  notable_cases: string | null
  next_focus: string | null
  created_at: string
  updated_at: string
}

export interface MeetingItem {
  id: string
  project_id: string
  meeting_id: string
  type: 'issue' | 'open_question' | 'decision'
  text: string
  status: 'open' | 'resolved' | 'pending' | 'confirmed'
  closed_meeting_id: string | null
  close_reason: string | null
  created_at: string
  updated_at: string
}

export interface MinutesDiscussion {
  item: string
  notes: string
}

export interface MinutesNextStep {
  action: string
  owner?: string
  due?: string
}

export interface MinutesData {
  date?: string
  attendees?: string[]
  topic?: string
  discussions?: MinutesDiscussion[]
  decisions?: string[]
  open_items?: string[]
  next_steps?: MinutesNextStep[]
}

export interface Meeting {
  id: string
  project_id: string
  week_start: string
  week_end: string
  schedule_comment_prev: string | null
  schedule_comment_curr: string | null
  minutes: MinutesData | null
  created_at: string
  updated_at: string
}

export interface Finding {
  id: string
  project_id: string
  type: FindingType
  title: string
  description: string | null
  quote_ids: string[]
  activity_ids: string[]
  participant_ids: string[]
  created_at: string
  updated_at: string
}
