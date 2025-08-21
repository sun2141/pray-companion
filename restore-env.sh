#!/bin/bash

# 개발용 환경 변수 복원 스크립트
# 사용법: bash restore-env.sh

echo "🔧 개발용 환경 변수 복원 중..."

# 개인용 환경 파일이 있는지 확인
if [ -f ".env.local.personal" ]; then
    echo "✅ .env.local.personal 파일 발견"
    
    # 기존 .env.local 백업 (필요시)
    if [ -f ".env.local" ]; then
        cp .env.local .env.local.backup
        echo "📄 기존 .env.local 파일을 .env.local.backup으로 백업"
    fi
    
    # 개인용 환경 파일을 .env.local로 복사
    cp .env.local.personal .env.local
    echo "✅ 개발용 API 키가 복원되었습니다!"
    
    echo ""
    echo "🚀 이제 개발 서버를 시작할 수 있습니다:"
    echo "   npm run dev"
    echo ""
    echo "⚠️  주의: .env.local.personal 파일은 절대 Git에 커밋하지 마세요!"
    
else
    echo "❌ .env.local.personal 파일을 찾을 수 없습니다."
    echo ""
    echo "📝 다음 명령으로 개인용 환경 파일을 생성하세요:"
    echo "   cp .env.example .env.local.personal"
    echo "   nano .env.local.personal"
    echo ""
    echo "💡 그 다음 실제 API 키들을 입력하고 이 스크립트를 다시 실행하세요."
fi