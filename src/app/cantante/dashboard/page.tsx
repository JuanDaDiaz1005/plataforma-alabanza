'use client'

import Layout from '@/components/Layout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Music, 
  Calendar, 
  PlayCircle, 
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Volume2,
  Info
} from 'lucide-react'
import { formatearFecha } from '@/lib/utils'
import Link from 'next/link';
import ProximoServicioResumen from '@/components/ProximoServicioResumen';

interface AsignacionCantante {
  id: string
  cancion: {
    id: string
    titulo: string
    artista: string
    duracionSegundos?: number
    album?: string
    tonalidad?: string
  }
  programacion: {
    id: string
    fecha: Date | string
    tipoServicio: string
  }
  rolCancion: string
  estadoPreparacion: string
  notasPersonales?: string
}

export default function DashboardCantante() {
  const { data: session } = useSession()
  const [asignaciones, setAsignaciones] = useState<AsignacionCantante[]>([])
  const [cargando, setCargando] = useState(true)
  const [editandoEstado, setEditandoEstado] = useState<string | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  const [actualizando, setActualizando] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (session?.user?.id) {
      obtenerAsignaciones()
    }
  }, [session])

  const obtenerAsignaciones = async () => {
    if (!session?.user?.id) return
    
    try {
      setCargando(true)
      const response = await fetch(`/api/programaciones?cantanteId=${session.user.id}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener asignaciones')
      }
      
      const data = await response.json()
      setAsignaciones(data.asignaciones || [])
    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar las asignaciones. Por favor, intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  // Obtener el próximo servicio
  const obtenerProximoServicio = async () => {
    if (asignaciones.length === 0) return null
    
    // Ordenar por fecha y obtener el más próximo
    const asignacionesOrdenadas = [...asignaciones].sort((a, b) => {
      const fechaA = new Date(a.programacion.fecha)
      const fechaB = new Date(b.programacion.fecha)
      return fechaA.getTime() - fechaB.getTime()
    })
    
    const proximaAsignacion = asignacionesOrdenadas[0]
    const fechaProxima = new Date(proximaAsignacion.programacion.fecha)
    const hoy = new Date()
    
    // Solo mostrar si es una fecha futura
    if (fechaProxima > hoy) {
      // Obtener todas las canciones de este servicio
      try {
        const response = await fetch(`/api/programaciones/${proximaAsignacion.programacion.id}`)
        if (response.ok) {
          const data = await response.json()
          return {
            ...proximaAsignacion,
            todasLasCanciones: data.asignaciones || []
          }
        }
      } catch (error) {
        console.error('Error al obtener detalles del servicio:', error)
      }
      
      return proximaAsignacion
    }
    
    return null
  }

  const [proximoServicio, setProximoServicio] = useState<unknown>(null)

  useEffect(() => {
    const fetchProximoServicio = async () => {
      const servicio = await obtenerProximoServicio()
      setProximoServicio(servicio)
    }
    fetchProximoServicio()
  }, [asignaciones])

  const iniciarEdicion = (asignacionId: string, estadoActual: string) => {
    setEditandoEstado(asignacionId)
    setNuevoEstado(estadoActual)
    setError('')
  }

  const cancelarEdicion = () => {
    setEditandoEstado(null)
    setNuevoEstado('')
    setError('')
  }

  const actualizarEstadoPreparacion = async (asignacionId: string) => {
    if (!session?.user?.id || !nuevoEstado) return

    try {
      setActualizando(true)
      setError('')

      // Primero necesitamos obtener la programación ID de la asignación
      const asignacion = asignaciones.find(a => a.id === asignacionId)
      if (!asignacion) throw new Error('Asignación no encontrada')

      const response = await fetch(`/api/programaciones/${asignacion.programacion.id}/asignaciones/${asignacionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estadoPreparacion: nuevoEstado
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar estado')
      }

      // Actualizar el estado local
      setAsignaciones(prevAsignaciones => 
        prevAsignaciones.map(asig => 
          asig.id === asignacionId 
            ? { ...asig, estadoPreparacion: nuevoEstado }
            : asig
        )
      )

      setEditandoEstado(null)
      setNuevoEstado('')
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Error al actualizar estado')
    } finally {
      setActualizando(false)
    }
  }

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PREPARADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'EN_PRACTICA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PENDIENTE':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NECESITA_AYUDA':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'PREPARADO':
        return <CheckCircle className="h-4 w-4" />
      case 'EN_PRACTICA':
        return <Clock className="h-4 w-4" />
      case 'PENDIENTE':
        return <AlertCircle className="h-4 w-4" />
      case 'NECESITA_AYUDA':
        return <User className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PREPARADO':
        return 'Preparado'
      case 'EN_PRACTICA':
        return 'En Práctica'
      case 'PENDIENTE':
        return 'Pendiente'
      case 'NECESITA_AYUDA':
        return 'Necesita Ayuda'
      default:
        return estado
    }
  }

  const obtenerTextoRol = (rol: string) => {
    switch (rol) {
      case 'LEAD_VOCAL':
        return 'Líder de Voz'
      case 'BACK_VOCAL':
        return 'Coro'
      case 'GUITARRA':
        return 'Guitarra'
      case 'BAJO':
        return 'Bajo'
      case 'TECLADO':
        return 'Teclado'
      case 'PERCUSION':
        return 'Percusión'
      default:
        return rol.replace('_', ' ')
    }
  }


  if (cargando) {
    return (
      <Layout titulo="Mi Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  const asignacionesPreparadas = asignaciones.filter(a => a.estadoPreparacion === 'PREPARADO').length
  const asignacionesPendientes = asignaciones.filter(a => a.estadoPreparacion !== 'PREPARADO').length

  return (
    <Layout titulo="Mi Dashboard">
      <div className="space-y-8">
        {/* Bienvenida personalizada */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            ¡Hola, {session?.user?.name}!
          </h2>
          <p className="text-purple-100">
            {session?.user?.rangoVocal && `${session.user.rangoVocal} • `}
            Tienes {asignaciones.length} canciones asignadas para los próximos servicios.
          </p>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Preparadas</p>
                <p className="text-3xl font-bold text-green-600">{asignacionesPreparadas}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Preparar</p>
                <p className="text-3xl font-bold text-orange-600">{asignacionesPendientes}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-blue-600">{asignaciones.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Music className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Próximo Servicio */}
        {proximoServicio && (
          <ProximoServicioResumen
            proximoServicio={proximoServicio}
            colorGradiente="from-green-500 to-emerald-600"
            colorAcento="text-green-600"
            obtenerColorEstado={obtenerColorEstado}
            obtenerTextoEstado={obtenerTextoEstado}
            obtenerTextoRol={obtenerTextoRol}
          />
        )}

        {/* Mis asignaciones */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Mis Próximas Asignaciones
              </h3>
              <p className="text-sm text-gray-500">Canciones asignadas para preparar</p>
            </div>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <div className="flex justify-between items-center">
                  <span>{error}</span>
                  <button 
                    onClick={() => setError('')}
                    className="text-red-700 hover:text-red-900"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {asignaciones.length === 0 ? (
              <div className="text-center py-12">
                <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tienes asignaciones pendientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {asignaciones.map((asignacion) => (
                  <div
                    key={asignacion.id}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-gray-900 text-lg">
                              <a 
                                href={`/canciones/${asignacion.cancion.id}?from=cantante-dashboard`}
                                className="hover:text-green-600 transition-colors cursor-pointer"
                              >
                                {asignacion.cancion.titulo}
                              </a>
                            </h4>
                            {editandoEstado === asignacion.id ? (
                              <div className="flex items-center gap-2">
                                <select 
                                  value={nuevoEstado}
                                  onChange={(e) => setNuevoEstado(e.target.value)}
                                  className="text-sm border rounded px-3 py-1 bg-white"
                                  disabled={actualizando}
                                >
                                  <option value="PENDIENTE">PENDIENTE</option>
                                  <option value="EN_PRACTICA">EN PRÁCTICA</option>
                                  <option value="PREPARADO">PREPARADO</option>
                                  <option value="NECESITA_AYUDA">NECESITA AYUDA</option>
                                </select>
                                <button
                                  onClick={() => actualizarEstadoPreparacion(asignacion.id)}
                                  disabled={actualizando}
                                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                  {actualizando ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                  onClick={cancelarEdicion}
                                  disabled={actualizando}
                                  className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorEstado(asignacion.estadoPreparacion)}`}>
                                  {obtenerIconoEstado(asignacion.estadoPreparacion)}
                                  {asignacion.estadoPreparacion.replace('_', ' ')}
                                </span>
                                <button
                                  onClick={() => iniciarEdicion(asignacion.id, asignacion.estadoPreparacion)}
                                  className="text-sm text-green-600 hover:text-green-800 px-3 py-1 hover:bg-green-50 rounded transition-colors"
                                >
                                  Editar
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {asignacion.cancion.artista}
                            </span>
                            {asignacion.cancion.album && (
                              <span className="text-gray-500">• {asignacion.cancion.album}</span>
                            )}
                            {asignacion.cancion.tonalidad && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {asignacion.cancion.tonalidad}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatearFecha(asignacion.programacion.fecha)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              {asignacion.rolCancion.replace('_', ' ')}
                            </span>
                            <span className="text-gray-500">
                              {asignacion.programacion.tipoServicio}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Link 
                          href={`/canciones/${asignacion.cancion.id}?from=cantante-dashboard`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ver detalles de la canción"
                        >
                          <Info className="h-5 w-5" />
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <PlayCircle className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                          <Volume2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones rápidas para cantantes */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Recursos de Práctica
              </h3>
              <p className="text-sm text-gray-500">Herramientas para tu preparación</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/biblioteca"
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <PlayCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">Reproductor</p>
                  <p className="text-sm text-gray-600">Escuchar canciones asignadas</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/canciones"
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">Catálogo</p>
                  <p className="text-sm text-gray-600">Explorar letras y acordes</p>
                </div>
              </div>
            </Link>

            <Link
              href="/servicios"
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">Servicios</p>
                  <p className="text-sm text-gray-600">Ver todos los servicios programados</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
} 