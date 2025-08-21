# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `pray-companion`
   - Database Password: 안전한 비밀번호 설정
   - Region: `Southeast Asia (Singapore)` (한국과 가장 가까운 리전)

## 2. 데이터베이스 설정

프로젝트가 생성되면 SQL Editor에서 다음을 실행:

```sql
-- supabase-setup.sql 파일의 내용을 복사하여 실행
```

또는 Supabase CLI를 사용하여:
```bash
supabase db push
```

## 3. 환경변수 설정

프로젝트 대시보드에서 Settings > API로 이동하여 다음 값들을 복사:

### 필수 환경변수
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### .env.local 파일 업데이트
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Storage 설정

1. Storage 섹션으로 이동
2. `tts-audio` 버킷이 생성되었는지 확인
3. Public access 설정 확인

## 5. 테스트

환경변수 설정 후 다음 명령으로 테스트:

```bash
# 개발 서버 시작
npm run dev

# 헬스체크 확인
curl http://localhost:3000/api/health
```

성공적으로 설정되면 헬스체크에서 `database: "up"` 및 `supabase_storage: "up"`이 표시됩니다.

## 6. 프로덕션 배포 시

Vercel 대시보드에서 Environment Variables에 동일한 값들을 설정하되:
- `NEXT_PUBLIC_APP_URL`을 실제 배포 URL로 변경
- `NEXT_PUBLIC_ENVIRONMENT`를 `production`으로 설정

## 보안 주의사항

- `service_role` 키는 절대 클라이언트 코드에 노출하면 안 됩니다
- RLS 정책을 프로덕션에 맞게 조정하세요
- 정기적으로 API 키를 로테이션하세요