import { describe, it, expect, vi } from 'vitest';
import { 
  validateInput, 
  sanitizeHTML, 
  redactData, 
  generateCSRFToken, 
  validateCSRFToken, 
  rateLimiter, 
  validateSecurityHeaders, 
  createAuditLog, 
  securityAudit 
} from '@/lib/security/audit';
import { securityConfig, gdprConfig } from '@/lib/security/config';

describe('Security Audit Utilities', () => {
  describe('Input Validation', () => {
    it('should validate emails correctly', () => {
      const validEmail = validateInput('test@example.com', 'email');
      const invalidEmail = validateInput('notanemail', 'email');
      
      expect(validEmail.valid).toBe(true);
      expect(invalidEmail.valid).toBe(false);
    });

    it('should validate passwords according to security rules', () => {
      const validPassword = validateInput('StrongPassw0rd!', 'password');
      const shortPassword = validateInput('Short1!', 'password');
      const noUppercase = validateInput('lowercase1!', 'password');
      
      expect(validPassword.valid).toBe(true);
      expect(shortPassword.valid).toBe(false);
      expect(noUppercase.valid).toBe(false);
    });

    it('should validate usernames correctly', () => {
      const validUsername = validateInput('test_user123', 'username');
      const invalidUsername = validateInput('test user', 'username');
      
      expect(validUsername.valid).toBe(true);
      expect(invalidUsername.valid).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize HTML content', () => {
      const html = '<script>alert("XSS")</script><div onload="evil()">Content</div>';
      const sanitized = sanitizeHTML(html);
      
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('onload');
    });

    it('should redact sensitive information', () => {
      const data = '{"email":"user@example.com","password":"secret","phone":"1234567890"}';
      const redacted = redactData(data);
      
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('secret');
    });
  });

  describe('CSRF Protection', () => {
    it('should generate and validate CSRF tokens', () => {
      const token = generateCSRFToken();
      const validation = validateCSRFToken(token, token);
      
      expect(token.length).toBeGreaterThan(0);
      expect(validation).toBe(true);
    });

    it('should reject invalid CSRF tokens', () => {
      const validation = validateCSRFToken('valid', 'invalid');
      expect(validation).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit requests within time window', () => {
      const limiter = rateLimiter(1000, 5);
      
      for (let i = 0; i < 5; i++) {
        const result = limiter('192.168.1.1');
        expect(result.allowed).toBe(true);
      }
      
      const result = limiter('192.168.1.1');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should validate security headers', () => {
      const validHeaders = {
        'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:",
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'referrer-policy': 'strict-origin-when-cross-origin'
      };
      
      const validation = validateSecurityHeaders(validHeaders);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    it('should have valid security configuration', () => {
      expect(securityConfig.session.timeout).toBeGreaterThan(0);
      expect(securityConfig.passwords.minLength).toBeGreaterThan(0);
      expect(securityConfig.cors.origin).toEqual(expect.arrayContaining([expect.any(String)]));
    });

    it('should have valid GDPR configuration', () => {
      expect(gdprConfig.rights.access).toBe(true);
      expect(gdprConfig.rights.erasure).toBe(true);
      expect(gdprConfig.consent.categories.length).toBeGreaterThan(0);
    });
  });

  describe('Security Audit', () => {
    it('should perform security audit', () => {
      const audit = securityAudit();
      expect(typeof audit.passed).toBe('boolean');
      expect(Array.isArray(audit.vulnerabilities)).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    it('should create audit logs', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      createAuditLog('test_event', { data: 'test' }, 'info');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});