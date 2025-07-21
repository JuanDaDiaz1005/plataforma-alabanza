'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { getReturnUrl, getReturnText } from '@/lib/utils';

const TIPOS_SERVICIO = [
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'DOMINGO', label: 'Domingo' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'ESPECIAL', label: 'Especial' }
]

interface FormularioProgramacion {
  fecha: string
  tipoServicio: string
  notas: string
  activa: boolean
}

export default function EditarProgramacion() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const programacionId = params?.id as string
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  
  const [formulario, setFormulario] = useState<FormularioProgramacion>({
    fecha: '',
    tipoServicio: 'DOMINGO',
    notas: '',
    activa: true
  })

  const searchParams = useSearchParams();

  // Verificar permisos
  const puedeEditar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'

  // Cargar programación
  const cargarProgramacion = async () => {
    try {
      const response = await fetch(`/api/programaciones/${programacionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Programación no encontrada')
        }
        throw new Error('Error al cargar la programación')
      }

      const programacion = await response.json()
      
      // Convertir fecha ISO a formato input date
      const fechaLocal = new Date(programacion.fecha).toISOString().split('T')[0]
      
      setFormulario({
        fecha: fechaLocal,
        tipoServicio: programacion.tipoServicio,
        notas: programacion.notas || '',
        activa: programacion.activa
      })
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar la programación')
    } finally {
      setCargando(false)
    }
  }

  const manejarCambio = (campo: keyof FormularioProgramacion, valor: string | boolean) => {
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
      if (!formulario.fecha || !formulario.tipoServicio) {
        throw new Error('La fecha y tipo de servicio son requeridos')
      }

      // Preparar datos para envío
      const datosProgramacion = {
        fecha: formulario.fecha + 'T00:00:00.000Z', // Convertir a ISO string
        tipoServicio: formulario.tipoServicio,
        notas: formulario.notas.trim() || null,
        activa: formulario.activa
      }

      const response = await fetch(`/api/programaciones/${programacionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosProgramacion)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la programación')
      }

      // Redirigir a la página de servicios  
      router.push('/servicios')
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar la programación')
    } finally {
      setGuardando(false)
    }
  }

  useEffect(() => {
    if (programacionId) {
      cargarProgramacion()
    }
  }, [programacionId])

  if (!puedeEditar) {
    return (
      <Layout titulo="Editar Programación">
        <div className="text-center py-12">
          <p className="text-red-600">No tienes permisos para editar programaciones</p>
          <Link href={`/programacion/${programacionId}`} className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
            ← Volver a Servicio
          </Link>
        </div>
      </Layout>
    )
  }

  if (cargando) {
    return (
      <Layout titulo="Editar Programación">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (error && !formulario.fecha) {
    return (
      <Layout titulo="Error">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/servicios" className="text-blue-600 hover:text-blue-500">
            ← Volver a Servicios
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Editar Programación">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href={getReturnUrl(searchParams)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Programación</h1>
            <p className="text-gray-600">Modifica los datos de la programación</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => manejarCambio('fecha', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Servicio <span className="text-red-500">*</span>
                </label>
                <select
                  value={formulario.tipoServicio}
                  onChange={(e) => manejarCambio('tipoServicio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  {TIPOS_SERVICIO.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de la Programación
              </label>
              <div className="space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="true"
                    checked={formulario.activa === true}
                    onChange={() => manejarCambio('activa', true)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activa</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="false"
                    checked={formulario.activa === false}
                    onChange={() => manejarCambio('activa', false)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inactiva</span>
                </label>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formulario.notas}
                onChange={(e) => manejarCambio('notas', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="Información adicional sobre la programación, temas especiales, etc."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Link
                href={`/programacion/${programacionId}`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancelar
              </Link>
              
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
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