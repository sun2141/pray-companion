-- Supabase 데이터베이스 설정 스크립트
-- 이 스크립트를 Supabase SQL 에디터에서 실행하세요

-- 기도문 캐시 테이블
CREATE TABLE IF NOT EXISTS prayer_cache (
  cache_key text PRIMARY KEY,
  id text NOT NULL,
  content text NOT NULL,
  title text NOT NULL,
  category text,
  generated_at timestamptz DEFAULT NOW(),
  expires_at timestamptz NOT NULL
);

-- TTS 캐시 테이블
CREATE TABLE IF NOT EXISTS tts_cache (
  text_hash text PRIMARY KEY,
  voice text NOT NULL,
  speed numeric NOT NULL,
  format text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  duration numeric,
  created_at timestamptz DEFAULT NOW(),
  expires_at timestamptz NOT NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_prayer_cache_expires_at ON prayer_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_tts_cache_expires_at ON tts_cache(expires_at);

-- Row Level Security (RLS) 정책
-- 일단 모든 작업을 허용 (나중에 인증 기반으로 제한할 수 있음)
ALTER TABLE prayer_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tts_cache ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (개발 단계용)
CREATE POLICY "Enable all access for prayer_cache" ON prayer_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for tts_cache" ON tts_cache FOR ALL USING (true) WITH CHECK (true);

-- Storage 버킷 생성 (TTS 오디오 파일용)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tts-audio', 'tts-audio', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage 정책 (모든 사용자가 업로드/다운로드 가능)
CREATE POLICY "Enable upload for tts-audio bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tts-audio');
CREATE POLICY "Enable select for tts-audio bucket" ON storage.objects FOR SELECT USING (bucket_id = 'tts-audio');
CREATE POLICY "Enable delete for tts-audio bucket" ON storage.objects FOR DELETE USING (bucket_id = 'tts-audio');

-- 실시간 기도 세션 추적 테이블
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL, -- 클라이언트 세션 식별자
  prayer_title text,
  started_at timestamptz DEFAULT NOW(),
  ended_at timestamptz,
  last_heartbeat timestamptz DEFAULT NOW(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended'))
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_status ON prayer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_last_heartbeat ON prayer_sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_started_at ON prayer_sessions(started_at);

-- Row Level Security 설정
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 세션만 관리할 수 있음
CREATE POLICY "Users can manage their own sessions" ON prayer_sessions 
FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 정책: 모든 사용자가 활성 세션 수를 조회할 수 있음 (집계만)
CREATE POLICY "Enable read access for active sessions count" ON prayer_sessions 
FOR SELECT USING (status = 'active');

-- 함수: 비활성 세션 정리 (5분 이상 하트비트 없으면 종료)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE prayer_sessions 
  SET status = 'ended', ended_at = NOW()
  WHERE status = 'active' 
    AND last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$;

-- 함수: 활성 기도자 수 조회
CREATE OR REPLACE FUNCTION get_active_prayers_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_count integer;
BEGIN
  -- 비활성 세션 먼저 정리
  PERFORM cleanup_inactive_sessions();
  
  -- 활성 세션 수 조회
  SELECT COUNT(DISTINCT user_id) INTO active_count
  FROM prayer_sessions
  WHERE status = 'active';
  
  RETURN active_count;
END;
$$;

-- AI 학습 관련 테이블들

-- 기도문 피드백 테이블
CREATE TABLE IF NOT EXISTS prayer_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  improvements text[], -- 개선사항 배열 (JSON도 가능)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW()
);

-- 기도문 생성 데이터 테이블 (패턴 분석용)
CREATE TABLE IF NOT EXISTS prayer_generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_id text NOT NULL,
  title text NOT NULL,
  category text,
  situation text,
  tone text,
  length text,
  content_length integer,
  generated_at timestamptz DEFAULT NOW()
);

-- AI 학습 데이터 테이블 (패턴과 효과성)
CREATE TABLE IF NOT EXISTS prayer_learning_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_text text NOT NULL,
  pattern_type text NOT NULL, -- 'positive_pattern', 'avoid_pattern' 등
  effectiveness_score numeric(3,2) DEFAULT 0.5 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
  category text,
  tone text,
  last_updated timestamptz DEFAULT NOW(),
  UNIQUE(pattern_text, pattern_type)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_prayer_feedback_prayer_id ON prayer_feedback(prayer_id);
CREATE INDEX IF NOT EXISTS idx_prayer_feedback_rating ON prayer_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_prayer_feedback_created_at ON prayer_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_prayer_generations_prayer_id ON prayer_generations(prayer_id);
CREATE INDEX IF NOT EXISTS idx_prayer_generations_category ON prayer_generations(category);
CREATE INDEX IF NOT EXISTS idx_prayer_generations_tone ON prayer_generations(tone);

CREATE INDEX IF NOT EXISTS idx_prayer_learning_effectiveness ON prayer_learning_data(effectiveness_score);
CREATE INDEX IF NOT EXISTS idx_prayer_learning_pattern_type ON prayer_learning_data(pattern_type);
CREATE INDEX IF NOT EXISTS idx_prayer_learning_category ON prayer_learning_data(category);

-- Row Level Security 설정
ALTER TABLE prayer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_learning_data ENABLE ROW LEVEL SECURITY;

-- 피드백 정책: 사용자는 자신의 피드백만 관리 가능, 읽기는 모두 허용
CREATE POLICY "Users can manage their own feedback" ON prayer_feedback 
FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 생성 데이터 정책: 시스템 레벨에서만 생성/수정, 읽기는 모두 허용
CREATE POLICY "Enable read for prayer_generations" ON prayer_generations 
FOR SELECT USING (true);
CREATE POLICY "Enable insert for prayer_generations" ON prayer_generations 
FOR INSERT WITH CHECK (true);

-- 학습 데이터 정책: 시스템 레벨에서만 관리, 읽기는 모두 허용
CREATE POLICY "Enable read for prayer_learning_data" ON prayer_learning_data 
FOR SELECT USING (true);
CREATE POLICY "Enable all access for prayer_learning_data" ON prayer_learning_data 
FOR ALL USING (true) WITH CHECK (true);