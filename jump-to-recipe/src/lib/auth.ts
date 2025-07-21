import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { env } from '@/lib/env';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { AuthOptions, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

/**
 * NextAuth configuration with Google provider and credentials
 * Uses JWT strategy for session management
 * Implements role-based access control
 */
export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Authorize function called with credentials:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password');
          return null;
        }

        try {
          // Find user by email
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email),
          });

          console.log('User found:', user ? 'Yes' : 'No');

          // If no user or no password (OAuth user), return null
          if (!user || !user.password) {
            console.log('No user or no password');
            return null;
          }

          // Compare passwords
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          console.log('Password match:', passwordMatch ? 'Yes' : 'No');

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('Error in authorize function:', error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    // Add role to JWT token and session
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.role = (user as User & { role: string }).role;
        token.id = user.id;
      }

      // On subsequent calls, check if role has been updated in database
      else if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });

        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },

    // Add role to client-side session
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as User & { role: string; id: string }).role = token.role as string;
        (session.user as User & { role: string; id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};

/**
 * Role-based authorization helper
 * @param role - Required role to access a resource
 * @returns Boolean indicating if user has required role
 */
export const hasRole = (userRole: string | undefined, requiredRole: 'admin' | 'elevated' | 'user') => {
  if (!userRole) return false;

  // Role hierarchy: admin > elevated > user
  if (userRole === 'admin') return true;
  if (userRole === 'elevated' && requiredRole !== 'admin') return true;
  if (userRole === 'user' && requiredRole === 'user') return true;

  return false;
};