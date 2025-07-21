'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Plus, 
  Trash2, 
  Play, 
  ExternalLink, 
  Music, 
  Headphones,
  Youtube,
  Volume2,
  Link as LinkIcon
} from 'lucide-react'
import { useAudioPlayer } from './audio/AudioPlayerContext';

interface RecursoAudio {
  id: string
  tipo: string
  plataforma: string
  url: string
  metadatos?: any
  fechaCreacion: string
}

interface GestorRecursosAudioProps {
  cancionId: string
  recursos: RecursoAudio[]
  onRecursosActualizados: () => void
}

interface FormularioRecurso {
  tipo: string
  plataforma: string
  url: string
  titulo?: string
}

const TIPOS_RECURSO = [
  { value: 'CANCION_ORIGINAL', label: 'Canción Original' },
  { value: 'PISTA_INSTRUMENTAL', label: 'Pista Instrumental' },
  { value: 'PISTA_VOCAL', label: 'Pista Vocal' },
  { value: 'ACORDES', label: 'Acordes/Partituras' }
]

const PLATAFORMAS = [
  { value: 'MP3_LOCAL', label: 'Archivo Local (MP3)', icon: <Headphones className="h-4 w-4" /> },
  { value: 'SPOTIFY', label: 'Spotify', icon: <Music className="h-4 w-4" /> },
  { value: 'YOUTUBE', label: 'YouTube', icon: <Youtube className="h-4 w-4" /> }
]

export default function GestorRecursosAudio({ cancionId, recursos, onRecursosActualizados }: GestorRecursosAudioProps) {
  const { data: session } = useSession()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  
  const [formulario, setFormulario] = useState<FormularioRecurso>({
    tipo: 'CANCION_ORIGINAL',
    plataforma: 'YOUTUBE',
    url: '',
    titulo: ''
  })

  const puedeGestionar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'
  const { setTrack } = useAudioPlayer();

  const manejarCambio = (campo: keyof FormularioRecurso, valor: string) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }))
  }

  const validarURL = (url: string, plataforma: string) => {
    if (!url) return false
    
    switch (plataforma) {
      case 'SPOTIFY':
        return url.includes('spotify.com')
      case 'YOUTUBE':
        return url.includes('youtube.com') || url.includes('youtu.be')
      case 'MP3_LOCAL':
        return url.endsWith('.mp3') || url.startsWith('http') || url.startsWith('/audio/')
      default:
        return true
    }
  }

  const agregarRecurso = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validarURL(formulario.url, formulario.plataforma)) {
      setError('URL no válida para la plataforma seleccionada')
      return
    }

    try {
      setGuardando(true)
      
      const metadatos = formulario.titulo ? { titulo: formulario.titulo } : null
      
      const response = await fetch(`/api/canciones/${cancionId}/recursos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: formulario.tipo,
          plataforma: formulario.plataforma,
          url: formulario.url,
          metadatos
        }),
      })

      if (response.ok) {
        setFormulario({
          tipo: 'CANCION_ORIGINAL',
          plataforma: 'YOUTUBE', 
          url: '',
          titulo: ''
        })
        setMostrarFormulario(false)
        onRecursosActualizados()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al agregar el recurso')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al agregar el recurso')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarRecurso = async (recursoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este recurso?')) return

    try {
      const response = await fetch(`/api/canciones/${cancionId}/recursos/${recursoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onRecursosActualizados()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al eliminar el recurso')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al eliminar el recurso')
    }
  }

  const reproducirRecurso = async (recurso: RecursoAudio) => {
    if (recurso.plataforma === 'MP3_LOCAL') {
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
        title: recurso.metadatos?.titulo || 'Recurso de Audio',
        artist: undefined,
        url,
        cover: undefined
      });
    } else {
      window.open(recurso.url, '_blank');
    }
  }

  const obtenerTextoTipo = (tipo: string) => {
    const tipoEncontrado = TIPOS_RECURSO.find(t => t.value === tipo)
    return tipoEncontrado?.label || tipo
  }

  const obtenerIconoPlataforma = (plataforma: string) => {
    switch (plataforma) {
      case 'MP3_LOCAL': return <Headphones className="h-4 w-4" />
      case 'SPOTIFY': return <Music className="h-4 w-4" />
      case 'YOUTUBE': return <Youtube className="h-4 w-4" />
      default: return <Volume2 className="h-4 w-4" />
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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recursos de Audio</h3>
        {puedeGestionar && (
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Agregar Recurso
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Formulario para agregar recurso */}
      {mostrarFormulario && puedeGestionar && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <form onSubmit={agregarRecurso} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Recurso
                </label>
                <select
                  value={formulario.tipo}
                  onChange={(e) => manejarCambio('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  {TIPOS_RECURSO.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plataforma
                </label>
                <select
                  value={formulario.plataforma}
                  onChange={(e) => manejarCambio('plataforma', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  {PLATAFORMAS.map(plataforma => (
                    <option key={plataforma.value} value={plataforma.value}>
                      {plataforma.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Recurso
              </label>
              <input
                type="url"
                value={formulario.url}
                onChange={(e) => manejarCambio('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formulario.plataforma === 'SPOTIFY' && 'Ej: https://open.spotify.com/track/...'}
                {formulario.plataforma === 'YOUTUBE' && 'Ej: https://www.youtube.com/watch?v=...'}
                {formulario.plataforma === 'MP3_LOCAL' && 'Ej: /audio/cancion.mp3 o https://...'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título (Opcional)
              </label>
              <input
                type="text"
                value={formulario.titulo}
                onChange={(e) => manejarCambio('titulo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Descripción o título específico..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {guardando ? 'Guardando...' : 'Agregar Recurso'}
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de recursos existentes */}
      {recursos.length === 0 ? (
        <div className="text-center py-8">
          <Volume2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No hay recursos de audio disponibles</p>
          {puedeGestionar && (
            <p className="text-gray-400 text-sm">Agrega enlaces de Spotify, YouTube o archivos MP3</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {recursos.map((recurso) => (
            <div key={recurso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {obtenerIconoPlataforma(recurso.plataforma)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${obtenerColorTipo(recurso.tipo)}`}>
                      {obtenerTextoTipo(recurso.tipo)}
                    </span>
                    {recurso.metadatos?.titulo && (
                      <span className="text-sm text-gray-600">
                        {recurso.metadatos.titulo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(recurso.fechaCreacion).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => await reproducirRecurso(recurso)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Reproducir/Abrir"
                >
                  {recurso.plataforma === 'MP3_LOCAL' ? <Play className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                </button>
                
                {session?.user?.role === 'ADMINISTRADOR' && (
                  <button
                    onClick={() => eliminarRecurso(recurso.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Eliminar recurso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 