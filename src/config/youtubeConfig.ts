// YouTube solution configuration for different subjects and mocks
export interface YouTubeSolution {
  subject: string;
  testId: string;
  youtubeUrl: string;
  title: string;
  description?: string;
}

// YouTube solutions configuration
export const youtubeSolutions: YouTubeSolution[] = [
  // SSC CGL Mock Tests
  {
    subject: 'maths',
    testId: 'ssc-cgl-mock-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'Mathematics',
    description: ''
  },
  {
    subject: 'english',
    testId: 'ssc-cgl-mock-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'English',
    description: ''
  },
  {
    subject: 'gk',
    testId: 'ssc-cgl-mock-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'General Knowledge',
    description: ''
  },
  {
    subject: 'reasoning',
    testId: 'ssc-cgl-mock-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'Reasoning',
    description: ''
  },
  
  // SSC CGL Mock Test 2
  {
    subject: 'maths',
    testId: 'ssc-cgl-mock-2',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'SSC CGL Mock Test 2 - Mathematics Solutions',
    description: 'Complete solution video for Mathematics section'
  },
  {
    subject: 'english',
    testId: 'ssc-cgl-mock-2',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'SSC CGL Mock Test 2 - English Solutions',
    description: 'Complete solution video for English section'
  },
  
  // SSC CGL PYQ Sets
  {
    subject: 'maths',
    testId: 'ssc-cgl-2024-set-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'SSC CGL 2024 Set 1 - Mathematics Solutions',
    description: 'Complete solution video for Mathematics section'
  },
  {
    subject: 'english',
    testId: 'ssc-cgl-2024-set-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'English',
    description: 'Complete solution video for English section'
  },
  {
    subject: 'maths',
    testId: 'ssc-cgl-2024-set-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'SSC CGL 2024 Set 1 - Mathematics Solutions',
    description: 'Complete solution video for Mathematics section'
  },
  {
    subject: 'english',
    testId: 'ssc-cgl-2024-set-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'SSC CGL 2024 Set 1 - English Solutions',
    description: 'Complete solution video for English section'
  },
  
  // Railway Mock Tests
  {
    subject: 'maths',
    testId: 'railway-mock-test-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE',
    title: 'Railway Mock Test 1 - Mathematics Solutions',
    description: 'Complete solution video for Mathematics section'
  },
  {
    subject: 'gk',
    testId: 'railway-mock-test-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE0',
    title: 'Railway Mock Test 1 - General Knowledge Solutions',
    description: 'Complete solution video for General Knowledge section'
  },
  
  // Bank PO Mock Tests
  {
    subject: 'maths',
    testId: 'bank-po-mock-test-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE1',
    title: 'Bank PO Mock Test 1 - Mathematics Solutions',
    description: 'Complete solution video for Mathematics section'
  },
  {
    subject: 'english',
    testId: 'bank-po-mock-test-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE2',
    title: 'Bank PO Mock Test 1 - English Solutions',
    description: 'Complete solution video for English section'
  },
  
  // Air Force Mock Tests
  {
    subject: 'maths',
    testId: 'airforce-mock-test-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE3',
    title: 'Air Force Mock Test 1 - Mathematics Solutions',
    description: 'Complete solution video for Mathematics section'
  },
  {
    subject: 'gk',
    testId: 'airforce-mock-test-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWjTbQ_N6vE4',
    title: 'Air Force Mock Test 1 - General Knowledge Solutions',
    description: 'Complete solution video for General Knowledge section'
  }
];

// Helper function to get YouTube solution for a specific subject and test
export const getYouTubeSolution = (subject: string, testId: string): YouTubeSolution | null => {
  return youtubeSolutions.find(
    solution => solution.subject === subject && solution.testId === testId
  ) || null;
};

// Helper function to get all YouTube solutions for a specific test
export const getYouTubeSolutionsForTest = (testId: string): YouTubeSolution[] => {
  return youtubeSolutions.filter(solution => solution.testId === testId);
};

// Helper function to check if YouTube solution exists for a subject and test
export const hasYouTubeSolution = (subject: string, testId: string): boolean => {
  return youtubeSolutions.some(
    solution => solution.subject === subject && solution.testId === testId
  );
};
