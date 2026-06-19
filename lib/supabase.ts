import { createClient } from '@supabase/supabase-js'

// 서버 사이드 전용 — service role key 사용
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
