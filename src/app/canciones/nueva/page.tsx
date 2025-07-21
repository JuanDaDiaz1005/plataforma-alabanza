'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'



interface FormularioCancion {
  titulo: string
  artista: string
  album: string
  duracionSegundos: string
  letra: string
  acordes: string
  tonalidad: string
}

export default function NuevaCancion() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  
  const [formulario, setFormulario] = useState<FormularioCancion>({
    titulo: '',
    artista: '',
    album: '',
    duracionSegundos: '',
    letra: '',
    acordes: '',
    tonalidad: ''
  })



  // Verificar permisos
  const puedeCrear = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'

  if (!puedeCrear) {
    return (
      <Layout titulo="Nueva Canción">
        <div className="text-center py-12">
          <p className="text-red-600">No tienes permisos para crear canciones</p>
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
    setCargando(true)

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

      const response = await fetch('/api/canciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosCancion)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la canción')
      }

      const nuevaCancion = await response.json()
      router.push(`/canciones/${nuevaCancion.id}`)

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Layout titulo="Nueva Canción">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/canciones"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Canción</h1>
            <p className="text-gray-600">Agrega una nueva canción al repertorio</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={manejarSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
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
                  Artista <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Álbum
                </label>
                <input
                  type="text"
                  value={formulario.album}
                  onChange={(e) => manejarCambio('album', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Nombre del álbum o producción"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (segundos)
                </label>
                <input
                  type="number"
                  value={formulario.duracionSegundos}
                  onChange={(e) => manejarCambio('duracionSegundos', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="180"
                  min="0"
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
                  placeholder="C, Am, G, etc."
                />
              </div>
            </div>



            {/* Letra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Letra
              </label>
              <textarea
                value={formulario.letra}
                onChange={(e) => manejarCambio('letra', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={8}
                placeholder="Escribe aquí la letra de la canción..."
              />
            </div>

            {/* Acordes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acordes
              </label>
              <textarea
                value={formulario.acordes}
                onChange={(e) => manejarCambio('acordes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={6}
                placeholder="Progresión de acordes, tablatura, etc..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link
                href="/canciones"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={cargando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cargando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Canción
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
} 
