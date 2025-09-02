import { 
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface TestAttempt {
  id: string;
  userId: string;
  examId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken?: number;
  completedAt: any;
  answers: any;
}

export interface ExamStatsData {
  id?: string;
  userId: string;
  examId: string;
  totalTests: number;
  bestScore: number;
  averageScore: number;
  rank?: number;
  lastTestDate: any;
}

// Store test attempt in Firestore
export const storeTestAttempt = async (
  userId: string,
  examId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  timeTaken: number,
  answers: any
) => {
  try {
    const attemptsCollection = collection(db, 'test_attempts');
    const attemptData = {
      userId,
      examId,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken,
      answers,
      completedAt: serverTimestamp()
    };

    const docRef = await addDoc(attemptsCollection, attemptData);

    // Update exam stats after storing attempt
    await updateExamStatsAfterTest(userId, examId, score);

    return { success: true, data: { id: docRef.id, ...attemptData } };
  } catch (error: any) {
    console.error('Error storing test attempt:', error);
    return { success: false, error: error.message };
  }
};

// Update exam stats after test completion
export const updateExamStatsAfterTest = async (
  userId: string, 
  examId: string, 
  newScore: number
) => {
  try {
    // Get last 20 attempts for average calculation
    const attemptsQuery = query(
      collection(db, 'test_attempts'),
      where('userId', '==', userId),
      where('examId', '==', examId),
      orderBy('completedAt', 'desc'),
      limit(20)
    );

    const attemptsSnapshot = await getDocs(attemptsQuery);
    const recentScores = attemptsSnapshot.docs.map(doc => doc.data().score);
    
    // Calculate average of last 20 attempts
    const last20Average = recentScores.length > 0 ? 
      Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length) : 
      newScore;

    // Get current stats
    const statsDocRef = doc(db, 'exam_stats', `${userId}_${examId}`);
    const currentStatsDoc = await getDoc(statsDocRef);

    let updatedStats;
    if (currentStatsDoc.exists()) {
      const currentStats = currentStatsDoc.data();
      // Update existing stats
      updatedStats = {
        totalTests: currentStats.totalTests + 1,
        bestScore: Math.max(currentStats.bestScore, newScore),
        averageScore: last20Average,
        lastTestDate: serverTimestamp()
      };

      await updateDoc(statsDocRef, updatedStats);
    } else {
      // Create new stats
      updatedStats = {
        userId,
        examId,
        totalTests: 1,
        bestScore: newScore,
        averageScore: newScore,
        lastTestDate: serverTimestamp()
      };

      await setDoc(statsDocRef, updatedStats);
    }

    // Calculate rank for this exam
    await calculateExamRank(examId);

    return { success: true, data: updatedStats };
  } catch (error: any) {
    console.error('Error updating exam stats:', error);
    return { success: false, error: error.message };
  }
};

// Calculate and update ranks for all users in an exam
export const calculateExamRank = async (examId: string) => {
  try {
    const statsQuery = query(
      collection(db, 'exam_stats'),
      where('examId', '==', examId),
      orderBy('bestScore', 'desc'),
      orderBy('averageScore', 'desc'),
      orderBy('totalTests', 'desc')
    );

    const statsSnapshot = await getDocs(statsQuery);
    
    // Update ranks
    const updatePromises = statsSnapshot.docs.map((docSnap, index) => {
      return updateDoc(docSnap.ref, { rank: index + 1 });
    });

    await Promise.all(updatePromises);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error calculating ranks:', error);
    return { success: false, error: error.message };
  }
};

// Get user's exam statistics
export const getUserExamStats = async (userId: string, examId: string) => {
  try {
    const statsDocRef = doc(db, 'exam_stats', `${userId}_${examId}`);
    const docSnap = await getDoc(statsDocRef);

    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } as ExamStatsData };
    } else {
      // Return default values if no stats found
      return {
        success: true,
        data: {
          userId,
          examId,
          totalTests: 0,
          bestScore: 0,
          averageScore: 0,
          rank: null,
          lastTestDate: null
        } as ExamStatsData
      };
    }
  } catch (error: any) {
    console.error('Error getting user exam stats:', error);
    return { success: false, error: error.message };
  }
};

// Get user's test attempts for an exam
export const getUserTestAttempts = async (
  userId: string, 
  examId: string, 
  limitCount: number = 20
) => {
  try {
    const attemptsQuery = query(
      collection(db, 'test_attempts'),
      where('userId', '==', userId),
      where('examId', '==', examId),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(attemptsQuery);
    const attempts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TestAttempt));

    return { success: true, data: attempts };
  } catch (error: any) {
    console.error('Error getting user test attempts:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Get leaderboard for an exam
export const getExamLeaderboard = async (examId: string, limitCount: number = 50) => {
  try {
    const leaderboardQuery = query(
      collection(db, 'exam_stats'),
      where('examId', '==', examId),
      orderBy('rank', 'asc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(leaderboardQuery);
    const leaderboard = [];

    for (const docSnap of querySnapshot.docs) {
      const statsData = docSnap.data();
      
      // Get user profile for phone number
      const userDoc = await getDoc(doc(db, 'users', statsData.userId));
      const userData = userDoc.exists() ? userDoc.data() : { phone: 'Unknown' };

      leaderboard.push({
        id: docSnap.id,
        ...statsData,
        user_profiles: { phone: userData.phone }
      });
    }

    return { success: true, data: leaderboard };
  } catch (error: any) {
    console.error('Error getting exam leaderboard:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Get all exam stats for a user (for dashboard)
export const getAllUserExamStats = async (userId: string) => {
  try {
    const statsQuery = query(
      collection(db, 'exam_stats'),
      where('userId', '==', userId),
      orderBy('lastTestDate', 'desc')
    );

    const querySnapshot = await getDocs(statsQuery);
    const allStats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ExamStatsData));

    return { success: true, data: allStats };
  } catch (error: any) {
    console.error('Error getting all user exam stats:', error);
    return { success: false, error: error.message, data: [] };
  }
};