#!/bin/bash

# 한국어 기도 동반자 PWA 자동 설정 스크립트
# 사용법: bash setup.sh

set -e  # 에러 발생 시 스크립트 중단

echo "🙏 한국어 기도 동반자 PWA 자동 설정을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "\n${BLUE}📌 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Node.js 버전 확인
check_node() {
    print_step "Node.js 버전 확인 중..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js $NODE_VERSION 설치됨"
        
        # Node.js 18 이상 확인
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ $MAJOR_VERSION -lt 18 ]; then
            print_error "Node.js 18 이상이 필요합니다. 현재 버전: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js가 설치되지 않았습니다. https://nodejs.org에서 설치해주세요."
        exit 1
    fi
}

# Git 확인
check_git() {
    print_step "Git 확인 중..."
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "$GIT_VERSION 설치됨"
    else
        print_error "Git이 설치되지 않았습니다."
        exit 1
    fi
}

# 의존성 설치
install_dependencies() {
    print_step "의존성 설치 중..."
    if [ -f "package.json" ]; then
        npm install
        print_success "의존성 설치 완료"
    else
        print_error "package.json을 찾을 수 없습니다."
        exit 1
    fi
}

# 환경 변수 설정
setup_env() {
    print_step "환경 변수 설정 중..."
    
    if [ -f ".env.local" ]; then
        print_warning ".env.local 파일이 이미 존재합니다."
        read -p "덮어쓰시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_success "기존 .env.local 파일 유지"
            return
        fi
    fi

    cat > .env.local << 'EOF'
# Local development environment variables
# DO NOT commit this file to version control

# Supabase configuration (필수)
NEXT_PUBLIC_SUPABASE_URL=https://aaziehufvqureeixrxag.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhemllaHVmdnF1cmVlaXhyeGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjY0NTAsImV4cCI6MjA3MDcwMjQ1MH0.FRWMBcLjJpV2WfNtxVjx9-fDQVKCOVGi5v6M2lpCsPk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhemllaHVmdnF1cmVlaXhyeGFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyNjQ1MCwiZXhwIjoyMDcwNzAyNDUwfQ.Cnj-lezn5iY-tFPsOsZaJeuIHvsn-qDe_qvFbanmfL8

# OpenAI API for prayer generation (선택사항)
OPENAI_API_KEY=your-openai-api-key-here

# Google Cloud TTS API (선택사항)
GOOGLE_CLOUD_API_KEY=AIzaSyDLMzUnvPrKhDHEjJAG85sKlXivNLzm7zI

# Azure Speech Services (선택사항)
AZURE_SPEECH_KEY=your-azure-speech-key-here
AZURE_SPEECH_REGION=koreacentral

# Naver Clova Speech for TTS (선택사항)
NAVER_CLIENT_ID=placeholder-naver-id
NAVER_CLIENT_SECRET=placeholder-naver-secret

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
EOF

    print_success ".env.local 파일 생성 완료"
}

# 개발 서버 실행 여부 확인
ask_dev_server() {
    print_step "설정 완료!"
    echo
    echo -e "${GREEN}🎉 프로젝트 설정이 완료되었습니다!${NC}"
    echo
    echo "사용 가능한 명령어:"
    echo "  npm run dev      - 개발 서버 실행"
    echo "  npm run build    - 프로덕션 빌드"
    echo "  npm run lint     - 코드 린트 검사"
    echo
    read -p "지금 개발 서버를 실행하시겠습니까? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo -e "\n${BLUE}나중에 개발 서버를 실행하려면:${NC}"
        echo "cd $(pwd)"
        echo "npm run dev"
        echo
        echo -e "${BLUE}브라우저에서 http://localhost:3000 접속${NC}"
    else
        echo
        print_step "개발 서버 실행 중..."
        npm run dev
    fi
}

# 메인 실행
main() {
    echo -e "${GREEN}"
    echo "=================================================="
    echo "🙏 한국어 기도 동반자 PWA 자동 설정"
    echo "=================================================="
    echo -e "${NC}"
    
    check_node
    check_git
    install_dependencies
    setup_env
    ask_dev_server
}

# 스크립트 실행
main "$@"