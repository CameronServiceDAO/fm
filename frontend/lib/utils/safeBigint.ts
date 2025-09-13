* Safe BigInt conversion utilities
 * Handles undefined, null, and various input types safely
 */

/**
 * Safely convert any value to bigint
 * Returns 0n if value is undefined, null, or invalid
 */
export function safeBigInt(value: any): bigint {
  if (value === undefined || value === null) {
    return 0n;
  }
  
  // If it's already a bigint, return it
  if (typeof value === 'bigint') {
    return value;
  }
  
  // If it's a number, convert it
  if (typeof value === 'number') {
    return BigInt(Math.floor(value));
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    try {
      // Remove any formatting characters
      const cleaned = value.replace(/[^0-9-]/g, '');
      return cleaned ? BigInt(cleaned) : 0n;
    } catch {
      return 0n;
    }
  }
  
  // If it's an object with toString, try that
  if (typeof value === 'object' && value.toString) {
    try {
      const str = value.toString();
      // Check if it's an empty object string representation
      if (str === '[object Object]' || str === '{}') {
        return 0n;
      }
      return BigInt(str);
    } catch {
      return 0n;
    }
  }
  
  // Default fallback
  return 0n;
}

/**
 * Check if a value is a valid bigint or can be converted to one
 */
export function isValidBigInt(value: any): boolean {
  try {
    safeBigInt(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a value as bigint with a fallback
 */
export function toBigInt(value: any, fallback: bigint = 0n): bigint {
  try {
    return safeBigInt(value);
  } catch {
    return fallback;
  }
}

/**
 * Ensure a value is bigint for arithmetic operations
 */
export function ensureBigInt(value: any): bigint {
  const result = safeBigInt(value);
  if (result < 0n) {
    console.warn('Negative bigint value detected:', value);
  }
  return result;
}