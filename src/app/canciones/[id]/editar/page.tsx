'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getReturnUrl, getReturnText } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface FormularioCancion {
  titulo: string
  artista: string
  album: string
  duracionSegundos: string
  letra: string
  acordes: string
  tonalidad: string
}

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
}

export default function EditarCancion({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [cancion, setCancion] = useState<Cancion | null>(null)
  
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  
  const [formulario, setFormulario] = useState<FormularioCancion>({
    titulo: '',
    artista: '',
    album: '',
    duracionSegundos: '',
    letra: '',
    acordes: '',
    tonalidad: ''
  })

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
      
      // Cargar datos en el formulario
      setFormulario({
        titulo: data.titulo || '',
        artista: data.artista || '',
        album: data.album || '',
        duracionSegundos: data.duracionSegundos ? data.duracionSegundos.toString() : '',
        letra: data.letra || '',
        acordes: data.acordes || '',
        tonalidad: data.tonalidad || ''
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  // Verificar permisos
  const puedeEditar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'

  if (!puedeEditar) {
    return (
      <Layout titulo="Editar Canción">
        <div className="text-center py-12">
          <p className="text-red-600">No tienes permisos para editar canciones</p>
          <Link href="/canciones" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
            ← Volver a Canciones
          </Link>
        </div>
      </Layout>
    )
  }

  const manejarCambio = (campo: keyof FormularioCancion, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      // Validaciones básicas
      if (!formulario.titulo.trim() || !formulario.artista.trim()) {
        throw new Error('El título y artista son requeridos')
      }

      // Preparar datos para envío
      const datosCancion = {
        titulo: formulario.titulo.trim(),
        artista: formulario.artista.trim(),
        album: formulario.album.trim() || null,
        duracionSegundos: formulario.duracionSegundos ? parseInt(formulario.duracionSegundos) : null,
        letra: formulario.letra.trim() || null,
        acordes: formulario.acordes.trim() || null,
        tonalidad: formulario.tonalidad.trim() || null
      }

      const response = await fetch(`/api/canciones/${cancion?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosCancion)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la canción')
      }

      const cancionActualizada = await response.json()
      router.push(`/canciones/${cancionActualizada.id}`)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

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

  const searchParams = useSearchParams();

  return (
    <Layout titulo={`Editar: ${cancion.titulo}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={getReturnUrl(searchParams)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Editar: {cancion.titulo}</h1>
              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">por {cancion.artista}</span>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <form onSubmit={manejarSubmit} className="p-6 space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formulario.titulo}
                    onChange={(e) => manejarCambio('titulo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Nombre de la canción"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artista *
                  </label>
                  <input
                    type="text"
                    value={formulario.artista}
                    onChange={(e) => manejarCambio('artista', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Intérprete o compositor"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Álbum
                  </label>
                  <input
                    type="text"
                    value={formulario.album}
                    onChange={(e) => manejarCambio('album', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Nombre del álbum"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (segundos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formulario.duracionSegundos}
                    onChange={(e) => manejarCambio('duracionSegundos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Ej: 240"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tonalidad
                  </label>
                  <input
                    type="text"
                    value={formulario.tonalidad}
                    onChange={(e) => manejarCambio('tonalidad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Ej: C, Em, F#"
                  />
                </div>
              </div>
            </div>

            {/* Contenido musical */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contenido Musical</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Letra
                </label>
                <textarea
                  value={formulario.letra}
                  onChange={(e) => manejarCambio('letra', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
                  placeholder="Letra de la canción..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Usa saltos de línea para separar versos y estribillos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acordes
                </label>
                <textarea
                  value={formulario.acordes}
                  onChange={(e) => manejarCambio('acordes', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
                  placeholder="Progresión de acordes..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Puedes incluir la progresión completa con las posiciones
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                href={`/canciones/${cancion.id}`}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
} 