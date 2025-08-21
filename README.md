# 🙏 한국어 기도 동반자 PWA

> AI 기반 기도문 생성과 실시간 기도 동행 기능을 제공하는 프로그레시브 웹 앱입니다.

[![CI/CD Pipeline](https://github.com/sun2141/pray-companion/actions/workflows/ci.yml/badge.svg)](https://github.com/sun2141/pray-companion/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 주요 기능

- **🤖 AI 기도문 생성**: 6개 카테고리별 맞춤형 기도문 (건강, 취업, 가족, 학업, 결혼, 감사)
- **🔊 3단계 TTS 시스템**: 브라우저 → Google Cloud → 오프라인 Piper
- **👥 실시간 기도 동행**: 현재 함께 기도하는 사용자 수 실시간 표시
- **🧠 AI 학습 시스템**: 사용자 피드백 기반 기도문 품질 개선
- **📱 PWA 지원**: 모바일 앱처럼 설치 및 오프라인 사용 가능
- **🎨 반응형 디자인**: 모든 디바이스에서 최적화된 UI/UX

## 🚀 빠른 시작

### 원클릭 설치 (권장)

```bash
curl -sSL https://raw.githubusercontent.com/sun2141/pray-companion/main/install.sh | bash
```

### 수동 설치

#### 필요 조건
- Node.js 18 이상
- Git

#### 설치 단계

1. **저장소 클론**
   ```bash
   git clone https://github.com/sun2141/pray-companion.git
   cd pray-companion
   ```

2. **자동 설정 실행**
   ```bash
   chmod +x setup.sh
   bash setup.sh
   ```

3. **또는 수동 설정**
   ```bash
   # 의존성 설치
   npm install
   
   # 환경 변수 설정 (.env.local 파일 생성 필요)
   
   # 개발 서버 실행
   npm run dev
   ```

4. **브라우저에서 접속**
   ```
   http://localhost:3000
   ```

## ⚙️ 환경 설정

### 필수 설정
```env
# Supabase (데이터베이스 및 실시간 기능)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 선택적 설정
```env
# OpenAI (AI 기도문 생성 향상)
OPENAI_API_KEY=your-openai-key

# Google Cloud TTS (고품질 음성 합성)
GOOGLE_CLOUD_API_KEY=your-google-cloud-key
```

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint
```

## 🏗️ 기술 스택

- **Next.js 15** + **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (PostgreSQL + Realtime)
- **OpenAI GPT-3.5** + **Google Cloud TTS**
- **React Query** + **Zustand**

## 🤝 기여하기

1. Fork 프로젝트
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. Pull Request 생성

---

<div align="center">
  <p>🤖 Generated with <a href="https://claude.ai/code">Claude Code</a></p>
</div>
