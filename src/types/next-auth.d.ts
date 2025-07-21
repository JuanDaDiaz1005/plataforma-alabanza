import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      telefono?: string
    } & DefaultSession['user']
  }

  interface User {
    role: string
    telefono?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    telefono?: string
  }
} 