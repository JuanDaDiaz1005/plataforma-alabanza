'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Users,
  Music,
  Clock,
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
    email: string
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

export default function ProgramacionPage() {
  const { data: session } = useSession()
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
  const puedeCrear = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'
  const puedeEditar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'
  const puedeEliminar = session?.user?.role === 'ADMINISTRADOR'

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

  if (cargando) {
    return (
      <Layout titulo="Programación">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Programación">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programación de Servicios</h1>
            <p className="text-gray-600">Gestiona las programaciones y asignaciones de canciones</p>
          </div>
          
          {puedeCrear && (
            <Link
              href="/programacion/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Programación
            </Link>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Servicio
              </label>
              <select
                value={tipoServicioFiltro}
                onChange={(e) => {
                  setTipoServicioFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={activaFiltro}
                onChange={(e) => {
                  setActivaFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesdeFiltro}
                onChange={(e) => {
                  setFechaDesdeFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHastaFiltro}
                onChange={(e) => {
                  setFechaHastaFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
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
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Lista de programaciones */}
        {programaciones.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programaciones</h3>
            <p className="text-gray-600 mb-4">No se encontraron programaciones con los filtros aplicados.</p>
            {puedeCrear && (
              <Link
                href="/programacion/nueva"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Crear Primera Programación
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programaciones.map((programacion) => (
              <div key={programacion.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatearTipoServicio(programacion.tipoServicio)}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatearFecha(programacion.fecha)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          programacion.activa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {programacion.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>

                  {programacion.notas && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {programacion.notas}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        Asignaciones:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {programacion._count.asignaciones}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Cantantes únicos:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {new Set(programacion.asignaciones.map(a => a.usuario.id)).size}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <div className="flex gap-2">
                      <Link
                        href={`/programacion/${programacion.id}`}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      
                      {puedeEditar && (
                        <Link
                          href={`/programacion/${programacion.id}/editar`}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      )}
                      
                      {puedeEliminar && (
                        <button
                          onClick={() => eliminarProgramacion(programacion.id, programacion.fecha)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      {new Date(programacion.fechaCreacion).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-600">
              Página {paginaActual} de {totalPaginas}
            </span>
            
            <button
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
} 