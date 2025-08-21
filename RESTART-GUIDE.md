# 컴퓨터 재시작 후 복원 가이드

## 🚀 빠른 시작 방법

### 1. 저장소 클론 및 기본 설정
```bash
git clone https://github.com/sun2141/pray-companion.git
cd pray-companion
npm install
```

### 2. 환경 변수 복원
```bash
# 개발용 API 키 복원
bash restore-env.sh

# 만약 .env.local.personal 파일이 없다면:
cp .env.example .env.local.personal
# 파일을 열어서 실제 API 키들을 입력하세요
```

### 3. 개발 서버 시작
```bash
npm run dev
```

## 📋 주요 API 키 정보

### 필수 API 키들 (.env.local.personal에 저장)
- **Supabase URL**: `https://aaziehufvqureeixrxag.supabase.co`
- **Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (이미 설정됨)
- **OpenAI API Key**: `sk-proj-3Vw_U36lKNOlLvTk7bAqaRjnISmDW5D3r5ii...` (작동 확인됨)
- **Google Cloud API Key**: `AIzaSyDLMzUnvPrKhDHEjJAG85sKlXivNLzm7zI` (설정됨)

## 🛠️ 문제 해결

### OpenAI API 오류 시
```bash
# API 키 테스트
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}], "max_tokens": 5}'
```

### 환경 변수 문제 시
```bash
# 환경 변수 확인
cat .env.local

# 복원 스크립트 재실행
bash restore-env.sh

# 개발 서버 재시작
npm run dev
```

## ✅ 완료된 기능들

### 핵심 기능
- ✅ 한국어 기도문 생성 (AI + Enhanced Fallback)
- ✅ 주제별 맞춤형 기도문 (건강, 직업, 가족, 학업, 결혼, 감사)
- ✅ 실시간 동행자 카운터 (Supabase Realtime)
- ✅ 3단계 TTS 시스템 (Browser, Google Cloud, Offline Piper)
- ✅ 모바일 반응형 UI (따뜻한 오렌지/로즈 테마)

### 기술 스택
- ✅ Next.js 15 + React 19 + TypeScript
- ✅ Supabase (데이터베이스, 인증, 실시간)
- ✅ OpenAI GPT-3.5-turbo (정상 작동 확인)
- ✅ Tailwind CSS + shadcn/ui
- ✅ PWA 기능

### 보안 및 배포
- ✅ API 키 보안 관리 시스템
- ✅ GitHub Actions CI/CD
- ✅ 자동화된 설정 스크립트

## 📱 애플리케이션 URL
- **로컬 개발**: http://localhost:3000
- **GitHub 저장소**: https://github.com/sun2141/pray-companion

## 📞 중요 참고사항

1. **보안**: `.env.local.personal` 파일은 절대 Git에 커밋하지 마세요
2. **API 키**: OpenAI API 키는 현재 정상 작동 중입니다
3. **백업**: 모든 코드는 GitHub에 백업되어 있습니다
4. **복원**: `restore-env.sh` 스크립트로 환경 변수를 쉽게 복원할 수 있습니다

---

*마지막 업데이트: 2025-08-21 (컴퓨터 재시작 전 백업)*