/**
 * UUID Utilities for ExamAce
 * Provides UUID generation with fallback for environments where crypto.randomUUID() is not available
 */

/**
 * Generate a random UUID v4
 * Uses crypto.randomUUID() if available, otherwise falls back to manual generation
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID() if available (modern browsers and Node.js 14.17+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments
  return generateUUIDFallback();
}

/**
 * Fallback UUID generation using crypto.getRandomValues() or Math.random()
 */
function generateUUIDFallback(): string {
  // Use crypto.getRandomValues() if available (most modern browsers)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Set version (4) and variant bits
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant bits
    
    const hex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32)
    ].join('-');
  }
  
  // Final fallback using Math.random() (not cryptographically secure but works)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a user ID specifically for user profiles
 * This ensures we always get a valid UUID for the user_profiles table
 */
export function generateUserID(): string {
  return generateUUID();
}
