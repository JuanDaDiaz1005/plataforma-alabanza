'use client'

import Layout from '@/components/Layout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Music, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle,
  Plus,
  User,
  ChevronRight,
  Mic,
  AlertCircle
} from 'lucide-react'

interface EstadisticasLider {
  cancionesRepertorio: number
  programacionesActivas: number
  cantantesActivos: number
}

interface ProximoServicio {
  id: string
  fecha: string
  tipoServicio: string
  asignaciones: {
    id: string
    cancion: {
      titulo: string
      artista: string
    }
    usuario: {
      nombre: string
      rangoVocal?: string
    }
    rolCancion: string
    estadoPreparacion: string
  }[]
  totalAsignaciones: number
  asignacionesPendientes: number
}

interface MiembroEquipo {
  id: string
  nombre: string
  rangoVocal?: string
  cancionesPorEstado: {
    preparado: number
    enPractica: number
    pendiente: number
    necesitaAyuda: number
  }
}

export default function DashboardLider() {
  const { data: session } = useSession()
  const [estadisticas, setEstadisticas] = useState<EstadisticasLider | null>(null)
  const [proximoServicio, setProximoServicio] = useState<ProximoServicio | null>(null)
  const [equipoEstado, setEquipoEstado] = useState<MiembroEquipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    try {
      setCargando(true)
      
      // Cargar estadísticas básicas
      const [cancionesRes, programacionesRes, usuariosRes] = await Promise.all([
        fetch('/api/canciones?limite=1000'),
        fetch('/api/programaciones'),
        fetch('/api/usuarios?role=CANTANTE,LIDER_ALABANZA')
      ])

      const cancionesData = await cancionesRes.json()
      const programacionesData = await programacionesRes.json()
      const usuariosData = await usuariosRes.json()

      // Procesar estadísticas
      setEstadisticas({
        cancionesRepertorio: cancionesData.total || cancionesData.canciones?.length || 0,
        programacionesActivas: programacionesData.total || programacionesData.programaciones?.length || 0,
        cantantesActivos: usuariosData.total || usuariosData.usuarios?.length || 0
      })

      // Buscar próximo servicio
      const programaciones = programacionesData.programaciones || []
      const hoy = new Date()
      const proximasProgramaciones = programaciones
        .filter((p: unknown) => new Date(p.fecha) >= hoy)
        .sort((a: unknown, b: unknown) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

      if (proximasProgramaciones.length > 0) {
        const proxima = proximasProgramaciones[0]
        
        // Cargar asignaciones del próximo servicio
        const asignacionesRes = await fetch(`/api/programaciones/${proxima.id}/asignaciones`)
        const asignacionesData = await asignacionesRes.json()
        
        const asignaciones = asignacionesData.asignaciones || []
        const asignacionesPendientes = asignaciones.filter((a: unknown) => a.estadoPreparacion === 'PENDIENTE').length

        setProximoServicio({
          id: proxima.id,
          fecha: new Date(proxima.fecha).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          tipoServicio: proxima.tipoServicio,
          asignaciones,
          totalAsignaciones: asignaciones.length,
          asignacionesPendientes
        })

        // Procesar estado del equipo
        const equipoMap = new Map()
        asignaciones.forEach((asignacion: unknown) => {
          const usuarioId = asignacion.usuario.id
          if (!equipoMap.has(usuarioId)) {
            equipoMap.set(usuarioId, {
              id: usuarioId,
              nombre: asignacion.usuario.nombre,
              rangoVocal: asignacion.usuario.rangoVocal,
              cancionesPorEstado: {
                preparado: 0,
                enPractica: 0,
                pendiente: 0,
                necesitaAyuda: 0
              }
            })
          }
          
          const miembro = equipoMap.get(usuarioId)
          const estado = asignacion.estadoPreparacion.toLowerCase()
          if (estado === 'preparado') miembro.cancionesPorEstado.preparado++
          else if (estado === 'en_practica') miembro.cancionesPorEstado.enPractica++
          else if (estado === 'pendiente') miembro.cancionesPorEstado.pendiente++
          else if (estado === 'necesita_ayuda') miembro.cancionesPorEstado.necesitaAyuda++
        })

        setEquipoEstado(Array.from(equipoMap.values()))
      }

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PREPARADO':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'EN_PRACTICA':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'PENDIENTE':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'NECESITA_AYUDA':
        return 'bg-orange-50 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PREPARADO': return 'Preparado'
      case 'EN_PRACTICA': return 'En Práctica'
      case 'PENDIENTE': return 'Pendiente'
      case 'NECESITA_AYUDA': return 'Necesita Ayuda'
      default: return estado
    }
  }

  const obtenerTextoRol = (rol: string) => {
    switch (rol) {
      case 'CANTANTE_PRINCIPAL': return 'Voz Principal'
      case 'COROS': return 'Coros'
      case 'ARMONIAS': return 'Armonías'
      case 'RESPALDO': return 'Respaldo'
      default: return rol
    }
  }

  if (cargando) {
    return (
      <Layout titulo="Dashboard Líder">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Dashboard Líder">
      <div className="space-y-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Hola, {session?.user?.name}!
              </h1>
              <p className="text-blue-100">
                Aquí tienes un resumen del estado del equipo de alabanza
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/programacion/nueva"
                className="inline-flex items-center gap-3 px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Nueva Programación
              </Link>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Estadísticas principales mejoradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Repertorio</p>
                <p className="text-3xl font-bold text-purple-600">
                  {estadisticas?.cancionesRepertorio || 0}
                </p>
                <p className="text-sm text-gray-500">Canciones activas</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Programaciones</p>
                <p className="text-3xl font-bold text-green-600">
                  {estadisticas?.programacionesActivas || 0}
                </p>
                <p className="text-sm text-gray-500">Activas</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Cantantes</p>
                <p className="text-3xl font-bold text-blue-600">
                  {estadisticas?.cantantesActivos || 0}
                </p>
                <p className="text-sm text-gray-500">En el equipo</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">
                  {proximoServicio?.asignacionesPendientes || 0}
                </p>
                <p className="text-sm text-gray-500">Por asignar</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-full shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Próximo servicio mejorado */}
        {proximoServicio && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Próximo Servicio
                </h3>
                <p className="text-sm text-gray-500">Estado del equipo y programación</p>
              </div>
            </div>
            
            <a 
              href={`/programacion/${proximoServicio.id}`}
              className="block bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border border-blue-100 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2 capitalize">
                      {proximoServicio.fecha}
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        {proximoServicio.tipoServicio}
                      </span>
                      <span className="text-gray-500 text-sm bg-white px-3 py-1 rounded-full border">
                        {proximoServicio.totalAsignaciones} asignaciones
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {proximoServicio.asignacionesPendientes > 0 ? (
                      <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          {proximoServicio.asignacionesPendientes} asignaciones pendientes
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">Todo el equipo está listo</span>
                      </div>
                    )}
                  </div>

                  {proximoServicio.asignaciones.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1.5 rounded-lg">
                          <Music className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Repertorio programado:</p>
                      </div>
                      <div className="space-y-3">
                        {proximoServicio.asignaciones.slice(0, 3).map((asignacion) => (
                          <div key={asignacion.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{asignacion.cancion.titulo}</p>
                                  <p className="text-xs text-gray-500">{asignacion.cancion.artista}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <div className="bg-blue-100 p-1 rounded-lg">
                                      <Mic className="h-3 w-3 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-900">
                                      {asignacion.usuario.nombre}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {obtenerTextoRol(asignacion.rolCancion)}
                                  </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${obtenerColorEstado(asignacion.estadoPreparacion)}`}>
                                  {obtenerTextoEstado(asignacion.estadoPreparacion)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {proximoServicio.asignaciones.length > 3 && (
                          <div className="text-center py-3">
                            <span className="text-sm text-purple-600 font-medium bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-full border border-purple-200">
                              +{proximoServicio.asignaciones.length - 3} canciones más
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
                    <ChevronRight className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Acciones rápidas funcionales */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Acciones Rápidas
              </h3>
              <p className="text-sm text-gray-500">Gestionar el equipo de alabanza</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/programacion/nueva"
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">Nueva Programación</p>
                  <p className="text-sm text-gray-600">Planificar próximo servicio</p>
                </div>
              </div>
            </Link>

            <Link
              href={proximoServicio ? `/programacion/${proximoServicio.id}/asignar` : '/servicios'}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">Asignar Canciones</p>
                  <p className="text-sm text-gray-600">Distribuir responsabilidades</p>
                </div>
              </div>
            </Link>

            <Link
              href="/canciones"
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">Gestionar Repertorio</p>
                  <p className="text-sm text-gray-600">Añadir/editar canciones</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Estado del equipo real */}
        {equipoEstado.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Estado del Equipo
                </h3>
                <p className="text-sm text-gray-500">Preparación de los cantantes</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {equipoEstado.map((miembro) => {
                const totalCanciones = Object.values(miembro.cancionesPorEstado).reduce((a, b) => a + b, 0)
                const preparadas = miembro.cancionesPorEstado.preparado
                const porcentaje = totalCanciones > 0 ? Math.round((preparadas / totalCanciones) * 100) : 0
                
                return (
                  <div key={miembro.id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{miembro.nombre}</h4>
                            {miembro.rangoVocal && (
                              <span className="text-sm text-blue-600 font-medium">({miembro.rangoVocal})</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{preparadas}/{totalCanciones}</div>
                            <div className="text-sm text-gray-600">Preparadas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{porcentaje}%</div>
                            <div className="text-sm text-gray-600">Listo</div>
                          </div>
                        </div>
                        
                        {totalCanciones > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4 text-purple-600" />
                              <p className="text-sm font-semibold text-gray-700">Estado de canciones:</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {miembro.cancionesPorEstado.preparado > 0 && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                                  ✓ {miembro.cancionesPorEstado.preparado} preparadas
                                </span>
                              )}
                              {miembro.cancionesPorEstado.enPractica > 0 && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200">
                                  ⏳ {miembro.cancionesPorEstado.enPractica} practicando
                                </span>
                              )}
                              {miembro.cancionesPorEstado.pendiente > 0 && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium border border-red-200">
                                  ⚠ {miembro.cancionesPorEstado.pendiente} pendientes
                                </span>
                              )}
                              {miembro.cancionesPorEstado.necesitaAyuda > 0 && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
                                  ❗ {miembro.cancionesPorEstado.necesitaAyuda} necesita ayuda
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                          porcentaje >= 80 ? 'border-green-500 bg-green-50' :
                          porcentaje >= 60 ? 'border-yellow-500 bg-yellow-50' :
                          'border-red-500 bg-red-50'
                        }`}>
                          <span className={`text-lg font-bold ${
                            porcentaje >= 80 ? 'text-green-600' :
                            porcentaje >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {porcentaje}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {porcentaje >= 80 ? 'Excelente' :
                           porcentaje >= 60 ? 'Bueno' :
                           'Necesita atención'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 