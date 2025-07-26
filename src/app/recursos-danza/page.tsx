'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { 
  Play, 
  Plus,
  ExternalLink,
  User,
  Calendar,
  Search,
  Filter,
  X,
  Youtube,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react'

interface RecursoDanza {
  id: string
  titulo: string
  descripcion: string
  url: string
  categoria: 'tutorial' | 'predica' | 'coreografia' | 'tecnica' | 'otro'
  creadoPor: {
    id: string
    nombre: string
  }
  fechaCreacion: string
}

export default function RecursosDanzaPage() {
  const { data: session } = useSession()
  const [recursos, setRecursos] = useState<RecursoDanza[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  
  // Estados del formulario
  const [nuevoRecurso, setNuevoRecurso] = useState({
    titulo: '',
    descripcion: '',
    url: '',
    categoria: 'tutorial' as RecursoDanza['categoria']
  })
  const [guardando, setGuardando] = useState(false)

  // Estados para modales de editar/eliminar
  const [recursoEditando, setRecursoEditando] = useState<RecursoDanza | null>(null)
  const [recursoParaEliminar, setRecursoParaEliminar] = useState<RecursoDanza | null>(null)
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [editandoRecurso, setEditandoRecurso] = useState({
    titulo: '',
    descripcion: '',
    url: '',
    categoria: 'tutorial' as RecursoDanza['categoria']
  })
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // Verificar acceso
  const puedeAcceder = session?.user?.role === 'DANZA' || session?.user?.role === 'LIDER_DANZA'

  // Verificar permisos de edición/eliminación
  const puedeEditarEliminar = (recurso: RecursoDanza) => {
    return (
      recurso.creadoPor.id === session?.user?.id ||
      session?.user?.role === 'LIDER_DANZA' ||
      session?.user?.role === 'ADMINISTRADOR'
    )
  }

  const cargarRecursos = async () => {
    try {
      setCargando(true)
      const params = new URLSearchParams({
        ...(busqueda && { busqueda }),
        ...(filtroCategoria && { categoria: filtroCategoria })
      })

      const response = await fetch(`/api/recursos-danza?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecursos(data.recursos || [])
      }
    } catch (error) {
      console.error('Error al cargar recursos:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (puedeAcceder) {
      cargarRecursos()
    }
  }, [puedeAcceder, busqueda, filtroCategoria])

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)

    try {
      const response = await fetch('/api/recursos-danza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRecurso)
      })

      if (response.ok) {
        setNuevoRecurso({ titulo: '', descripcion: '', url: '', categoria: 'tutorial' })
        setMostrarFormulario(false)
        cargarRecursos()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al crear recurso:', error)
      alert('Error al crear el recurso')
    } finally {
      setGuardando(false)
    }
  }

  const manejarEditar = (recurso: RecursoDanza) => {
    setRecursoEditando(recurso)
    setEditandoRecurso({
      titulo: recurso.titulo,
      descripcion: recurso.descripcion,
      url: recurso.url,
      categoria: recurso.categoria
    })
  }

  const manejarActualizacion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recursoEditando) return

    setGuardandoEdicion(true)

    try {
      const response = await fetch(`/api/recursos-danza/${recursoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editandoRecurso)
      })

      if (response.ok) {
        setRecursoEditando(null)
        cargarRecursos()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al actualizar recurso:', error)
      alert('Error al actualizar el recurso')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const manejarEliminar = (recurso: RecursoDanza) => {
    setRecursoParaEliminar(recurso)
    setMostrarModalEliminar(true)
  }

  const confirmarEliminar = async () => {
    if (!recursoParaEliminar) return

    setEliminando(true)

    try {
      const response = await fetch(`/api/recursos-danza/${recursoParaEliminar.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMostrarModalEliminar(false)
        setRecursoParaEliminar(null)
        cargarRecursos()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al eliminar recurso:', error)
      alert('Error al eliminar el recurso')
    } finally {
      setEliminando(false)
    }
  }

  const obtenerIconoCategoria = (categoria: string) => {
    switch (categoria) {
      case 'tutorial': return '🎬'
      case 'predica': return '🙏'
      case 'coreografia': return '💃'
      case 'tecnica': return '🎯'
      default: return '📹'
    }
  }

  const obtenerTextoCategoria = (categoria: string) => {
    switch (categoria) {
      case 'tutorial': return 'Tutorial'
      case 'predica': return 'Prédica'
      case 'coreografia': return 'Coreografía'
      case 'tecnica': return 'Técnica'
      default: return 'Otro'
    }
  }

  if (!puedeAcceder) {
    return (
      <Layout titulo="Recursos de Danza">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Acceso Restringido</h2>
            <p className="text-red-700">Esta página es solo para el equipo de danza.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Recursos de Danza">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Recursos de Danza 💃</h1>
              <p className="text-purple-100">
                Espacio colaborativo para compartir tutoriales, prédicas y recursos de danza
              </p>
            </div>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Agregar Recurso
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Todas las categorías</option>
                <option value="tutorial">Tutoriales</option>
                <option value="predica">Prédicas</option>
                <option value="coreografia">Coreografías</option>
                <option value="tecnica">Técnica</option>
                <option value="otro">Otros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de recursos */}
        {cargando ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : recursos.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Youtube className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron recursos</h3>
            <p className="text-gray-600 mb-6">Sé el primero en compartir un recurso con el equipo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recursos.map((recurso) => (
              <div key={recurso.id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{obtenerIconoCategoria(recurso.categoria)}</span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                        {obtenerTextoCategoria(recurso.categoria)}
                      </span>
                    </div>
                    {puedeEditarEliminar(recurso) && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => manejarEditar(recurso)}
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => manejarEliminar(recurso)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{recurso.titulo}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{recurso.descripcion}</p>
                  
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <User className="h-4 w-4" />
                    <span>{recurso.creadoPor.nombre}</span>
                    <Calendar className="h-4 w-4 ml-2" />
                    <span>{new Date(recurso.fechaCreacion).toLocaleDateString()}</span>
                  </div>
                  
                  <a
                    href={recurso.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium justify-center"
                  >
                    <Play className="h-4 w-4" />
                    Ver en YouTube
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de agregar recurso */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Agregar Recurso</h3>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={manejarSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                  <input
                    type="text"
                    required
                    value={nuevoRecurso.titulo}
                    onChange={(e) => setNuevoRecurso(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Tutorial de giros básicos"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                  <textarea
                    required
                    rows={3}
                    value={nuevoRecurso.descripcion}
                    onChange={(e) => setNuevoRecurso(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe el contenido del recurso..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL de YouTube *</label>
                  <input
                    type="url"
                    required
                    value={nuevoRecurso.url}
                    onChange={(e) => setNuevoRecurso(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  <select
                    required
                    value={nuevoRecurso.categoria}
                    onChange={(e) => setNuevoRecurso(prev => ({ ...prev, categoria: e.target.value as RecursoDanza['categoria'] }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="tutorial">Tutorial</option>
                    <option value="predica">Prédica</option>
                    <option value="coreografia">Coreografía</option>
                    <option value="tecnica">Técnica</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de editar recurso */}
        {recursoEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Editar Recurso</h3>
                <button
                  onClick={() => setRecursoEditando(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={manejarActualizacion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                  <input
                    type="text"
                    required
                    value={editandoRecurso.titulo}
                    onChange={(e) => setEditandoRecurso(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Tutorial de giros básicos"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                  <textarea
                    required
                    rows={3}
                    value={editandoRecurso.descripcion}
                    onChange={(e) => setEditandoRecurso(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe el contenido del recurso..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL de YouTube *</label>
                  <input
                    type="url"
                    required
                    value={editandoRecurso.url}
                    onChange={(e) => setEditandoRecurso(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  <select
                    required
                    value={editandoRecurso.categoria}
                    onChange={(e) => setEditandoRecurso(prev => ({ ...prev, categoria: e.target.value as RecursoDanza['categoria'] }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="tutorial">Tutorial</option>
                    <option value="predica">Prédica</option>
                    <option value="coreografia">Coreografía</option>
                    <option value="tecnica">Técnica</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setRecursoEditando(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEdicion}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {guardandoEdicion ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmar eliminación */}
        {mostrarModalEliminar && recursoParaEliminar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirmar Eliminación</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  ¿Estás seguro de que deseas eliminar este recurso?
                </p>
                <p className="font-medium text-gray-900">&quot;{recursoParaEliminar.titulo}&quot;</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMostrarModalEliminar(false)
                    setRecursoParaEliminar(null)
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminar}
                  disabled={eliminando}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 