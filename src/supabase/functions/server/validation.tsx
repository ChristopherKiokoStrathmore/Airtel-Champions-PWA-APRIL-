// ============================================================================
// VALIDATION SCHEMAS
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Zod schemas for request validation
// ============================================================================

import { z } from "npm:zod@3";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

// Phone number validation (Kenyan format)
const phoneSchema = z.string()
  .regex(/^\+254[17]\d{8}$/, 'Phone must be in format +254XXXXXXXXX');

// UUID validation
const uuidSchema = z.string().uuid('Invalid UUID format');

// Location validation (Kenya bounds)
const locationSchema = z.object({
  latitude: z.number()
    .min(-4.7, 'Latitude must be within Kenya')
    .max(5.5, 'Latitude must be within Kenya'),
  longitude: z.number()
    .min(33.9, 'Longitude must be within Kenya')
    .max(41.9, 'Longitude must be within Kenya'),
  accuracy: z.number().min(0).max(100).optional()
});

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const RequestOTPSchema = z.object({
  phone: phoneSchema
});

export const VerifyOTPSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric')
});

export const LoginPINSchema = z.object({
  phone: phoneSchema,
  pin: z.string().length(4, 'PIN must be 4 digits').regex(/^\d{4}$/, 'PIN must be numeric')
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// ============================================================================
// SUBMISSION SCHEMAS
// ============================================================================

export const CreateSubmissionSchema = z.object({
  missionTypeId: uuidSchema,
  photoUrl: z.string().url('Invalid photo URL').max(2048, 'Photo URL too long').optional(),
  location: locationSchema,
  locationName: z.string()
    .min(3, 'Location name must be at least 3 characters')
    .max(200, 'Location name must be less than 200 characters')
    .trim(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional(),
  clientId: z.string()
    .max(50, 'Client ID too long')
    .optional(),
  photoMetadata: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    fileSize: z.number().positive().optional(),
    capturedAt: z.string().datetime().optional(),
    deviceModel: z.string().max(100).optional(),
    gpsAccuracy: z.number().min(0).max(100).optional()
  }).optional()
});

export const ApproveSubmissionSchema = z.object({
  submissionId: uuidSchema,
  pointsAwarded: z.number()
    .int('Points must be an integer')
    .min(0, 'Points must be positive')
    .max(1000, 'Points cannot exceed 1000'),
  reviewNotes: z.string()
    .max(500, 'Review notes must be less than 500 characters')
    .trim()
    .optional()
});

export const RejectSubmissionSchema = z.object({
  submissionId: uuidSchema,
  reviewNotes: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Review notes must be less than 500 characters')
    .trim()
});

export const BulkApproveSchema = z.object({
  submissionIds: z.array(uuidSchema)
    .min(1, 'At least one submission required')
    .max(50, 'Cannot approve more than 50 submissions at once'),
  pointsAwarded: z.number()
    .int()
    .min(0)
    .max(1000)
});

// ============================================================================
// SYNC SCHEMAS
// ============================================================================

export const SyncSubmissionsSchema = z.object({
  submissions: z.array(z.object({
    clientId: z.string().max(50),
    data: CreateSubmissionSchema,
    photoBase64: z.string().optional(),
    createdAtDevice: z.string().datetime()
  })).max(20, 'Cannot sync more than 20 submissions at once')
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UpdateUserProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional()
});

export const RegisterDeviceSchema = z.object({
  token: z.string().min(1, 'Device token required').max(255),
  platform: z.enum(['ios', 'android'], {
    errorMap: () => ({ message: 'Platform must be ios or android' })
  })
});

// ============================================================================
// ACHIEVEMENT SCHEMAS
// ============================================================================

export const AwardAchievementSchema = z.object({
  userId: uuidSchema,
  achievementId: uuidSchema
});

// ============================================================================
// CHALLENGE SCHEMAS
// ============================================================================

export const CheckChallengeSchema = z.object({
  userId: uuidSchema,
  challengeId: uuidSchema
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 50)
    .pipe(z.number().min(1).max(100)),
  offset: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 0)
    .pipe(z.number().min(0)),
  cursor: z.string().optional()
});

export const LeaderboardQuerySchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'alltime']).optional().default('weekly'),
  region: z.string().max(50).optional(),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 20)
    .pipe(z.number().min(1).max(100)),
  offset: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 0)
    .pipe(z.number().min(0))
});

export const SubmissionsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 50)
    .pipe(z.number().min(1).max(100)),
  offset: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 0)
    .pipe(z.number().min(0))
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate request body against schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  } else {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    return {
      success: false,
      errors
    };
  }
}

/**
 * Validate and throw on error (for middleware)
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = validate(schema, data);
  
  if (!result.success) {
    const error: any = new Error('Validation failed');
    error.validationErrors = result.errors;
    error.statusCode = 400;
    throw error;
  }
  
  return result.data!;
}

// ============================================================================
// SCHEMA EXPORTS
// ============================================================================

export const schemas = {
  // Auth
  RequestOTPSchema,
  VerifyOTPSchema,
  LoginPINSchema,
  RefreshTokenSchema,
  
  // Submissions
  CreateSubmissionSchema,
  ApproveSubmissionSchema,
  RejectSubmissionSchema,
  BulkApproveSchema,
  
  // Sync
  SyncSubmissionsSchema,
  
  // User
  UpdateUserProfileSchema,
  RegisterDeviceSchema,
  
  // Achievements
  AwardAchievementSchema,
  
  // Challenges
  CheckChallengeSchema,
  
  // Query params
  PaginationSchema,
  LeaderboardQuerySchema,
  SubmissionsQuerySchema,
};

// ============================================================================
// END OF VALIDATION SCHEMAS
// ============================================================================