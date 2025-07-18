import { DefaultSession } from 'next-auth';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
  
  interface User {
    role?: string;
  }
}

// Extend the JWT type
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}