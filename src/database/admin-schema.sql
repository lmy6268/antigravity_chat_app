-- Admin Monitoring Schema
-- 관리자 계정 및 API 로깅을 위한 스키마

-- 1. Admins Table (관리자 계정)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- 2. API Logs Table (API 호출 로그)
CREATE TABLE IF NOT EXISTS api_logs (
  id BIGSERIAL PRIMARY KEY,
  method TEXT NOT NULL,           -- GET, POST, PUT, DELETE
  path TEXT NOT NULL,              -- /api/users, /api/rooms, etc.
  status_code INTEGER,             -- 200, 404, 500, etc.
  ip_address TEXT,                 -- 클라이언트 IP
  user_agent TEXT,                 -- User-Agent 헤더
  response_time_ms INTEGER,        -- 응답 시간 (ms)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_path ON api_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_logs_ip ON api_logs(ip_address);

-- 3. Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role bypass" ON admins;
DROP POLICY IF EXISTS "Service role bypass" ON api_logs;

-- Allow service role to bypass all policies
CREATE POLICY "Service role bypass" ON admins FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON api_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Function to delete old API logs (30일 이상)
CREATE OR REPLACE FUNCTION delete_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 5. Insert default admin account (username: admin, password: admin123)
-- Note: 비밀번호는 bcrypt로 해시된 값입니다
INSERT INTO admins (username, password)
VALUES ('admin', '$2a$10$rN8qNKZ5yGKGJvXqZ5yGKOqZ5yGKGJvXqZ5yGKGJvXqZ5yGKGJvXq')
ON CONFLICT (username) DO NOTHING;

-- 6. 주기적으로 오래된 로그 삭제 (선택사항 - cron job 필요)
-- SELECT delete_old_api_logs();
