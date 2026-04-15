import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import LinkedInProvider from 'next-auth/providers/linkedin'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/database/prisma'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Account is suspended or banned')
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
          username: user.username,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.emailVerified = user.emailVerified
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.avatar = user.avatar
        token.username = user.username
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session.user }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as Date | null
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.avatar = token.avatar as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      })
    },
    async signOut({ token }) {
      if (token.id) {
        await prisma.user.update({
          where: { id: token.id as string },
          data: { lastActive: new Date() },
        })
      }
    },
  },
}

declare module 'next-auth' {
  interface User {
    id: string
    firstName: string
    lastName: string
    role: string
    emailVerified: Date | null
    avatar: string
    username: string
  }

  interface Session {
    user: User & {
      id: string
      firstName: string
      lastName: string
      role: string
      emailVerified: Date | null
      avatar: string
      username: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    emailVerified: Date | null
    firstName: string
    lastName: string
    avatar: string
    username: string
  }
}
