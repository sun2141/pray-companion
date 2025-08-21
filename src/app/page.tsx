'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, LogOut, UserPlus, LogIn } from 'lucide-react';
import { useAuthContext } from '@/components/AuthProvider';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { PrayerForm } from '@/features/prayer/components/PrayerForm';
import { TTSPlayer } from '@/features/tts/components/TTSPlayer';
import { APP_CONFIG } from '@/constants';

export default function Home() {
  const { user, loading, isAuthenticated, signOut } = useAuthContext();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [generatedPrayer, setGeneratedPrayer] = useState<{
    title: string;
    content: string;
  } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <AuthModal
        initialMode={authMode}
        onSuccess={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      {/* Header */}
      <header className="border-b border-orange-100/50 bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              {APP_CONFIG.name}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 md:space-x-3">
                <span className="hidden md:block text-sm text-orange-700/80">
                  안녕하세요, {user?.email?.split('@')[0]}님
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 md:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center space-x-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">로그인</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0 shadow-md flex items-center space-x-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">가입</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {!isAuthenticated ? (
          // Welcome Section for Non-authenticated Users
          <div className="text-center mb-8 md:mb-12">
            <div className="max-w-4xl mx-auto">
              {/* Hero Section */}
              <div className="mb-8 md:mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full shadow-lg mb-6">
                  <Heart className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                    AI와 함께하는
                  </span>
                  <br />
                  <span className="text-gray-800">동행 기도</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                  혼자 기도하는 외로움을 해소하고<br className="md:hidden" />
                  AI가 마음에 맞는 기도문을 함께 만들어요 🙏
                </p>
              </div>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-3">맞춤형 기도문</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      상황과 마음에 맞는<br />
                      기승전결이 있는 자연스러운 기도문
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-3">동행 기도</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      실시간으로 함께 기도하는<br />
                      사람들과 동행감을 느껴보세요
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-3">쉬운 공유</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      아름다운 기도문 카드로<br />
                      가족, 친구들과 함께 나눠요
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* CTA Button */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                >
                  🙏 지금 시작하기
                </Button>
                <p className="text-sm text-gray-500">
                  무료로 시작 • 언제든 편안하게
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Main App for Authenticated Users
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            {/* Welcome Header */}
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full shadow-lg mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                  오늘도 함께 기도해요
                </span>
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                마음을 나누고 AI와 함께 의미있는 기도 시간을 가져보세요 ✨
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Prayer Generation Section */}
              <div className="order-1">
                <PrayerForm onPrayerGenerated={setGeneratedPrayer} />
              </div>

              {/* TTS Section */}
              <div className="order-2 lg:order-2">
                {generatedPrayer ? (
                  <TTSPlayer
                    text={generatedPrayer.content}
                    title={generatedPrayer.title}
                  />
                ) : (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-gray-800 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🎵</span>
                        </div>
                        <span>음성 낭독</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center min-h-[200px]">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-rose-100 rounded-full flex items-center justify-center mx-auto">
                          <Heart className="w-8 h-8 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            먼저 기도문을 생성해주세요
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            AI가 생성한 기도문을 따뜻한 음성으로 들을 수 있습니다
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-100/50 bg-gradient-to-r from-orange-50/50 to-rose-50/50 mt-8 md:mt-16">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                {APP_CONFIG.name}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600">
              AI 기반 동행 기도 서비스 • 혼자가 아닌 함께하는 기도 🙏
            </p>
            <p className="text-xs text-gray-500">
              © 2024 {APP_CONFIG.name}. Made with ❤️ for peaceful prayers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
