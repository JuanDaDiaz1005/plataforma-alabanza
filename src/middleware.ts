import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware() {
    // Esta función se ejecuta cuando el usuario está autenticado
    return
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Rutas que requieren autenticación
        const rutasProtegidas = ['/admin', '/lider', '/cantante', '/dashboard']
        const requiereAuth = rutasProtegidas.some(ruta => pathname.startsWith(ruta))
        
        // Si no requiere auth, permitir acceso
        if (!requiereAuth) return true
        
        // Si requiere auth, verificar token
        return !!token
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 