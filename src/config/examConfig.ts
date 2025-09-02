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
  stats: {
    enrolled: string;
    tests: string;
  };
  sections: SectionConfig[];
}

// Sample questions for SSC CGL
const sscCglQuestions: QuestionConfig[] = [
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
  },
  {
    id: "q3",
    questionEn: "Which of the following is a prime number?",
    questionHi: "निम्नलिखित में से कौन सी एक अभाज्य संख्या है?",
    options: ["15", "21", "23", "27"],
    correct: 2,
    difficulty: "easy",
    subject: "maths",
    topic: "number-system"
  },
  {
    id: "q4",
    questionEn: "The area of a circle with radius 7 cm is:",
    questionHi: "7 सेमी त्रिज्या वाले वृत्त का क्षेत्रफल है:",
    options: ["154 cm²", "44 cm²", "22 cm²", "308 cm²"],
    correct: 0,
    difficulty: "medium",
    subject: "maths",
    topic: "geometry"
  },
  {
    id: "q5",
    questionEn: "What is 25% of 200?",
    questionHi: "200 का 25% क्या है?",
    options: ["25", "50", "75", "100"],
    correct: 1,
    difficulty: "easy",
    subject: "maths",
    topic: "percentage"
  },
  // Add more questions for variety
  {
    id: "q6",
    questionEn: "Who wrote the book 'Discovery of India'?",
    questionHi: "डिस्कवरी ऑफ इंडिया पुस्तक किसने लिखी?",
    options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Subhas Chandra Bose", "Sardar Patel"],
    correct: 1,
    difficulty: "easy",
    subject: "gk",
    topic: "history"
  },
  {
    id: "q7",
    questionEn: "The synonym of 'Abundant' is:",
    questionHi: "'Abundant' का समानार्थी है:",
    options: ["Scarce", "Plentiful", "Limited", "Rare"],
    correct: 1,
    difficulty: "medium",
    subject: "english",
    topic: "vocabulary"
  },
  {
    id: "q8",
    questionEn: "If CODING is written as DPEJOH, how is FLOWER written?",
    questionHi: "यदि CODING को DPEJOH लिखा जाता है, तो FLOWER को कैसे लिखा जाएगा?",
    options: ["GMPXFS", "GMPWFR", "HMPXFS", "GMPXES"],
    correct: 0,
    difficulty: "medium",
    subject: "reasoning",
    topic: "coding-decoding"
  }
];

// Generate dynamic tests based on questions
const generateMockTests = (questions: QuestionConfig[], count: number = 15): TestConfig[] => {
  const tests: TestConfig[] = [];
  const questionsPerTest = Math.min(25, questions.length);
  
  for (let i = 1; i <= count; i++) {
    // Shuffle and select questions for this test
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    const testQuestions = shuffledQuestions.slice(0, questionsPerTest);
    
    tests.push({
      id: `mock-${i}`,
      name: `Full Mock Test ${i}`,
      duration: 180,
      questions: testQuestions,
      breakdown: `${questionsPerTest} questions - Mixed subjects`
    });
  }
  
  return tests;
};

const generatePYQTests = (questions: QuestionConfig[]): { year: string; papers: TestConfig[] }[] => {
  const years = ["2024", "2023", "2022", "2021", "2020"];
  const yearData: { year: string; papers: TestConfig[] }[] = [];
  
  years.forEach(year => {
    const papers: TestConfig[] = [];
    const papersCount = 15; // Number of papers per year
    
    for (let i = 1; i <= papersCount; i++) {
      const shift = ((i - 1) % 3) + 1;
      const date = Math.floor((i - 1) / 3) + 1;
      
      // Shuffle and select questions for this paper
      const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
      const paperQuestions = shuffledQuestions.slice(0, Math.min(25, questions.length));
      
      papers.push({
        id: `${year}-day${date}-shift${shift}`,
        name: `PYQ ${year} (Day ${date}, Shift ${shift})`,
        duration: 180,
        questions: paperQuestions
      });
    }
    
    yearData.push({ year, papers });
  });
  
  return yearData;
};

const generatePracticeSets = (questions: QuestionConfig[]): SubjectConfig[] => {
  const subjects: { [key: string]: { name: string; topics: { [key: string]: string } } } = {
    maths: {
      name: "Quantitative Aptitude",
      topics: {
        algebra: "Algebra",
        geometry: "Geometry",
        "number-system": "Number System",
        percentage: "Percentage",
        trigonometry: "Trigonometry",
        statistics: "Statistics"
      }
    },
    english: {
      name: "English Language",
      topics: {
        grammar: "Grammar",
        vocabulary: "Vocabulary",
        "reading-comprehension": "Reading Comprehension",
        "sentence-correction": "Sentence Correction"
      }
    },
    reasoning: {
      name: "General Intelligence & Reasoning",
      topics: {
        "verbal-reasoning": "Verbal Reasoning",
        "non-verbal-reasoning": "Non-Verbal Reasoning",
        puzzles: "Puzzles & Seating Arrangement",
        "coding-decoding": "Coding & Decoding"
      }
    },
    gk: {
      name: "General Knowledge & Awareness",
      topics: {
        history: "History",
        polity: "Polity & Constitution",
        geography: "Geography",
        "current-affairs": "Current Affairs"
      }
    }
  };

  const subjectConfigs: SubjectConfig[] = [];

  Object.entries(subjects).forEach(([subjectId, subject]) => {
    const topics: TopicConfig[] = [];

    Object.entries(subject.topics).forEach(([topicId, topicName]) => {
      const topicQuestions = questions.filter(q => q.subject === subjectId && q.topic === topicId);
      
      if (topicQuestions.length > 0) {
        const sets: TestConfig[] = [];
        const setsCount = Math.min(5, Math.ceil(topicQuestions.length / 5)); // Create up to 5 sets per topic
        
        for (let i = 1; i <= setsCount; i++) {
          const setQuestions = topicQuestions.slice((i - 1) * 5, i * 5);
          if (setQuestions.length > 0) {
            sets.push({
              id: `${topicId}-set-${i}`,
              name: `Practice Set ${i}`,
              duration: 30,
              questions: setQuestions
            });
          }
        }

        if (sets.length > 0) {
          topics.push({
            id: topicId,
            name: topicName,
            sets
          });
        }
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
    stats: { enrolled: "2.5M+", tests: "150+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sscCglQuestions)
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sscCglQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sscCglQuestions)
      }
    ]
  },
  "ssc-mts": {
    id: "ssc-mts",
    name: "SSC MTS",
    fullName: "Staff Selection Commission Multi Tasking Staff",
    icon: "Users",
    color: "from-green-500 to-green-600",
    stats: { enrolled: "1.8M+", tests: "120+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sscCglQuestions, 10) // Fewer tests for MTS
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sscCglQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sscCglQuestions)
      }
    ]
  },
  "railway": {
    id: "railway",
    name: "Railway",
    fullName: "Railway Recruitment Board Examinations",
    icon: "TrendingUp",
    color: "from-purple-500 to-purple-600",
    stats: { enrolled: "3.2M+", tests: "200+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sscCglQuestions, 20)
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sscCglQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sscCglQuestions)
      }
    ]
  },
  "bank-po": {
    id: "bank-po",
    name: "Bank PO",
    fullName: "Bank Probationary Officer",
    icon: "Trophy",
    color: "from-orange-500 to-orange-600",
    stats: { enrolled: "1.9M+", tests: "180+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sscCglQuestions, 18)
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sscCglQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sscCglQuestions)
      }
    ]
  },
  "airforce": {
    id: "airforce",
    name: "Airforce",
    fullName: "Indian Air Force Group X & Y",
    icon: "Brain",
    color: "from-red-500 to-red-600",
    stats: { enrolled: "850K+", tests: "90+" },
    sections: [
      {
        id: "mock",
        name: "Full Mock Tests",
        icon: "Trophy",
        color: "text-success",
        type: "mock",
        tests: generateMockTests(sscCglQuestions, 9)
      },
      {
        id: "pyq",
        name: "Previous Year Questions",
        icon: "FileText",
        color: "text-warning",
        type: "pyq",
        years: generatePYQTests(sscCglQuestions)
      },
      {
        id: "practice",
        name: "Practice Sets (Subject wise)",
        icon: "BookOpen",
        color: "text-primary",
        type: "practice",
        subjects: generatePracticeSets(sscCglQuestions)
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