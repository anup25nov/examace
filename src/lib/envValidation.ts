/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  required: string[];
  optional: string[];
  validations?: Record<string, (value: string) => boolean>;
}

const ENV_CONFIG: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ],
  optional: [
    'VITE_OBFUSCATION_KEY',
    'VITE_RAZORPAY_KEY_ID',
    'VITE_SENTRY_DSN',
    'VITE_ANALYTICS_ID'
  ],
  validations: {
    VITE_SUPABASE_URL: (value: string) => value.startsWith('https://') && value.includes('.supabase.co'),
    VITE_OBFUSCATION_KEY: (value: string) => value.length >= 32,
  }
};

export class EnvValidationError extends Error {
  constructor(message: string, public missingVars: string[] = []) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

// Generate a secure obfuscation key if not provided
const generateObfuscationKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'examace_secure_key_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const validateEnvironment = (): void => {
  const errors: string[] = [];
  const missingVars: string[] = [];

  // Check required variables
  for (const varName of ENV_CONFIG.required) {
    const value = import.meta.env[varName];
    
    if (!value) {
      missingVars.push(varName);
      errors.push(`Required environment variable ${varName} is missing`);
      continue;
    }

    // Run validation if defined
    const validator = ENV_CONFIG.validations?.[varName];
    if (validator && !validator(value)) {
      errors.push(`Environment variable ${varName} has invalid value`);
    }
  }

  // Check optional variables with validation
  for (const varName of ENV_CONFIG.optional) {
    const value = import.meta.env[varName];
    
    if (value) {
      const validator = ENV_CONFIG.validations?.[varName];
      if (validator && !validator(value)) {
        errors.push(`Optional environment variable ${varName} has invalid value`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    throw new EnvValidationError(
      `Environment validation failed: ${errors.join(', ')}`,
      missingVars
    );
  }

  console.log('✅ Environment validation passed');
};

export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = import.meta.env[name];
  
  if (!value && defaultValue === undefined) {
    throw new EnvValidationError(`Environment variable ${name} is required but not set`);
  }
  
  return value || defaultValue!;
};

export const isProduction = (): boolean => {
  return import.meta.env.MODE === 'production';
};

export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development';
};

// Auto-validate on import in production
if (isProduction()) {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('🚨 CRITICAL: Environment validation failed in production!');
    throw error;
  }
}
