'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  Calendar,
  Music,
  Play,
  Users,
  ArrowRight,
  Youtube
} from 'lucide-react'
import ProximoServicioResumen from '@/components/ProximoServicioResumen';
// Eliminar import { Dialog } from '@headlessui/react'

interface ServicioDanza {
  id: string
  fecha: string
  tipoServicio: string
  asignaciones: Asignacion[]
}

interface Asignacion {
  cancion: {
    id: string
    titulo: string
    artista: string
    videoDanza?: string
  }
}

export default function DashboardDanza() {
  const { data: sesion } = useSession()
  const [proximosServicios, setProximosServicios] = useState<ServicioDanza[]>([])
  const [cancionesConVideo, setCancionesConVideo] = useState<unknown[]>([])
  const [cargando, setCargando] = useState(true)
  const [lideresPorCancion, setLideresPorCancion] = useState<Record<string, { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }>>({})

  // Verificar acceso
  const puedeAcceder = sesion?.user?.role === 'DANZA' || sesion?.user?.role === 'LIDER_DANZA'

  const cargarDatos = async () => {
    try {
      setCargando(true)

      // Cargar próximos servicios
      const hoy = new Date().toISOString()
      const respuestaServicios = await fetch(`/api/programaciones?fechaDesde=${hoy}&limite=3`)
      
      if (respuestaServicios.ok) {
        const datosServicios = await respuestaServicios.json()
        setProximosServicios(datosServicios.programaciones || [])
      }

      // Cargar canciones con videos de danza (últimas 5)
      const respuestaCanciones = await fetch('/api/canciones?limite=50')
      
      if (respuestaCanciones.ok) {
        const datosCanciones = await respuestaCanciones.json()
        const conVideo = datosCanciones.canciones.filter((c: unknown) => c.videoDanza).slice(0, 5)
        setCancionesConVideo(conVideo)
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const cargarLideres = async (programacionId: string) => {
    const res = await fetch(`/api/programaciones/${programacionId}/danzas-lideres`)
    if (res.ok) {
      const data = await res.json()
      const porCancion: Record<string, { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }> = {}
      data.forEach((c: unknown) => { porCancion[c.cancionId] = c })
      setLideresPorCancion(prev => ({ ...prev, ...porCancion }))
    }
  }

  useEffect(() => {
    if (puedeAcceder) {
      cargarDatos()
    }
  }, [puedeAcceder])

  // Cargar líderes cuando se cargan los servicios
  useEffect(() => {
    if (proximosServicios.length > 0) {
      proximosServicios.forEach(servicio => {
        cargarLideres(servicio.id)
      })
    }
  }, [proximosServicios])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatearTipoServicio = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'MIERCOLES': 'Miércoles',
      'DOMINGO': 'Domingo',
      'SABADO': 'Sábado',
      'JUEVES': 'Jueves',
      'ESPECIAL': 'Especial'
    }
    return tipos[tipo] || tipo
  }

  if (!puedeAcceder) {
    return (
      <Layout titulo="Dashboard Danza">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Acceso Restringido</h2>
            <p className="text-red-700">Este dashboard es solo para el equipo de danza.</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (cargando) {
    return (
      <Layout titulo="Dashboard Danza">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Dashboard Danza">
      <div className="space-y-8">
        {/* Header de bienvenida mejorado */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Bienvenido al Dashboard de Danza! 💃
              </h1>
              <p className="text-purple-100">
                {sesion?.user?.role === 'LIDER_DANZA' 
                  ? 'Como líder de danza, puedes gestionar videos y preparar coreografías para los servicios.'
                  : 'Revisa los próximos servicios y estudia las danzas correspondientes.'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {sesion?.user?.role === 'LIDER_DANZA' && (
                <Link
                  href="/servicios"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Users className="h-5 w-5" />
                  Asignar Danzas
                </Link>
              )}
              <div className="bg-white/20 rounded-lg p-3">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{proximosServicios.length}</div>
                <div className="text-sm text-purple-100">Servicios</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximos Servicios mejorado */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Próximos Servicios
                  </h2>
                </div>
                <Link 
                  href="/servicios"
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition-all duration-200"
                >
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {proximosServicios.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay servicios próximos programados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proximosServicios.slice(0, 1).map((servicio) => (
                    <div key={servicio.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {formatearTipoServicio(servicio.tipoServicio)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatearFecha(servicio.fecha)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                              {servicio.asignaciones.length} canciones
                            </span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-purple-600" />
                          <p className="text-sm font-semibold text-gray-700">Canciones para danza:</p>
                        </div>
                        <div className="space-y-2">
                          {servicio.asignaciones.slice(0, 3).map((asig) => (
                            <div key={asig.cancion.id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">{asig.cancion.titulo}</p>
                                    <p className="text-xs text-gray-500">{asig.cancion.artista}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">Líder(es): </span>
                                    {lideresPorCancion[asig.cancion.id]?.lideres.length > 0
                                      ? lideresPorCancion[asig.cancion.id].lideres.map(l => l.nombre).join(', ')
                                      : <span className="text-gray-400">No asignado</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {servicio.asignaciones.length > 3 && (
                            <div className="text-center py-2">
                              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full">
                                +{servicio.asignaciones.length - 3} canciones más
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {proximosServicios.length > 1 && (
                    <div className="text-center">
                      <Link
                        href="/servicios"
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Ver {proximosServicios.length - 1} servicios más...
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Canciones con Videos de Danza */}
          {(sesion?.user?.role === 'DANZA' || sesion?.user?.role === 'LIDER_DANZA') && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-600" />
                    Videos de Danza Disponibles
                  </h2>
                  <Link 
                    href="/biblioteca"
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    Ver biblioteca <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {cancionesConVideo.length === 0 ? (
                  <div className="text-center py-8">
                    <Youtube className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hay videos de danza disponibles aún</p>
                    {sesion?.user?.role === 'LIDER_DANZA' && (
                      <p className="text-sm text-gray-400 mt-1">
                        Ve a la biblioteca para agregar videos a las canciones
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cancionesConVideo.map((cancion) => (
                      <div key={cancion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {cancion.titulo}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {cancion.artista}
                          </p>
                        </div>
                        <a
                          href={cancion.videoDanza}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <Play className="h-3 w-3" />
                          Ver Video
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enlaces rápidos */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enlaces Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/servicios"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Ver Servicios</h3>
                <p className="text-sm text-gray-600">Explora todos los servicios programados</p>
              </div>
            </Link>
            
            <Link
              href="/biblioteca"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Music className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Biblioteca</h3>
                <p className="text-sm text-gray-600">Busca canciones y sus recursos</p>
              </div>
            </Link>

            {sesion?.user?.role === 'LIDER_DANZA' && (
              <Link
                href="/biblioteca?danza=true"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <Youtube className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Gestionar Videos</h3>
                  <p className="text-sm text-gray-600">Agregar videos de danza</p>
                </div>
              </Link>
            )}
          </div>
        </div>


      </div>
    </Layout>
  )
} 