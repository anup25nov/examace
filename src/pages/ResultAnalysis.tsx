import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Brain
} from "lucide-react";

const ResultAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId, sectionId } = useParams();
  
  const {
    score,
    correct,
    incorrect,
    total,
    timeTaken,
    answers,
    questions
  } = location.state || {};

  if (!location.state) {
    navigate(`/exam/${examId}`);
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const accuracy = Math.round((correct / total) * 100);
  const avgTimePerQuestion = Math.round(timeTaken / total);
  const unattempted = total - correct - incorrect;

  // Performance analysis
  const getPerformanceLevel = () => {
    if (score >= 80) return { level: "Excellent", color: "success", message: "Outstanding performance! Keep it up!" };
    if (score >= 60) return { level: "Good", color: "primary", message: "Good work! Focus on weak areas to improve further." };
    if (score >= 40) return { level: "Average", color: "warning", message: "You're on the right track. More practice needed." };
    return { level: "Needs Improvement", color: "destructive", message: "Don't worry! Focus on fundamentals and practice regularly." };
  };

  const performance = getPerformanceLevel();

  // Recommendations based on performance
  const getRecommendations = () => {
    const recommendations = [];
    
    if (accuracy < 50) {
      recommendations.push({
        icon: BookOpen,
        title: "Review Fundamentals",
        description: "Revisit basic concepts and practice topic-wise questions",
        action: "Start Practice"
      });
    }
    
    if (avgTimePerQuestion > 90) {
      recommendations.push({
        icon: Clock,
        title: "Improve Speed",
        description: "Practice timed tests to increase solving speed",
        action: "Speed Practice"
      });
    }
    
    if (accuracy > 80 && avgTimePerQuestion < 60) {
      recommendations.push({
        icon: Trophy,
        title: "Take Mock Tests",
        description: "You're ready for full-length mock examinations",
        action: "Mock Test"
      });
    }
    
    if (unattempted > total * 0.2) {
      recommendations.push({
        icon: Target,
        title: "Attempt All Questions",
        description: "Practice time management to attempt all questions",
        action: "Time Practice"
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/exam/${examId}`)}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Test Results</h1>
                <p className="text-sm text-muted-foreground">Performance Analysis & Recommendations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => navigate(`/test/${examId}/${sectionId}/practice`)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Test
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Score Overview */}
        <div className="text-center mb-8 animate-scale-in">
          <div className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center gradient-${performance.color === 'success' ? 'primary' : 'card'} border-4 border-${performance.color}`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{score}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </div>
          <h2 className={`text-2xl font-bold text-${performance.color} mb-2`}>{performance.level}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{performance.message}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="gradient-card border-0 text-center">
            <CardContent className="p-4">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-foreground">{correct}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0 text-center">
            <CardContent className="p-4">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold text-foreground">{incorrect}</p>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0 text-center">
            <CardContent className="p-4">
              <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{formatTime(timeTaken)}</p>
              <p className="text-sm text-muted-foreground">Total Time</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0 text-center">
            <CardContent className="p-4">
              <Target className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Breakdown */}
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Performance Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Accuracy</span>
                  <span className="text-sm text-muted-foreground">{accuracy}%</span>
                </div>
                <Progress value={accuracy} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Speed (Avg per question)</span>
                  <span className="text-sm text-muted-foreground">{avgTimePerQuestion}s</span>
                </div>
                <Progress value={Math.max(0, 100 - (avgTimePerQuestion / 120 * 100))} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Attempt Rate</span>
                  <span className="text-sm text-muted-foreground">{Math.round((total - unattempted) / total * 100)}%</span>
                </div>
                <Progress value={(total - unattempted) / total * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-lg font-bold text-success">{correct}</div>
                  <div className="text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-destructive">{incorrect}</div>
                  <div className="text-muted-foreground">Wrong</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{unattempted}</div>
                  <div className="text-muted-foreground">Skipped</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-accent" />
                <span>Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <rec.icon className="w-5 h-5 mt-1 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <Button size="sm" variant="outline">
                        {rec.action}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-success" />
                  <p className="text-foreground font-medium">Excellent Performance!</p>
                  <p className="text-sm text-muted-foreground">Keep practicing to maintain your level.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button 
            size="lg"
            onClick={() => navigate(`/exam/${examId}`)}
            className="gradient-primary border-0"
          >
            Back to Dashboard
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate(`/test/${examId}/${sectionId}/practice`)}
          >
            Practice More
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate(`/test/${examId}/full/mock`)}
          >
            Take Mock Test
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultAnalysis;