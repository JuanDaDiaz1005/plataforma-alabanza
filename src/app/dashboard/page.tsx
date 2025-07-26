'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Aún cargando

    if (!session) {
      router.push('/auth/login')
      return
    }

    // Redirigir según el rol del usuario
    const rolUsuario = session.user.role
    
    if (rolUsuario === 'ADMINISTRADOR') {
      router.push('/admin/dashboard')
    } else if (rolUsuario === 'LIDER_ALABANZA') {
      router.push('/lider/dashboard')
    } else if (rolUsuario === 'LIDER_DANZA' || rolUsuario === 'DANZA') {
      router.push('/danza/dashboard')
    } else if (rolUsuario === 'MUSICO') {
      router.push('/musico/dashboard')
    } else {
      router.push('/cantante/dashboard')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  )
} 