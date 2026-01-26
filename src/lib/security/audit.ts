// Security Audit and Validation Utilities
// SOC 2 Type 2 and GDPR Compliance Checks

import { securityConfig } from './config';

// Input validation and sanitization
export const validateInput = (input: string, type: 'email' | 'password' | 'username' | 'url' | 'phone'): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} => {
  const sanitized = input.trim();
  let valid = false;
  let error = '';

  switch (type) {
    case 'email':
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);
      error = valid ? '' : 'Please enter a valid email address';
      break;
      
    case 'password':
      valid = true;
      if (sanitized.length < securityConfig.passwords.minLength) {
        valid = false;
        error = `Password must be at least ${securityConfig.passwords.minLength} characters`;
      } else if (securityConfig.passwords.requireUppercase && !/[A-Z]/.test(sanitized)) {
        valid = false;
        error = 'Password must contain at least one uppercase letter';
      } else if (securityConfig.passwords.requireLowercase && !/[a-z]/.test(sanitized)) {
        valid = false;
        error = 'Password must contain at least one lowercase letter';
      } else if (securityConfig.passwords.requireNumbers && !/[0-9]/.test(sanitized)) {
        valid = false;
        error = 'Password must contain at least one number';
      } else if (securityConfig.passwords.requireSpecialChars && !/[^A-Za-z0-9]/.test(sanitized)) {
        valid = false;
        error = 'Password must contain at least one special character';
      }
      break;
      
    case 'username':
      valid = /^[a-zA-Z0-9_-]{3,20}$/.test(sanitized);
      error = valid ? '' : 'Username must be 3-20 characters, using letters, numbers, or underscores';
      break;
      
    case 'url':
      valid = /^(https?:\/\/)[^\s]+$/.test(sanitized);
      error = valid ? '' : 'Please enter a valid URL starting with http:// or https://';
      break;
      
    case 'phone':
      valid = /^[+\d\s()-]{10,20}$/.test(sanitized);
      error = valid ? '' : 'Please enter a valid phone number';
      break;
  }

  return {
    valid,
    error,
    sanitized: valid ? sanitized : ''
  };
};

// XSS sanitization for user-generated content
export const sanitizeHTML = (html: string): string => {
  // Remove script tags and potentially malicious content
  return html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '')
    .replace(/<object[^>]*>([\s\S]*?)<\/object>/gi, '')
    .replace(/<embed[^>]*>([\s\S]*?)<\/embed>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/on\w+=`[^`]*`/gi, '');
};

// Data redaction for sensitive information
export const redactData = (data: string, redactedFields: string[] = securityConfig.dataProtection.logging.redactedFields): string => {
  let result = data;
  redactedFields.forEach(field => {
    const regex = new RegExp(`"${field}":"[^"]*"`, 'g');
    result = result.replace(regex, `"${field}":"[REDACTED]"`);
  });
  return result;
};

// CSRF token generation
export const generateCSRFToken = (): string => {
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16)).join('');
};

// Validate CSRF token
export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken;
};

// Rate limiting utility
export const rateLimiter = (windowMs: number = securityConfig.rateLimit.windowMs, max: number = securityConfig.rateLimit.max) => {
  const requests: Map<string, { count: number; timestamp: number }> = new Map();
  
  return (ip: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.timestamp < windowStart) {
        requests.delete(key);
      }
    }
    
    const requestData = requests.get(ip);
    if (requestData) {
      if (requestData.count >= max) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart + windowMs
        };
      }
      
      requestData.count++;
      requestData.timestamp = now;
      requests.set(ip, requestData);
      
      return {
        allowed: true,
        remaining: max - requestData.count,
        resetTime: windowStart + windowMs
      };
    }
    
    requests.set(ip, { count: 1, timestamp: now });
    return {
      allowed: true,
      remaining: max - 1,
      resetTime: windowStart + windowMs
    };
  };
};

// Security header validation
export const validateSecurityHeaders = (headers: Record<string, string>): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check for required security headers
  Object.entries(securityConfig.headers).forEach(([name, expected]) => {
    const actual = headers[name.toLowerCase()];
    if (!actual) {
      issues.push(`Missing security header: ${name}`);
    } else if (!actual.includes(expected.split(';')[0])) {
      issues.push(`Invalid security header: ${name}`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
};

// Audit trail for security events
export const createAuditLog = (event: string, details: any, level: 'error' | 'warn' | 'info' | 'debug' = 'info') => {
  if (!securityConfig.dataProtection.logging.enabled) {
    return;
  }
  
  // Redact sensitive information
  const redactedDetails = JSON.parse(redactData(JSON.stringify(details)));
  
  // Send to logging service (implement your own logic)
  console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${event}`, redactedDetails);
  
  // You could also send this to a remote logging service
  // fetch('/api/audit-logs', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     event,
  //     details: redactedDetails,
  //     level,
  //     timestamp: new Date().toISOString()
  //   })
  // });
};

// Check for common security vulnerabilities
export const securityAudit = (): { 
  passed: boolean; 
  vulnerabilities: Array<{ 
    id: string; 
    severity: 'low' | 'medium' | 'high' | 'critical'; 
    description: string; 
    recommendation: string;
  }> 
} => {
  const vulnerabilities: any[] = [];
  
  // Check localStorage for sensitive data
  if (typeof window !== 'undefined') {
    const sensitiveKeys = ['token', 'password', 'credit', 'card', 'email', 'phone'];
    Object.keys(localStorage).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        vulnerabilities.push({
          id: `localStorage-${key}`,
          severity: 'high',
          description: `Sensitive data found in localStorage: ${key}`,
          recommendation: 'Do not store sensitive data in localStorage; use secure, HttpOnly cookies'
        });
      }
    });
  }
  
  // Check document.cookie for insecure cookies
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie && !trimmedCookie.includes('Secure') && !trimmedCookie.includes('HttpOnly')) {
        const name = trimmedCookie.split('=')[0];
        vulnerabilities.push({
          id: `cookie-${name}`,
          severity: 'medium',
          description: `Cookie not marked as Secure or HttpOnly: ${name}`,
          recommendation: 'Mark cookies as Secure and HttpOnly to prevent XSS attacks'
        });
      }
    });
  }
  
  return {
    passed: vulnerabilities.length === 0,
    vulnerabilities
  };
};