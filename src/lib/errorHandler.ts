// Production-ready error handling utility
export class ProductionError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ProductionError';
  }
}

export const handleStorageError = (operation: string, error: any): void => {
  console.error(`Storage operation failed: ${operation}`, {
    error: error.message,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
};

export const validateTestResult = (result: any): boolean => {
  return (
    result &&
    typeof result.examId === 'string' &&
    typeof result.score === 'number' &&
    typeof result.totalQuestions === 'number' &&
    typeof result.correctAnswers === 'number' &&
    result.score >= 0 && result.score <= 100 &&
    result.totalQuestions > 0 &&
    result.correctAnswers >= 0 &&
    result.correctAnswers <= result.totalQuestions
  );
};

export const sanitizeStorageData = (data: any): any => {
  if (!data) return null;
  
  try {
    // Convert date strings back to Date objects
    if (data.completedAt && typeof data.completedAt === 'string') {
      data.completedAt = new Date(data.completedAt);
    }
    if (data.lastTestDate && typeof data.lastTestDate === 'string') {
      data.lastTestDate = new Date(data.lastTestDate);
    }
    if (data.joinedDate && typeof data.joinedDate === 'string') {
      data.joinedDate = new Date(data.joinedDate);
    }
    if (data.lastActiveDate && typeof data.lastActiveDate === 'string') {
      data.lastActiveDate = new Date(data.lastActiveDate);
    }
    
    return data;
  } catch (error) {
    handleStorageError('sanitize_data', error);
    return null;
  }
};

export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};