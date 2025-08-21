# Technical Requirements Document (TRD)

## 1. Executive Technical Summary

### 프로젝트 개요
- AI 기반 동행 기도 PWA로, 사용자가 입력한 기도 제목·상황에 맞춰 AI가 맞춤형 기도문을 생성·낭독하며  
  실시간 동행자 수를 제공하여 고립감을 해소하고 꾸준한 기도 생활을 유도  
- Next.js 기반 PWA, Supabase BaaS, OpenAI GPT-3.5 및 Naver Clova TTS 연동, Vercel 배포  

### 핵심 기술 스택
- Frontend: Next.js + TypeScript + Tailwind CSS  
- Backend/BaaS: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)  
- AI: OpenAI GPT-3.5  
- TTS: Naver Clova Speech  
- 배포·호스팅: Vercel  

### 주요 기술 목표
- 성능: 초기 로드 타임 1초 이내, AI 응답 2초 이내  
- 확장성: 동시 사용자 1,000명 이상 수용 가능하도록 설계  
- 안정성: 99.9% 가용성, 실시간 동행자 수 정확도 95% 이상  

### 주요 가정
- Supabase Realtime이 소규모 동시 사용자(수백 명) 수준에서 안정적 동기화 제공  
- OpenAI·Clova TTS API 호출 비용 및 응답 속도가 대체로 일정  
- 초기 사용자 규모는 1천 명 내외이며, 이후 단계별 확장 계획 수립  

---

## 2. Tech Stack

| Category                   | Technology / Library         | Reasoning (Why it's chosen for this project)             |
| -------------------------- | ---------------------------- | -------------------------------------------------------- |
| Frontend Framework         | Next.js                      | PWA 기능(SSR/SSG, Service Worker), Vercel 연동 용이       |
| Language                   | TypeScript                   | 정적 타입 검증, 코드 안정성 향상                          |
| Styling                    | Tailwind CSS                 | 유틸리티 클래스 기반 빠른 UI 개발                         |
| BaaS                       | Supabase                     | Auth, Realtime, PostgreSQL 통합 제공, 개발 속도 향상       |
| AI Service                 | OpenAI GPT-3.5               | 높은 품질의 자연어 생성, 쉬운 API 연동                   |
| TTS Service                | Naver Clova Speech           | 한국어 음성 품질 우수, API 호출 간편                      |
| Hosting / CDN / CI·CD      | Vercel                       | Next.js와 최적화된 배포, 프리뷰 환경 지원, 자동 스케일링  |
| Social Login & Auth        | Supabase Auth                | 구글·카카오·네이버 등 소셜 로그인 간편 통합               |
| Payment Gateway            | Stripe (or Toss)             | 글로벌 및 국내 간편 결제, 구독 결제 기능 안정적 지원      |

---

## 3. System Architecture Design

### Top-Level Building Blocks
- Frontend (Next.js PWA)  
  - Service Worker, 캐싱, PWA 설치  
- BaaS Layer (Supabase)  
  - 인증(Auth), Realtime, PostgreSQL, Edge Functions  
- AI Integration  
  - OpenAI GPT-3.5 호출 및 프롬프트 관리  
- TTS Integration  
  - Naver Clova Speech API 호출 및 오디오 캐싱  
- CDN & Hosting  
  - Vercel 배포, 자동 스케일링, HTTPS  

### Top-Level Component Interaction Diagram
```mermaid
graph TD
    F[Frontend(PWA)] --> E[Edge Functions]
    E --> A[OpenAI GPT-3.5]
    E --> T[Naver Clova Speech]
    F --> S[Supabase Realtime]
    F --> D[Supabase PostgreSQL]
    F --> P[Stripe/Toss]
```
- 사용자가 PWA(UI)에서 기도 제목 입력 후 요청  
- Edge Functions가 OpenAI GPT-3.5 및 Clova TTS 호출  
- Supabase Realtime을 통해 실시간 동행자 수 구독/갱신  
- Supabase PostgreSQL에 세션·구독·사용자 정보 저장  
- Stripe/Toss로 결제 처리 및 구독 상태 관리  

### Code Organization & Convention

**Domain-Driven Organization Strategy**
- Domain Separation: `prayer`, `user`, `subscription`, `share`  
- Layer-Based Architecture: Presentation(pages/components), Business Logic(services), Data Access(lib/db), Infrastructure(integrations)  
- Feature-Based Modules: 각 도메인별 폴더에 UI·로직 밀집  
- Shared Components: 공통 UI, 유틸리티, 타입 정의

**Universal File & Folder Structure**
```
/
├── public
│   └── assets
├── src
│   ├── domains
│   │   ├── prayer
│   │   │   ├── components
│   │   │   ├── services
│   │   │   └── types
│   │   ├── user
│   │   ├── subscription
│   │   └── share
│   ├── pages
│   │   ├── _app.tsx
│   │   ├── index.tsx
│   │   └── api
│   ├── components
│   ├── services
│   ├── lib
│   │   ├── db.ts
│   │   ├── supabaseClient.ts
│   │   └── apiClient.ts
│   ├── styles
│   └── utils
├── supabase
│   ├── migrations
│   └── functions
├── next.config.js
├── tailwind.config.js
└── package.json
```

### Data Flow & Communication Patterns
- Client-Server 통신: Next.js API Routes 및 Supabase 클라이언트 사용  
- Database Interaction: Supabase JS SDK + PostgREST, ORM 불필요  
- External Service Integration: Edge Functions에서 OpenAI·Clova 호출, 응답 캐싱  
- Real-time Communication: Supabase Realtime 구독(Presence)  
- Data Synchronization: 사용자 세션 만료 처리, 캐시 무효화 로직  

---

## 4. Performance & Optimization Strategy
- SSR/SSG 및 Incremental Static Regeneration 활용으로 초기 로드 최적화  
- AI·TTS 응답 결과 오디오·텍스트 캐싱하여 재호출 비용 절감  
- 이미지 카드 생성·공유 시 클라이언트 사이드 처리 및 Web Workers 활용  
- Tailwind JIT 모드, 코드 분할(Code Splitting)으로 번들 크기 최소화  

---

## 5. Implementation Roadmap & Milestones

### Phase 1: Foundation (MVP Implementation)
- Core Infrastructure: Next.js 프로젝트 초기화, Supabase 세팅  
- Essential Features: AI 기도문 생성, TTS 낭독, 실시간 동행자 수, 기본 UI  
- Basic Security: Supabase Auth, HTTPS, CORS 설정  
- Development Setup: GitHub Actions CI, Vercel Preview 배포  
- Timeline: 4~6주

### Phase 2: Feature Enhancement
- Advanced Features: 공유 카드 생성/다운로드, 구독 결제 로직  
- Performance Optimization: 캐싱 전략 강화, 로딩 스켈레톤  
- Enhanced Security: 결제 정보 암호화, Rate Limiting  
- Monitoring Implementation: Sentry 오류 모니터링, Vercel Analytics  
- Timeline: 2~4주

### Phase 3: Scaling & Optimization
- Scalability Implementation: Supabase Horizontal Scaling, DB 인덱스 최적화  
- Advanced Integrations: 소그룹 중보기도, 기도 저널 모듈  
- Enterprise Features: 관리자 대시보드, A/B 테스트  
- Compliance & Auditing: 개인정보보호법, PCI DSS 준수  
- Timeline: 4~6주

---

## 6. Risk Assessment & Mitigation Strategies

### Technical Risk Analysis
- Technology Risks: AI 응답 품질 저하 → 프롬프트 튜닝, 신고 기능  
- Performance Risks: Realtime 부하 증가 → 세션 타임아웃, Connection Pool 관리  
- Security Risks: 인증·결제 취약점 → Supabase 보안 규칙, HTTPS·CSP 적용  
- Integration Risks: 외부 API 장애 → 타임아웃·재시도 로직, 장애 대체 메시지 제공  
- Mitigation Strategies: 단계별 부하 테스트, 비용 모니터링, 롤백 전략 수립  

### Project Delivery Risks
- Timeline Risks: 요구사항 변경 → 스코프 우선순위 조정, 스프린트 리뷰  
- Resource Risks: AI·인프라 전문성 부족 → 외부 컨설팅, 문서화 강화  
- Quality Risks: 테스트 부족 → 유닛·통합 테스트, 코드 리뷰 강화  
- Deployment Risks: CI/CD 오류 → 프리뷰 환경 검증, 롤링 배포 전략  
- Contingency Plans: 기능 축소 출시, 백업 환경 구성, 인력·일정 버퍼 확보