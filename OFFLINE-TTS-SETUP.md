# 오프라인 TTS 설정 가이드 (Piper TTS)

완전히 무료이면서 개인정보를 100% 보호하는 오프라인 TTS 시스템 설정 가이드입니다.

## 🔐 주요 장점

### 완전한 개인정보 보호
- **기도문이 외부로 전송되지 않음**: 모든 처리가 로컬에서 이루어짐
- **인터넷 연결 불필요**: 모델 다운로드 후 오프라인 사용 가능
- **데이터 수집 없음**: 음성 사용 기록이 어디에도 저장되지 않음

### 경제적 이점
- **완전 무료**: 사용량 제한 없음, 영구 무료
- **무제한 사용**: 하루에 수백 개 기도문 생성해도 비용 발생 없음
- **한 번 설치로 영구 사용**: 추가 비용 없이 계속 사용

### 기술적 안정성
- **오픈소스**: Piper TTS는 검증된 오픈소스 프로젝트
- **로컬 실행**: 서버 다운타임에 영향받지 않음
- **높은 호환성**: 대부분의 운영체제에서 동작

## 💾 품질 vs 비용/보안 비교

| 특징 | Google/Azure TTS | 브라우저 TTS | **Piper 오프라인** |
|------|------------------|--------------|-------------------|
| 음성 품질 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 비용 | 월 $2-8 | 무료 | **완전 무료** |
| 개인정보 | 클라우드 전송 | 브라우저 처리 | **100% 로컬** |
| 인터넷 필요 | 필수 | 불필요 | **모델 다운로드 후 불필요** |
| 사용량 제한 | 있음 | 없음 | **없음** |
| 한국어 지원 | 최고 | 시스템 의존 | **우수** |

## 🚀 설치 방법

### 방법 1: Docker 사용 (권장)

```bash
# Docker로 Piper TTS 실행
docker run -d \
  --name piper-tts \
  -p 59125:59125 \
  -v $(pwd)/piper-models:/data/models \
  rhasspy/piper:latest \
  --model /data/models/ko_KR-kss-medium.onnx \
  --config /data/models/ko_KR-kss-medium.onnx.json \
  --port 59125
```

### 방법 2: 직접 설치

#### macOS
```bash
# Homebrew로 설치
brew install piper-tts

# 또는 바이너리 다운로드
wget https://github.com/rhasspy/piper/releases/latest/download/piper_macos_x64.tar.gz
tar -xzf piper_macos_x64.tar.gz
sudo mv piper /usr/local/bin/
```

#### Ubuntu/Debian
```bash
# 공식 릴리스에서 다운로드
wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz
tar -xzf piper_linux_x86_64.tar.gz
sudo mv piper /usr/local/bin/
sudo chmod +x /usr/local/bin/piper
```

#### Windows
1. [Piper 릴리스 페이지](https://github.com/rhasspy/piper/releases)에서 `piper_windows_amd64.zip` 다운로드
2. 압축 해제 후 `piper.exe`를 PATH에 추가

### 환경변수 설정

`.env.local` 파일에 Piper 경로 추가:
```bash
# Piper TTS 실행 파일 경로
PIPER_PATH=/usr/local/bin/piper

# 또는 Docker 사용시
PIPER_API_URL=http://localhost:59125
```

## 🎵 한국어 음성 모델

### 사용 가능한 모델

1. **ko_KR-kss-medium** (추천)
   - 크기: 25MB
   - 품질: 높음
   - 성별: 남성 톤
   - 발음: 명확하고 자연스러움

2. **ko_KR-kss-low**
   - 크기: 10MB
   - 품질: 기본
   - 성별: 중성
   - 발음: 실용적, 빠른 로딩

### 모델 다운로드

앱에서 "오프라인 기도 음성" 선택 후 자동 다운로드되지만, 수동으로도 가능:

```bash
# 모델 저장 디렉토리 생성
mkdir -p public/piper-models

# Medium 품질 모델 다운로드
wget -O public/piper-models/ko_KR-kss-medium.onnx \
  https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx

wget -O public/piper-models/ko_KR-kss-medium.onnx.json \
  https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx.json
```

## 🎯 기도 최적화 설정

Piper TTS가 기도문에 최적화된 설정으로 동작합니다:

### 음성 설정
- **속도**: 0.8배 (차분하고 느린 속도)
- **피치**: 0.9배 (약간 낮은 톤으로 안정감)
- **문장 휴지**: 1초 (묵상과 사색을 위한 시간)

### 텍스트 전처리
- 문장 단위 분리
- 각 문장 후 적절한 휴지 삽입
- 기도문에 적합한 억양 패턴

## 🔧 고급 설정

### 성능 최적화
```bash
# CPU 코어 수에 따른 최적화
export OMP_NUM_THREADS=4

# 메모리 사용량 제한
export PIPER_MAX_MEMORY=512MB
```

### 모바일 최적화
- 경량 모델(`ko_KR-kss-low`) 사용 권장
- 배터리 소모 최소화
- 빠른 응답 시간

## 📱 사용 방법

1. **음성 엔진에서 "오프라인 기도 음성" 선택**
2. **원하는 음성 모델 선택**
3. **"모델 다운로드" 버튼 클릭** (최초 1회만)
4. **다운로드 완료 후 "오프라인 음성으로 듣기" 사용**

## 🛡️ 보안 및 개인정보

### 데이터 흐름
1. 기도문 → 로컬 Piper 엔진
2. 로컬 합성 → 오디오 파일
3. 브라우저 재생

**외부 전송 없음!** 모든 과정이 사용자 디바이스에서만 처리됩니다.

### 저장 위치
- 음성 모델: `public/piper-models/`
- 생성된 오디오: 메모리에서만 처리 (디스크 저장 안함)
- 사용 기록: 어디에도 저장되지 않음

## 🔍 문제해결

### Piper 실행 오류
```bash
# Piper 설치 확인
which piper
piper --version

# 권한 확인
chmod +x /usr/local/bin/piper
```

### 모델 다운로드 실패
- 인터넷 연결 확인
- 디스크 공간 확인 (최소 100MB)
- 방화벽 설정 확인

### 음성 품질 개선
- Medium 모델 사용 (25MB)
- 적절한 CPU 할당
- 조용한 환경에서 재생

## 💡 추천 사용 시나리오

### 개인 기도용 (최고 개인정보 보호)
- **Piper 오프라인 TTS** 사용
- 기도 내용이 절대 외부 유출되지 않음
- 완전 무료로 무제한 사용

### 가족/공동체용
- **프리미엄 TTS** (Google/Azure) 멀티캐스팅 사용
- 고품질 음성으로 함께하는 기도 분위기

### 경제적 사용
- **Piper 오프라인** 메인 사용
- 특별한 날에만 프리미엄 TTS 사용

---

이 설정을 통해 완전히 안전하고 무료인 기도 음성 환경을 구축하실 수 있습니다! 🔐🙏