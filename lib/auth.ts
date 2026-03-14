import NextAuth, { getServerSession } from 'next-auth'
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from '@/lib/db'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        console.log('[Auth] Attempting to authorize user with email:', credentials.email)

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          console.warn('[Auth] User not found for email:', credentials.email)
          return null
        }

        if (!user.hashedPassword) {
          console.warn('[Auth] User does not have a hashed password (likely Google OAuth):', credentials.email)
          return null
        }

        if (!user.emailVerified) {
          console.warn('[Auth] Email not verified:', credentials.email)
          throw new Error('Please verify your email address before logging in.')
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword)

        if (!isValid) {
          console.warn('[Auth] Invalid password for email:', credentials.email)
          return null
        }

        console.log('[Auth] User authorized successfully:', user.email)

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Always ensure we have the most up-to-date user ID and language from the database
      if (token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email }
        })
        if (dbUser) {
          token.id = dbUser.id
          token.name = dbUser.name
          token.language = dbUser.language
        }
      } else if (user) {
        token.id = user.id
        token.language = (user as any).language
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        if (token.name) {
          session.user.name = token.name as string
        }
        if (token.language) {
          (session.user as any).language = token.language as string
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
}

/**
 * Helper to get the current session in Server Components
 */
export const auth = () => getServerSession(authOptions)

/**
 * Helper to require authentication in Server Actions/Routes
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User must be authenticated')
  }
  return session
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}