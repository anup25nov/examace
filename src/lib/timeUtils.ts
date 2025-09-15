// Time utility functions for IST timezone handling

/**
 * Get current date in IST timezone
 * @returns Date string in YYYY-MM-DD format in IST
 */
export const getCurrentISTDate = (): string => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().split('T')[0];
};

/**
 * Get current time in IST timezone
 * @returns Date object in IST
 */
export const getCurrentISTTime = (): Date => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  return new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
};

/**
 * Check if current time is after midnight IST
 * @returns boolean indicating if it's after midnight IST
 */
export const isAfterMidnightIST = (): boolean => {
  const istTime = getCurrentISTTime();
  const hours = istTime.getUTCHours();
  return hours >= 0; // After midnight (00:00)
};

/**
 * Get yesterday's date in IST timezone
 * @returns Date string in YYYY-MM-DD format in IST
 */
export const getYesterdayISTDate = (): string => {
  const istTime = getCurrentISTTime();
  const yesterday = new Date(istTime.getTime() - (24 * 60 * 60 * 1000));
  return yesterday.toISOString().split('T')[0];
};

/**
 * Check if a date string is today in IST
 * @param dateString Date string in YYYY-MM-DD format
 * @returns boolean indicating if the date is today in IST
 */
export const isTodayIST = (dateString: string): boolean => {
  const todayIST = getCurrentISTDate();
  return dateString === todayIST;
};

/**
 * Check if a date string is yesterday in IST
 * @param dateString Date string in YYYY-MM-DD format
 * @returns boolean indicating if the date is yesterday in IST
 */
export const isYesterdayIST = (dateString: string): boolean => {
  const yesterdayIST = getYesterdayISTDate();
  return dateString === yesterdayIST;
};

/**
 * Get time until next midnight IST
 * @returns milliseconds until next midnight IST
 */
export const getTimeUntilNextMidnightIST = (): number => {
  const istTime = getCurrentISTTime();
  const nextMidnight = new Date(istTime);
  nextMidnight.setUTCHours(24, 0, 0, 0); // Next midnight IST
  return nextMidnight.getTime() - istTime.getTime();
};
