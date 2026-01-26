// Security and Compliance Configuration
// SOC 2 Type 2 and GDPR Compliance Settings

export const securityConfig = {
  // Session Management
  session: {
    timeout: 15 * 60 * 1000, // 15 minutes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    renewalThreshold: 5 * 60 * 1000, // 5 minutes before timeout
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
  },

  // Password Security
  passwords: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // CSRF Protection
  csrf: {
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict' as const,
    },
  },

  // CORS Configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://socialos.example.com'] 
      : ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  },

  // Security Headers
  headers: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Data Protection
  dataProtection: {
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keySize: 32,
    },
    logging: {
      enabled: true,
      redactedFields: ['password', 'creditCard', 'phoneNumber', 'email'],
    },
  },
};

export const gdprConfig = {
  // Data Subject Rights
  rights: {
    access: true,
    rectification: true,
    erasure: true,
    restriction: true,
    portability: true,
    objection: true,
  },

  // Consent Management
  consent: {
    categories: [
      {
        id: 'essential',
        name: 'Essential',
        description: 'Necessary for the website to function properly',
        required: true,
        cookies: ['session'],
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Help us understand how visitors interact with our website',
        required: false,
        cookies: ['analytics'],
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Enable us to send you personalized content and offers',
        required: false,
        cookies: ['marketing'],
      },
      {
        id: 'functional',
        name: 'Functional',
        description: 'Enhance your experience with additional features',
        required: false,
        cookies: ['functional'],
      },
    ],

    // Cookie Expiration
    cookieExpiration: {
      session: 0, // Session cookie
      analytics: 365 * 24 * 60 * 60, // 1 year
      marketing: 365 * 24 * 60 * 60, // 1 year
      functional: 365 * 24 * 60 * 60, // 1 year
    },
  },

  // Data Retention
  retention: {
    userData: 365 * 24 * 60 * 60, // 1 year after account deletion
    sessionData: 15 * 60, // 15 minutes
    auditLogs: 365 * 24 * 60 * 60, // 1 year
    analyticsData: 2 * 365 * 24 * 60 * 60, // 2 years
  },

  // Breach Notification
  breachNotification: {
    notificationPeriod: 72, // hours
    contactEmail: 'privacy@socialos.example.com',
    supportEmail: 'support@socialos.example.com',
  },
};

export const auditConfig = {
  enabled: true,
  levels: ['error', 'warn', 'info', 'debug'] as const,
  excludedPaths: ['/health', '/metrics'],
  maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
};

export const complianceConfig = {
  // SOC 2 Type 2 Requirements
  soc2: {
    trustServices: ['security', 'availability', 'processing-integrity', 'confidentiality', 'privacy'],
    controlActivities: [
      'access-control',
      'change-management',
      'incident-response',
      'risk-assessment',
      'system-monitoring',
    ],
  },

  // GDPR Requirements
  gdpr: {
    article30Records: true,
    dataProtectionOfficer: 'privacy@socialos.example.com',
    representativeInEU: 'legal@socialos.example.com',
  },
};