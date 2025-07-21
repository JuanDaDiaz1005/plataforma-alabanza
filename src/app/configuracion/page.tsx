'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { 
  User, 
  Mail, 
  Shield, 
  Volume2, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface FormularioConfiguracion {
  nombre: string
  email: string
  passwordActual: string
  passwordNueva: string
  confirmarPassword: string
  rangoVocal: string
}

const ROLES_LABELS = {
  'ADMINISTRADOR': 'Administrador',
  'LIDER_ALABANZA': 'Líder de Alabanza',
  'CANTANTE': 'Cantante',
  'LIDER_DANZA': 'Líder de Danza',
  'DANZA': 'Danza'
}

export default function ConfiguracionPage() {
  const { data: session, update } = useSession()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false)
  const [mostrarPasswordNueva, setMostrarPasswordNueva] = useState(false)
  const [cambiarPassword, setCambiarPassword] = useState(false)
  
  const [formulario, setFormulario] = useState<FormularioConfiguracion>({
    nombre: '',
    email: '',
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: '',
    rangoVocal: ''
  })

  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.id) {
      cargarDatosUsuario()
    }
  }, [session])

  const cargarDatosUsuario = async () => {
    if (!session?.user?.id) return
    
    try {
      setCargando(true)
      const response = await fetch(`/api/usuarios/${session.user.id}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos del usuario')
      }
      
      const data = await response.json()
      setUsuario(data)
      
      setFormulario({
        nombre: data.nombre || '',
        email: data.email || '',
        passwordActual: '',
        passwordNueva: '',
        confirmarPassword: '',
        rangoVocal: data.rangoVocal || ''
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  const manejarCambio = (campo: keyof FormularioConfiguracion, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }))
    
    // Limpiar mensajes cuando el usuario empiece a escribir
    if (error) setError('')
    if (mensaje) setMensaje('')
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)

    try {
      // Validaciones básicas
      if (!formulario.nombre.trim() || !formulario.email.trim()) {
        throw new Error('Nombre y email son requeridos')
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formulario.email)) {
        throw new Error('El formato del email no es válido')
      }

      // Validaciones de contraseña si se quiere cambiar
      if (cambiarPassword) {
        if (!formulario.passwordActual.trim()) {
          throw new Error('Debes ingresar tu contraseña actual')
        }
        
        if (!formulario.passwordNueva.trim()) {
          throw new Error('Debes ingresar la nueva contraseña')
        }
        
        if (formulario.passwordNueva.length < 6) {
          throw new Error('La nueva contraseña debe tener al menos 6 caracteres')
        }
        
        if (formulario.passwordNueva !== formulario.confirmarPassword) {
          throw new Error('Las contraseñas nuevas no coinciden')
        }
      }

      // Preparar datos para envío
      const datosActualizacion: any = {
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim().toLowerCase(),
        rangoVocal: formulario.rangoVocal || null
      }

      if (cambiarPassword) {
        datosActualizacion.passwordActual = formulario.passwordActual
        datosActualizacion.passwordNueva = formulario.passwordNueva
      }

      const response = await fetch(`/api/usuarios/${session?.user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosActualizacion)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la información')
      }

      const usuarioActualizado = await response.json()
      
      // Actualizar la sesión si cambió el nombre o email
      if (formulario.nombre !== session?.user?.name || formulario.email !== session?.user?.email) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: usuarioActualizado.nombre,
            email: usuarioActualizado.email
          }
        })
      }

      setMensaje('Información actualizada correctamente')
      
      // Limpiar campos de contraseña
      if (cambiarPassword) {
        setFormulario(prev => ({
          ...prev,
          passwordActual: '',
          passwordNueva: '',
          confirmarPassword: ''
        }))
        setCambiarPassword(false)
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <Layout titulo="Configuración">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!usuario) {
    return (
      <Layout titulo="Configuración">
        <div className="text-center py-12">
          <p className="text-red-600">Error al cargar la información del usuario</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Configuración">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Usuario</h1>
          <p className="text-gray-600">Actualiza tu información personal y configuración</p>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {mensaje && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{mensaje}</p>
          </div>
        )}

        {/* Información del rol */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Información del Rol</h3>
          </div>
          <p className="text-blue-700">
            Tu rol actual es: <span className="font-semibold">{ROLES_LABELS[usuario.rol as keyof typeof ROLES_LABELS]}</span>
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Solo un administrador puede cambiar los roles de usuario
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <form onSubmit={manejarSubmit} className="p-6 space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
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
                    placeholder="Tu nombre completo"
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
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Cambio de contraseña */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Contraseña</h3>
                <button
                  type="button"
                  onClick={() => setCambiarPassword(!cambiarPassword)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {cambiarPassword ? 'Cancelar cambio' : 'Cambiar contraseña'}
                </button>
              </div>

              {cambiarPassword && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual *
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarPasswordActual ? "text" : "password"}
                        value={formulario.passwordActual}
                        onChange={(e) => manejarCambio('passwordActual', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Tu contraseña actual"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPasswordActual(!mostrarPasswordActual)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarPasswordActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarPasswordNueva ? "text" : "password"}
                        value={formulario.passwordNueva}
                        onChange={(e) => manejarCambio('passwordNueva', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Nueva contraseña (mínimo 6 caracteres)"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPasswordNueva(!mostrarPasswordNueva)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarPasswordNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formulario.confirmarPassword}
                      onChange={(e) => manejarCambio('confirmarPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Confirma la nueva contraseña"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botón de guardar */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Estadísticas del usuario */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{usuario._count?.asignaciones || 0}</p>
              <p className="text-sm text-gray-600">Asignaciones totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{usuario._count?.comentarios || 0}</p>
              <p className="text-sm text-gray-600">Comentarios realizados</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 