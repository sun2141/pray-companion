# 배포 가이드

## 환경변수 설정

### 개발 환경 (.env.local)
개발 환경에서는 `.env.local.example` 파일을 복사하여 `.env.local`을 생성하고 실제 값을 입력하세요.

### 프로덕션 환경 (Vercel)
Vercel 대시보드에서 다음 환경변수들을 설정해야 합니다:

**필수 환경변수:**
- `OPENAI_API_KEY`: OpenAI API 키
- `NAVER_CLIENT_ID`: 네이버 클로바 클라이언트 ID
- `NAVER_CLIENT_SECRET`: 네이버 클로바 클라이언트 시크릿
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
- `NEXT_PUBLIC_APP_URL`: 배포된 앱의 URL (예: https://pray-companion.vercel.app)
- `NEXT_PUBLIC_ENVIRONMENT`: production

## Vercel 배포 설정

### 1. 프로젝트 연결
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 리포지토리 선택 및 연결
3. 프로젝트 설정:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

### 2. 도메인 설정
- 프로덕션 도메인: `pray-companion.vercel.app` (또는 커스텀 도메인)
- Preview 브랜치: `develop`, `staging`

### 3. 배포 브랜치 전략
- `main`: 프로덕션 배포
- `develop`: 스테이징/프리뷰 배포
- `feature/*`: 개발용 프리뷰 배포

## CI/CD 파이프라인

### GitHub Actions 워크플로우
- 코드 품질 검사 (ESLint, TypeScript)
- 자동 빌드 테스트
- 자동 배포 (main 브랜치)

### 배포 과정
1. PR 생성 → CI 파이프라인 실행 (린트, 타입체크, 빌드)
2. `main` 브랜치 병합 → Vercel 자동 배포
3. 배포 완료 → 헬스체크 실행

## 필수 서비스 설정

### Supabase 설정
1. **데이터베이스 테이블:**
   ```sql
   -- Prayer cache table
   CREATE TABLE prayer_cache (
     cache_key text PRIMARY KEY,
     id text NOT NULL,
     content text NOT NULL,
     title text NOT NULL,
     category text,
     generated_at timestamptz DEFAULT NOW(),
     expires_at timestamptz NOT NULL
   );

   -- TTS cache table
   CREATE TABLE tts_cache (
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
   ```

2. **Storage Buckets:**
   - `tts-audio`: TTS 음성 파일 저장용

3. **Row Level Security (RLS):**
   - 모든 테이블에 대해 적절한 RLS 정책 설정

### OpenAI API 설정
- API 키 발급 및 사용량 모니터링 설정
- Rate limiting 및 비용 알림 설정

### 네이버 클로바 TTS 설정
- API 키 발급 및 월 사용량 확인
- TTS Premium API 사용 권한 확인

## 모니터링 및 알림

### 헬스체크 엔드포인트
- `/api/health`: 기본 서비스 상태 확인
- 모든 핵심 서비스 연결 상태 점검

### 로그 모니터링
- Vercel 함수 로그 모니터링
- 에러 발생 시 알림 설정 (선택사항: Sentry 연동)

## 보안 설정

### 환경변수 보안
- 모든 API 키는 Vercel 환경변수로 관리
- 클라이언트 노출 방지를 위한 `NEXT_PUBLIC_` 접두사 주의

### CORS 설정
- API 엔드포인트별 적절한 CORS 헤더 설정
- 프로덕션 도메인만 허용

### 보안 헤더
- X-Frame-Options, X-Content-Type-Options 등 기본 보안 헤더 적용