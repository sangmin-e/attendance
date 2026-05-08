-- =============================================================
-- Attendance App — Supabase Schema
-- =============================================================

-- ---------------------------------------------------------------
-- 1. rosters
-- ---------------------------------------------------------------
create table if not exists rosters (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 2. roster_students  (students 객체를 정규화한 테이블)
-- ---------------------------------------------------------------
create table if not exists roster_students (
  roster_id   uuid not null references rosters(id) on delete cascade,
  student_id  text not null,
  name        text not null,
  primary key (roster_id, student_id)
);

-- ---------------------------------------------------------------
-- 3. attendance_entries
-- ---------------------------------------------------------------
create table if not exists attendance_entries (
  id            uuid primary key default gen_random_uuid(),
  roster_id     uuid not null references rosters(id) on delete cascade,
  roster_title  text not null,
  student_id    text not null,
  name          text,
  date_key      date not null,
  recorded_at   timestamptz not null default now()
);

create index if not exists attendance_entries_date_key_idx
  on attendance_entries(date_key);

create index if not exists attendance_entries_roster_id_date_key_idx
  on attendance_entries(roster_id, date_key);

-- unique: 같은 로스터에서 같은 날 중복 출석 방지
create unique index if not exists attendance_entries_unique_per_day
  on attendance_entries(roster_id, student_id, date_key);

-- ---------------------------------------------------------------
-- 4. gate_password  (단일 행 설정 테이블)
-- ---------------------------------------------------------------
create table if not exists gate_password (
  id          int primary key default 1 check (id = 1),  -- 항상 1개의 행만 허용
  password    text not null,
  updated_at  timestamptz not null default now()
);

-- 기본 비밀번호 삽입 (이미 존재하면 무시)
insert into gate_password (id, password)
values (1, '1225')
on conflict (id) do nothing;

-- =============================================================
-- RLS (Row Level Security)
-- 모든 DB 접근은 서버 사이드 API 라우트(service_role key)를
-- 통해서만 이루어지므로 anon 접근을 차단합니다.
-- service_role은 RLS를 자동으로 우회합니다.
-- =============================================================

alter table rosters           enable row level security;
alter table roster_students   enable row level security;
alter table attendance_entries enable row level security;
alter table gate_password     enable row level security;

-- anon / authenticated 역할은 아무것도 할 수 없음
-- (정책 없음 = 기본 deny)
-- service_role key를 사용하는 서버 코드만 접근 가능
