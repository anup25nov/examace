import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Clock,
  Users,
  Eye,
  RotateCcw,
  Play,
  Crown,
  Lock,
  CheckCircle
} from 'lucide-react';
import { PremiumTest, premiumService } from '@/lib/premiumService';
import { PremiumPaymentModal } from './PremiumPaymentModal';
import { TestStartModal } from './TestStartModal';

interface YearData {
  year: string;
  papers: PremiumTest[];
}

interface YearWiseTabsProps {
  years: YearData[];
  completedTests: Set<string>;
  testScores: Map<string, { score: number; rank: number; totalParticipants: number }>;
  onStartTest: (testId: string, language?: string) => void;
  onViewSolutions: (testId: string) => void;
  onRetry: (testId: string) => void;
  testFilter?: 'all' | 'attempted' | 'not-attempted';
  className?: string;
  sectionMessage?: {
    type: string;
    message: string;
    icon: string;
    actionText: string;
    actionType: string;
  } | null;
  onMessageAction?: (actionType: string) => void;
}

export const YearWiseTabs: React.FC<YearWiseTabsProps> = ({
  years,
  completedTests,
  testScores,
  onStartTest,
  onViewSolutions,
  onRetry,
  testFilter = 'all',
  className = '',
  sectionMessage,
  onMessageAction
}) => {
  const [selectedYear, setSelectedYear] = useState(years[0]?.year || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTestStartModal, setShowTestStartModal] = useState(false);
  const [selectedPremiumTest, setSelectedPremiumTest] = useState<PremiumTest | null>(null);
  const [selectedTestForStart, setSelectedTestForStart] = useState<PremiumTest | null>(null);
  const papersPerPage = 6;

  const selectedYearData = years.find(year => year.year === selectedYear);
  
  // Filter papers based on test filter
  const filteredPapers = selectedYearData ? selectedYearData.papers.filter(paper => {
    const isCompleted = completedTests.has(`pyq-${paper.id}`);
    
    if (testFilter === 'attempted') return isCompleted;
    if (testFilter === 'not-attempted') return !isCompleted;
    return true; // Show all for 'all' filter
  }) : [];
  
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);
  const currentPapers = filteredPapers.slice(currentPage * papersPerPage, (currentPage + 1) * papersPerPage);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentPage(0);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleStartTest = (paper: PremiumTest) => {
    if (paper.isPremium && !premiumService.hasAccess(paper.id)) {
      setSelectedPremiumTest(paper);
      setShowPaymentModal(true);
    } else {
      setSelectedTestForStart(paper);
      setShowTestStartModal(true);
    }
  };

  const handleStartWithLanguage = (language: string) => {
    if (selectedTestForStart) {
      onStartTest(selectedTestForStart.id, language);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPremiumTest(null);
  };

  const getYearStats = (year: string) => {
    const yearData = years.find(y => y.year === year);
    if (!yearData) return { total: 0, completed: 0 };

    const total = yearData.papers.length;
    const completed = yearData.papers.filter(paper => 
      completedTests.has(`pyq-${paper.id}`)
    ).length;

    return { total, completed };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Year Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {years.map((yearData) => {
          const stats = getYearStats(yearData.year);
          const isSelected = selectedYear === yearData.year;
          
          // Hide year if filter is 'attempted' and no completed tests
          if (testFilter === 'attempted' && stats.completed === 0) {
            return null;
          }
          
          return (
            <Button
              key={yearData.year}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleYearChange(yearData.year)}
              className={`relative transition-all duration-200 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{yearData.year}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    isSelected 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : 'bg-muted-foreground/20'
                  }`}
                >
                  {stats.completed}/{stats.total}
                </Badge>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Section Message */}
      {sectionMessage && (
        <div className={`p-4 rounded-lg border ${
          sectionMessage.type === 'info' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' :
          sectionMessage.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
          'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{sectionMessage.icon}</div>
              <p className={`font-medium ${
                sectionMessage.type === 'info' ? 'text-blue-700' :
                sectionMessage.type === 'success' ? 'text-green-700' :
                'text-yellow-700'
              }`}>
                {sectionMessage.message}
              </p>
            </div>
            <Button
              onClick={() => onMessageAction?.(sectionMessage.actionType)}
              className={`${
                sectionMessage.type === 'info' ? 'bg-blue-600 hover:bg-blue-700' :
                sectionMessage.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              } text-white`}
              size="sm"
            >
              {sectionMessage.actionText}
            </Button>
          </div>
        </div>
      )}

      {/* Selected Year Content */}
      {selectedYearData && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-orange-50 to-red-50">
          <CardHeader className="pb-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">SSC CGL {selectedYear}</h3>
                  <p className="text-sm text-orange-100">
                    {selectedYearData.papers.length} Previous Year Papers
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {getYearStats(selectedYear).completed}
                </div>
                <div className="text-sm text-orange-100">Completed</div>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Papers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentPapers.map((paper) => {
                const isCompleted = completedTests.has(`pyq-${paper.id}`);
                const testScore = testScores.get(`pyq-${paper.id}`);

                return (
        <Card
          key={paper.id}
          className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] hover:border-primary/40 h-72 group ${
            isCompleted ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' : 'border-border bg-gradient-to-br from-white to-slate-50'
          }`}
        >
                    <CardContent className="p-4 h-full flex flex-col">
                      {/* Header */}
                      <div className="mb-4 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground text-sm line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300">
                            {paper.name}
                          </h4>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                            <Badge className={`text-xs px-2 py-1 ${
                              paper.isPremium 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse' 
                                : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                            }`}>
                              {paper.isPremium ? (
                                <div className="flex items-center space-x-1">
                                  <Crown className="w-3 h-3" />
                                  <span>PREMIUM</span>
                                </div>
                              ) : (
                                'FREE'
                              )}
                            </Badge>
                            {isCompleted && (
                              <div className="flex items-center space-x-1 animate-bounce">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-green-600 font-medium hidden sm:inline">Completed</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Paper Details */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{paper.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{paper.duration} min</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-muted-foreground">{paper.questions} questions</span>
                          </div>
                          
                        </div>
                      </div>
                      
                      {/* Score Display */}
                      <div className="mb-4 min-h-[60px] flex items-center justify-center">
                        {testScore && isCompleted ? (
                          <div className="w-full p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{testScore.score}</div>
                                <div className="text-xs text-blue-500 font-medium">Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">#{testScore.rank}</div>
                                <div className="text-xs text-purple-500 font-medium">Rank</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <div className="text-xs">Complete to see</div>
                              <div className="text-xs">score & rank</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 mt-auto">
                        {isCompleted ? (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-md"
                              onClick={() => onViewSolutions(paper.id)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Solutions
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-md"
                              onClick={() => onRetry(paper.id)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full h-8 text-xs bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-md"
                            onClick={() => handleStartTest(paper)}
                            disabled={paper.isPremium && !premiumService.hasAccess(paper.id)}
                          >
                            {paper.isPremium && !premiumService.hasAccess(paper.id) ? (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Unlock Premium
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Start Test
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Premium Overlay */}
                      {paper.isPremium && !premiumService.hasAccess(paper.id) && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <div className="text-center text-white">
                            <Crown className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                            <p className="text-xs font-medium">Premium Content</p>
                            <p className="text-xs opacity-90">₹{paper.price}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      {selectedPremiumTest && (
        <PremiumPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          test={selectedPremiumTest}
          onPurchaseSuccess={handlePaymentSuccess}
        />
      )}

      {/* Test Start Modal */}
      {selectedTestForStart && (
        <TestStartModal
          isOpen={showTestStartModal}
          onClose={() => setShowTestStartModal(false)}
          onStart={handleStartWithLanguage}
          test={selectedTestForStart}
          testType="pyq"
        />
      )}
    </div>
  );
};
