'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import React, { useEffect, useState, createContext, useContext } from 'react'
import { 
  Home, 
  Music, 
  Calendar, 
  Users, 
  PlayCircle, 
  Settings, 
  LogOut, 
  User,
  Library,
  Menu,
  X
} from 'lucide-react'
import Image from 'next/image';

interface MenuItem {
  nombre: string
  href: string
  icono: React.ReactNode
  roles: string[]
}

const menuItems: MenuItem[] = [
  {
    nombre: 'Dashboard',
    href: '/dashboard',
    icono: <Home className="h-5 w-5" />,
    roles: ['ADMINISTRADOR', 'LIDER_ALABANZA', 'CANTANTE', 'LIDER_DANZA', 'DANZA', 'MUSICO']
  },
  {
    nombre: 'Canciones',
    href: '/canciones',
    icono: <Music className="h-5 w-5" />,
    roles: ['LIDER_ALABANZA', 'CANTANTE', 'LIDER_DANZA', 'DANZA', 'MUSICO']
  },
  {
    nombre: 'Servicios',
    href: '/servicios',
    icono: <Calendar className="h-5 w-5" />,
    roles: ['ADMINISTRADOR', 'LIDER_ALABANZA', 'CANTANTE', 'LIDER_DANZA', 'DANZA', 'MUSICO']
  },

  {
    nombre: 'Usuarios',
    href: '/usuarios',
    icono: <Users className="h-5 w-5" />,
    roles: ['ADMINISTRADOR']
  },
  {
    nombre: 'Biblioteca',
    href: '/biblioteca',
    icono: <Library className="h-5 w-5" />,
    roles: ['ADMINISTRADOR', 'LIDER_ALABANZA', 'CANTANTE', 'LIDER_DANZA', 'DANZA', 'MUSICO']
  }
]

interface LayoutProps {
  children: React.ReactNode
  titulo?: string
}

export const SidebarContext = createContext<{ sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }>({ sidebarOpen: false, setSidebarOpen: () => {} });

export default function Layout({ children, titulo }: LayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No tienes una sesión activa</p>
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  const menuFiltrado = menuItems.filter(item => 
    item.roles.includes(session.user.role)
  )

  const manejarLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar mejorado */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col min-h-0`}>
          {/* Logo mejorado */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="logo Casa de Amor" width={48} height={48} className="w-12 h-12 object-contain rounded-full bg-white/80 p-1" />
              <div>
                <h1 className="font-bold text-white text-lg">ICCAP</h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info mejorado */}
          <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate text-sm">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {session.user.role === 'ADMINISTRADOR' && '👑 Administrador'}
                  {session.user.role === 'LIDER_ALABANZA' && '🎵 Líder de Alabanza'}
                  {session.user.role === 'CANTANTE' && `🎤 Cantante`}
                  {session.user.role === 'LIDER_DANZA' && '💃 Líder de Danza'}
                  {session.user.role === 'DANZA' && '💃 Danza'}
                  {session.user.role === 'MUSICO' && '🎸 Músico'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation mejorada */}
          <nav className="flex-1 px-[clamp(2px,1vw,8px)] py-[clamp(2px,1vw,8px)] space-y-[clamp(2px,0.5vw,8px)]">
            {menuFiltrado.map((item) => {
              // Lógica mejorada para detectar si el item está activo
              let esActivo = false
              if (item.href === '/dashboard') {
                esActivo = pathname === '/' || 
                          pathname === '/dashboard' || 
                          pathname.startsWith('/cantante/dashboard') ||
                          pathname.startsWith('/lider/dashboard') ||
                          pathname.startsWith('/admin/dashboard') ||
                          pathname.startsWith('/danza/dashboard') ||
                          pathname.startsWith('/musico/dashboard')
              } else {
                esActivo = pathname.startsWith(item.href)
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-[clamp(2px,0.5vw,8px)] px-[clamp(2px,1vw,8px)] py-[clamp(2px,1vw,8px)] pl-4 sm:pl-6 rounded-xl font-medium transition-all duration-300 text-[clamp(10px,2.5vh,16px)] ${
                    esActivo
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900 hover:shadow-md transform hover:scale-105'
                  }`}
                >
                  <div className={`rounded-lg p-[clamp(1px,0.5vw,6px)] ${
                    esActivo 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'bg-gray-100 group-hover:bg-white/50'
                  }`}>
                    {React.isValidElement(item.icono) && typeof item.icono.type === 'function'
                      ? React.createElement(item.icono.type, { className: 'w-[clamp(12px,2.5vh,20px)] h-[clamp(12px,2.5vh,20px)]' })
                      : item.icono}
                  </div>
                  {item.nombre}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions mejorados */}
          <div className="border-t border-gray-200 px-[clamp(2px,1vw,8px)] py-[clamp(2px,1vw,8px)] space-y-[clamp(2px,0.5vw,8px)] bg-gradient-to-r from-gray-50 to-white">
            <Link
              href="/perfil"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-[clamp(2px,0.5vw,8px)] px-[clamp(2px,1vw,8px)] py-[clamp(2px,1vw,8px)] rounded-xl font-medium text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-900 transition-all duration-300 text-[clamp(10px,2.5vh,16px)]"
            >
              <div className="rounded-lg p-[clamp(1px,0.5vw,6px)] bg-gray-100">
                <Settings className="w-[clamp(12px,2.5vh,20px)] h-[clamp(12px,2.5vh,20px)]" />
              </div>
              Configuración
            </Link>
            <button
              onClick={manejarLogout}
              className="w-full flex items-center gap-[clamp(2px,0.5vw,8px)] px-[clamp(2px,1vw,8px)] py-[clamp(2px,1vw,8px)] rounded-xl font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 text-[clamp(10px,2.5vh,16px)]"
            >
              <div className="rounded-lg p-[clamp(1px,0.5vw,6px)] bg-red-100">
                <LogOut className="w-[clamp(12px,2.5vh,20px)] h-[clamp(12px,2.5vh,20px)]" />
              </div>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header simplificado - solo botón móvil */}
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 pb-30">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
} 