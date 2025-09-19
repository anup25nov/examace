import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Trophy, Users, TrendingUp, Brain, ChevronRight, Flame, FileText, Smartphone, Download, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { examConfigs } from "@/config/examConfig";

import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserStreak } from "@/hooks/useUserStreak";
import { analytics } from "@/lib/analytics";
import { optimizeRouteTransition } from "@/lib/navigationOptimizer";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import UserMessages from '@/components/UserMessages';
import { MembershipPlans } from "@/components/MembershipPlans";
import { PhoneUpdateModal } from "@/components/PhoneUpdateModal";
import { ReferralSystem } from "@/components/ReferralSystem";
import { ReferralCodeInput } from "@/components/ReferralCodeInput";
import { DailyAccolades } from "@/components/DailyAccolades";
// Removed referral code modal from login flow - now handled during OTP verification
import Footer from "@/components/Footer";

// Icon mapping for dynamic loading
const iconMap: { [key: string]: any } = {
  BookOpen,
  Users,
  TrendingUp,
  Trophy,
  Brain
};

const exams = Object.values(examConfigs).map(exam => ({
  ...exam,
  icon: iconMap[exam.icon] || BookOpen
}));

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { profile } = useUserProfile();
  const { streak, refreshStreak } = useUserStreak();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Referral code collection removed - now handled during OTP verification for new users only
  
  // New modal states
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showReferralSystem, setShowReferralSystem] = useState(false);
  const [showReferralCodeInput, setShowReferralCodeInput] = useState(false);
  const [appliedReferralCode, setAppliedReferralCode] = useState<string | null>(null);
  const [showDailyAccolades, setShowDailyAccolades] = useState(false);
  const [isFirstDailyVisit, setIsFirstDailyVisit] = useState(false);

  // Track page view and check daily visit
  useEffect(() => {
    analytics.trackPageView('home', 'S2S Home');
    
    // Check if this is the first visit today
    if (isAuthenticated) {
      const today = new Date().toDateString();
      const lastVisit = localStorage.getItem('lastVisit');
      
      if (lastVisit !== today) {
        setIsFirstDailyVisit(true);
        setShowDailyAccolades(true);
        localStorage.setItem('lastVisit', today);
      }
    }
  }, [isAuthenticated]);


  const handleLogout = async () => {
    await logout();
  };

  // New modal handlers
  const handleMembershipClick = () => {
    setShowMembershipPlans(true);
  };


  const handlePlanSelect = (_plan: any) => {
    // MembershipPlans will handle opening RazorpayCheckout internally
    setShowMembershipPlans(false);
  };

  const handlePaymentSuccess = (_paymentId: string) => {
    // Handled inside MembershipPlans/RazorpayCheckout
  };

  const handlePhoneUpdateSuccess = (phone: string) => {
    console.log('Phone updated:', phone);
    setShowPhoneModal(false);
    // TODO: Update phone in database
  };

  const handleReferralClick = () => {
    setShowReferralSystem(true);
  };

  const handleReferralCodeApplied = (code: string) => {
    setAppliedReferralCode(code);
    setShowReferralCodeInput(false);
    // Show success message
    console.log('Referral code applied:', code);
  };


  const handleExamSelect = (examId: string) => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      // Track exam selection
      analytics.trackExamSelect(examId);
      
      setIsNavigating(true);
      // Optimize route transition
      optimizeRouteTransition('/', `/exam/${examId}`);
      navigate(`/exam/${examId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  if (isNavigating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Navigating...</h2>
          <p className="text-muted-foreground">Taking you to your exam</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/logos/alternate_image.png"
                alt="S2S Logo" 
                className="h-6 w-auto sm:h-8"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">S2S</h1>
                {/* <p className="text-xs text-gray-600 hidden sm:block">Seedha Selection</p> */}
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <UserMessages />
                <ProfileDropdown
                  onLogout={handleLogout}
                  onMembershipClick={handleMembershipClick}
                  onReferralClick={handleReferralClick}
                />
              </div>
            ) : (
              <Button 
                onClick={() => navigate('/auth')} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 py-2 text-sm sm:text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

          {/* Hero Section with Streak */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Streak Display - Only show when authenticated */}
          {isAuthenticated && streak && (
            <div className="mb-6">
              <div className="inline-flex items-center justify-center space-x-4 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-8 py-4 shadow-xl">
                <Flame className="w-7 h-7 text-orange-400 animate-pulse" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white drop-shadow-lg">
                    {streak.current_streak || 0}
                  </div>
                  <div className="text-sm text-white/90 font-semibold">
                    Day Streak 🔥
                  </div>
                </div>
                <div className="w-px h-10 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white drop-shadow-lg">
                    {streak.longest_streak || 0}
                  </div>
                  <div className="text-sm text-white/90 font-semibold">
                    Best Streak
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Brand Name - Glorified */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-2xl mb-4 tracking-tight">
              S2S
            </h1>
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white/95 drop-shadow-lg mb-2 tracking-wide">
                Seedha Selection
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full shadow-lg"></div>
            </div>
          </div>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto animate-slide-up font-medium leading-relaxed">
            Your direct path to government job success. Practice with real exam patterns, track your progress, and achieve your dream job.
          </p>
          <div className="flex flex-wrap justify-center gap-6 animate-scale-in">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Timed Tests</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Real Exam Patterns</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Progress Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Exams Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Exam</span>
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Select your target exam and start your preparation journey
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Active Exam - SSC CGL (Bigger Card) */}
            {exams.filter(exam => exam.id === 'ssc-cgl').map((exam) => (
              <Card
                key={exam.id}
                className="bg-white border-0 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                onClick={() => handleExamSelect(exam.id)}
              >
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-r ${exam.color} flex items-center justify-center flex-shrink-0`}>
                      {exam.logo ? (
                        <img 
                          src={exam.logo} 
                          alt={`${exam.name} logo`}
                          className="w-12 h-12 md:w-16 md:h-16 object-contain"
                        />
                      ) : (
                        <exam.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                        <h4 className="text-xl md:text-2xl font-bold text-foreground">{exam.name}</h4>
                        <div className="flex items-center justify-center md:justify-end space-x-2 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full mt-2 md:mt-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-semibold">Active</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">Start your SSC CGL preparation with comprehensive mock tests and previous year questions</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start space-x-4 md:space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Mock Tests</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">PYQ Sets</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Practice</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Coming Soon Exams (Compact Vertical List) */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-muted-foreground mb-4">Coming Soon</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {exams.filter(exam => exam.id !== 'ssc-cgl').map((exam) => (
                  <Card
                    key={exam.id}
                    className="gradient-card border-0 opacity-50 cursor-not-allowed"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${exam.color} flex items-center justify-center flex-shrink-0`}>
                          {exam.logo ? (
                            <img 
                              src={exam.logo} 
                              alt={`${exam.name} logo`}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <exam.icon className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">{exam.name}</h4>
                        </div>
                        <span className="text-xs bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-1 rounded-full font-semibold shadow-md">
                          Coming Soon
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">S2S</span>?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the most comprehensive and effective government exam preparation platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Topic-wise Practice</h4>
              <p className="text-gray-600 text-lg leading-relaxed">Master concepts with focused practice sets designed by experts</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Previous Year Questions</h4>
              <p className="text-gray-600 text-lg leading-relaxed">Practice with authentic past exam questions and detailed solutions</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Full Mock Tests</h4>
              <p className="text-gray-600 text-lg leading-relaxed">Simulate real exam experience with comprehensive mock tests</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Download Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <Smartphone className="w-16 h-16 mx-auto lg:mx-0 mb-4 text-yellow-400" />
                <h3 className="text-4xl md:text-5xl font-bold mb-4">
                  Download Our <span className="text-yellow-400">Mobile App</span>
                </h3>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Study on the go! Access all features, take tests, and track your progress anywhere, anytime.
                </p>
              </div>
              
              <div className="space-y-4">
                {/* <div className="flex items-center space-x-3 text-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Offline test access</span>
                </div> */}
                <div className="flex items-center space-x-3 text-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Push notifications for reminders</span>
                </div>
                <div className="flex items-center space-x-3 text-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Sync across all devices</span>
                </div>
                <div className="flex items-center space-x-3 text-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Mobile-optimized interface</span>
                </div>
              </div>
            </div>

            {/* Right Side - QR Code and Download */}
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-sm mx-auto">
                <div className="mb-6">
                  <QrCode className="w-24 h-24 mx-auto mb-4 text-white" />
                  <p className="text-lg font-semibold mb-2">Scan to Download</p>
                  <p className="text-blue-100 text-sm">Available on Google Play Store</p>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => window.open('https://play.google.com/store', '_blank')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download for Android
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-blue-200 mb-2">Coming Soon</p>
                    <Button 
                      disabled
                      className="w-full bg-gray-500 text-white font-bold py-4 px-6 rounded-xl opacity-50 cursor-not-allowed"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download for iOS
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showMembershipPlans && (
        <MembershipPlans
          onSelectPlan={handlePlanSelect}
          onClose={() => setShowMembershipPlans(false)}
          currentPlan={(profile as any)?.membership_plan}
        />
      )}

      {/* Payment handled within MembershipPlans via RazorpayCheckout */}

      {showPhoneModal && (
        <PhoneUpdateModal
          currentPhone={(profile as any)?.phone}
          onClose={() => setShowPhoneModal(false)}
          onPhoneUpdate={handlePhoneUpdateSuccess}
        />
      )}

      {showReferralSystem && (
        <ReferralSystem
          onClose={() => setShowReferralSystem(false)}
        />
      )}

      {showReferralCodeInput && (
        <ReferralCodeInput
          onReferralApplied={handleReferralCodeApplied}
          onClose={() => setShowReferralCodeInput(false)}
        />
      )}

      {/* Daily Accolades */}
      <DailyAccolades
        isFirstVisit={isFirstDailyVisit}
        onClose={() => {
          setShowDailyAccolades(false);
          setIsFirstDailyVisit(false);
        }}
      />

      {/* Referral Code Collection removed - now handled during OTP verification for new users only */}

      <Footer />
    </div>
  );
};

export default Index;