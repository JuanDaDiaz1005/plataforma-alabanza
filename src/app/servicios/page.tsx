'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  Calendar, 
  Search, 
  Filter,
  Music,
  PlayCircle,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Programacion {
  id: string
  fecha: string
  tipoServicio: string
  notas?: string
  activa: boolean
  fechaCreacion: string
  asignaciones: Asignacion[]
  _count: {
    asignaciones: number
    comentarios: number
  }
}

interface Asignacion {
  id: string
  rolCancion: string
  usuario: {
    id: string
    nombre: string
    rangoVocal?: string
  }
  cancion: {
    id: string
    titulo: string
    artista: string
  }
}

const TIPOS_SERVICIO = [
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'DOMINGO', label: 'Domingo' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'ESPECIAL', label: 'Especial' }
]

export default function ServiciosPage() {
  const { data: sesion } = useSession()
  const [programaciones, setProgramaciones] = useState<Programacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('')
  const [tipoServicioFiltro, setTipoServicioFiltro] = useState('')
  const [activaFiltro, setActivaFiltro] = useState<string>('')
  const [fechaDesdeFiltro, setFechaDesdeFiltro] = useState('')
  const [fechaHastaFiltro, setFechaHastaFiltro] = useState('')
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const limite = 12

  // Verificar permisos
  const puedeCrear = sesion?.user?.role === 'ADMINISTRADOR' || sesion?.user?.role === 'LIDER_ALABANZA'
  const puedeEditar = sesion?.user?.role === 'ADMINISTRADOR' || sesion?.user?.role === 'LIDER_ALABANZA'
  const puedeEliminar = sesion?.user?.role === 'ADMINISTRADOR'
  const esDanza = sesion?.user?.role === 'DANZA' || sesion?.user?.role === 'LIDER_DANZA'

  // Cargar programaciones
  const cargarProgramaciones = async () => {
    try {
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        limite: limite.toString()
      })

      if (tipoServicioFiltro) params.append('tipoServicio', tipoServicioFiltro)
      if (activaFiltro !== '') params.append('activa', activaFiltro)
      if (fechaDesdeFiltro) params.append('fechaDesde', fechaDesdeFiltro)
      if (fechaHastaFiltro) params.append('fechaHasta', fechaHastaFiltro)

      const response = await fetch(`/api/programaciones?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar las programaciones')
      }

      const data = await response.json()
      setProgramaciones(data.programaciones)
      setTotalPaginas(data.pagination.totalPaginas)
      
    } catch (error) {
      setError('Error al cargar las programaciones')
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  // Formatear tipo de servicio
  const formatearTipoServicio = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'MIERCOLES': 'Miércoles',
      'DOMINGO': 'Domingo',
      'SABADO': 'Sábado', 
      'JUEVES': 'Jueves',
      'ESPECIAL': 'Especial'
    }
    return tipos[tipo] || tipo
  }

  // Efectos
  useEffect(() => {
    cargarProgramaciones()
  }, [paginaActual, tipoServicioFiltro, activaFiltro, fechaDesdeFiltro, fechaHastaFiltro])

  // Limpiar filtros
  const limpiarFiltros = () => {
    setTipoServicioFiltro('')
    setActivaFiltro('')
    setFechaDesdeFiltro('')
    setFechaHastaFiltro('')
    setPaginaActual(1)
  }

  // Eliminar programación
  const eliminarProgramacion = async (id: string, fecha: string) => {
    if (!confirm(`¿Estás seguro de eliminar la programación del ${formatearFecha(fecha)}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/programaciones/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la programación')
      }

      // Recargar lista
      cargarProgramaciones()
      
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar la programación')
    }
  }

  if (cargando) {
    return (
      <Layout titulo="Servicios">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Servicios Programados">
      <div className="space-y-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Servicios Programados</h1>
              <p className="text-blue-100">
                {sesion?.user?.role === 'CANTANTE' 
                  ? 'Explora los servicios y haz clic en "Ver Detalles" para estudiar las canciones'
                  : esDanza
                  ? 'Explora los servicios programados y revisa las canciones para preparar las danzas'
                  : 'Gestiona las programaciones y asignaciones de canciones'
                }
              </p>
            </div>
            
            {puedeCrear && (
              <Link
                href="/programacion/nueva"
                className="inline-flex items-center gap-3 px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Nueva Programación
              </Link>
            )}
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-2 rounded-lg">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Filtros de Búsqueda
              </h3>
              <p className="text-sm text-gray-500">Refina los resultados según tus necesidades</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Servicio
              </label>
              <select
                value={tipoServicioFiltro}
                onChange={(e) => {
                  setTipoServicioFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
              >
                <option value="">Todos los tipos</option>
                {TIPOS_SERVICIO.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={activaFiltro}
                onChange={(e) => {
                  setActivaFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesdeFiltro}
                onChange={(e) => {
                  setFechaDesdeFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHastaFiltro}
                onChange={(e) => {
                  setFechaHastaFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Lista de programaciones mejorada */}
        {programaciones.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay servicios</h3>
            <p className="text-gray-600 mb-6">No se encontraron servicios con los filtros aplicados.</p>
            {puedeCrear && (
              <Link
                href="/programacion/nueva"
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Crear Primera Programación
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programaciones.map((programacion) => (
              <div key={programacion.id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                
                <Link 
                  href={`/programacion/${programacion.id}`}
                  className="block p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {formatearTipoServicio(programacion.tipoServicio)}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatearFecha(programacion.fecha)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          programacion.activa
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {programacion.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>

                  {programacion.notas && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {programacion.notas}
                      </p>
                    </div>
                  )}

                  {!esDanza && (
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Music className="h-4 w-4 text-blue-600" />
                          Canciones:
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {new Set(programacion.asignaciones.map(a => a.cancion.id)).size}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cantantes:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {new Set(programacion.asignaciones.map(a => a.usuario.id)).size}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lista simplificada de primeras 3 canciones */}
                  <div className="space-y-3 mb-12">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1.5 rounded-lg">
                        <Music className="h-3 w-3 text-white" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {esDanza ? 'Canciones para Danza:' : 'Repertorio:'}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {Array.from(new Set(programacion.asignaciones.map(a => a.cancion.id)))
                        .slice(0, 3)
                        .map(cancionId => {
                          const cancion = programacion.asignaciones.find(a => a.cancion.id === cancionId)?.cancion
                          return (
                            <div key={cancionId} className="text-sm text-gray-600 flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span className="truncate font-medium">{cancion?.titulo}</span>
                              <span className="text-gray-500 text-xs">- {cancion?.artista}</span>
                            </div>
                          )
                        })}
                      {new Set(programacion.asignaciones.map(a => a.cancion.id)).size > 3 && (
                        <div className="text-center">
                          <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                            +{new Set(programacion.asignaciones.map(a => a.cancion.id)).size - 3} canciones más
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Botones de acción administrativos */}
                {(puedeEditar || puedeEliminar) && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {puedeEditar && (
                      <Link
                        href={`/programacion/${programacion.id}/editar`}
                        className="p-2 bg-white shadow-sm border rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Editar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    )}
                    
                    {puedeEliminar && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          eliminarProgramacion(programacion.id, programacion.fecha)
                        }}
                        className="p-2 bg-white shadow-sm border rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Paginación mejorada */}
        {totalPaginas > 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </button>
              
              <div className="flex items-center gap-2">
                {/* Mostrar números de página */}
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginaActual <= 3) {
                    pageNum = i + 1;
                  } else if (paginaActual >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = paginaActual - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPaginaActual(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        pageNum === paginaActual
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Siguiente →
              </button>
            </div>
            
            <div className="text-center mt-3">
              <span className="text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas} • {programaciones.length} servicios mostrados
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 