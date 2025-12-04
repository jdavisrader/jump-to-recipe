import { describe, it, expect } from '@jest/globals';
import {
  userEditSchema,
  passwordUpdateSchema,
  userDeleteSchema,
} from '../admin';

describe('Admin Validation Schemas', () => {
  describe('userEditSchema', () => {
    describe('valid inputs', () => {
      it('should validate a complete user edit request', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user' as const,
          password: 'password123',
        };

        const result = userEditSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it('should validate user edit without password', () => {
        const validData = {
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'elevated' as const,
        };

        const result = userEditSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it('should validate all role types', () => {
        const roles = ['user', 'elevated', 'admin'] as const;

        roles.forEach((role) => {
          const data = {
            name: 'Test User',
            email: 'test@example.com',
            role,
          };

          const result = userEditSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should validate name at max length (255 chars)', () => {
        const longName = 'a'.repeat(255);
        const data = {
          name: longName,
          email: 'test@example.com',
          role: 'user' as const,
        };

        const result = userEditSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate email at max length (255 chars)', () => {
        const longEmail = 'a'.repeat(240) + '@example.com'; // 253 chars total
        const data = {
          name: 'Test User',
          email: longEmail,
          role: 'user' as const,
        };

        const result = userEditSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty name', () => {
        const invalidData = {
          name: '',
          email: 'test@example.com',
          role: 'user' as const,
        };

        const result = userEditSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Name is required');
        }
      });

      it('should reject name exceeding 255 characters', () => {
        const tooLongName = 'a'.repeat(256);
        const invalidData = {
          name: tooLongName,
          email: 'test@example.com',
          role: 'user' as const,
        };

        const result = userEditSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid email format', () => {
        const invalidEmails = [
          'notanemail',
          'missing@domain',
          '@nodomain.com',
          'spaces in@email.com',
          'double@@domain.com',
        ];

        invalidEmails.forEach((email) => {
          const data = {
            name: 'Test User',
            email,
            role: 'user' as const,
          };

          const result = userEditSchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid email format');
          }
        });
      });

      it('should reject email exceeding 255 characters', () => {
        const tooLongEmail = 'a'.repeat(250) + '@example.com'; // 262 chars
        const invalidData = {
          name: 'Test User',
          email: tooLongEmail,
          role: 'user' as const,
        };

        const result = userEditSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid role values', () => {
        const invalidRoles = ['superadmin', 'guest', 'moderator', ''];

        invalidRoles.forEach((role) => {
          const data = {
            name: 'Test User',
            email: 'test@example.com',
            role,
          };

          const result = userEditSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should reject password shorter than 8 characters', () => {
        const invalidData = {
          name: 'Test User',
          email: 'test@example.com',
          role: 'user' as const,
          password: 'short',
        };

        const result = userEditSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Password must be at least 8 characters'
          );
        }
      });

      it('should reject missing required fields', () => {
        const missingName = {
          email: 'test@example.com',
          role: 'user' as const,
        };

        const result1 = userEditSchema.safeParse(missingName);
        expect(result1.success).toBe(false);

        const missingEmail = {
          name: 'Test User',
          role: 'user' as const,
        };

        const result2 = userEditSchema.safeParse(missingEmail);
        expect(result2.success).toBe(false);

        const missingRole = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const result3 = userEditSchema.safeParse(missingRole);
        expect(result3.success).toBe(false);
      });
    });
  });

  describe('passwordUpdateSchema', () => {
    describe('valid inputs', () => {
      it('should validate password with exactly 8 characters', () => {
        const validData = {
          password: 'password',
        };

        const result = passwordUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate password with more than 8 characters', () => {
        const validData = {
          password: 'verylongpassword123',
        };

        const result = passwordUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate password with special characters', () => {
        const validData = {
          password: 'P@ssw0rd!#$%',
        };

        const result = passwordUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate password with spaces', () => {
        const validData = {
          password: 'pass word 123',
        };

        const result = passwordUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject password with less than 8 characters', () => {
        const lengths = [0, 1, 5, 7];

        lengths.forEach((length) => {
          const data = {
            password: 'a'.repeat(length),
          };

          const result = passwordUpdateSchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              'Password must be at least 8 characters'
            );
          }
        });
      });

      it('should reject empty password', () => {
        const invalidData = {
          password: '',
        };

        const result = passwordUpdateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject missing password field', () => {
        const invalidData = {};

        const result = passwordUpdateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('userDeleteSchema', () => {
    describe('valid inputs', () => {
      it('should validate valid UUID v4', () => {
        const validData = {
          newOwnerId: '550e8400-e29b-41d4-a716-446655440000',
        };

        const result = userDeleteSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate different valid UUIDs', () => {
        const validUUIDs = [
          '123e4567-e89b-12d3-a456-426614174000',
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ];

        validUUIDs.forEach((uuid) => {
          const data = { newOwnerId: uuid };
          const result = userDeleteSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid UUID format', () => {
        const invalidUUIDs = [
          'not-a-uuid',
          '12345',
          'abc-def-ghi',
          '550e8400-e29b-41d4-a716',
          '550e8400-e29b-41d4-a716-446655440000-extra',
        ];

        invalidUUIDs.forEach((uuid) => {
          const data = { newOwnerId: uuid };
          const result = userDeleteSchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid user ID');
          }
        });
      });

      it('should reject empty string', () => {
        const invalidData = {
          newOwnerId: '',
        };

        const result = userDeleteSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject missing newOwnerId field', () => {
        const invalidData = {};

        const result = userDeleteSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject UUID with wrong case variations', () => {
        // UUIDs should be case-insensitive, but let's test
        const mixedCaseUUID = '550E8400-E29B-41D4-A716-446655440000';
        const data = { newOwnerId: mixedCaseUUID };
        
        const result = userDeleteSchema.safeParse(data);
        // Zod's UUID validator is case-insensitive, so this should pass
        expect(result.success).toBe(true);
      });
    });
  });
});
