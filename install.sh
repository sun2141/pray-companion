#!/bin/bash

# 한국어 기도 동반자 PWA 원클릭 설치 스크립트
# 사용법: curl -sSL https://raw.githubusercontent.com/sun2141/pray-companion/main/install.sh | bash

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════╗"
    echo "║       🙏 한국어 기도 동반자 PWA 설치        ║"
    echo "║            Korean Prayer Companion              ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

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
    exit 1
}

# 필수 도구 확인
check_requirements() {
    print_step "시스템 요구사항 확인 중..."
    
    # Git 확인
    if ! command -v git &> /dev/null; then
        print_error "Git이 설치되지 않았습니다. https://git-scm.com에서 설치해주세요."
    fi
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        print_error "Node.js가 설치되지 않았습니다. https://nodejs.org에서 LTS 버전을 설치해주세요."
    fi
    
    # Node.js 버전 확인 (18 이상)
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
    if [ $NODE_VERSION -lt 18 ]; then
        print_error "Node.js 18 이상이 필요합니다. 현재 버전: $(node -v)"
    fi
    
    print_success "시스템 요구사항 충족"
}

# 프로젝트 디렉토리 설정
setup_directory() {
    print_step "설치 디렉토리 설정..."
    
    PROJECT_DIR="pray-companion"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "디렉토리 '$PROJECT_DIR'가 이미 존재합니다."
        read -p "삭제 후 다시 설치하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_DIR"
            print_success "기존 디렉토리 삭제"
        else
            print_error "설치를 중단합니다."
        fi
    fi
}

# 저장소 클론
clone_repository() {
    print_step "프로젝트 다운로드 중..."
    
    git clone https://github.com/sun2141/pray-companion.git
    cd pray-companion
    
    print_success "프로젝트 다운로드 완료"
}

# 의존성 설치
install_dependencies() {
    print_step "의존성 설치 중... (이 과정은 몇 분 소요될 수 있습니다)"
    
    npm install --silent
    
    print_success "의존성 설치 완료"
}

# 환경 설정
setup_environment() {
    print_step "환경 설정 중..."
    
    if [ -f "setup.sh" ]; then
        chmod +x setup.sh
        # 자동으로 Yes 응답하도록 echo 사용
        echo "n" | bash setup.sh > /dev/null 2>&1 || true
    fi
    
    print_success "환경 설정 완료"
}

# 설치 완료 안내
show_completion() {
    echo
    echo -e "${GREEN}🎉 설치가 완료되었습니다!${NC}"
    echo
    echo -e "${BLUE}프로젝트 디렉토리:${NC} $(pwd)"
    echo
    echo -e "${YELLOW}다음 명령어로 개발 서버를 시작하세요:${NC}"
    echo "cd pray-companion"
    echo "npm run dev"
    echo
    echo -e "${YELLOW}브라우저에서 다음 주소로 접속하세요:${NC}"
    echo "http://localhost:3000"
    echo
    echo -e "${BLUE}사용 가능한 명령어:${NC}"
    echo "  npm run dev      - 개발 서버 실행"
    echo "  npm run build    - 프로덕션 빌드"
    echo "  npm run lint     - 코드 검사"
    echo
    echo -e "${PURPLE}문의사항이나 이슈는 GitHub에 올려주세요:${NC}"
    echo "https://github.com/sun2141/pray-companion/issues"
    echo
}

# 에러 처리
handle_error() {
    print_error "설치 중 오류가 발생했습니다. 다시 시도하거나 수동으로 설치해주세요."
    echo
    echo "수동 설치 방법:"
    echo "1. git clone https://github.com/sun2141/pray-companion.git"
    echo "2. cd pray-companion"
    echo "3. npm install"
    echo "4. bash setup.sh"
    echo "5. npm run dev"
}

# 메인 실행
main() {
    print_header
    
    # 에러 발생 시 핸들러 설정
    trap handle_error ERR
    
    check_requirements
    setup_directory
    clone_repository
    install_dependencies
    setup_environment
    show_completion
}

# 스크립트 실행
main "$@"