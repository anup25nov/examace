import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle } from 'lucide-react';

interface PYQYearSelectorProps {
  years: { year: string; papers: any[] }[];
  onYearSelect: (year: string) => void;
  selectedYear: string;
  completedTests: Set<string>;
  testType: 'pyq';
}

export const PYQYearSelector: React.FC<PYQYearSelectorProps> = ({
  years,
  onYearSelect,
  selectedYear,
  completedTests,
  testType
}) => {
  const [currentYearIndex, setCurrentYearIndex] = useState(0);

  // Find the latest year (first in the array) and set it as default
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      onYearSelect(years[0].year);
      setCurrentYearIndex(0);
    } else {
      const index = years.findIndex(y => y.year === selectedYear);
      if (index !== -1) {
        setCurrentYearIndex(index);
      }
    }
  }, [years, selectedYear, onYearSelect]);

  const handlePreviousYear = () => {
    if (currentYearIndex > 0) {
      const newIndex = currentYearIndex - 1;
      setCurrentYearIndex(newIndex);
      onYearSelect(years[newIndex].year);
    }
  };

  const handleNextYear = () => {
    if (currentYearIndex < years.length - 1) {
      const newIndex = currentYearIndex + 1;
      setCurrentYearIndex(newIndex);
      onYearSelect(years[newIndex].year);
    }
  };

  const getCompletionStats = (year: string) => {
    const yearData = years.find(y => y.year === year);
    if (!yearData) return { completed: 0, total: 0 };
    
    const total = yearData.papers.length;
    const completed = yearData.papers.filter(paper => 
      completedTests.has(`${testType}-${paper.id}`)
    ).length;
    
    return { completed, total };
  };

  if (years.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Year Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Previous Year Questions</h3>
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousYear}
            disabled={currentYearIndex === 0}
            className="p-2 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {currentYearIndex + 1} / {years.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextYear}
            disabled={currentYearIndex === years.length - 1}
            className="p-2 flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current Year Display */}
      <Card className="gradient-card border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">{selectedYear}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xl font-bold text-foreground">SSC CGL {selectedYear}</h4>
                <p className="text-sm text-muted-foreground">Previous Year Question Papers</p>
              </div>
            </div>
            <div className="flex justify-center sm:justify-end">
              {(() => {
                const stats = getCompletionStats(selectedYear);
                return (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {stats.completed}/{stats.total} Completed
                    </Badge>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Year Navigation Pills */}
          <div className="flex flex-wrap gap-2">
            {years.map((yearData, index) => (
              <Button
                key={yearData.year}
                variant={selectedYear === yearData.year ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentYearIndex(index);
                  onYearSelect(yearData.year);
                }}
                className={`transition-all duration-200 ${
                  selectedYear === yearData.year 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                {yearData.year}
                {(() => {
                  const stats = getCompletionStats(yearData.year);
                  if (stats.completed > 0) {
                    return (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
                        {stats.completed}
                      </Badge>
                    );
                  }
                  return null;
                })()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
