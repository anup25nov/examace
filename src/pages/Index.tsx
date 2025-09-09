import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Trophy, Users, TrendingUp, Brain, ChevronRight, Flame, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { examConfigs } from "@/config/examConfig";

import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserStreak } from "@/hooks/useUserStreak";
import { analytics } from "@/lib/analytics";
import { optimizeRouteTransition } from "@/lib/navigationOptimizer";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { MembershipPlans } from "@/components/MembershipPlans";
import { PaymentModal } from "@/components/PaymentModal";
import { PhoneUpdateModal } from "@/components/PhoneUpdateModal";
import { ReferralSystem } from "@/components/ReferralSystem";
import { ReferralCodeInput } from "@/components/ReferralCodeInput";
import { TrustIndicators } from "@/components/TrustIndicators";
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
  
  // New modal states
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showReferralSystem, setShowReferralSystem] = useState(false);
  const [showReferralCodeInput, setShowReferralCodeInput] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [appliedReferralCode, setAppliedReferralCode] = useState<string | null>(null);

  // Track page view
  useEffect(() => {
    analytics.trackPageView('home', 'ExamAce Home');
  }, []);


  const handleLogout = async () => {
    await logout();
  };

  // New modal handlers
  const handleMembershipClick = () => {
    setShowMembershipPlans(true);
  };

  const handlePhoneUpdate = () => {
    setShowPhoneModal(true);
  };

  const handleSettingsClick = () => {
    // TODO: Implement settings modal
    console.log('Settings clicked');
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setShowMembershipPlans(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    setShowPaymentModal(false);
    setSelectedPlan(null);
    // TODO: Update user membership in database
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
      optimizeRouteTransition('/', `/exam-pro/${examId}`);
      navigate(`/exam-pro/${examId}`);
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
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/logos/examace-logo.svg" 
              alt="ExamAce Logo" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">ExamAce</h1>
              <p className="text-xs text-muted-foreground">Master Your Success</p>
            </div>
          </div>
          
          {isAuthenticated ? (
            <ProfileDropdown
              onLogout={handleLogout}
              onMembershipClick={handleMembershipClick}
              onPhoneUpdate={handlePhoneUpdate}
              onSettingsClick={handleSettingsClick}
              onReferralClick={handleReferralClick}
            />
          ) : (
            <Button onClick={() => navigate('/auth')} className="gradient-primary border-0">
              Login
            </Button>
          )}
        </div>
      </header>

          {/* Hero Section with Streak */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Streak Display - Only show when authenticated */}
          {isAuthenticated && streak && (
            <div className="mb-6">
              <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 shadow-lg">
                <Flame className="w-6 h-6 text-orange-400" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">
                    {streak.current_streak || 0}
                  </div>
                  <div className="text-xs text-white/80 font-medium">
                    Day Streak 🔥
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-left">
                  <div className="text-lg font-semibold text-white">
                    {streak.longest_streak || 0}
                  </div>
                  <div className="text-xs text-white/80">
                    Best Streak
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            Ace Your Competitive Exams
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-slide-up">
            Practice with real exam patterns, track your progress, and boost your confidence with our comprehensive test platform.
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Choose Your Exam
            </h3>
          </div>
          
          <div className="space-y-6">
            {/* Active Exam - SSC CGL (Bigger Card) */}
            {exams.filter(exam => exam.id === 'ssc-cgl').map((exam) => (
              <Card
                key={exam.id}
                className="exam-card-hover gradient-card border-0 cursor-pointer hover:shadow-xl transition-all duration-300"
                onClick={() => handleExamSelect(exam.id)}
              >
                <CardContent className="p-6 md:p-8">
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
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Topic-wise Practice</h4>
              <p className="text-muted-foreground">Master concepts with focused practice sets</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Previous Year Questions</h4>
              <p className="text-muted-foreground">Practice with authentic past exam questions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Full Mock Tests</h4>
              <p className="text-muted-foreground">Simulate real exam experience with timers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <TrustIndicators />
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

      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

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

      <Footer />
    </div>
  );
};

export default Index;