'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

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
}

export default function NuevaProgramacion() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  
  const [formulario, setFormulario] = useState<FormularioProgramacion>({
    fecha: '',
    tipoServicio: 'DOMINGO',
    notas: ''
  })

  // Verificar permisos
  const puedeCrear = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'

  if (!puedeCrear) {
    return (
      <Layout titulo="Nueva Programación">
        <div className="text-center py-12">
          <p className="text-red-600">No tienes permisos para crear programaciones</p>
          <Link href="/servicios" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
            ← Volver a Servicios
          </Link>
        </div>
      </Layout>
    )
  }

  const manejarCambio = (campo: keyof FormularioProgramacion, valor: string) => {
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

      // Validar que la fecha no sea en el pasado
      const fechaSeleccionada = new Date(formulario.fecha + 'T00:00:00')
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      if (fechaSeleccionada < hoy) {
        throw new Error('La fecha no puede ser en el pasado')
      }

      // Preparar datos para envío
      const datosProgramacion = {
        fecha: formulario.fecha + 'T00:00:00.000Z', // Convertir a ISO string
        tipoServicio: formulario.tipoServicio,
        notas: formulario.notas.trim() || null
      }

      const response = await fetch('/api/programaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosProgramacion)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la programación')
      }

      const nuevaProgramacion = await response.json()
      
      // Redirigir a la página de servicios
      router.push('/servicios')
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear la programación')
    } finally {
      setGuardando(false)
    }
  }

  // Formatear fecha mínima (hoy)
  const fechaMinima = new Date().toISOString().split('T')[0]

  return (
    <Layout titulo="Nueva Programación">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/servicios"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Programación</h1>
            <p className="text-gray-600">Crea una nueva programación de servicio</p>
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
                  Fecha del Servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => manejarCambio('fecha', e.target.value)}
                  min={fechaMinima}
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
                href="/programacion"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancelar
              </Link>
              
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Crear Programación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">¿Qué sigue después?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Una vez creada la programación, podrás asignar canciones y cantantes</li>
            <li>• Los cantantes recibirán notificaciones de sus asignaciones</li>
            <li>• Puedes editar la programación hasta el día del servicio</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
} 