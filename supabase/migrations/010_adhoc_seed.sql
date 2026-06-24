-- 일반 회의(ad_hoc) 더미 데이터
-- 기존 meetings에서 project_id를 참조하여 삽입
INSERT INTO meetings (project_id, meeting_type, title, week_start, week_end, minutes)
SELECT
  project_id,
  'ad_hoc',
  '스크리너 설계 검토',
  '2026-06-12',
  '2026-06-12',
  jsonb_build_object(
    'date', '2026-06-12',
    'attendees', jsonb_build_array('홍길동 (PM)', '김리서처 (Researcher)'),
    'topic', '스크리너 문항 개선 방향 논의',
    'discussions', jsonb_build_array(
      jsonb_build_object(
        'item', 'Q3 문항 모호성 해소 방안',
        'notes', '기존 "디지털 기기 사용 빈도" 문항을 "하루 평균 스마트폰 사용 시간"으로 구체화. 참여자 혼란 사례 3건 검토 후 합의.'
      ),
      jsonb_build_object(
        'item', '추가 스크리닝 기준 필요 여부',
        'notes', '현장직 비율이 예상보다 낮음. 직무 유형 필터 문항 1개 추가 여부 검토. 일정상 추가는 어렵고 인터뷰 시 보완하기로.'
      )
    ),
    'decisions', jsonb_build_array(
      'Q3 문항 "하루 평균 스마트폰 사용 시간(시간 단위)"으로 교체',
      '직무 유형 추가 문항은 이번 회차 제외, 인터뷰 도입부에서 구두 확인'
    ),
    'open_items', jsonb_build_array(
      '수정된 스크리너 참여자 전체 재안내 필요 여부 — 이미 제출한 응답 처리 기준 미정'
    ),
    'next_steps', jsonb_build_array(
      jsonb_build_object('action', 'Q3 문항 수정 및 스크리너 업데이트', 'owner', '김리서처', 'due', '2026-06-13'),
      jsonb_build_object('action', '미제출 참여자에게 수정본 발송', 'owner', '김리서처', 'due', '2026-06-14')
    )
  )
FROM meetings
LIMIT 1;

INSERT INTO meetings (project_id, meeting_type, title, week_start, week_end, minutes)
SELECT
  project_id,
  'ad_hoc',
  '인터뷰 가이드 리뷰',
  '2026-06-19',
  '2026-06-19',
  jsonb_build_object(
    'date', '2026-06-19',
    'attendees', jsonb_build_array('홍길동 (PM)', '김리서처 (Researcher)', '이진아 (Client Lead)'),
    'topic', '현장 인터뷰 가이드 최종 검토',
    'discussions', jsonb_build_array(
      jsonb_build_object(
        'item', '인터뷰 가이드 구조 검토',
        'notes', '도입 5분 / 주요 질문 40분 / 마무리 10분 구조 확인. 클라이언트 측에서 "디지털 전환 저항감" 관련 탐색 질문 추가 요청.'
      ),
      jsonb_build_object(
        'item', '민감 주제 처리 방식',
        'notes', '업무 스트레스, 동료 관계 언급 시 중립 유지 원칙 공유. 녹취 거부 시 메모 전환 절차 재확인.'
      ),
      jsonb_build_object(
        'item', '옵저버 동석 프로토콜',
        'notes', '박민준 옵저버는 후방 착석, 질문 개입 금지. 참여자에게 사전 고지 문구 확정.'
      )
    ),
    'decisions', jsonb_build_array(
      '"디지털 전환 저항감" 탐색 질문 2개 추가 (섹션 3 말미)',
      '옵저버 사전 고지 문구: "오늘 세션은 리서치 팀 내부 학습 목적으로 1명이 동석합니다"',
      '인터뷰 종료 후 2시간 내 현장 메모 작성 의무화'
    ),
    'open_items', jsonb_build_array(
      '추가된 질문 2개 파일럿 테스트 여부 — 일정상 생략 가능하나 리스크 있음'
    ),
    'next_steps', jsonb_build_array(
      jsonb_build_object('action', '가이드 최종본 PDF 배포', 'owner', '김리서처', 'due', '2026-06-19'),
      jsonb_build_object('action', '인터뷰 당일 메모 템플릿 공유', 'owner', '김리서처', 'due', '2026-06-19'),
      jsonb_build_object('action', 'P-001 옵저버 동석 동의 확인', 'owner', '홍길동', 'due', '2026-06-19')
    )
  )
FROM meetings
LIMIT 1;
