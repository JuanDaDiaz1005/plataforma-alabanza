'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { 
  Play, 
  SkipForward, 
  SkipBack, 
  Music,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Mic2,
  Headphones,
  X,
  Plus
} from 'lucide-react'
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext';

interface RecursoAudio {
  id: string
  tipo: string
  plataforma: string
  url: string
  metadatos?: Record<string, object>
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
  const [cargandoAudio, setCargandoAudio] = useState(false)

  // Estado para video de danza
  const [videoEditandoId, setVideoEditandoId] = useState<string | null>(null)
  const [videoDanzaInput, setVideoDanzaInput] = useState('')
  const [guardandoVideo, setGuardandoVideo] = useState(false)

  const cargarCanciones = async () => {
    try {
      setCargando(true)
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        limite: '8',
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
      setError(error instanceof Error ? error.message : 'Error al cargar la biblioteca')
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
      alert(error instanceof Error ? error.message : 'Error al cargar el audio. Por favor, intenta de nuevo.')
    } finally {
      setCargandoAudio(false)
    }
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
              {(session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA') && (
                <Link
                  href="/canciones/nueva"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl ml-4"
                >
                  <Plus className="h-5 w-5" />
                  Registrar Canción
                </Link>
              )}
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
          <div className="text-center py-20">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Music className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron canciones</h3>
            <p className="text-gray-600 mb-6">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {canciones.map((cancion) => (
              <div key={cancion.id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col justify-between min-h-[420px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  {/* Info de la canción */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      <Link 
                        href={`/canciones/${cancion.id}?from=biblioteca`}
                        className="hover:text-purple-600 transition-colors"
                      >
                        {cancion.titulo}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1.5 rounded-lg">
                        <Mic2 className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-gray-600 font-medium">{cancion.artista}</p>
                    </div>
                    {cancion.album && (
                      <p className="text-gray-500 text-sm mb-2">{cancion.album}</p>
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
                  {/* Recursos de audio mejorados */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Music className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Recursos disponibles:</h4>
                    </div>
                    <div className="flex flex-col gap-2">
                      {cancion.recursosAudio.map((recurso) => (
                        <div key={recurso.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                              {obtenerIconoPlataforma(recurso.plataforma)}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${obtenerColorTipo(recurso.tipo)}`}>{obtenerTextoTipo(recurso.tipo)}</span>
                          </div>
                          <div className="flex gap-2">
                            {(recurso.plataforma === 'YOUTUBE' || recurso.plataforma === 'SPOTIFY' && (recurso.tipo !== 'CANCION_ORIGINAL' && recurso.tipo !== 'PISTA_INSTRUMENTAL')) && recurso.url && (
                              <a
                                href={recurso.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-white hover:text-red-600 border transition-colors text-xs font-medium shadow"
                              >
                                <ExternalLink className="h-4 w-4" />
                                {recurso.plataforma === 'YOUTUBE' ? 'Ver en YouTube' : 'Ver en Spotify'}
                              </a>
                            )}
                            {!(recurso.plataforma === 'YOUTUBE' || recurso.plataforma === 'SPOTIFY') && (
                              <button
                                onClick={() => reproducirCancion(cancion, recurso)}
                                disabled={cargandoAudio}
                                className="flex items-center gap-2 px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-white hover:text-blue-600 border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-xs font-medium shadow cursor-pointer"
                              >
                                <Play className="h-3 w-3" />
                                {recurso.plataforma === 'MP3_LOCAL' ? 'Reproducir' : 'Abrir'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Video de danza en la biblioteca, estilo mejorado */}
                  {cancion.videoDanza && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-semibold border border-pink-200">
                        <Play className="h-4 w-4" />
                        Video de Danza
                      </span>
                      <a href={cancion.videoDanza} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium border border-red-200 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        Ver en YouTube
                      </a>
                    </div>
                  )}
                  {session?.user?.role === 'LIDER_DANZA' && (
                    <button
                      className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-xs font-medium border border-purple-200 transition-colors"
                      onClick={() => setVideoEditandoId(cancion.id)}
                    >
                      <Play className="h-4 w-4" />
                      {cancion.videoDanza ? 'Editar Video de Danza' : 'Agregar Video de Danza'}
                    </button>
                  )}
                  {videoEditandoId === cancion.id && (
                    <form
                      className="mt-2 flex gap-2 items-center"
                      onSubmit={async e => {
                        e.preventDefault();
                        setGuardandoVideo(true);
                        const res = await fetch(`/api/canciones/${cancion.id}/video-danza`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ videoDanza: videoDanzaInput })
                        });
                        setGuardandoVideo(false);
                        if (res.ok) {
                          setVideoEditandoId(null);
                          window.location.reload();
                        } else {
                          alert('Error al guardar el video de danza');
                        }
                      }}
                    >
                      <input
                        type="url"
                        required
                        placeholder="URL de YouTube"
                        className="px-3 py-1 border border-gray-300 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-pink-500"
                        value={videoDanzaInput}
                        onChange={e => setVideoDanzaInput(e.target.value)}
                      />
                      <button type="submit" disabled={guardandoVideo} className="px-3 py-1 bg-pink-600 text-white rounded-lg text-xs font-medium shadow hover:bg-pink-700 transition-colors">
                        {guardandoVideo ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button type="button" onClick={() => setVideoEditandoId(null)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-300 hover:bg-gray-200 transition-colors">Cancelar</button>
                    </form>
                  )}
                  {/* Acciones al pie del card */}
                  <div className="flex justify-end items-center mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/canciones/${cancion.id}?from=biblioteca`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold shadow transition"
                    >
                      <Music className="h-4 w-4" />
                      Detalles
                    </Link>
                    {(session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA') && (
                      <button
                        onClick={async () => {
                          if (confirm('¿Estás seguro de eliminar esta canción?')) {
                            const response = await fetch(`/api/canciones/${cancion.id}`, { method: 'DELETE' });
                            if (response.ok) window.location.reload();
                            else alert('Error al eliminar la canción');
                          }
                        }}
                        className="inline-flex items-center gap-2 ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold shadow transition cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 mb-5">
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