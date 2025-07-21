import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { validarEmail } from './utils'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Validar formato de email
        if (!validarEmail(email)) {
          return null
        }

        try {
          // Buscar usuario en la base de datos
          const usuario = await prisma.usuario.findUnique({
            where: { email: email.toLowerCase() }
          })

          if (!usuario || !usuario.activo) {
            return null
          }

          // Verificar contraseña
          const passwordValida = await bcrypt.compare(password, usuario.passwordHash)
          
          if (!passwordValida) {
            return null
          }

          // Retornar datos del usuario para la sesión
          return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nombre,
            role: usuario.rol,
            telefono: usuario.telefono
          }
        } catch (error) {
          console.error('Error en autenticación:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.telefono = user.telefono
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.telefono = token.telefono as string
      }
      return session
    }
  }
}

export default NextAuth(authOptions) 