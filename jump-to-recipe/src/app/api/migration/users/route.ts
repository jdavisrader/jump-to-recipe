/**
 * Migration API - User Import Endpoint
 * 
 * This endpoint is specifically for the migration script to import users
 * from the legacy system. It bypasses normal authentication but requires
 * a migration token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check migration token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.MIGRATION_AUTH_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid migration token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          existed: true,
        },
        { status: 200 }
      );
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      id: body.id, // Use the UUID from migration
      email: body.email,
      name: body.name,
      emailVerified: body.emailVerified || null,
      password: body.password || null,
      image: body.image || null,
      role: body.role || 'user',
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      updatedAt: body.updatedAt ? new Date(body.updatedAt) : new Date(),
    }).returning();

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      existed: false,
    });

  } catch (error) {
    console.error('Migration user import error:', error);
    return NextResponse.json(
      { error: 'Failed to import user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
