'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, Loader2, User, Mail, Shield, Volume2 } from 'lucide-react'
import Link from 'next/link'

interface FormularioUsuario {
  nombre: string
  email: string
  password: string
  rol: string
  rangoVocal: string
}

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'LIDER_ALABANZA', label: 'Líder de Alabanza' },
  { value: 'CANTANTE', label: 'Cantante' },
  { value: 'LIDER_DANZA', label: 'Líder de Danza' },
  { value: 'DANZA', label: 'Danza' },
  { value: 'MUSICO', label: 'Músico' }
]

export default function NuevoUsuario() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  
  const [formulario, setFormulario] = useState<FormularioUsuario>({
    nombre: '',
    email: '',
    password: '',
    rol: '',
    rangoVocal: ''
  })

  // Verificar permisos
  const puedeCrear = session?.user?.role === 'ADMINISTRADOR'

  if (!puedeCrear) {
    return (
      <Layout titulo="Nuevo Usuario">
        <div className="text-center py-12">
          <p className="text-red-600">No tienes permisos para crear usuarios</p>
          <Link href="/usuarios" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
            ← Volver a Usuarios
          </Link>
        </div>
      </Layout>
    )
  }

  const manejarCambio = (campo: keyof FormularioUsuario, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      // Validaciones básicas
      if (!formulario.nombre.trim() || !formulario.email.trim() || !formulario.password.trim() || !formulario.rol) {
        throw new Error('Nombre, email, contraseña y rol son requeridos')
      }

      if (formulario.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formulario.email)) {
        throw new Error('El formato del email no es válido')
      }

      // Preparar datos para envío
      const datosUsuario = {
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim().toLowerCase(),
        password: formulario.password,
        rol: formulario.rol,
        rangoVocal: formulario.rangoVocal || null
      }

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosUsuario)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el usuario')
      }

      // Redirigir a la lista de usuarios
      router.push('/usuarios')

    } catch (error: unknown) {
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <Layout titulo="Nuevo Usuario">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/usuarios"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Usuario</h1>
            <p className="text-gray-600">Crear una nueva cuenta de usuario</p>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <form onSubmit={manejarSubmit} className="p-6 space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) => manejarCambio('nombre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formulario.email}
                    onChange={(e) => manejarCambio('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Ej: juan@iglesia.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formulario.password}
                  onChange={(e) => manejarCambio('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
              </div>
            </div>

            {/* Rol y permisos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rol y Permisos
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  value={formulario.rol}
                  onChange={(e) => manejarCambio('rol', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="">Seleccionar rol...</option>
                  {ROLES.map(rol => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Define los permisos y accesos del usuario en la plataforma
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/usuarios"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={cargando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cargando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {cargando ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
} 