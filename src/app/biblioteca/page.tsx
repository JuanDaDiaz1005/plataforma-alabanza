'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Music,
  Search,
  Filter,
  ExternalLink,
  Download,
  Clock,
  Mic2,
  Headphones,
  Youtube,
  Edit,
  Save,
  X,
  Plus,
  RotateCcw
} from 'lucide-react'
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext';

interface RecursoAudio {
  id: string
  tipo: string
  plataforma: string
  url: string
  metadatos?: unknown
  fechaCreacion: string
}

interface CancionBiblioteca {
  id: string
  titulo: string
  artista: string
  album?: string
  duracionSegundos?: number
  letra?: string
  acordes?: string
  tonalidad?: string
  videoDanza?: string
  recursosAudio: RecursoAudio[]
  _count: {
    asignaciones: number
    comentarios: number
  }
}

interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  currentSong: CancionBiblioteca | null
  currentResource: RecursoAudio | null
}

export default function BibliotecaPage() {
  const { data: session } = useSession();
  const { setTrack } = useAudioPlayer();
  
  const [canciones, setCanciones] = useState<CancionBiblioteca[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  
  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [plataformaFiltro, setPlataformaFiltro] = useState('')
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  
  // Estado del reproductor
  const [player, setPlayer] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    currentSong: null,
    currentResource: null
  })
  const [isLoop, setIsLoop] = useState(false)
  const [cargandoAudio, setCargandoAudio] = useState(false)

  // Estados para gestión de videos de danza
  const [editandoVideo, setEditandoVideo] = useState<string | null>(null)
  const [nuevoVideoUrl, setNuevoVideoUrl] = useState('')
  const [guardandoVideo, setGuardandoVideo] = useState(false)

  // Verificar permisos de danza
  const esLiderDanza = session?.user?.role === 'LIDER_DANZA'

  const cargarCanciones = async () => {
    try {
      setCargando(true)
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        limite: '12',
        ...(busqueda && { busqueda })
      })

      const response = await fetch(`/api/canciones?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCanciones(data.canciones || [])
        setTotalPaginas(data.totalPages || 1)
      } else {
        setError(data.error || 'Error al cargar la biblioteca')
      }
    } catch (error) {
      console.error('Error al cargar biblioteca:', error)
      setError('Error al cargar la biblioteca')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarCanciones()
  }, [paginaActual, busqueda, tipoFiltro, plataformaFiltro])

  // Funciones del reproductor
  const reproducirCancion = async (cancion: CancionBiblioteca, recurso: RecursoAudio) => {
    if (recurso.plataforma !== 'MP3_LOCAL') {
      // Para Spotify y YouTube, abrir en nueva ventana
      window.open(recurso.url, '_blank')
      return
    }

    // Para archivos MP3 locales, obtener URL firmada primero
    setCargandoAudio(true)
    try {
      // Extraer la key del archivo a partir de la url de Cloudflare
      let key = ''
      
      // Intentar diferentes formatos de URL
      if (recurso.url.includes('r2.dev')) {
        // Formato: https://pub-xxx.r2.dev/bucket-name/pistas/archivo.mp3
        const urlParts = recurso.url.split('/')
        const bucketIndex = urlParts.findIndex(part => part.includes('r2.dev'))
        if (bucketIndex !== -1) {
          key = urlParts.slice(bucketIndex + 2).join('/')
        }
      } else if (recurso.url.includes('cloudflarestorage.com')) {
        // Formato alternativo: https://xxx.cloudflarestorage.com/bucket-name/pistas/archivo.mp3
        const urlParts = recurso.url.split('/')
        const bucketIndex = urlParts.findIndex(part => part.includes('cloudflarestorage.com'))
        if (bucketIndex !== -1) {
          key = urlParts.slice(bucketIndex + 2).join('/')
        }
      }
      
      // Si no se pudo extraer la key, usar la URL completa como fallback
      if (!key) {
        console.warn('No se pudo extraer la key, usando URL completa')
        key = recurso.url
      }
      
      const response = await fetch(`/api/r2-signed-url?key=${encodeURIComponent(key)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al obtener URL firmada')
      }
      
      const { url: signedUrl } = await response.json()
      
      setTrack({
        id: recurso.id,
        title: cancion.titulo,
        artist: cancion.artista,
        url: signedUrl,
        cover: undefined
      });
    } catch (error) {
      console.error('Error al obtener URL firmada:', error)
      alert('Error al cargar el audio. Por favor, intenta de nuevo.')
    } finally {
      setCargandoAudio(false)
    }
  }

  const togglePlayPause = () => {
    // This function is now handled by the global audio player context
  }

  const cambiarVolumen = (nuevoVolumen: number) => {
    // This function is now handled by the global audio player context
  }

  const toggleMute = () => {
    // This function is now handled by the global audio player context
  }

  // Handlers de eventos del audio
  const handleTimeUpdate = () => {
    // This function is now handled by the global audio player context
  }

  const handleLoadedMetadata = () => {
    // This function is now handled by the global audio player context
  }

  const handleEnded = () => {
    // This function is now handled by the global audio player context
  }

  const formatearDuracion = (segundos: number) => {
    if (isNaN(segundos)) return '0:00'
    const minutos = Math.floor(segundos / 60)
    const segs = Math.floor(segundos % 60)
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  const obtenerTextoTipo = (tipo: string) => {
    switch (tipo) {
      case 'CANCION_ORIGINAL': return 'Original'
      case 'PISTA_INSTRUMENTAL': return 'Pista'
      case 'PISTA_VOCAL': return 'Vocal'
      case 'ACORDES': return 'Acordes'
      default: return tipo
    }
  }

  const obtenerIconoPlataforma = (plataforma: string) => {
    switch (plataforma) {
      case 'MP3_LOCAL': return <Headphones className="h-4 w-4" />
      case 'SPOTIFY': return <Music className="h-4 w-4" />
      case 'YOUTUBE': return <Play className="h-4 w-4" />
      default: return <Music className="h-4 w-4" />
    }
  }

  // Funciones para gestionar videos de danza
  const manejarEdicionVideo = (cancionId: string, videoActual?: string) => {
    setEditandoVideo(cancionId)
    setNuevoVideoUrl(videoActual || '')
  }

  const cancelarEdicionVideo = () => {
    setEditandoVideo(null)
    setNuevoVideoUrl('')
  }

  const guardarVideoDanza = async (cancionId: string) => {
    if (!nuevoVideoUrl.trim() || guardandoVideo) return

    // Validar URL de YouTube
    if (!nuevoVideoUrl.includes('youtube.com') && !nuevoVideoUrl.includes('youtu.be')) {
      alert('Por favor ingresa una URL válida de YouTube')
      return
    }

    try {
      setGuardandoVideo(true)
      
      const response = await fetch(`/api/canciones/${cancionId}/video-danza`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoDanza: nuevoVideoUrl.trim() })
      })

      if (response.ok) {
        // Actualizar el estado local
        setCanciones(prev => prev.map(cancion => 
          cancion.id === cancionId 
            ? { ...cancion, videoDanza: nuevoVideoUrl.trim() }
            : cancion
        ))
        cancelarEdicionVideo()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar el video de danza')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el video de danza')
    } finally {
      setGuardandoVideo(false)
    }
  }

  const eliminarVideoDanza = async (cancionId: string) => {
    if (!confirm('¿Estás seguro de eliminar el video de danza?')) return

    try {
      const response = await fetch(`/api/canciones/${cancionId}/video-danza`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Actualizar el estado local
        setCanciones(prev => prev.map(cancion => 
          cancion.id === cancionId 
            ? { ...cancion, videoDanza: undefined }
            : cancion
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar el video de danza')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el video de danza')
    }
  }

  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'CANCION_ORIGINAL': return 'bg-blue-100 text-blue-800'
      case 'PISTA_INSTRUMENTAL': return 'bg-green-100 text-green-800'
      case 'PISTA_VOCAL': return 'bg-purple-100 text-purple-800'
      case 'ACORDES': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout titulo="Biblioteca Musical">
      <div className="space-y-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Biblioteca Musical</h1>
              <p className="text-purple-100">
                Explora nuestro repertorio completo con recursos de audio, letras y acordes
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-3">
                <Headphones className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{canciones.length}</div>
                <div className="text-sm text-purple-100">Canciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Filtros de Búsqueda
              </h3>
              <p className="text-sm text-gray-500">Encuentra exactamente lo que necesitas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar canción
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título o artista..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setPaginaActual(1)
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de recurso
              </label>
              <select
                value={tipoFiltro}
                onChange={(e) => {
                  setTipoFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
              >
                <option value="">Todos los tipos</option>
                <option value="CANCION_ORIGINAL">Original</option>
                <option value="PISTA_INSTRUMENTAL">Pista</option>
                <option value="PISTA_VOCAL">Vocal</option>
                <option value="ACORDES">Acordes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma
              </label>
              <select
                value={plataformaFiltro}
                onChange={(e) => {
                  setPlataformaFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
              >
                <option value="">Todas las plataformas</option>
                <option value="MP3_LOCAL">Archivos locales</option>
                <option value="SPOTIFY">Spotify</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Lista de canciones mejorada */}
        {cargando ? (
          <div className="flex justify-center items-center py-16">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-24 h-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : canciones.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Music className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron canciones</h3>
            <p className="text-gray-600 mb-6">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canciones.map((cancion) => (
              <div key={cancion.id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                
                <div className="p-6">
                  {/* Info de la canción */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      <Link 
                        href={`/canciones/${cancion.id}?from=biblioteca`}
                        className="hover:text-purple-600 transition-colors"
                      >
                        {cancion.titulo}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1.5 rounded-lg">
                        <Mic2 className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-gray-600 font-medium">{cancion.artista}</p>
                    </div>
                    {cancion.album && (
                      <p className="text-gray-500 text-sm mb-3">{cancion.album}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {cancion.duracionSegundos && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                          <Clock className="h-4 w-4 text-purple-600" />
                          {formatearDuracion(cancion.duracionSegundos)}
                        </div>
                      )}
                      {cancion.tonalidad && (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-medium">
                          {cancion.tonalidad}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recursos de audio */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1.5 rounded-lg">
                        <Music className="h-3 w-3 text-white" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Recursos disponibles:</h4>
                    </div>
                    <div className="space-y-2">
                      {cancion.recursosAudio.map((recurso) => (
                        <div key={recurso.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                {obtenerIconoPlataforma(recurso.plataforma)}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${obtenerColorTipo(recurso.tipo)}`}>
                                {obtenerTextoTipo(recurso.tipo)}
                              </span>
                            </div>
                            <button
                              onClick={() => reproducirCancion(cancion, recurso)}
                              disabled={cargandoAudio}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl"
                            >
                                <Play className="h-3 w-3" />
                              {recurso.plataforma === 'MP3_LOCAL' ? 'Reproducir' : 'Abrir'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Video de Danza - Solo visible para roles de danza */}
                  {(session?.user?.role === 'DANZA' || session?.user?.role === 'LIDER_DANZA') && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-1.5 rounded-lg">
                            <Youtube className="h-3 w-3 text-white" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900">Video de Danza</h4>
                        </div>
                        {esLiderDanza && !editandoVideo && (
                          <button
                            onClick={() => manejarEdicionVideo(cancion.id, cancion.videoDanza)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title={cancion.videoDanza ? 'Editar video' : 'Agregar video'}
                          >
                            {cancion.videoDanza ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      
                      {editandoVideo === cancion.id ? (
                        <div className="space-y-3">
                          <input
                            type="url"
                            value={nuevoVideoUrl}
                            onChange={(e) => setNuevoVideoUrl(e.target.value)}
                            placeholder="URL de YouTube para el video de danza"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white transition-all duration-200"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => guardarVideoDanza(cancion.id)}
                              disabled={guardandoVideo || !nuevoVideoUrl.trim()}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-medium"
                            >
                              <Save className="h-4 w-4" />
                              {guardandoVideo ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              onClick={cancelarEdicionVideo}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm font-medium"
                            >
                              <X className="h-4 w-4" />
                              Cancelar
                            </button>
                            {cancion.videoDanza && (
                              <button
                                onClick={() => eliminarVideoDanza(cancion.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 text-sm font-medium"
                              >
                                <X className="h-4 w-4" />
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {cancion.videoDanza ? (
                            <a
                              href={cancion.videoDanza}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg hover:from-red-100 hover:to-pink-100 transition-all duration-300 text-sm font-medium"
                            >
                              <Youtube className="h-4 w-4 text-red-600" />
                              <span className="text-red-700">Ver Video de Danza</span>
                              <ExternalLink className="h-3 w-3 text-red-600" />
                            </a>
                          ) : (
                            <p className="text-gray-500 text-sm italic bg-gray-50 rounded-lg p-3">
                              {esLiderDanza ? 'Haz clic en + para agregar un video de danza' : 'Sin video de danza disponible'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            
            <span className="text-gray-600">
              Página {paginaActual} de {totalPaginas}
            </span>
            
            <button
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
} 