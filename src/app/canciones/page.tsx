'use client'

import Layout from '@/components/Layout'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { 
  Music, 
  Calendar, 
  PlayCircle, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User, 
  Volume2,
  Info,
  ExternalLink
} from 'lucide-react'
import { formatearFecha } from '@/lib/utils'
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext';
import Link from 'next/link'

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

interface AsignacionDanza {
  id: string
  cancion: {
    id: string
    titulo: string
    artista: string
    videoDanza?: string
  }
  programacion: {
    id: string
    fecha: Date | string
    tipoServicio: string
  }
  tipo: string
  fechaCreacion: string
}

export default function CancionesPage() {
  const { data: session } = useSession()
  const { setTrack } = useAudioPlayer();
  const [mensajeCard, setMensajeCard] = useState<{ [key: string]: string }>({});
  const timeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [asignaciones, setAsignaciones] = useState<AsignacionCantante[]>([])
  const [asignacionesDanza, setAsignacionesDanza] = useState<AsignacionDanza[]>([])
  const [cargando, setCargando] = useState(true)
  const [editandoEstado, setEditandoEstado] = useState<string | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  const [actualizando, setActualizando] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Verificar si es usuario de danza
  const esDanza = session?.user?.role === 'DANZA' || session?.user?.role === 'LIDER_DANZA'
  const esCantante = session?.user?.role === 'CANTANTE' || session?.user?.role === 'LIDER_ALABANZA'
  const puedeVerAsignaciones = esDanza || esCantante

  useEffect(() => {
    if (session?.user?.id) {
      obtenerAsignaciones()
    }
  }, [session])

  const obtenerAsignaciones = async () => {
    if (!session?.user?.id) return
    
    try {
      setCargando(true)
      
      if (esDanza) {
        // Para usuarios de danza, obtener asignaciones de danza
        const response = await fetch(`/api/programaciones/danza-asignaciones?usuarioId=${session.user.id}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener asignaciones de danza')
        }
        
        const data = await response.json()
        setAsignacionesDanza(data.asignaciones || [])
      } else {
        // Para cantantes, obtener asignaciones de canciones
        const response = await fetch(`/api/programaciones?cantanteId=${session.user.id}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener asignaciones')
        }
        
        const data = await response.json()
        setAsignaciones(data.asignaciones || [])
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar las asignaciones. Por favor, intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

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

      const asignacion = asignaciones.find(a => a.id === asignacionId)
      if (!asignacion) throw new Error('Asignación no encontrada')

      const response = await fetch(`/api/programaciones/${asignacion.programacion.id}/asignaciones`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asignacionId: asignacionId,
          estadoPreparacion: nuevoEstado
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar estado')
      }

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

  if (!puedeVerAsignaciones) {
    return (
      <Layout titulo="Mis Canciones">
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 text-lg font-semibold">No tienes acceso a esta página.</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (cargando) {
    return (
      <Layout titulo="Mis Canciones">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  const asignacionesPreparadas = asignaciones.filter(a => a.estadoPreparacion === 'PREPARADO').length
  const asignacionesPendientes = asignaciones.filter(a => a.estadoPreparacion !== 'PREPARADO').length
  const totalAsignaciones = esDanza ? asignacionesDanza.length : asignaciones.length

  return (
    <Layout titulo="Mis Canciones">
      <div className="space-y-8">
        {/* Header mejorado */}
        <div className={`rounded-xl p-6 text-white ${
          esDanza 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {esDanza ? 'Mis Canciones de Danza' : 'Mis Canciones Asignadas'}
              </h2>
              <p className={esDanza ? 'text-purple-100' : 'text-green-100'}>
                {esDanza 
                  ? `Tienes ${totalAsignaciones} canciones asignadas para liderar en los próximos servicios.`
                  : `Tienes ${totalAsignaciones} canciones asignadas para los próximos servicios.`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-3">
                <Music className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{totalAsignaciones}</div>
                <div className={`text-sm ${esDanza ? 'text-purple-100' : 'text-green-100'}`}>
                  {esDanza ? 'Asignaciones' : 'Asignaciones'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen rápido mejorado */}
        {!esDanza ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Preparadas</p>
                  <p className="text-3xl font-bold text-green-600">{asignacionesPreparadas}</p>
                  <p className="text-sm text-gray-500">Listas para cantar</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Por Preparar</p>
                  <p className="text-3xl font-bold text-orange-600">{asignacionesPendientes}</p>
                  <p className="text-sm text-gray-500">Necesitan práctica</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-full shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{asignaciones.length}</p>
                  <p className="text-sm text-gray-500">Asignaciones</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg">
                  <Music className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Con Video</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {asignacionesDanza.filter(a => a.cancion.videoDanza).length}
                  </p>
                  <p className="text-sm text-gray-500">Videos disponibles</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg">
                  <PlayCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{asignacionesDanza.length}</p>
                  <p className="text-sm text-gray-500">Asignaciones</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg">
                  <Music className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Próximo</p>
                  <p className="text-3xl font-bold text-green-600">
                    {asignacionesDanza.length > 0 ? 1 : 0}
                  </p>
                  <p className="text-sm text-gray-500">Servicio</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de asignaciones */}
        <div className="bg-white rounded-xl shadow-sm border p-6 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${
              esDanza 
                ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600'
            }`}>
              <Music className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {esDanza ? 'Mis Asignaciones de Danza' : 'Mis Asignaciones'}
              </h3>
              <p className="text-sm text-gray-500">
                {esDanza ? 'Canciones asignadas para liderar' : 'Canciones asignadas para preparar'}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-red-700 text-sm">{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="text-red-700 hover:text-red-900"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {(esDanza ? asignacionesDanza.length === 0 : asignaciones.length === 0) ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Music className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {esDanza ? 'No tienes asignaciones de danza' : 'No tienes asignaciones'}
              </h3>
              <p className="text-gray-600 mb-6">
                {esDanza 
                  ? 'No tienes canciones asignadas para liderar en este momento.'
                  : 'No tienes canciones asignadas en este momento.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
              {/* Asignaciones de cantantes */}
              {!esDanza && asignaciones.map((asignacion) => (
                <div
                  key={asignacion.id}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300 w-full max-w-full min-w-0 overflow-x-hidden mb-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 min-w-0">
                    <div className="flex-1 space-y-4 min-w-0">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-gray-900 text-lg">
                            <Link 
                              href={`/canciones/${asignacion.cancion.id}?from=asignaciones`}
                              className="hover:text-green-600 transition-colors cursor-pointer"
                            >
                              {asignacion.cancion.titulo}
                            </Link>
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

                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto mt-2 lg:mt-0 min-w-0 justify-end">
                      {/* Mensaje contextual sobre el card */}
                      {mensajeCard[asignacion.id] && (
                        <div className="absolute -top-8 left-0 right-0 flex justify-center z-10">
                          <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl border border-yellow-300 shadow text-sm font-semibold">
                            {mensajeCard[asignacion.id]}
                          </span>
                        </div>
                      )}
                      <Link 
                        href={`/canciones/${asignacion.cancion.id}?from=asignaciones`}
                        className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-4 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-green-300 font-semibold shadow-sm hover:shadow-md active:scale-95 min-h-[40px] text-xs sm:text-sm flex-1 sm:flex-none"
                        title="Ver detalles de la canción"
                      >
                        <Info className="h-5 w-5" />
                        <span className="text-xs sm:text-sm font-semibold">Detalles</span>
                      </Link>
                      <button
                        className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-4 text-blue-700 hover:text-white hover:bg-blue-600 rounded-xl border border-blue-200 font-semibold shadow-sm transition-all duration-200 min-h-[40px] text-xs sm:text-sm flex-1 sm:flex-none"
                        title="Ver en YouTube"
                        onClick={async () => {
                          const res = await fetch(`/api/canciones/${asignacion.cancion.id}/recursos`);
                          if (!res.ok) return;
                          const recursos = await res.json();
                          const recursoYT = recursos.find((r: unknown) => (r as any).tipo === 'CANCION_ORIGINAL' && (r as any).plataforma === 'YOUTUBE');
                          if (recursoYT && recursoYT.url) window.open(recursoYT.url, '_blank');
                          else {
                            setMensajeCard(prev => ({ ...prev, [asignacion.id]: 'No hay enlace de YouTube configurado para esta canción.' }));
                            if (timeoutRef.current[asignacion.id]) clearTimeout(timeoutRef.current[asignacion.id]);
                            timeoutRef.current[asignacion.id] = setTimeout(() => {
                              setMensajeCard(prev => ({ ...prev, [asignacion.id]: '' }));
                            }, 3500);
                          }
                        }}
                      >
                        <ExternalLink className="h-5 w-5" />
                        <span className="text-xs sm:text-sm font-semibold">Canción</span>
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-4 text-green-700 hover:text-white hover:bg-green-600 rounded-xl border border-green-200 font-semibold shadow-sm transition-all duration-200 min-h-[40px] text-xs sm:text-sm flex-1 sm:flex-none"
                        title="Reproducir pista instrumental"
                        onClick={async () => {
                          const res = await fetch(`/api/canciones/${asignacion.cancion.id}/recursos`);
                          if (!res.ok) return;
                          const recursos = await res.json();
                          const recurso = recursos.find((r: unknown) => (r as any).tipo === 'PISTA_INSTRUMENTAL' && (r as any).plataforma === 'MP3_LOCAL');
                          if (!recurso) {
                            setMensajeCard(prev => ({ ...prev, [asignacion.id]: 'No hay pista instrumental disponible para esta canción.' }));
                            if (timeoutRef.current[asignacion.id]) clearTimeout(timeoutRef.current[asignacion.id]);
                            timeoutRef.current[asignacion.id] = setTimeout(() => {
                              setMensajeCard(prev => ({ ...prev, [asignacion.id]: '' }));
                            }, 3500);
                            return;
                          }
                          let url = recurso.url;
                          if (url && (url.includes('r2.dev') || url.includes('cloudflarestorage.com'))) {
                            let key = '';
                            if (url.includes('r2.dev')) {
                              const urlParts = url.split('/');
                              const bucketIndex = urlParts.findIndex((part: string) => part.includes('r2.dev'));
                              if (bucketIndex !== -1) {
                                key = urlParts.slice(bucketIndex + 2).join('/');
                              }
                            } else if (url.includes('cloudflarestorage.com')) {
                              const urlParts = url.split('/');
                              const bucketIndex = urlParts.findIndex((part: string) => part.includes('cloudflarestorage.com'));
                              if (bucketIndex !== -1) {
                                key = urlParts.slice(bucketIndex + 2).join('/');
                              }
                            }
                            if (!key) key = url;
                            const signedRes = await fetch(`/api/r2-signed-url?key=${encodeURIComponent(key)}`);
                            if (signedRes.ok) {
                              const { url: signedUrl } = await signedRes.json();
                              url = signedUrl;
                            }
                          }
                          setTrack({
                            id: recurso.id,
                            title: asignacion.cancion.titulo,
                            artist: asignacion.cancion.artista,
                            url,
                            cover: undefined
                          });
                        }}
                      >
                        <Volume2 className="h-5 w-5" />
                        <span className="text-xs sm:text-sm font-semibold">Pista</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Asignaciones de danza */}
              {esDanza && asignacionesDanza.map((asignacion) => (
                <div
                  key={asignacion.id}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-gray-900 text-lg">
                            <Link 
                              href={`/canciones/${asignacion.cancion.id}?from=asignaciones-danza`}
                              className="hover:text-purple-600 transition-colors cursor-pointer"
                            >
                              {asignacion.cancion.titulo}
                            </Link>
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                              💃 Líder de Danza
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {asignacion.cancion.artista}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatearFecha(asignacion.programacion.fecha)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            {asignacion.programacion.tipoServicio}
                          </span>
                          {asignacion.cancion.videoDanza && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              🎥 Video Disponible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                      <Link 
                        href={`/canciones/${asignacion.cancion.id}?from=asignaciones-danza`}
                        className="flex items-center justify-center gap-2 px-6 py-4 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-purple-300 font-semibold shadow-sm hover:shadow-md active:scale-95 min-h-[48px] flex-1 sm:flex-none"
                        title="Ver detalles de la canción"
                      >
                        <Info className="h-5 w-5" />
                        <span className="text-sm font-semibold">Detalles</span>
                      </Link>
                      {asignacion.cancion.videoDanza && (
                        <Link 
                          href={asignacion.cancion.videoDanza}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-6 py-4 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-red-300 font-semibold shadow-sm hover:shadow-md active:scale-95 min-h-[48px] flex-1 sm:flex-none"
                          title="Ver video de danza"
                        >
                          <PlayCircle className="h-5 w-5" />
                          <span className="text-sm font-semibold">Video</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {esDanza ? 'Acciones Rápidas' : 'Recursos de Práctica'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {esDanza ? (
              <>
                <Link 
                  href="/servicios"
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <Calendar className="h-6 w-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Asignar Canciones</p>
                    <p className="text-sm text-gray-500">Ver servicios y asignar danzas</p>
                  </div>
                </Link>

                <Link 
                  href="/biblioteca"
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors"
                >
                  <PlayCircle className="h-6 w-6 text-pink-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Gestionar Videos</p>
                    <p className="text-sm text-gray-500">Agregar videos de danza</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/biblioteca"
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Biblioteca</p>
                    <p className="text-sm text-gray-500">Escuchar canciones completas</p>
                  </div>
                </Link>

                <Link 
                  href="/servicios"
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <Calendar className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Servicios</p>
                    <p className="text-sm text-gray-500">Ver todos los servicios programados</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
} 