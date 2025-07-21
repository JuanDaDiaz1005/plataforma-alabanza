'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'
import GestorRecursosMusicales from '@/components/GestorRecursosMusicales'
import { 
  ArrowLeft, 
  Music, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Download,
  Play,
  Edit,
  Trash2,
  MessageSquare,
  Album,
  Volume2,
  ExternalLink,
  Eye
} from 'lucide-react'
import { formatearFecha, formatearDuracion, getReturnUrl, getReturnText } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

interface Cancion {
  id: string
  titulo: string
  artista: string
  album?: string
  duracionSegundos?: number
  letra?: string
  acordes?: string
  tonalidad?: string
  videoDanza?: string
  fechaCreacion: string
  fechaActualizacion?: string
  asignaciones: {
    id: string
    rolCancion: string
    estadoPreparacion: string
    notasPersonales?: string
    usuario: {
      id: string
      nombre: string
      email: string
      rol: string
    }
    programacion: {
      id: string
      fecha: string
      tipoServicio: string
    }
  }[]
  comentarios: {
    id: string
    contenido: string
    fechaCreacion: string
    usuario: {
      id: string
      nombre: string
      rol: string
    }
  }[]
  recursosAudio: {
    id: string
    tipo: string
    plataforma: string
    url: string
    metadatos?: string
    activo: boolean
    fechaCreacion: string
  }[]
}

export default function DetalleCancion({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [cancion, setCancion] = useState<Cancion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [mostrarEliminar, setMostrarEliminar] = useState(false)

  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  const searchParams = useSearchParams()
  const fromProgramacion = searchParams.get('from') === 'programacion'
  const programacionId = searchParams.get('id')
  const fromBiblioteca = searchParams.get('from') === 'biblioteca'
  const fromAsignaciones = searchParams.get('from') === 'asignaciones'
  const fromCantanteDashboard = searchParams.get('from') === 'cantante-dashboard'

  // Función para obtener la URL de retorno
  const getReturnUrl = () => {
    if (fromProgramacion && programacionId) {
      return `/programacion/${programacionId}`
    }
    if (fromBiblioteca) {
      return '/biblioteca'
    }
    if (fromAsignaciones) {
      return '/canciones'
    }
    if (fromCantanteDashboard) {
      return '/cantante/dashboard'
    }
    return '/canciones'
  }

  // Función para obtener el texto del botón de volver
  const getReturnText = () => {
    if (fromProgramacion && programacionId) {
      return 'Volver a Programación'
    }
    if (fromBiblioteca) {
      return 'Volver a Biblioteca'
    }
    if (fromAsignaciones) {
      return 'Volver a Asignaciones'
    }
    if (fromCantanteDashboard) {
      return 'Volver al Dashboard'
    }
    return 'Volver a Canciones'
  }

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams?.id) {
      cargarCancion()
    }
  }, [resolvedParams])

  const cargarCancion = async () => {
    if (!resolvedParams?.id) return
    
    try {
      setCargando(true)
      const response = await fetch(`/api/canciones/${resolvedParams.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Canción no encontrada')
        }
        throw new Error('Error al cargar la canción')
      }
      
      const data = await response.json()
      setCancion(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  const eliminarCancion = async () => {
    if (!cancion) return
    
    setEliminando(true)
    try {
      const response = await fetch(`/api/canciones/${cancion.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la canción')
      }

      router.push('/canciones')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setEliminando(false)
      setMostrarEliminar(false)
    }
  }

  // Permisos
  const puedeEditar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'
  const puedeEliminar = session?.user?.role === 'ADMINISTRADOR'
  const puedeGestionarVideoDanza = session?.user?.role === 'LIDER_DANZA'
  const esRolDanza = session?.user?.role === 'DANZA' || session?.user?.role === 'LIDER_DANZA'

  if (cargando) {
    return (
      <Layout titulo="Cargando...">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout titulo="Error">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/canciones" className="text-blue-600 hover:text-blue-500">
            ← Volver a Canciones
          </Link>
        </div>
      </Layout>
    )
  }

  if (!cancion) {
    return (
      <Layout titulo="Canción no encontrada">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">La canción solicitada no existe</p>
          <Link href="/canciones" className="text-blue-600 hover:text-blue-500">
            ← Volver a Canciones
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo={cancion.titulo}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={getReturnUrl(searchParams)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">{cancion.titulo}</h1>
              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">por {cancion.artista}</span>
            </div>
          </div>
          <Link href={`/canciones/${cancion.id}/editar`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold shadow transition">
            <Edit className="h-5 w-5" />
            Editar
          </Link>
        </div>

        {/* Información básica */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Music className="h-5 w-5" />
            Información General
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Artista</p>
              <p className="font-medium text-gray-900">{cancion.artista}</p>
            </div>
            
            {cancion.album && (
              <div>
                <p className="text-sm text-gray-500">Álbum</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Album className="h-4 w-4" />
                  {cancion.album}
                </p>
              </div>
            )}
            
            {cancion.duracionSegundos && (
              <div>
                <p className="text-sm text-gray-500">Duración</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatearDuracion(cancion.duracionSegundos)}
                </p>
              </div>
            )}
            
            {cancion.tonalidad && (
              <div>
                <p className="text-sm text-gray-500">Tonalidad</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Volume2 className="h-4 w-4" />
                  {cancion.tonalidad}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Fecha de creación</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatearFecha(cancion.fechaCreacion)}
              </p>
            </div>

            {cancion.fechaActualizacion && (
              <div>
                <p className="text-sm text-gray-500">Última actualización</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatearFecha(cancion.fechaActualizacion)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Video de danza */}
        {(cancion.videoDanza && esRolDanza) && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-purple-600" />
              Video de Danza
            </h2>
            <div className="space-y-3">
              <a
                href={cancion.videoDanza}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver video en YouTube
              </a>
            </div>
          </div>
        )}

        {/* Letra */}
        {cancion.letra && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Letra
            </h2>
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg font-mono text-sm">
              {cancion.letra}
            </div>
          </div>
        )}

        {/* Acordes */}
        {cancion.acordes && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Music className="h-5 w-5" />
              Acordes
            </h2>
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg font-mono text-sm">
              {cancion.acordes}
            </div>
          </div>
        )}

        {/* Asignaciones recientes */}
        {cancion.asignaciones.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Asignaciones Recientes ({cancion.asignaciones.length})
            </h2>
            <div className="space-y-3">
              {cancion.asignaciones.slice(0, 5).map((asignacion) => (
                <div key={asignacion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{asignacion.usuario.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {asignacion.rolCancion.replace('_', ' ')} • {formatearFecha(asignacion.programacion.fecha)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      asignacion.estadoPreparacion === 'PRACTICANDO' ? 'bg-yellow-100 text-yellow-700' :
                      asignacion.estadoPreparacion === 'LISTO' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {asignacion.estadoPreparacion.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recursos Musicales */}
        <GestorRecursosMusicales 
          cancionId={cancion.id}
          puedeGestionar={puedeEditar}
          cancionTitulo={cancion.titulo}
          cancionArtista={cancion.artista}
          onRecursosActualizados={cargarCancion}
        />

        {/* Comentarios */}
        {cancion.comentarios.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comentarios ({cancion.comentarios.length})
            </h2>
            <div className="space-y-4">
              {cancion.comentarios.map((comentario) => (
                <div key={comentario.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{comentario.usuario.nombre}</p>
                    <p className="text-sm text-gray-500">{formatearFecha(comentario.fechaCreacion)}</p>
                  </div>
                  <p className="text-gray-700">{comentario.contenido}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {mostrarEliminar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar la canción "{cancion.titulo}"? 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setMostrarEliminar(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={eliminando}
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarCancion}
                  disabled={eliminando}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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