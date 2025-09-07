// Dynamic exam configuration system
export interface QuestionConfig {
  id: string;
  questionEn: string;
  questionHi: string;
  options: string[];
  correct: number;
  difficulty: "easy" | "medium" | "hard";
  subject?: string;
  topic?: string;
}

export interface TestConfig {
  id: string;
  name: string;
  duration: number; // in minutes
  questions: QuestionConfig[];
  breakdown?: string;
}

export interface TopicConfig {
  id: string;
  name: string;
  sets: TestConfig[];
}

export interface SubjectConfig {
  id: string;
  name: string;
  topics: TopicConfig[];
}

export interface SectionConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'mock' | 'pyq' | 'practice';
  tests?: TestConfig[];
  years?: { year: string; papers: TestConfig[] }[];
  subjects?: SubjectConfig[];
}

export interface ExamConfig {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  logo?: string;
  stats: {
    enrolled: string;
    tests: string;
  };
  sections: SectionConfig[];
}

// Sample questions for all exams (will be replaced by dynamic loading)
const sampleQuestions: QuestionConfig[] = [
  {
    id: "q1",
    questionEn: "What is the square root of 144?",
    questionHi: "144 का वर्गमूल क्या है?",
    options: ["10", "12", "14", "16"],
    correct: 1,
    difficulty: "easy",
    subject: "maths",
    topic: "algebra"
  },
  {
    id: "q2",
    questionEn: "If 2x + 5 = 15, what is the value of x?",
    questionHi: "यदि 2x + 5 = 15, तो x का मान क्या है?",
    options: ["3", "5", "7", "10"],
    correct: 1,
    difficulty: "medium",
    subject: "maths",
    topic: "algebra"
  }
];

// Generate dynamic tests based on questions
const generateMockTests = (questions: QuestionConfig[], count: number = 1): TestConfig[] => {
  const tests: TestConfig[] = [];
  
  for (let i = 1; i <= count; i++) {
    tests.push({
      id: `mock-test-${i}`,
      name: `Full Mock Test ${i}`,
      duration: 30, // 2 questions = 30 minutes
      questions: questions,
      breakdown: `${questions.length} questions - Mixed subjects`
    });
  }
  
  return tests;
};

const generatePYQTests = (questions: QuestionConfig[]): { year: string; papers: TestConfig[] }[] => {
  const years = ["2024", "2023", "2022", "2021", "2020"];
  const yearData: { year: string; papers: TestConfig[] }[] = [];
  
  years.forEach(year => {
    const papers: TestConfig[] = [];
    
  // Create only available papers for each year
  const availablePapers = {
    '2024': ['set-1', 'set-2'],
    '2023': ['set-1'],
    '2022': ['set-1'],
    '2021': ['set-1'],
    '2020': ['set-1']
  };
  
  const papersForYear = availablePapers[year as keyof typeof availablePapers] || [];
  papersForYear.forEach(setId => {
    papers.push({
      id: `${year}-${setId}`,
      name: `PYQ ${year} ${setId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      duration: 30,
      questions: questions
    });
  });
    
    yearData.push({ year, papers });
  });
  
  return yearData;
};

const generatePracticeSets = (questions: QuestionConfig[], examId: string): SubjectConfig[] => {
  const subjects: { [key: string]: { name: string; topics: { [key: string]: string } } } = {
    maths: {
      name: "Quantitative Aptitude",
      topics: {
        algebra: "Algebra"
      }
    }
  };

  const subjectConfigs: SubjectConfig[] = [];

  Object.entries(subjects).forEach(([subjectId, subject]) => {
    const topics: TopicConfig[] = [];

    Object.entries(subject.topics).forEach(([topicId, topicName]) => {
      const sets: TestConfig[] = [];
      
      sets.push({
        id: `${examId}-${subjectId}-${topicId}`,
        name: `Practice Set 1`,
        duration: 30, // 2 questions = 30 minutes
        questions: questions
      });

      if (sets.length > 0) {
        topics.push({
          id: topicId,
          name: topicName,
          sets
        });
      }
    });

    if (topics.length > 0) {
      subjectConfigs.push({
        id: subjectId,
        name: subject.name,
        topics
      });
    }
  });

  return subjectConfigs;
};

// Exam configurations
export const examConfigs: { [key: string]: ExamConfig } = {
  "ssc-cgl": {
    id: "ssc-cgl",
    name: "SSC CGL",
    fullName: "Staff Selection Commission Combined Graduate Level",
    icon: "BookOpen",
    color: "from-blue-500 to-blue-600",
    logo: "/logos/ssc-cgl-logo.png",
    stats: { enrolled: "2.5M+", tests: "150+" },
    sections: [
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sampleQuestions)
      },
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sampleQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sampleQuestions, "ssc-cgl")
      }
    ]
  },
  "ssc-mts": {
    id: "ssc-mts",
    name: "SSC MTS",
    fullName: "Staff Selection Commission Multi Tasking Staff",
    icon: "Users",
    color: "from-green-500 to-green-600",
    logo: "/logos/ssc-mts-logo.png",
    stats: { enrolled: "1.8M+", tests: "120+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sampleQuestions, 1) // Fewer tests for MTS
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sampleQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sampleQuestions, "ssc-mts")
      }
    ]
  },
  "railway": {
    id: "railway",
    name: "Railway",
    fullName: "Railway Recruitment Board Examinations",
    icon: "TrendingUp",
    color: "from-purple-500 to-purple-600",
    logo: "/logos/railway-logo.png",
    stats: { enrolled: "3.2M+", tests: "200+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sampleQuestions, 1)
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sampleQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sampleQuestions, "railway")
      }
    ]
  },
  "bank-po": {
    id: "bank-po",
    name: "Bank PO",
    fullName: "Bank Probationary Officer",
    icon: "Trophy",
    color: "from-orange-500 to-orange-600",
    logo: "/logos/bank-po-logo.png",
    stats: { enrolled: "1.9M+", tests: "180+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sampleQuestions, 1)
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sampleQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sampleQuestions, "bank-po")
      }
    ]
  },
  "airforce": {
    id: "airforce",
    name: "Airforce",
    fullName: "Indian Air Force Group X & Y",
    icon: "Brain",
    color: "from-red-500 to-red-600",
    logo: "/logos/airforce-logo.png",
    stats: { enrolled: "850K+", tests: "90+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sampleQuestions, 1)
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sampleQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sampleQuestions, "airforce")
      }
    ]
  }
};

// Helper function to get questions for a specific test
export const getQuestionsForTest = (examId: string, sectionId: string, testId: string, topicId?: string): QuestionConfig[] => {
  const exam = examConfigs[examId];
  if (!exam) return [];

  const section = exam.sections.find(s => s.id === sectionId);
  if (!section) return [];

  // For mock tests
  if (section.type === 'mock' && section.tests) {
    const test = section.tests.find(t => t.id === testId);
    return test?.questions || [];
  }

  // For PYQ tests
  if (section.type === 'pyq' && section.years) {
    for (const year of section.years) {
      const paper = year.papers.find(p => p.id === testId);
      if (paper) return paper.questions;
    }
  }

  // For practice sets
  if (section.type === 'practice' && section.subjects && topicId) {
    for (const subject of section.subjects) {
      for (const topic of subject.topics) {
        if (topic.id === topicId) {
          const set = topic.sets.find(s => s.id === testId);
          return set?.questions || [];
        }
      }
    }
  }

  return [];
};

// Helper function to get test duration
export const getTestDuration = (examId: string, sectionId: string, testId: string, topicId?: string): number => {
  const exam = examConfigs[examId];
  if (!exam) return 30;

  const section = exam.sections.find(s => s.id === sectionId);
  if (!section) return 30;

  // For mock tests
  if (section.type === 'mock' && section.tests) {
    const test = section.tests.find(t => t.id === testId);
    return test?.duration || 180;
  }

  // For PYQ tests  
  if (section.type === 'pyq' && section.years) {
    for (const year of section.years) {
      const paper = year.papers.find(p => p.id === testId);
      if (paper) return paper.duration || 180;
    }
  }

  // For practice sets
  if (section.type === 'practice' && section.subjects && topicId) {
    for (const subject of section.subjects) {
      for (const topic of subject.topics) {
        if (topic.id === topicId) {
          const set = topic.sets.find(s => s.id === testId);
          return set?.duration || 30;
        }
      }
    }
  }

  return 30;
};