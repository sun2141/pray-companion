# Google Cloud TTS 설정 가이드

이 앱에서 고품질 한국어 남성 음성을 사용하기 위해 Google Cloud Text-to-Speech API를 설정하는 방법입니다.

## 💰 비용 정보
- **매우 저렴함**: 1백만 자당 $4 (한국어 WaveNet)
- **Neural2 음성**: 1백만 자당 $16 (최고 품질)
- **무료 할당량**: 매월 1백만 자까지 무료 (Standard 음성)
- **실제 사용량**: 기도문 1개당 약 200-500자 → 월 수천 개 기도문 생성 가능

## 🚀 설정 단계

### 1. Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 결제 계정 설정 (필수 - 무료 크레딧 사용 가능)

### 2. Text-to-Speech API 활성화
1. Google Cloud Console에서 "API 및 서비스" → "라이브러리" 이동
2. "Cloud Text-to-Speech API" 검색 후 활성화
3. "사용 설정" 버튼 클릭

### 3. API 키 생성
1. "API 및 서비스" → "사용자 인증 정보" 이동
2. "+ 사용자 인증 정보 만들기" → "API 키" 선택
3. 생성된 API 키 복사

### 4. API 키 제한 설정 (보안)
1. 생성된 API 키 옆의 편집 버튼 클릭
2. "API 제한사항"에서 "키 제한" 선택
3. "Cloud Text-to-Speech API"만 선택
4. "HTTP 리퍼러"에서 도메인 제한 설정 (선택사항)

### 5. 환경변수 설정
`.env.local` 파일에서 다음 값을 실제 API 키로 변경:

```bash
GOOGLE_CLOUD_API_KEY=여기에-실제-API-키-입력
```

## 🎵 사용 가능한 음성

### Standard 음성 (무료 할당량 적용)
- `ko-KR-Standard-C`: 남성, 깊은 목소리
- `ko-KR-Standard-D`: 여성, 따뜻한

### WaveNet 음성 (고품질, 저렴)
- `ko-KR-Wavenet-C`: 남성, 자연스러운 ⭐ **추천**
- `ko-KR-Wavenet-D`: 남성, 친근한
- `ko-KR-Wavenet-A`: 여성, 자연스러운
- `ko-KR-Wavenet-B`: 여성, 부드러운

### Neural2 음성 (최고 품질)
- `ko-KR-Neural2-C`: 남성, AI 자연스러운 ⭐ **최고 품질**
- `ko-KR-Neural2-A`: 여성, AI 고품질
- `ko-KR-Neural2-B`: 여성, AI 부드러운

## 🛡️ 보안 모범 사례

1. **API 키 제한**: Text-to-Speech API만 사용하도록 제한
2. **리퍼러 제한**: 특정 도메인에서만 사용하도록 설정
3. **환경변수**: API 키를 코드에 직접 포함하지 말고 환경변수 사용
4. **모니터링**: Google Cloud Console에서 API 사용량 모니터링

## 📊 사용량 모니터링

1. Google Cloud Console → "API 및 서비스" → "할당량"
2. Text-to-Speech API 사용량 확인
3. 알림 설정으로 예산 초과 방지

## 🔧 문제해결

### API 키 오류
- API 키가 올바르게 설정되었는지 확인
- Text-to-Speech API가 활성화되어 있는지 확인
- 결제 계정이 설정되어 있는지 확인

### 권한 오류 (403)
- API 키에 Text-to-Speech API 권한이 있는지 확인
- 프로젝트에서 API가 활성화되어 있는지 확인

### 할당량 초과
- Google Cloud Console에서 현재 사용량 확인
- 필요시 할당량 증가 요청

## 💡 사용 팁

1. **WaveNet-C 추천**: 가장 자연스러운 한국어 남성 음성
2. **캐싱 활용**: 동일한 텍스트는 캐시되어 비용 절약
3. **속도 조절**: 기도문에 적합한 느린 속도(0.9) 기본 설정
4. **품질 vs 비용**: WaveNet이 Neural2보다 4배 저렴하면서도 충분히 고품질

---

이 설정을 완료하면 매우 자연스러운 한국어 남성 음성으로 기도문을 들을 수 있습니다! 🙏