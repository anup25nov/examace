import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Trophy, Users, TrendingUp, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { examConfigs } from "@/config/examConfig";
import AuthFlow from "@/components/auth/AuthFlow";
import { useAuth } from "@/hooks/useAuth";

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
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();

  const handleAuthSuccess = async () => {
    setShowLogin(false);
    // Refresh user data
    await refreshUser();
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleExamSelect = (examId: string) => {
    if (!isAuthenticated) {
      setShowLogin(true);
    } else {
      navigate(`/exam/${examId}`);
    }
  };

  if (showLogin) {
    return (
      <AuthFlow 
        onSuccess={handleAuthSuccess}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ExamAce</h1>
              <p className="text-xs text-muted-foreground">Master Your Success</p>
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Welcome!</p>
                <p className="text-xs text-muted-foreground">
                  +91 {user?.phone || localStorage.getItem("userPhone")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowLogin(true)} className="gradient-primary border-0">
              Login
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
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
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Choose Your Exam
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam, index) => (
              <Card 
                key={exam.id}
                className="exam-card-hover cursor-pointer gradient-card border-0"
                onClick={() => handleExamSelect(exam.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${exam.color} flex items-center justify-center`}>
                      <exam.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-foreground mb-2">{exam.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{exam.fullName}</p>
                  
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Enrolled:</span>
                      <span className="font-medium text-foreground ml-1">{exam.stats.enrolled}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tests:</span>
                      <span className="font-medium text-foreground ml-1">{exam.stats.tests}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
};

export default Index;