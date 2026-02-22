/**
 * Rate Limiting Utility for WahfaLab
 * 
 * Prevents abuse and excessive API calls by limiting requests per user
 * within a specified time window.
 * 
 * Usage:
 * ```typescript
 * if (!checkRateLimit(userId, 'create_quotation', 10, 60000)) {
 *   throw new Error('Too many requests')
 * }
 * ```
 */

interface RateLimitEntry {
  count: number
  firstRequestTime: number
}

// In-memory store for rate limiting (per server instance)
// For production with multiple instances, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval: remove old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000

// Auto-cleanup old entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstRequestTime > 10 * 60 * 1000) { // 10 minutes
      rateLimitStore.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

/**
 * Check if a request is within rate limits
 * 
 * @param userId - Unique identifier for the user
 * @param action - Action type (e.g., 'create_quotation', 'login')
 * @param limit - Maximum number of requests allowed (default: 10)
 * @param windowMs - Time window in milliseconds (default: 1 minute)
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  userId: string,
  action: string = 'default',
  limit: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): boolean {
  const key = `${userId}:${action}`
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    // First request for this action
    rateLimitStore.set(key, {
      count: 1,
      firstRequestTime: now
    })
    return true
  }
  
  // Check if window has expired
  if (now - entry.firstRequestTime > windowMs) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      firstRequestTime: now
    })
    return true
  }
  
  // Check if within limit
  if (entry.count >= limit) {
    return false // Rate limited
  }
  
  // Increment count
  entry.count++
  return true
}

/**
 * Get remaining requests for a user/action
 */
export function getRemainingRequests(
  userId: string,
  action: string = 'default',
  limit: number = 10,
  windowMs: number = 60 * 1000
): { remaining: number; resetIn: number } {
  const key = `${userId}:${action}`
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    return { remaining: limit, resetIn: windowMs }
  }
  
  const elapsed = now - entry.firstRequestTime
  if (elapsed > windowMs) {
    return { remaining: limit, resetIn: windowMs }
  }
  
  return {
    remaining: Math.max(0, limit - entry.count),
    resetIn: windowMs - elapsed
  }
}

/**
 * Custom error for rate limit exceeded
 */
export class RateLimitError extends Error {
  constructor(
    message: string = 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
    public retryAfter: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Check rate limit and throw error if exceeded
 * 
 * @throws {RateLimitError} If rate limit is exceeded
 */
export function enforceRateLimit(
  userId: string,
  action: string = 'default',
  limit: number = 10,
  windowMs: number = 60 * 1000
): void {
  const allowed = checkRateLimit(userId, action, limit, windowMs)
  
  if (!allowed) {
    const remaining = getRemainingRequests(userId, action, limit, windowMs)
    throw new RateLimitError(
      `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(remaining.resetIn / 1000)} detik.`,
      remaining.resetIn
    )
  }
}

/**
 * Rate limit configurations for common actions
 */
export const RATE_LIMITS = {
  // Authentication
  LOGIN: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts per 5 minutes
  REGISTER: { limit: 3, windowMs: 10 * 60 * 1000 }, // 3 per 10 minutes
  PASSWORD_RESET: { limit: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 minutes
  
  // Quotations
  CREATE_QUOTATION: { limit: 20, windowMs: 60 * 1000 }, // 20 per minute
  UPDATE_QUOTATION: { limit: 30, windowMs: 60 * 1000 }, // 30 per minute
  DELETE_QUOTATION: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
  
  // Job Orders
  CREATE_JOB_ORDER: { limit: 20, windowMs: 60 * 1000 },
  UPDATE_JOB_STATUS: { limit: 30, windowMs: 60 * 1000 },
  
  // File Uploads
  UPLOAD_FILE: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
  
  // API Calls (general)
  API_DEFAULT: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
} as const
