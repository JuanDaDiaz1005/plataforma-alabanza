'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  Edit,
  Save,
  X,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'

interface PerfilUsuario {
  id: string
  nombre: string
  email: string
  role: string
  fechaCreacion: string
}

export default function PerfilPage() {
  const { data: session, update } = useSession()
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  
  // Estados para edición
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setPerfil({
        id: session.user.id,
        nombre: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role,
        fechaCreacion: new Date().toISOString() // En una app real, esto vendría de la BD
      })
      setNuevoNombre(session.user.name || '')
      setNuevoEmail(session.user.email || '')
      setCargando(false)
    }
  }, [session])

  const iniciarEdicion = () => {
    setEditando(true)
    setError('')
    setExito('')
  }

  const cancelarEdicion = () => {
    setEditando(false)
    setNuevoNombre(perfil?.nombre || '')
    setNuevoEmail(perfil?.email || '')
    setNuevaContrasena('')
    setConfirmarContrasena('')
    setError('')
    setExito('')
  }

  const guardarCambios = async () => {
    if (!nuevoNombre.trim() || !nuevoEmail.trim()) {
      setError('El nombre y email son obligatorios')
      return
    }

    if (nuevaContrasena && nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (nuevaContrasena && nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setGuardando(true)
      setError('')

      const datosActualizados: unknown = {
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim()
      }

      if (nuevaContrasena) {
        datosActualizados.contrasena = nuevaContrasena
      }

      const response = await fetch(`/api/usuarios/${perfil?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosActualizados)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el perfil')
      }

      // Actualizar la sesión
      await update({
        ...session,
        user: {
          ...session?.user,
          name: nuevoNombre.trim(),
          email: nuevoEmail.trim()
        }
      })

      setPerfil(prev => prev ? {
        ...prev,
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim()
      } : null)

      setEditando(false)
      setNuevaContrasena('')
      setConfirmarContrasena('')
      setExito('Perfil actualizado correctamente')
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(''), 3000)

    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      setError(error instanceof Error ? error.message : 'Error al actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  const obtenerTextoRol = (role: string) => {
    const roles: { [key: string]: string } = {
      'ADMINISTRADOR': '👑 Administrador',
      'LIDER_ALABANZA': '🎵 Líder de Alabanza',
      'CANTANTE': '🎤 Cantante',
      'LIDER_DANZA': '💃 Líder de Danza',
      'DANZA': '💃 Danza',
      'MUSICO': '🎸 Músico'
    }
    return roles[role] || role
  }

  const obtenerColorRol = (role: string) => {
    const colores: { [key: string]: string } = {
      'ADMINISTRADOR': 'from-purple-500 to-indigo-600',
      'LIDER_ALABANZA': 'from-blue-500 to-purple-600',
      'CANTANTE': 'from-green-500 to-emerald-600',
      'LIDER_DANZA': 'from-pink-500 to-purple-600',
      'DANZA': 'from-pink-500 to-rose-600',
      'MUSICO': 'from-green-500 to-teal-600'
    }
    return colores[role] || 'from-gray-500 to-gray-600'
  }

  if (cargando) {
    return (
      <Layout titulo="Mi Perfil">
        <div className="flex justify-center items-center py-16">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Mi Perfil">
      <div className="space-y-8">
        {/* Mensajes de error y éxito */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {exito && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 text-sm">{exito}</p>
          </div>
        )}

        {/* Información del perfil */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Información Personal</h2>
            </div>
            {!editando && (
              <button
                onClick={iniciarEdicion}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Nombre */}
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                {editando ? (
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
                    placeholder="Tu nombre completo"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{perfil?.nombre}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                {editando ? (
                  <input
                    type="email"
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
                    placeholder="tu@email.com"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{perfil?.email}</p>
                )}
              </div>
            </div>

            {/* Rol */}
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol en la plataforma
                </label>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${obtenerColorRol(perfil?.role || '')} text-white shadow-lg`}>
                  {obtenerTextoRol(perfil?.role || '')}
                </span>
              </div>
            </div>

            {/* Fecha de registro */}
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Miembro desde
                </label>
                <p className="text-gray-900 font-medium">
                  {perfil?.fechaCreacion ? new Date(perfil.fechaCreacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Reciente'}
                </p>
              </div>
            </div>

            {/* Cambio de contraseña */}
            {editando && (
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="h-5 w-5 text-gray-600" />
                  Cambiar contraseña
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarContrasena ? "text" : "password"}
                        value={nuevaContrasena}
                        onChange={(e) => setNuevaContrasena(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
                        placeholder="Deja vacío para mantener la actual"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasena(!mostrarContrasena)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarContrasena ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
                      placeholder="Repite la nueva contraseña"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            {editando && (
              <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={guardarCambios}
                  disabled={guardando}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  <Save className="h-4 w-4" />
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
} 