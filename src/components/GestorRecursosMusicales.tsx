'use client'

import { useState, useEffect } from 'react'
import { 
  Play, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  ExternalLink,
  Guitar,
  Mic,
  Music,
  Headphones,
  Piano,
  Drum,
} from 'lucide-react'
import 'react-h5-audio-player/lib/styles.css'
import { useAudioPlayer } from './audio/AudioPlayerContext';

interface RecursoMusical {
  id: string
  tipo: string
  plataforma: string
  url: string
  titulo?: string
  descripcion?: string
  fechaCreacion: string
  fechaActualizacion: string
}

interface GestorRecursosMusicalesProps {
  cancionId: string
  puedeGestionar: boolean
  cancionTitulo: string
  cancionArtista?: string
  onRecursosActualizados?: () => void
}

interface TipoRecursoConfig {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const TIPOS_RECURSOS = [
  { value: 'CANCION_ORIGINAL', label: 'Canción Original', icon: Music, color: 'blue' },
  { value: 'PISTA_INSTRUMENTAL', label: 'Pista Instrumental', icon: Headphones, color: 'green' },
  { value: 'MULTITRACK', label: 'Multitrack', icon: Music, color: 'purple' },
  { value: 'TUTORIAL_VOCES', label: 'Tutorial de Voces', icon: Mic, color: 'pink' },
  { value: 'TUTORIAL_GUITARRA', label: 'Tutorial de Guitarra', icon: Guitar, color: 'orange' },
  { value: 'TUTORIAL_BAJO', label: 'Tutorial de Bajo', icon: Guitar, color: 'red' },
  { value: 'TUTORIAL_BATERIA', label: 'Tutorial de Batería', icon: Drum, color: 'yellow' },
  { value: 'TUTORIAL_TECLADO', label: 'Tutorial de Teclado', icon: Piano, color: 'indigo' },
  { value: 'TUTORIAL_VIOLIN', label: 'Tutorial de Violín', icon: Music, color: 'cyan' }
]

export default function GestorRecursosMusicales({ 
  cancionId, 
  puedeGestionar, 
  cancionTitulo,
  cancionArtista,
  onRecursosActualizados 
}: GestorRecursosMusicalesProps) {
  const [recursos, setRecursos] = useState<RecursoMusical[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState<{ visible: boolean; recurso: RecursoMusical | null }>({ visible: false, recurso: null })

  const [formulario, setFormulario] = useState({
    tipo: '',
    url: '',
    titulo: '',
    descripcion: ''
  })

  const { setTrack } = useAudioPlayer();

  useEffect(() => {
    cargarRecursos()
  }, [cancionId])

  const cargarRecursos = async () => {
    try {
      setCargando(true)
      const response = await fetch(`/api/canciones/${cancionId}/recursos`)
      
      if (response.ok) {
        const data = await response.json()
        setRecursos(data)
      } else {
        setError('Error al cargar recursos')
      }
    } catch (error) {
      setError('Error al cargar recursos')
    } finally {
      setCargando(false)
    }
  }

  const obtenerConfigTipo = (tipo: string) => {
    return TIPOS_RECURSOS.find(t => t.value === tipo) || TIPOS_RECURSOS[0]
  }

  const obtenerColorClasse = (color: string) => {
    const colores: { [key: string]: string } = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    }
    return colores[color] || colores.blue
  }

  const limpiarFormulario = () => {
    setFormulario({
      tipo: '',
      url: '',
      titulo: '',
      descripcion: ''
    })
    setMostrarFormulario(false)
    setEditando(null)
    setError('')
  }

  const iniciarEdicion = (recurso: RecursoMusical) => {
    setFormulario({
      tipo: recurso.tipo,
      url: recurso.url,
      titulo: recurso.titulo || '',
      descripcion: recurso.descripcion || ''
    })
    setEditando(recurso.id)
    setMostrarFormulario(true)
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formulario.tipo) {
      setError('El tipo de recurso es requerido')
      return
    }
    // Si es pista, solo requiere url (que puede ser la del mp3 subido)
    if ((formulario.tipo === 'PISTA_INSTRUMENTAL' || formulario.tipo === 'CANCION_ORIGINAL') && !formulario.url) {
      setError('Debes subir un archivo mp3 para la pista')
      return
    }
    // Para otros tipos, requiere tipo y url
    if (formulario.tipo !== 'PISTA_INSTRUMENTAL' && formulario.tipo !== 'CANCION_ORIGINAL' && !formulario.url) {
      setError('La URL es requerida')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const url = editando 
        ? `/api/canciones/${cancionId}/recursos/${editando}`
        : `/api/canciones/${cancionId}/recursos`
      const method = editando ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formulario)
      })
      if (response.ok) {
        await cargarRecursos()
        limpiarFormulario()
        onRecursosActualizados?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar el recurso')
      }
    } catch (error) {
      setError('Error al guardar el recurso')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarRecurso = async (recursoId: string) => {
    setModalEliminar({ visible: true, recurso: recursos.find(r => r.id === recursoId) || null })
  }

  const confirmarEliminacion = async () => {
    if (!modalEliminar.recurso) return
    try {
      // Limpiar el estado antes de recargar
      setRecursos([])
      const response = await fetch(`/api/canciones/${cancionId}/recursos/${modalEliminar.recurso.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await cargarRecursos()
        onRecursosActualizados?.()
        setModalEliminar({ visible: false, recurso: null })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar el recurso')
      }
    } catch (error) {
      setError('Error al eliminar el recurso')
    }
  }

  // Filtrar solo los recursos permitidos para la biblioteca
  const recursosFiltrados = recursos.filter(r => r.tipo === 'CANCION_ORIGINAL' || r.tipo === 'PISTA_INSTRUMENTAL')

  // Agrupar recursos por tipo
  const recursosAgrupados = recursosFiltrados.reduce((grupos: Record<string, { config: TipoRecursoConfig; recursos: RecursoMusical[] }>, recurso: RecursoMusical) => {
    const config = obtenerConfigTipo(recurso.tipo) as TipoRecursoConfig;
    if (!grupos[recurso.tipo]) {
      grupos[recurso.tipo] = {
        config,
        recursos: []
      };
    }
    grupos[recurso.tipo].recursos.push(recurso);
    return grupos;
  }, {} as Record<string, { config: TipoRecursoConfig; recursos: RecursoMusical[] }>)

  const reproducirRecurso = async (recurso: RecursoMusical) => {
    let url = recurso.url;
    if (url && (url.includes('r2.dev') || url.includes('cloudflarestorage.com') || url.includes('pistas-jalal'))) {
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
      } else if (url.includes('pistas-jalal')) {
        const urlParts = url.split('/');
        const bucketIndex = urlParts.findIndex((part: string) => part === 'pistas-jalal');
        if (bucketIndex !== -1) {
          key = urlParts.slice(bucketIndex + 1).join('/');
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
      title: recurso.titulo || cancionTitulo,
      artist: cancionArtista,
      url,
      cover: undefined
    });
  };

  const puedeSubirArchivo = puedeGestionar

  if (cargando) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Play className="h-5 w-5" />
          Recursos Musicales ({recursosFiltrados.length})
        </h2>
        
        {puedeGestionar && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Agregar Recurso
          </button>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
          <h3 className="font-medium text-gray-900 mb-4">
            {editando ? 'Editar Recurso' : 'Nuevo Recurso'}
          </h3>
          
          <form onSubmit={manejarSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Recurso *
                </label>
                <select
                  value={formulario.tipo}
                  onChange={(e) => setFormulario(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {TIPOS_RECURSOS.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) => setFormulario(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ej: Guitarra Lead, Voces Principales"
                />
              </div>
            </div>

            {formulario.tipo !== 'PISTA_INSTRUMENTAL' && formulario.tipo !== 'CANCION_ORIGINAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de YouTube *
                </label>
                <input
                  type="url"
                  value={formulario.url}
                  onChange={e => setFormulario(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required={formulario.tipo !== 'PISTA_INSTRUMENTAL' && formulario.tipo !== 'CANCION_ORIGINAL'}
                  className="block w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formulario.descripcion}
                onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={2}
                placeholder="Descripción adicional del recurso..."
              />
            </div>

            {(formulario.tipo === 'PISTA_INSTRUMENTAL' || formulario.tipo === 'CANCION_ORIGINAL') && puedeSubirArchivo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo MP3
                </label>
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setGuardando(true)
                      setError('')
                      try {
                        const formData = new FormData()
                        formData.append('file', file)
                        // POST directo al backend
                        const res = await fetch('https://iccap-canciones-cargar-audios.onrender.com/upload-audio', {
                          method: 'POST',
                          body: formData
                        })
                        const data = await res.json()
                        if (!res.ok || !data.url) {
                          setError(data.error || 'Error al subir el archivo')
                          setGuardando(false)
                          return
                        }
                        setFormulario(f => ({ ...f, url: data.url }))
                      } catch {
                        setError('Error al subir el archivo')
                      } finally {
                        setGuardando(false)
                      }
                    }
                  }}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={limpiarFormulario}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {guardando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de recursos agrupados */}
      {Object.keys(recursosAgrupados).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(recursosAgrupados).map(([tipoKey, grupo]) => (
            <div key={tipoKey} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <grupo.config.icon className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">{grupo.config.label}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${obtenerColorClasse(grupo.config.color)}`}>
                  {grupo.recursos.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {grupo.recursos.map((recurso) => (
                  <div key={recurso.id} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {recurso.titulo || grupo.config.label}
                        </h4>
                      </div>
                      {recurso.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">{recurso.descripcion}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Agregado: {new Date(recurso.fechaCreacion).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Solo mostrar el botón Ver para recursos que no sean MP3_LOCAL */}
                      
                      {recurso.plataforma === 'MP3_LOCAL' && typeof recurso.url === 'string' && recurso.url && (
                        <button
                          className="flex my-2 p-2 items-center text-white bg-green-600 hover:bg-white hover:text-green-600 border rounded-lg transition-colors text-sm cursor-pointer"
                          onClick={async () => await reproducirRecurso(recurso)}
                          title="Reproducir"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Reproducir
                        </button>
                      )}
                      {recurso.plataforma !== 'MP3_LOCAL' && (
                        <a
                          href={recurso.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-white hover:text-red-500 border transition-colors text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver en Youtube
                        </a>
                      )}
                      
                      {puedeGestionar && (
                        <>
                          <button
                            onClick={() => iniciarEdicion(recurso)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminarRecurso(recurso.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No hay recursos musicales disponibles</p>
          {puedeGestionar && (
            <p className="text-gray-400 text-sm">
              Haz clic en Agregar Recurso para comenzar
            </p>
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {modalEliminar.visible && modalEliminar.recurso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar el recurso <span className="font-bold">{modalEliminar.recurso.titulo || obtenerConfigTipo(modalEliminar.recurso.tipo).label}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalEliminar({ visible: false, recurso: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}