'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  Calendar,
  Music,
  Play,
  Users,
  ArrowRight,
  Youtube,
  Edit2,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Star,
  ExternalLink
} from 'lucide-react'
import ProximoServicioResumen from '@/components/ProximoServicioResumen';

interface ServicioDanza {
  id: string
  fecha: string
  tipoServicio: string
  asignaciones: Asignacion[]
}

interface Asignacion {
  cancion: {
    id: string
    titulo: string
    artista: string
    videoDanza?: string
    estadoVideoDanza?: string
    album?: string
    duracionSegundos?: number
    tonalidad?: string
  }
}

// Interfaces para gestión de estado de preparación de danza
interface AsignacionDanza {
  id: string
  estadoPreparacion: string
  notasPersonales?: string
  cancion: {
    id: string
    titulo: string
    artista: string
    videoDanza?: string
    estadoVideoDanza?: string
  }
  programacion: {
    id: string
    fecha: string
    tipoServicio: string
  }
}

// Interfaces para ProximoServicioResumen
interface AsignacionServicio {
  id: string;
  cancion: {
    id: string;
    titulo: string;
    artista: string;
  };
  usuario: {
    id: string;
    nombre: string;
    rolCancion: string;
  };
  rolCancion: string;
  estadoPreparacion: string;
}

interface ProximoServicioDanza {
  id: string;
  fecha: string;
  tipoServicio: string;
  asignaciones: AsignacionServicio[];
  totalAsignaciones: number;
  asignacionesPendientes: number;
}

export default function DashboardDanza() {
  const { data: sesion } = useSession()
  const [proximosServicios, setProximosServicios] = useState<ServicioDanza[]>([])
  const [cancionesConVideo, setCancionesConVideo] = useState<Asignacion['cancion'][]>([])
  const [cargando, setCargando] = useState(true)
  const [lideresPorCancion, setLideresPorCancion] = useState<Record<string, { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }>>({})
  const [proximoServicioCompleto, setProximoServicioCompleto] = useState<ProximoServicioDanza | null>(null)
  
  // Estados para gestión de preparación de danza
  const [misAsignacionesDanza, setMisAsignacionesDanza] = useState<AsignacionDanza[]>([])
  const [editandoEstadoDanza, setEditandoEstadoDanza] = useState<string | null>(null)
  const [nuevoEstadoDanza, setNuevoEstadoDanza] = useState('')
  const [actualizandoDanza, setActualizandoDanza] = useState(false)
  const [errorDanza, setErrorDanza] = useState('')

  // Estados para gestión de videos de danza (solo líderes)
  const [editandoVideoEstado, setEditandoVideoEstado] = useState<string | null>(null)
  const [nuevoEstadoVideo, setNuevoEstadoVideo] = useState('')
  const [actualizandoVideo, setActualizandoVideo] = useState(false)

  // Verificar acceso
  const puedeAcceder = sesion?.user?.role === 'DANZA' || sesion?.user?.role === 'LIDER_DANZA'
  const esLiderDanza = sesion?.user?.role === 'LIDER_DANZA'

  // Funciones para ProximoServicioResumen
  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PREPARADO':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'EN_PRACTICA':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'PENDIENTE':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'NECESITA_AYUDA':
        return 'bg-orange-50 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PREPARADO': return 'Preparado'
      case 'EN_PRACTICA': return 'En Práctica'
      case 'PENDIENTE': return 'Pendiente'
      case 'NECESITA_AYUDA': return 'Necesita Ayuda'
      default: return estado
    }
  }

  const obtenerTextoRol = (rol: string) => {
    switch (rol) {
      case 'CANTANTE_PRINCIPAL': return 'Voz Principal'
      case 'COROS': return 'Coros'
      case 'ARMONIAS': return 'Armonías'
      case 'RESPALDO': return 'Respaldo'
      case 'MUSICO': return 'Músico'
      case 'DANZA': return 'Danzora'
      case 'LIDER_DANZA': return 'Líder de Danza'
      default: return rol
    }
  }

  const obtenerTextoEstadoVideo = (estado: string) => {
    switch (estado) {
      case 'SIN_GRABAR': return 'Sin Grabar'
      case 'GRABADO': return 'Grabado'
      case 'REGRABAR': return 'Regrabar'
      default: return estado
    }
  }

  const obtenerColorEstadoVideo = (estado: string) => {
    switch (estado) {
      case 'GRABADO': return 'bg-green-100 text-green-700 border-green-200'
      case 'SIN_GRABAR': return 'bg-red-100 text-red-700 border-red-200'
      case 'REGRABAR': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Función para actualizar estado de preparación de danza
  const actualizarEstadoPreparacionDanza = async (asignacionId: string) => {
    if (!sesion?.user?.id || !nuevoEstadoDanza) return

    try {
      setActualizandoDanza(true)
      setErrorDanza('')

      const asignacion = misAsignacionesDanza.find(a => a.id === asignacionId)
      if (!asignacion) throw new Error('Asignación no encontrada')

      const response = await fetch(`/api/programaciones/${asignacion.programacion.id}/danzas-lideres`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asignacionDanzaId: asignacionId,
          estadoPreparacion: nuevoEstadoDanza
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar estado')
      }

      // Actualizar estado local
      setMisAsignacionesDanza(prevAsignaciones => 
        prevAsignaciones.map(asig => 
          asig.id === asignacionId 
            ? { ...asig, estadoPreparacion: nuevoEstadoDanza }
            : asig
        )
      )

      setEditandoEstadoDanza(null)
      setNuevoEstadoDanza('')
    } catch (error) {
      console.error('Error:', error)
      setErrorDanza(error instanceof Error ? error.message : 'Error al actualizar estado')
    } finally {
      setActualizandoDanza(false)
    }
  }

  // Función para actualizar estado de video de danza (solo líderes)
  const actualizarEstadoVideo = async (cancionId: string) => {
    if (!esLiderDanza || !nuevoEstadoVideo) return

    try {
      setActualizandoVideo(true)

      const response = await fetch(`/api/canciones/${cancionId}/video-danza`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estadoVideoDanza: nuevoEstadoVideo
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar estado del video')
      }

      // Recargar datos para reflejar cambios
      cargarDatos()
      setEditandoVideoEstado(null)
      setNuevoEstadoVideo('')
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar estado del video')
    } finally {
      setActualizandoVideo(false)
    }
  }

  const cargarDatos = async () => {
    try {
      setCargando(true)

      // Cargar próximos servicios
      const hoy = new Date().toISOString()
      const respuestaServicios = await fetch(`/api/programaciones?fechaDesde=${hoy}&limite=3`)
      
      if (respuestaServicios.ok) {
        const datosServicios = await respuestaServicios.json()
        const servicios = datosServicios.programaciones || []
        setProximosServicios(servicios)

        // Cargar el próximo servicio completo con asignaciones
        if (servicios.length > 0) {
          const proximoServicio = servicios[0]
          const respuestaAsignaciones = await fetch(`/api/programaciones/${proximoServicio.id}/asignaciones`)
          
          if (respuestaAsignaciones.ok) {
            const datosAsignaciones = await respuestaAsignaciones.json()
            const todasAsignaciones = datosAsignaciones.asignaciones || []
            
            // Filtrar asignaciones según el rol del usuario
            const asignacionesFiltradas = esLiderDanza 
              ? todasAsignaciones // Líder de danza ve TODAS las asignaciones
              : todasAsignaciones.filter((a: any) => 
                  (a.rolCancion === 'DANZA' || a.rolCancion === 'LIDER_DANZA') ||
                  (a.usuario.role === 'DANZA' || a.usuario.role === 'LIDER_DANZA')
                )
            
            // Mapear al formato correcto
            const asignacionesMapeadas = asignacionesFiltradas.map((a: any) => ({
              id: a.id,
              cancion: {
                id: a.cancion.id,
                titulo: a.cancion.titulo,
                artista: a.cancion.artista
              },
              usuario: {
                id: a.usuario.id,
                nombre: a.usuario.nombre,
                rolCancion: a.rolCancion || a.usuario.role
              },
              rolCancion: a.rolCancion || a.usuario.role,
              estadoPreparacion: a.estadoPreparacion || 'PENDIENTE'
            }))
            
            setProximoServicioCompleto({
              id: proximoServicio.id,
              fecha: new Date(proximoServicio.fecha).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              tipoServicio: proximoServicio.tipoServicio,
              asignaciones: asignacionesMapeadas,
              totalAsignaciones: asignacionesMapeadas.length,
              asignacionesPendientes: asignacionesMapeadas.filter((a: AsignacionServicio) => a.estadoPreparacion === 'PENDIENTE').length
            })
          }
        }

        // Cargar mis asignaciones de danza (solo para los próximos 2 servicios)
        if (sesion?.user?.id) {
          const respuestaMisAsignaciones = await fetch(`/api/programaciones/danza-asignaciones?usuarioId=${sesion.user.id}`)
          
          if (respuestaMisAsignaciones.ok) {
            const datosMisAsignaciones = await respuestaMisAsignaciones.json()
            console.log('Mis asignaciones de danza cargadas:', datosMisAsignaciones)
            
            // Filtrar para mostrar solo asignaciones de los próximos 2 servicios
            let asignacionesFiltradas = datosMisAsignaciones || []
            if (servicios && servicios.length > 0) {
              const proximosDosCultos = servicios.slice(0, 2) // Solo los primeros 2 servicios
              const idsProximosDosCultos = proximosDosCultos.map((s: ServicioDanza) => s.id)
              
              asignacionesFiltradas = asignacionesFiltradas.filter((asignacion: any) => 
                idsProximosDosCultos.includes(asignacion.programacion?.id)
              )
              
              console.log(`Filtrando asignaciones para los próximos 2 cultos:`, {
                totalServicios: servicios.length,
                proximosDosCultos: proximosDosCultos.map((s: ServicioDanza) => ({ id: s.id, fecha: s.fecha, tipo: s.tipoServicio })),
                asignacionesOriginales: datosMisAsignaciones.length,
                asignacionesFiltradas: asignacionesFiltradas.length
              })
            }
            
            setMisAsignacionesDanza(asignacionesFiltradas)
            
            // Debug: Si no hay asignaciones, mostrar un mensaje más útil
            if (!asignacionesFiltradas || asignacionesFiltradas.length === 0) {
              console.log('No se encontraron asignaciones de danza para el usuario en los próximos 2 servicios:', sesion.user.id)
            }
          } else {
            console.error('Error al cargar mis asignaciones de danza:', respuestaMisAsignaciones.statusText)
          }
        }
      }

      // Cargar canciones con videos de danza (últimas 5)
      const respuestaCanciones = await fetch('/api/canciones?limite=50')
      
      if (respuestaCanciones.ok) {
        const datosCanciones = await respuestaCanciones.json()
        const conVideo = datosCanciones.canciones.filter((c: Asignacion['cancion']) => c.videoDanza).slice(0, 5)
        console.log('Canciones con video cargadas:', conVideo)
        setCancionesConVideo(conVideo)
      } else {
        console.error('Error al cargar canciones:', respuestaCanciones.statusText)
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const cargarLideres = async (programacionId: string) => {
    const res = await fetch(`/api/programaciones/${programacionId}/danzas-lideres`)
    if (res.ok) {
      const data = await res.json()
      const porCancion: Record<string, { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }> = {}
      data.forEach((c: { cancionId: string; titulo: string; lideres: Array<{ id: string, nombre: string }> }) => { porCancion[c.cancionId] = c })
      setLideresPorCancion(prev => ({ ...prev, ...porCancion }))
    }
  }

  useEffect(() => {
    if (puedeAcceder) {
      console.log('Cargando datos del dashboard de danza para usuario:', sesion?.user?.id, 'Es líder:', esLiderDanza)
      cargarDatos()
    }
  }, [puedeAcceder])

  // Cargar líderes cuando se cargan los servicios
  useEffect(() => {
    if (proximosServicios.length > 0) {
      proximosServicios.forEach(servicio => {
        cargarLideres(servicio.id)
      })
    }
  }, [proximosServicios])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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

  if (!puedeAcceder) {
    return (
      <Layout titulo="Dashboard Danza">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Acceso Restringido</h2>
            <p className="text-red-700">Este dashboard es solo para el equipo de danza.</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (cargando) {
    return (
      <Layout titulo="Dashboard Danza">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Dashboard Danza">
      <div className="space-y-8">
        {/* Header de bienvenida mejorado */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Bienvenido al Dashboard de Danza! 💃
              </h1>
              <p className="text-purple-100">
                {esLiderDanza 
                  ? 'Como líder de danza, puedes gestionar videos, estados y preparar coreografías para los servicios.'
                  : 'Revisa los próximos servicios, actualiza tu estado de preparación y estudia las danzas correspondientes.'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {esLiderDanza && (
                <Link
                  href="/servicios"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Users className="h-5 w-5" />
                  Asignar Danzas
                </Link>
              )}
              <div className="bg-white/20 rounded-lg p-3">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{proximosServicios.length}</div>
                <div className="text-sm text-purple-100">Servicios</div>
              </div>
            </div>
          </div>
        </div>

        {/* Próximo Servicio con ProximoServicioResumen */}
        {proximoServicioCompleto && (
          <ProximoServicioResumen
            proximoServicio={proximoServicioCompleto}
            colorGradiente="from-purple-500 to-pink-600"
            colorAcento="text-purple-600"
            obtenerColorEstado={obtenerColorEstado}
            obtenerTextoEstado={obtenerTextoEstado}
            obtenerTextoRol={obtenerTextoRol}
            esDanza={sesion?.user?.role === 'DANZA'}
            esLiderOAdmin={esLiderDanza}
          />
        )}

        {/* Mis Asignaciones de Danza */}
        {misAsignacionesDanza.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                Mis Asignaciones de Danza
              </h2>
              <p className="text-gray-600 mt-1">Actualiza tu estado de preparación para cada canción</p>
            </div>
            <div className="p-6">
              {errorDanza && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{errorDanza}</p>
                </div>
              )}
              <div className="space-y-4">
                {misAsignacionesDanza.map((asignacion) => (
                  <div key={asignacion.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Music className="h-5 w-5 text-purple-600" />
                          <h3 className="font-bold text-gray-900">{asignacion.cancion.titulo}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">por {asignacion.cancion.artista}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatearFecha(asignacion.programacion.fecha)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatearTipoServicio(asignacion.programacion.tipoServicio)}
                          </div>
                        </div>
                        {asignacion.cancion.videoDanza && (
                          <div className="mt-2">
                            <a
                              href={asignacion.cancion.videoDanza}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium transition-colors"
                            >
                              <Play className="h-3 w-3" />
                              Ver Video de Danza
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {editandoEstadoDanza === asignacion.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={nuevoEstadoDanza}
                              onChange={(e) => setNuevoEstadoDanza(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Seleccionar estado</option>
                              <option value="PENDIENTE">Pendiente</option>
                              <option value="EN_PRACTICA">En Práctica</option>
                              <option value="PREPARADO">Preparado</option>
                              <option value="NECESITA_AYUDA">Necesita Ayuda</option>
                            </select>
                            <button
                              onClick={() => actualizarEstadoPreparacionDanza(asignacion.id)}
                              disabled={actualizandoDanza || !nuevoEstadoDanza}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                            >
                              {actualizandoDanza ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              onClick={() => {
                                setEditandoEstadoDanza(null)
                                setNuevoEstadoDanza('')
                              }}
                              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorEstado(asignacion.estadoPreparacion)}`}>
                              {obtenerTextoEstado(asignacion.estadoPreparacion)}
                            </span>
                            <button
                              onClick={() => setEditandoEstadoDanza(asignacion.id)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Cambiar estado"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Canciones con Videos de Danza */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-600" />
                    Videos de Danza Disponibles
                  </h2>
                  <Link 
                    href="/biblioteca"
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    Ver biblioteca <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {cancionesConVideo.length === 0 ? (
                  <div className="text-center py-8">
                    <Youtube className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hay videos de danza disponibles aún</p>
                  {esLiderDanza && (
                      <p className="text-sm text-gray-400 mt-1">
                        Ve a la biblioteca para agregar videos a las canciones
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cancionesConVideo.map((cancion) => (
                      <div key={cancion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {cancion.titulo}
                          </h4>
                        <p className="text-xs text-gray-600 mb-1">
                            {cancion.artista}
                          </p>
                        {esLiderDanza && cancion.estadoVideoDanza && (
                          <div className="flex items-center gap-2">
                            {editandoVideoEstado === cancion.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={nuevoEstadoVideo}
                                  onChange={(e) => setNuevoEstadoVideo(e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                  <option value="">Seleccionar</option>
                                  <option value="SIN_GRABAR">Sin Grabar</option>
                                  <option value="GRABADO">Grabado</option>
                                  <option value="REGRABAR">Regrabar</option>
                                </select>
                                <button
                                  onClick={() => actualizarEstadoVideo(cancion.id)}
                                  disabled={actualizandoVideo || !nuevoEstadoVideo}
                                  className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                                >
                                  {actualizandoVideo ? '...' : 'OK'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditandoVideoEstado(null)
                                    setNuevoEstadoVideo('')
                                  }}
                                  className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${obtenerColorEstadoVideo(cancion.estadoVideoDanza)}`}>
                                  {obtenerTextoEstadoVideo(cancion.estadoVideoDanza)}
                                </span>
                                <button
                                  onClick={() => setEditandoVideoEstado(cancion.id)}
                                  className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors"
                                  title="Cambiar estado del video"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={cancion.videoDanza}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <Play className="h-3 w-3" />
                          Ver Video
                        </a>
                      </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
        </div>
        </div>
      </div>
    </Layout>
  )
}