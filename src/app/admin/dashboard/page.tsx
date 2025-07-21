'use client'

import Layout from '@/components/Layout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Users, 
  Music, 
  Calendar, 
  PlayCircle, 
  TrendingUp,
  Clock,
  User,
  FileMusic
} from 'lucide-react'
import Link from 'next/link'

interface EstadisticasDashboard {
  totalUsuarios: number
  totalCanciones: number
  programacionesActivas: number
  asignacionesPendientes: number
  proximoServicio?: {
    id: string
    fecha: string
    tipo: string
    canciones: number
  }
}

export default function DashboardAdmin() {
  const { data: session } = useSession()
  const [estadisticas, setEstadisticas] = useState<EstadisticasDashboard | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerEstadisticas()
  }, [])

  const obtenerEstadisticas = async () => {
    try {
      setCargando(true)
      
      // Obtener datos en paralelo
      const [usuariosRes, cancionesRes, programacionesRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/canciones?limite=1000'),
        fetch('/api/programaciones')
      ])

      const [usuariosData, cancionesData, programacionesData] = await Promise.all([
        usuariosRes.json(),
        cancionesRes.json(), 
        programacionesRes.json()
      ])

      // Calcular estadísticas
      const programacionesActivas = programacionesData.programaciones?.filter((p: unknown) => (p as any).activa && new Date((p as any).fecha) >= new Date()).length || 0
      
      let asignacionesPendientes = 0
      let proximoServicio = null

      // Encontrar próximo servicio y contar asignaciones pendientes
      const programacionesFuturas = programacionesData.programaciones?.filter((p: unknown) => 
        (p as any).activa && new Date((p as any).fecha) >= new Date()
      ).sort((a: unknown, b: unknown) => new Date((a as any).fecha).getTime() - new Date((b as any).fecha).getTime()) || []

      if (programacionesFuturas.length > 0) {
        const proxima = programacionesFuturas[0] as any
        proximoServicio = {
          id: proxima.id,
          fecha: new Date(proxima.fecha).toLocaleDateString('es-ES', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          tipo: proxima.tipoServicio,
          canciones: proxima.asignaciones?.length || 0
        }
      }

      // Contar asignaciones pendientes en todas las programaciones futuras
      programacionesFuturas.forEach((prog: unknown) => {
        (prog as any).asignaciones?.forEach((asig: unknown) => {
          if ((asig as any).estadoPreparacion === 'PENDIENTE') {
            asignacionesPendientes++
          }
        })
      })

      setEstadisticas({
        totalUsuarios: usuariosData.usuarios?.length || 0,
        totalCanciones: cancionesData.total || 0,
        programacionesActivas,
        asignacionesPendientes,
        proximoServicio
      })

    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <Layout titulo="Dashboard Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Dashboard Administrador">
      <div className="space-y-8">
        {/* Bienvenida mejorada */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                ¡Bienvenido, {session?.user?.name}!
              </h2>
              <p className="text-indigo-100">
                Aquí tienes un resumen del estado actual de tu equipo de alabanza.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-3">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{estadisticas?.totalUsuarios || 0}</div>
                <div className="text-sm text-indigo-100">Usuarios</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas principales mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Usuarios</p>
                <p className="text-3xl font-bold text-blue-600">{estadisticas?.totalUsuarios}</p>
                <p className="text-sm text-gray-500">Activos</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">Creciendo</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Canciones</p>
                <p className="text-3xl font-bold text-purple-600">{estadisticas?.totalCanciones}</p>
                <p className="text-sm text-gray-500">En repertorio</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <FileMusic className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-purple-600 font-medium">Disponibles</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Programaciones</p>
                <p className="text-3xl font-bold text-green-600">{estadisticas?.programacionesActivas}</p>
                <p className="text-sm text-gray-500">Activas</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">Programadas</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">{estadisticas?.asignacionesPendientes}</p>
                <p className="text-sm text-gray-500">Asignaciones</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-full shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-600 font-medium">Por revisar</span>
            </div>
          </div>
        </div>

        {/* Próximo servicio mejorado */}
        {estadisticas?.proximoServicio && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Próximo Servicio
                </h3>
                <p className="text-sm text-gray-500">Información del próximo evento</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-gray-900 capitalize">
                    {estadisticas.proximoServicio.fecha}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      {estadisticas.proximoServicio.tipo}
                    </span>
                    <span className="text-gray-500 text-sm bg-white px-3 py-1 rounded-full border">
                      {estadisticas.proximoServicio.canciones} canciones
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-full shadow-lg">
                  <PlayCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/canciones/nueva"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Music className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Agregar Canción</p>
                <p className="text-sm text-gray-500">Expandir repertorio</p>
              </div>
            </Link>

            <Link 
                                  href="/servicios"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <Calendar className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Nueva Programación</p>
                <p className="text-sm text-gray-500">Planificar servicio</p>
              </div>
            </Link>

            <Link 
              href="/usuarios"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Users className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Gestionar Usuarios</p>
                <p className="text-sm text-gray-500">Administrar equipo</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
} 