import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Schema for user registration validation
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Throttle per IP before doing any work.
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`register:ip:${ip}`, 10, WINDOW_MS);
    if (!ipLimit.allowed) {
      return tooManyRequests(ipLimit.retryAfter);
    }

    const body = await request.json();

    // Validate input data
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map(e => `${e.path}: ${e.message}`).join(', ') },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Normalize email to lowercase so casing can't create duplicate accounts or
    // cause phantom "invalid password" failures at sign in.
    const email = validatedData.email.toLowerCase();

    // Throttle per email to blunt targeted abuse/enumeration.
    const emailLimit = checkRateLimit(
      `register:email:${email}`,
      5,
      WINDOW_MS
    );
    if (!emailLimit.allowed) {
      return tooManyRequests(emailLimit.retryAfter);
    }

    // Check if user already exists. Return a generic message either way so the
    // response does not reveal whether an email is registered (enumeration).
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Unable to create an account with the provided details.' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    await db.insert(users).values({
      name: validatedData.name,
      email,
      password: hashedPassword,
      role: 'user',
    });
    
    return NextResponse.json(
      { success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}