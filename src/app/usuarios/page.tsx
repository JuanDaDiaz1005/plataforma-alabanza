'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { 
  Search, 
  Plus, 
  Users, 
  Filter, 
  Edit, 
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  X,
  Mail,
  Clock,
  MessageSquare,
  Music,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  fechaCreacion: string
  fechaActualizacion?: string
  _count: {
    asignaciones: number
    comentarios: number
    programacionesCreadas?: number
  }
}

interface RespuestaAPI {
  usuarios: Usuario[]
  pagination: {
    pagina: number
    limite: number
    total: number
    totalPaginas: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'LIDER_ALABANZA', label: 'Líder de Alabanza' },
  { value: 'CANTANTE', label: 'Cantante' },
  { value: 'LIDER_DANZA', label: 'Líder de Danza' },
  { value: 'DANZA', label: 'Danza' },
  { value: 'MUSICO', label: 'Músico' }
]

export default function PaginaUsuarios() {
  const { data: session } = useSession()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para filtros y búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [rolFiltro, setRolFiltro] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [paginacion, setPaginacion] = useState<RespuestaAPI['pagination'] | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Estados para modales
  const [modalVer, setModalVer] = useState<{ visible: boolean; usuario: Usuario | null }>({
    visible: false,
    usuario: null
  })
  const [modalEditar, setModalEditar] = useState<{ visible: boolean; usuario: Usuario | null }>({
    visible: false,
    usuario: null
  })
  const [modalEliminar, setModalEliminar] = useState<{ visible: boolean; usuario: Usuario | null }>({
    visible: false,
    usuario: null
  })

  // Estados para formulario de edición
  const [formEdicion, setFormEdicion] = useState({
    nombre: '',
    email: '',
    rol: ''
  })
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false)

  // Verificar permisos
  const puedeVer = session?.user?.role === 'ADMINISTRADOR'
  const puedeEditar = session?.user?.role === 'ADMINISTRADOR'
  const puedeEliminar = session?.user?.role === 'ADMINISTRADOR'

  // Cargar usuarios
  const cargarUsuarios = async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        limite: '6'
      })
      
      if (busqueda) params.append('busqueda', busqueda)
      if (rolFiltro) params.append('rol', rolFiltro)

      const response = await fetch(`/api/usuarios?${params}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }

      const data: RespuestaAPI = await response.json()
      setUsuarios(data.usuarios)
      setPaginacion(data.pagination)
      
    } catch (error) {
      setError('Error al cargar los usuarios')
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  // Funciones para modales
  const abrirModalVer = async (usuario: Usuario) => {
    try {
      const response = await fetch(`/api/usuarios/${usuario.id}`)
      if (response.ok) {
        const usuarioCompleto = await response.json()
        setModalVer({ visible: true, usuario: usuarioCompleto })
      } else {
        setError('Error al cargar los detalles del usuario')
      }
    } catch (error) {
      setError('Error al cargar los detalles del usuario')
    }
  }

  const abrirModalEditar = (usuario: Usuario) => {
    setFormEdicion({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    })
    setModalEditar({ visible: true, usuario })
  }

  const abrirModalEliminar = (usuario: Usuario) => {
    setModalEliminar({ visible: true, usuario })
  }

  const cerrarModales = () => {
    setModalVer({ visible: false, usuario: null })
    setModalEditar({ visible: false, usuario: null })
    setModalEliminar({ visible: false, usuario: null })
    setError('')
  }

  // Función para guardar edición
  const guardarEdicion = async () => {
    if (!modalEditar.usuario) return
    
    setGuardandoEdicion(true)
    try {
      const response = await fetch(`/api/usuarios/${modalEditar.usuario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formEdicion)
      })

      if (response.ok) {
        await cargarUsuarios() // Recargar la lista
        cerrarModales()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar el usuario')
      }
    } catch (error) {
      setError('Error al actualizar el usuario')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  // Función para eliminar usuario
  const confirmarEliminacion = async () => {
    if (!modalEliminar.usuario) return
    
    setEliminandoUsuario(true)
    try {
      const response = await fetch(`/api/usuarios/${modalEliminar.usuario.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await cargarUsuarios() // Recargar la lista
        cerrarModales()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar el usuario')
      }
    } catch (error) {
      setError('Error al eliminar el usuario')
    } finally {
      setEliminandoUsuario(false)
    }
  }

  // Efectos
  useEffect(() => {
    if (puedeVer) {
      cargarUsuarios()
    }
  }, [paginaActual, busqueda, rolFiltro, puedeVer])

  // Funciones auxiliares
  const formatearRol = (rol: string) => {
    const roles: { [key: string]: string } = {
      'ADMINISTRADOR': 'Administrador',
      'LIDER_ALABANZA': 'Líder de Alabanza',
      'CANTANTE': 'Cantante',
      'LIDER_DANZA': 'Líder de Danza',
      'DANZA': 'Danza',
      'MUSICO': 'Músico'
    }
    return roles[rol] || rol
  }

  const formatearRangoVocal = (rango?: string) => {
    if (!rango) return 'No especificado'
    const rangos: { [key: string]: string } = {
      'SOPRANO': 'Soprano',
      'CONTRALTO': 'Contralto',
      'TENOR': 'Tenor',
      'BAJO': 'Bajo'
    }
    return rangos[rango] || rango
  }

  const obtenerColorRol = (rol: string) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'bg-red-100 text-red-800'
      case 'LIDER_ALABANZA':
        return 'bg-blue-100 text-blue-800'
      case 'CANTANTE':
        return 'bg-green-100 text-green-800'
      case 'LIDER_DANZA':
        return 'bg-purple-100 text-purple-800'
      case 'DANZA':
        return 'bg-pink-100 text-pink-800'
      case 'MUSICO':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setRolFiltro('')
    setPaginaActual(1)
  }

  if (!puedeVer) {
    return (
      <Layout titulo="Gestión de Usuarios">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">No tienes permisos para acceder a esta página.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Gestión de Usuarios">
      <div className="space-y-6">
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra los miembros del equipo de alabanza</p>
          </div>
          
          {puedeEditar && (
            <Link href="/usuarios/nuevo" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Link>
          )}
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </div>

          {/* Panel de filtros expandible */}
          {mostrarFiltros && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={rolFiltro}
                  onChange={(e) => setRolFiltro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Todos los roles</option>
                  {ROLES.map(rol => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Usuarios */}
        {cargando ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron usuarios</p>
          </div>
        ) : (
          <>
            {/* Grid de Usuarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {usuario.nombre}
                          </h3>
                          <p className="text-gray-600 truncate text-sm">{usuario.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rol:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorRol(usuario.rol)}`}>
                          {formatearRol(usuario.rol)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Miembro desde:</span>
                        <span className="text-sm text-gray-500">
                          {new Date(usuario.fechaCreacion).toLocaleDateString('es-ES', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="flex justify-between text-xs text-gray-500 mb-4 pt-3 border-t">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {usuario.rol !== 'ADMINISTRADOR' && `${usuario._count.asignaciones} asignaciones`}
                        {usuario.rol === 'ADMINISTRADOR' && 'Sin asignaciones'}
                      </span>
                      <span>{usuario._count.comentarios} comentarios</span>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => abrirModalVer(usuario)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </button>
                      
                      {puedeEditar && (
                        <button 
                          onClick={() => abrirModalEditar(usuario)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </button>
                      )}
                      
                      {puedeEliminar && usuario.id !== session?.user?.id && (
                        <button 
                          onClick={() => abrirModalEliminar(usuario)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {paginacion && paginacion.totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={!paginacion.hasPrev}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {paginacion.pagina} de {paginacion.totalPaginas}
                </span>
                
                <button
                  onClick={() => setPaginaActual(Math.min(paginacion.totalPaginas, paginaActual + 1))}
                  disabled={!paginacion.hasNext}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Resumen de estadísticas */}
        {paginacion && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Equipo</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{paginacion.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              
              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.rol === 'ADMINISTRADOR').length}
                </p>
                <p className="text-sm text-gray-600">Admins</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.rol === 'LIDER_ALABANZA').length}
                </p>
                <p className="text-sm text-gray-600">Líd. Alabanza</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.rol === 'CANTANTE').length}
                </p>
                <p className="text-sm text-gray-600">Cantantes</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.rol === 'LIDER_DANZA').length}
                </p>
                <p className="text-sm text-gray-600">Líd. Danza</p>
              </div>
              
              <div className="text-center">
                <div className="bg-pink-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <User className="h-6 w-6 text-pink-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.rol === 'DANZA').length + usuarios.filter(u => u.rol === 'MUSICO').length}
                </p>
                <p className="text-sm text-gray-600">Danza/Música</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ver Usuario */}
      {modalVer.visible && modalVer.usuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Detalles del Usuario</h2>
                <button
                  onClick={cerrarModales}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <p className="text-gray-900 font-medium">{modalVer.usuario.nombre}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {modalVer.usuario.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rol</label>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${obtenerColorRol(modalVer.usuario.rol)}`}>
                        {formatearRol(modalVer.usuario.rol)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Fechas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
                      <p className="text-gray-900">{formatearFecha(modalVer.usuario.fechaCreacion)}</p>
                    </div>
                    {modalVer.usuario.fechaActualizacion && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Última Actualización</label>
                        <p className="text-gray-900">{formatearFecha(modalVer.usuario.fechaActualizacion)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actividad */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Actividad
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {modalVer.usuario.rol !== 'ADMINISTRADOR' && (
                      <div className="text-center">
                        <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{modalVer.usuario._count.asignaciones}</p>
                        <p className="text-sm text-gray-600">Asignaciones</p>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{modalVer.usuario._count.comentarios}</p>
                      <p className="text-sm text-gray-600">Comentarios</p>
                    </div>
                    {modalVer.usuario._count.programacionesCreadas !== undefined && (
                      <div className="text-center">
                        <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                          <Music className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{modalVer.usuario._count.programacionesCreadas}</p>
                        <p className="text-sm text-gray-600">Programaciones</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={cerrarModales}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
                {puedeEditar && (
                  <button
                    onClick={() => {
                      cerrarModales()
                      abrirModalEditar(modalVer.usuario!)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {modalEditar.visible && modalEditar.usuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
                <button
                  onClick={cerrarModales}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); guardarEdicion(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formEdicion.nombre}
                    onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formEdicion.email}
                    onChange={(e) => setFormEdicion({ ...formEdicion, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    value={formEdicion.rol}
                    onChange={(e) => setFormEdicion({ ...formEdicion, rol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    {ROLES.map(rol => (
                      <option key={rol.value} value={rol.value}>
                        {rol.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cerrarModales}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEdicion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {guardandoEdicion ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {guardandoEdicion ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Usuario */}
      {modalEliminar.visible && modalEliminar.usuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
                </div>
                <button
                  onClick={cerrarModales}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar al usuario{' '}
                  <span className="font-semibold">{modalEliminar.usuario.nombre}</span>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-2">
                    <strong>Esta acción no se puede deshacer.</strong>
                  </p>
                  <p className="text-sm text-red-600">
                    Se eliminarán también:
                  </p>
                  <ul className="text-sm text-red-600 list-disc list-inside mt-1">
                    <li>{modalEliminar.usuario._count.asignaciones} asignaciones</li>
                    <li>{modalEliminar.usuario._count.comentarios} comentarios</li>
                    {modalEliminar.usuario._count.programacionesCreadas && (
                      <li>{modalEliminar.usuario._count.programacionesCreadas} programaciones creadas</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cerrarModales}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminacion}
                  disabled={eliminandoUsuario}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {eliminandoUsuario ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {eliminandoUsuario ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}