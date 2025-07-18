import { db } from '@/db';
import { users } from '@/db/schema/users';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Schema for user registration validation
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Register a new user with email and password
 */
export async function registerUser(data: RegisterFormData) {
  try {
    // Validate input data
    const validatedData = registerSchema.parse(data);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });
    
    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    await db.insert(users).values({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: 'user',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path}: ${e.message}`).join(', ') 
      };
    }
    return { success: false, error: 'Failed to register user' };
  }
}