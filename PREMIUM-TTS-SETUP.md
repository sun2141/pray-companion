# 프리미엄 기도 음성 설정 가이드

SSML을 활용한 "기도 톤" 연출과 멀티캐스팅 기능을 위한 설정 가이드입니다.

## 🎵 기도 톤 특징

### SSML 최적화 요소
- **느린 속도 (0.7배)**: 묵상과 기도에 적합한 차분한 속도
- **낮은 피치 (-2st/-10%)**: 평화롭고 안정감 있는 톤
- **부드러운 강세**: 격앙되지 않는 차분한 감정 표현
- **문장 간 휴지 (800ms-1s)**: 깊은 사색과 묵상을 위한 시간

### 멀티캐스팅 기능
- **문단별 음성 교차**: 성인 남성 → 성인 여성 → 장년 남성 → 장년 여성 순환
- **공동체 기도 느낌**: 마치 여러 사람이 함께 기도하는 듯한 연출
- **연령/성별 다양성**: 아이, 성인, 장년의 다양한 음성으로 포용적 기도

## 💰 비용 비교

### Google Cloud TTS
- **Neural2**: 1백만 자당 $16 (최고 품질)
- **WaveNet**: 1백만 자당 $4 (고품질, 추천)
- **Standard**: 1백만 자당 무료 (기본 품질)

### Azure Speech Services
- **Neural**: 1백만 자당 $15 (고품질)
- **Standard**: 1백만 자당 $4
- **무료 할당량**: 매월 50만 자까지 무료

### 실제 사용량 예시
- 기도문 1개: 약 200-500자
- 월 1,000개 기도문 = 약 50만 자
- **예상 월 비용**: $2-8 (매우 저렴!)

## 🚀 설정 방법

### 옵션 1: Google Cloud TTS (추천)

1. **Google Cloud Console 설정**
   ```
   1. https://console.cloud.google.com/ 접속
   2. 새 프로젝트 생성
   3. 결제 계정 설정
   4. Cloud Text-to-Speech API 활성화
   5. API 키 생성
   ```

2. **환경변수 설정**
   ```bash
   GOOGLE_CLOUD_API_KEY=실제-API-키-여기-입력
   ```

### 옵션 2: Azure Speech Services

1. **Azure Portal 설정**
   ```
   1. https://portal.azure.com/ 접속
   2. Speech Services 리소스 생성
   3. 지역: Korea Central 권장
   4. 가격 책정 계층: S0 (유료) 또는 F0 (무료)
   ```

2. **환경변수 설정**
   ```bash
   AZURE_SPEECH_KEY=실제-Speech-키-여기-입력
   AZURE_SPEECH_REGION=koreacentral
   ```

### 옵션 3: 두 서비스 모두 설정 (최고 품질)

두 API를 모두 설정하면 사용자가 원하는 서비스를 선택할 수 있습니다.

## 🎭 사용 가능한 음성 캐릭터

### Google Cloud Neural2 (최고 품질)
- **👨 성인 남성**: ko-KR-Neural2-C (차분한)
- **👩 성인 여성**: ko-KR-Neural2-A (온화한)
- **👴 장년 남성**: ko-KR-Wavenet-C (깊은)
- **👵 장년 여성**: ko-KR-Wavenet-A (부드러운)

### Azure Neural (고품질, 다양성)
- **👨 성인 남성**: ko-KR-InJoonNeural (인준)
- **👩 성인 여성**: ko-KR-SunHiNeural (선희)
- **👴 장년 남성**: ko-KR-BongJinNeural (봉진)
- **👵 장년 여성**: ko-KR-SeoHyeonNeural (서현)
- **👶 아이**: ko-KR-JiMinNeural (지민)

## 🎯 사용 방법

1. **기도문 생성 후 음성 엔진에서 "프리미엄 기도 음성" 선택**
2. **제공자 선택**: Google 또는 Azure
3. **모드 선택**:
   - **단일 음성**: 선택한 한 명의 목소리로 전체 낭독
   - **멀티캐스팅**: 여러 음성이 문장별로 교차하여 낭독
4. **재생**: "기도 톤으로 듣기" 클릭

## 🔧 SSML 기술 세부사항

### 단일 음성 모드 SSML 예시
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
  <voice name="ko-KR-Neural2-C">
    <prosody rate="0.75" pitch="-1st">
      <emphasis level="reduced">
        <s><prosody rate="0.7" pitch="-2st" volume="soft">하나님 아버지.</prosody><break time="800ms"/></s>
        <s><prosody rate="0.7" pitch="-2st" volume="soft">오늘도 저희와 함께 해주셔서 감사합니다.</prosody><break time="800ms"/></s>
      </emphasis>
    </prosody>
  </voice>
</speak>
```

### 멀티캐스팅 모드 SSML 예시
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
  <emphasis level="reduced">
    <voice name="ko-KR-Neural2-C">
      <s><prosody rate="0.7" pitch="-2st" volume="soft">하나님 아버지.</prosody><break time="1s"/></s>
    </voice>
    <voice name="ko-KR-Neural2-A">
      <s><prosody rate="0.7" pitch="0st" volume="soft">오늘도 저희와 함께 해주셔서 감사합니다.</prosody><break time="1s"/></s>
    </voice>
  </emphasis>
</speak>
```

## 🛡️ 보안 및 모니터링

1. **API 키 보안**
   - 환경변수에만 저장
   - GitHub 등에 업로드 금지
   - 필요시 키 순환

2. **사용량 모니터링**
   - 각 플랫폼의 대시보드에서 사용량 확인
   - 예산 알림 설정
   - 예상치 못한 과금 방지

3. **최적화 팁**
   - 동일한 기도문은 캐시 활용
   - 불필요한 재생성 방지
   - 적절한 길이의 기도문 권장

## 🎊 추천 설정

### 개인 기도용
- **Google Neural2-C (성인 남성)** 단일 음성
- 차분하고 깊이 있는 톤으로 개인적인 묵상에 적합

### 가족/공동체 기도용
- **멀티캐스팅 모드** (Google 또는 Azure)
- 다양한 연령층의 음성으로 함께하는 기도 분위기 연출

### 최고 품질 원할 때
- **Google Neural2** 시리즈
- 가장 자연스럽고 감정이 풍부한 AI 음성

---

이 설정을 완료하면 정말 특별한 기도 경험을 하실 수 있습니다! 🙏✨