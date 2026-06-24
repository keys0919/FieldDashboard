-- 회의록 더미 데이터 (1차, 2차 정례회의)
-- project 내 week_start 순서 기준으로 1차, 2차에 삽입

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY week_start) AS seq
  FROM meetings
)
UPDATE meetings m
SET minutes = '{
  "date": "2026-06-10",
  "attendees": ["홍길동 (PM)", "김리서처 (Researcher)", "이진아 (Client Lead)"],
  "topic": "1차 정례회의 — 필드 조사 1주차 현황 점검",
  "discussions": [
    {
      "item": "1주차 다이어리 제출 현황",
      "notes": "10명 중 7명 제출 완료. P-003, P-007, P-009 미제출 확인. P-009는 개인 사정으로 연락 불가 상태."
    },
    {
      "item": "첫 인터뷰 일정 조율",
      "notes": "P-001 ~ P-004 현장 인터뷰 6/20 ~ 6/21 예정. 장소는 클라이언트 사무실 3층 회의실."
    },
    {
      "item": "스크리너 문항 해석 이슈",
      "notes": "Q3 문항(디지털 기기 사용 빈도)이 모호하다는 참여자 피드백. 다음 회차부터 보충 설명 추가 필요."
    }
  ],
  "decisions": [
    "미제출 참여자 P-003, P-007에 당일 리마인더 발송 (담당: 김리서처)",
    "P-009 대체 인원 탐색 즉시 착수 (담당: 이진아)",
    "Q3 문항에 보충 설명 1문장 추가 후 참여자에게 재안내"
  ],
  "open_items": [
    "P-009 대체 인원 확보 가능 여부 — 이진아 6/12까지 회신",
    "현장 인터뷰 녹음 동의서 최종 버전 검토 필요 (법무 확인 중)"
  ],
  "next_steps": [
    { "action": "P-003, P-007 리마인더 발송", "owner": "김리서처", "due": "2026-06-10" },
    { "action": "P-009 대체 인원 리크루팅 의뢰", "owner": "이진아", "due": "2026-06-12" },
    { "action": "Q3 문항 보충 설명 초안 작성", "owner": "김리서처", "due": "2026-06-11" },
    { "action": "현장 인터뷰 장소·장비 최종 확인", "owner": "홍길동", "due": "2026-06-17" }
  ]
}'::jsonb
FROM ordered o
WHERE m.id = o.id AND o.seq = 1;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY week_start) AS seq
  FROM meetings
)
UPDATE meetings m
SET minutes = '{
  "date": "2026-06-17",
  "attendees": ["홍길동 (PM)", "김리서처 (Researcher)", "이진아 (Client Lead)", "박민준 (Observer)"],
  "topic": "2차 정례회의 — 인터뷰 준비 완료 확인 및 대체 인원 현황",
  "discussions": [
    {
      "item": "P-009 대체 인원 확보 결과",
      "notes": "P-011로 대체 확정. 스크리너 통과 완료. 다이어리 키트 발송 예정 (6/18)."
    },
    {
      "item": "현장 인터뷰 준비 사항 최종 점검",
      "notes": "녹음 장비 2세트 준비 완료. 동의서 법무 검토 통과. 대기 공간 클라이언트 3층 확보."
    },
    {
      "item": "2주차 다이어리 데이터 중간 검토",
      "notes": "제출률 90%로 1주차 대비 개선. 주요 패턴: 오전 루틴 중 디지털 전환 시점 다수 발견. 오후 업무 중 끊김(interruption) 경험 반복 언급."
    },
    {
      "item": "관찰자 참여 범위 조율",
      "notes": "박민준 옵저버로 20일 인터뷰 1건 참관 예정. 참여자 동의 필요 — 인터뷰 당일 사전 고지."
    }
  ],
  "decisions": [
    "P-011 대체 확정 및 키트 6/18 발송",
    "박민준 6/20 첫 세션 참관 — P-001 동의 확보 후 진행",
    "인터뷰 이후 당일 메모 작성 원칙 수립 (인터뷰 종료 2시간 내)"
  ],
  "open_items": [
    "P-011 합류로 전체 일정 밀림 가능성 — 마지막 인터뷰 날짜 재조율 필요",
    "옵저버 참관 시 참여자 반응 모니터링 — 영향 최소화 방법 논의 필요"
  ],
  "next_steps": [
    { "action": "P-011 다이어리 키트 발송", "owner": "이진아", "due": "2026-06-18" },
    { "action": "P-001 옵저버 참관 사전 동의 획득", "owner": "김리서처", "due": "2026-06-19" },
    { "action": "인터뷰 당일 메모 템플릿 작성", "owner": "김리서처", "due": "2026-06-18" },
    { "action": "전체 인터뷰 일정 최종본 공유", "owner": "홍길동", "due": "2026-06-18" }
  ]
}'::jsonb
FROM ordered o
WHERE m.id = o.id AND o.seq = 2;
