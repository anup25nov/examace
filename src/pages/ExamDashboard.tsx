import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Target, 
  Calendar,
  ArrowLeft,
  Play,
  FileText,
  Brain,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { examConfigs } from "@/config/examConfig";
import { useExamStats } from "@/hooks/useExamStats";
import { useAuth } from "@/hooks/useAuth";

// Icon mapping for dynamic loading
const iconMap: { [key: string]: any } = {
  BookOpen,
  Trophy,
  FileText,
  Brain,
  TrendingUp,
  Target
};

const ExamDashboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { allStats, loadAllStats, getExamStatById } = useExamStats();
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    avgScore: 0,
    bestScore: 0,
    streak: 0,
    rank: 0,
    percentile: 0,
    lastActive: null as Date | null
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const exam = examConfigs[examId as string];
  const userPhone = user?.phone || localStorage.getItem("userPhone");

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated || !userPhone) {
      navigate("/");
      return;
    }

    // Load exam stats immediately
    if (examId) {
      loadAllStats();
      
      // Find stats for current exam
      setTimeout(() => {
        const currentExamStats = getExamStatById(examId);
        if (currentExamStats) {
          setUserStats({
            totalTests: currentExamStats.totalTests,
            avgScore: currentExamStats.averageScore,
            bestScore: currentExamStats.bestScore,
            streak: currentExamStats.streak,
            rank: currentExamStats.rank || 0,
            percentile: currentExamStats.percentile || 0,
            lastActive: currentExamStats.lastTestDate
          });
        } else {
          setUserStats({
            totalTests: 0,
            avgScore: 0,
            bestScore: 0,
            streak: 0,
            rank: 0,
            percentile: 0,
            lastActive: null
          });
        }
      }, 100);
    }
  }, [examId, userPhone, navigate, isAuthenticated, isLoading, loadAllStats, getExamStatById]);

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

  if (!exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Exam Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  const handleTestStart = (type: 'practice' | 'pyq' | 'mock', itemId: string, topicId?: string) => {
    const testPath = topicId 
      ? `/test/${examId}/${type}/${itemId}/${topicId}`
      : `/test/${examId}/${type}/${itemId}`;
    navigate(testPath);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

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
                onClick={() => navigate("/")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{exam.name}</h1>
                <p className="text-sm text-muted-foreground">{exam.fullName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Welcome!</p>
              <p className="text-xs text-muted-foreground">+91 {userPhone}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-foreground">{userStats.totalTests}</p>
              <p className="text-sm text-muted-foreground">Tests Taken</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{userStats.avgScore}%</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-foreground">{userStats.bestScore}%</p>
              <p className="text-sm text-muted-foreground">Best Score</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-foreground">{userStats.streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-foreground">#{userStats.rank}</p>
              <p className="text-sm text-muted-foreground">Your Rank</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{userStats.percentile}%</p>
              <p className="text-sm text-muted-foreground">Percentile</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Mock Test */}
        <Card className="exam-card-hover cursor-pointer gradient-primary text-white border-0 mb-8">
          <CardContent className="p-6 text-center">
            <Play className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Quick Full Mock Test</h3>
            <p className="text-white/90 mb-4">Take a complete practice test with 100 questions in 180 minutes</p>
            <Button 
              variant="secondary" 
              className="w-full max-w-xs"
              onClick={() => handleTestStart('mock', 'mock-1')}
            >
              Start Mock Test
            </Button>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-6">
          {exam.sections.map((section) => (
            <Card key={section.id} className="gradient-card border-0">
              <Collapsible 
                open={openSections[section.id]} 
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {iconMap[section.icon] && React.createElement(iconMap[section.icon], {
                          className: `w-6 h-6 ${section.color}`
                        })}
                        <span>{section.name}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                        openSections[section.id] ? 'rotate-180' : ''
                      }`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent>
                    {/* Mock Tests */}
                    {section.id === 'mock' && section.tests && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {section.tests.map((test) => (
                          <Button
                            key={test.id}
                            variant="ghost"
                            className="h-auto p-4 justify-between hover:bg-muted/50"
                            onClick={() => handleTestStart('mock', test.id)}
                          >
                            <div className="text-left">
                              <p className="font-medium text-foreground">{test.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {test.questions.length} questions • {test.duration} minutes
                              </p>
                              <p className="text-xs text-muted-foreground">{test.breakdown}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Previous Year Questions */}
                    {section.id === 'pyq' && section.years && (
                      <div className="space-y-6">
                        {section.years.map((yearData) => (
                          <Collapsible key={yearData.year}>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-5 h-5 text-warning" />
                                  <span className="text-lg font-semibold">{yearData.year} Papers ({yearData.papers.length} sets)</span>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                {yearData.papers.map((paper) => (
                                  <Button
                                    key={paper.id}
                                    variant="ghost"
                                    className="h-auto p-3 justify-between hover:bg-muted/50"
                                    onClick={() => handleTestStart('pyq', paper.id)}
                                  >
                                    <div className="text-left">
                                      <p className="font-medium text-foreground text-sm">{paper.name}</p>
                                      <p className="text-xs text-muted-foreground">{paper.questions.length} questions</p>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  </Button>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}

                    {/* Practice Sets */}
                    {section.id === 'practice' && section.subjects && (
                      <div className="space-y-4">
                        {!selectedSubject ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.subjects.map((subject) => (
                              <Button
                                key={subject.id}
                                variant="ghost"
                                className="h-auto p-6 justify-between hover:bg-muted/50"
                                onClick={() => setSelectedSubject(subject.id)}
                              >
                                <div className="text-left">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    <p className="font-semibold text-foreground">{subject.name}</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {subject.topics.length} topics • {subject.topics.reduce((acc, topic) => acc + topic.sets.length, 0)} total sets
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <Button 
                              variant="ghost" 
                              className="mb-4"
                              onClick={() => setSelectedSubject(null)}
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Back to Subjects
                            </Button>
                            {section.subjects
                              .find(s => s.id === selectedSubject)
                              ?.topics.map((topic) => (
                                <div key={topic.id} className="border border-border rounded-lg p-4 mb-4">
                                  <h4 className="text-lg font-semibold text-foreground mb-3">{topic.name}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {topic.sets.map((set, i) => (
                                      <Button
                                        key={set.id}
                                        variant="ghost"
                                        className="h-auto p-3 justify-between hover:bg-muted/50"
                                        onClick={() => handleTestStart('practice', set.id, topic.id)}
                                      >
                                        <div className="text-left">
                                          <p className="font-medium text-foreground">{set.name}</p>
                                          <p className="text-sm text-muted-foreground">{set.questions.length} questions</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamDashboard;