'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Music,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  MessageSquare,
  Info,
  Headphones,
  User,
  ExternalLink,
  Loader2,
  Youtube
} from 'lucide-react'
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext';
import { useRef } from 'react';
import { getReturnUrl } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface Programacion {
  id: string
  fecha: string
  tipoServicio: string
  notas?: string
  activa: boolean
  fechaCreacion: string
  asignaciones: Asignacion[]
  comentarios: Comentario[]
}

interface Asignacion {
  id: string
  rolCancion: string
  estadoPreparacion: string
  notasPersonales?: string
  fechaCreacion: string
  usuario: {
    id: string
    nombre: string
    email: string
  }
  cancion: {
    id: string
    titulo: string
    artista: string
    duracionSegundos?: number
    tonalidad?: string
    videoDanza?: string
    estadoVideoDanza?: string
  }
}

interface AsignacionDanza {
  id: string
  usuarioId: string
  cancionId: string
  estadoPreparacion: string
  notasPersonales?: string
  fechaActualizacion: string
  usuario: {
    id: string
    nombre: string
    email: string
  }
  cancion: {
    id: string
    titulo: string
    artista: string
    videoDanza?: string
    estadoVideoDanza?: string
  }
  programacion: {
    id: string
    fecha: string
    tipoServicio: string
  }
}

interface Comentario {
  id: string
  contenido: string
  fechaCreacion: string
  usuario: {
    id: string
    nombre: string
    role: string
  }
}

const ESTADOS_PREPARACION = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { value: 'EN_PRACTICA', label: 'En Práctica', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'PREPARADO', label: 'Preparado', color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'NECESITA_AYUDA', label: 'Necesita Ayuda', color: 'text-red-600', bgColor: 'bg-red-100' }
]

interface UsuarioDanza {
  id: string
  nombre: string
  email: string
  role: string
}

export default function DetalleProgramacion() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const programacionId = params?.id as string

  const [programacion, setProgramacion] = useState<Programacion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [lideresPorCancion, setLideresPorCancion] = useState<Record<string, { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }>>({})
  // Estados para el modal de asignar líder de danza
  const [modalOpen, setModalOpen] = useState(false)
  const [modalCancionId, setModalCancionId] = useState<string | null>(null)
  const [danzoras, setDanzoras] = useState<UsuarioDanza[]>([])
  const [cargandoDanzoras, setCargandoDanzoras] = useState(false)
  const [asignando, setAsignando] = useState(false)
  const [errorModal, setErrorModal] = useState('')
  const [liderActual, setLiderActual] = useState<string | null>(null)
  const { setTrack } = useAudioPlayer();
  const [mensajeCard, setMensajeCard] = useState<{ [key: string]: string }>({});
  const timeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Estado global de loading para los botones de cada canción
  const [loading, setLoading] = useState({});

  // Estado para el guardando del modal de líderes de danza
  const [guardando, setGuardando] = useState(false)

  // Estados para asignaciones de danza y estado del video
  const [asignacionesDanza, setAsignacionesDanza] = useState<Record<string, AsignacionDanza[]>>({})
  const [editandoEstadoVideo, setEditandoEstadoVideo] = useState<string | null>(null)
  const [actualizandoVideo, setActualizandoVideo] = useState(false)

  // Verificar permisos
  const puedeEditar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'
  const puedeEliminar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'
  const puedeAsignar = puedeEditar
  const esDanza = session?.user?.role === 'DANZA' || session?.user?.role === 'LIDER_DANZA'

  const searchParams = useSearchParams();

  // Cargar programación
  const cargarProgramacion = async () => {
    try {
      setCargando(true)
      const response = await fetch(`/api/programaciones/${programacionId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Programación no encontrada')
        }
        throw new Error('Error al cargar la programación')
      }

      const data = await response.json()
      console.log('Programación cargada:', data)
      setProgramacion(data)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar la programación')
    } finally {
      setCargando(false)
    }
  }

  // Eliminar programación
  const eliminarProgramacion = async () => {
    if (!programacion || !confirm(`¿Estás seguro de eliminar la programación del ${formatearFecha(programacion.fecha)}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/programaciones/${programacionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la programación')
      }

      router.push('/servicios')

    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar la programación')
    }
  }

  // Cambiar estado de preparación
  const cambiarEstadoPreparacion = async (asignacionId: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/programaciones/${programacionId}/asignaciones`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asignacionId,
          estadoPreparacion: nuevoEstado
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar estado de preparación')
      }

      // Recargar datos
      cargarProgramacion()

    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar estado de preparación')
    }
  }

  // Eliminar asignación
  const eliminarAsignacion = async (asignacionId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) {
      return
    }

    try {
      const response = await fetch(`/api/programaciones/${programacionId}/asignaciones`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ asignacionId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar asignación')
      }

      // Recargar datos
      cargarProgramacion()

    } catch (error) {
      console.error('Error al eliminar asignación:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar asignación')
    }
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  // Formatear tipo de servicio
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

  // Formatear rol
  const formatearRol = (rol: string) => {
    const roles: { [key: string]: string } = {
      'CANTANTE_PRINCIPAL': 'Cantante Principal',
      'COROS': 'Coros',
      'ARMONIAS': 'Armonías',
      'RESPALDO': 'Respaldo'
    }
    return roles[rol] || rol
  }

  // Cargar líderes de danza
  const cargarLideresDanza = async () => {
    if (!programacion) return

    try {
      const res = await fetch(`/api/programaciones/${programacion.id}/danzas-lideres`)
      if (res.ok) {
        const data = await res.json()
        const porCancion: Record<string, { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }> = {}
        Array.isArray(data) && data.forEach((c: { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }) => { porCancion[c.cancionId] = c });
        setLideresPorCancion(prev => ({ ...prev, ...porCancion }))
      } else {
        console.error('Error al cargar líderes de danza:', res.statusText)
        setLideresPorCancion({})
      }
    } catch (error) {
      console.error('Error al cargar líderes de danza:', error)
      setLideresPorCancion({})
    }
  }

  // Cargar asignaciones de danza (individuales)
  const cargarAsignacionesDanza = async () => {
    if (!programacion) return

    try {
      console.log('Cargando asignaciones de danza para programación:', programacion.id)
      const res = await fetch(`/api/programaciones/danza-asignaciones?programacionId=${programacion.id}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Asignaciones de danza recibidas:', data)
        
        // Manejar tanto el formato nuevo (array directo) como el antiguo (objeto con asignaciones)
        const asignaciones = Array.isArray(data) ? data : (data.asignaciones || [])
        console.log('Asignaciones procesadas:', asignaciones)
        
        const porCancion: Record<string, AsignacionDanza[]> = {}
        asignaciones.forEach((asignacion: AsignacionDanza) => {
          const cancionId = asignacion.cancionId
          if (!porCancion[cancionId]) porCancion[cancionId] = []
          porCancion[cancionId].push(asignacion)
        })
        console.log('Asignaciones de danza agrupadas por canción:', porCancion)
        setAsignacionesDanza(porCancion)
      } else {
        console.error('Error al cargar asignaciones de danza:', res.statusText)
        setAsignacionesDanza({})
      }
    } catch (error) {
      console.error('Error al cargar asignaciones de danza:', error)
      setAsignacionesDanza({})
    }
  }

  // Abrir modal de asignación de danza
  const abrirModalDanza = async (cancionId: string, cancionTitulo: string) => {
    console.log('Abriendo modal de danza para canción:', cancionId, cancionTitulo)
    setModalOpen(true)
    setModalCancionId(cancionId)
    setCargandoDanzoras(true)
    setErrorModal('')
    try {
      // Cargar danzoras y líder de danza
      console.log('Cargando usuarios de danza...')
      const res = await fetch('/api/usuarios?rol=DANZA,LIDER_DANZA&limite=50')
      console.log('Respuesta de usuarios:', res.status, res.statusText)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Datos de usuarios recibidos:', data)
        const usuarios = data.usuarios || []
        console.log('Usuarios de danza encontrados:', usuarios.length, usuarios)
        setDanzoras(usuarios)
      } else {
        console.error('Error al cargar usuarios de danza:', res.status, res.statusText)
        const errorData = await res.json().catch(() => ({}))
        console.error('Error data:', errorData)
        setDanzoras([])
        setErrorModal('Error al cargar usuarios de danza')
      }
      // Cargar líderes actuales
      await cargarLideresDanza()
      setSeleccionadas(lideresPorCancion[cancionId]?.lideres.map(l => l.id) || [])
    } catch (error) {
      console.error('Error al abrir modal de danza:', error)
      setDanzoras([])
      setSeleccionadas([])
      setErrorModal('Error al cargar usuarios')
    } finally {
      setCargandoDanzoras(false)
    }
  }

  // Cerrar modal de danza
  const cerrarModalDanza = () => {
    setModalOpen(false)
    setModalCancionId(null)
    setSeleccionadas([])
    setDanzoras([])
  }

  // Guardar líderes de danza
  const guardarLideresDanza = async () => {
    if (!programacion) return
    setGuardando(true)
    try {
      await fetch(`/api/programaciones/${programacion.id}/danzas-lideres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancionId: modalCancionId,
          usuarioIds: seleccionadas
        })
      })
      await cargarLideresDanza()
      await cargarAsignacionesDanza()
      setGuardando(false)
      cerrarModalDanza()
    } catch (error) {
      console.error('Error al guardar líderes de danza:', error)
      setGuardando(false)
    }
  }

  // Actualizar estado de preparación de danza
  const actualizarEstadoPreparacionDanza = async (asignacionId: string, nuevoEstado: string) => {
    try {
      console.log('Actualizando estado de preparación de danza:', { asignacionId, nuevoEstado, programacionId: programacion?.id })
      const res = await fetch(`/api/programaciones/${programacion?.id}/danzas-lideres`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asignacionDanzaId: asignacionId,
          estadoPreparacion: nuevoEstado
        })
      })

      if (res.ok) {
        console.log('Estado de preparación actualizado exitosamente')
        await cargarAsignacionesDanza()
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Error al actualizar estado de preparación:', res.status, errorData)
      }
    } catch (error) {
      console.error('Error al actualizar estado de preparación:', error)
    }
  }

  // Actualizar estado del video de danza
  const actualizarEstadoVideo = async (cancionId: string, nuevoEstado: string) => {
    if (actualizandoVideo) return
    
    console.log('Actualizando estado del video:', { cancionId, nuevoEstado })
    setActualizandoVideo(true)
    try {
      const res = await fetch(`/api/canciones/${cancionId}/video-danza`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoVideoDanza: nuevoEstado })
      })

      if (res.ok) {
        console.log('Estado del video actualizado exitosamente')
        // Recargar programación para obtener los datos actualizados
        await cargarProgramacion()
        await cargarAsignacionesDanza()
        setEditandoEstadoVideo(null)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Error al actualizar estado del video:', res.status, errorData)
      }
    } catch (error) {
      console.error('Error al actualizar estado del video:', error)
    } finally {
      setActualizandoVideo(false)
    }
  }

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (!programacion) return { totalCanciones: 0, cantantesUnicos: 0, preparados: 0, porcentajePreparacion: 0 }

    const asignaciones = programacion.asignaciones
    const cancionesUnicas = new Set(asignaciones.map(a => a.cancion.id))
    const cantantesUnicos = new Set(asignaciones.map(a => a.usuario.id))
    const preparados = asignaciones.filter(a => a.estadoPreparacion === 'PREPARADO').length
    const porcentajePreparacion = asignaciones.length > 0 ? (preparados / asignaciones.length) * 100 : 0

    return {
      totalCanciones: cancionesUnicas.size,
      cantantesUnicos: cantantesUnicos.size,
      preparados,
      porcentajePreparacion: Math.round(porcentajePreparacion)
    }
  }

  // Función para reproducir recurso de audio
  const reproducirRecurso = async (cancionId: string, cancionTitulo: string, cancionArtista: string, tipo: string) => {
    try {
      const res = await fetch(`/api/canciones/${cancionId}/recursos`);
      if (!res.ok) return;
      const recursos: Array<{ id: string, tipo: string, plataforma: string, url: string }> = await res.json();
      const recurso = recursos.find((r) => r.tipo === tipo && r.plataforma === 'MP3_LOCAL');
      if (!recurso) return;
      // Obtener URL firmada si es necesario
      let url = recurso.url;
      if (url && (url.includes('r2.dev') || url.includes('cloudflarestorage.com'))) {
        let key = '';
        if (url.includes('r2.dev')) {
          const urlParts = url.split('/');
          const bucketIndex = urlParts.findIndex((part) => typeof part === 'string' && part.includes('r2.dev'));
          if (bucketIndex !== -1) key = urlParts.slice(bucketIndex + 2).join('/');
        } else if (url.includes('cloudflarestorage.com')) {
          const urlParts = url.split('/');
          const bucketIndex = urlParts.findIndex((part) => typeof part === 'string' && part.includes('cloudflarestorage.com'));
          if (bucketIndex !== -1) key = urlParts.slice(bucketIndex + 2).join('/');
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
        title: cancionTitulo,
        artist: cancionArtista,
        url,
        cover: undefined
      });
    } catch (e) {
      alert('No se pudo reproducir el recurso.');
    }
  };

  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);

  // Funciones auxiliares para estados del video
  const obtenerTextoEstadoVideo = (estado: string) => {
    switch (estado) {
      case 'SIN_GRABAR': return 'Sin Grabar'
      case 'GRABADO': return 'Grabado'
      case 'REGRABAR': return 'Regrabar'
      default: return 'Sin Grabar'
    }
  }

  const obtenerColorEstadoVideo = (estado: string) => {
    switch (estado) {
      case 'SIN_GRABAR': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'GRABADO': return 'bg-green-100 text-green-700 border-green-200'
      case 'REGRABAR': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  useEffect(() => {
    if (programacionId) {
      console.log('Cargando datos iniciales para programación:', programacionId)
      cargarProgramacion()
      cargarLideresDanza()
      cargarAsignacionesDanza()
    }
  }, [programacionId])

  // Cargar asignaciones de danza cuando la programación esté lista
  useEffect(() => {
    if (programacion) {
      console.log('Programación lista, cargando asignaciones de danza...')
      cargarAsignacionesDanza()
    }
  }, [programacion])

  // Cargar líderes de danza cuando se carga la programación - para roles autorizados
  useEffect(() => {
    if (programacion && (session?.user?.role === 'LIDER_DANZA' || session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA' || session?.user?.role === 'DANZA')) {
      cargarLideresDanza()
    }
  }, [programacion, session?.user?.role])

  // Este useEffect se removió porque la carga se hace en abrirModalDanza()
  // y causaba conflictos al tener dos llamadas simultáneas

  // Cargar líder actual al abrir modal
  useEffect(() => {
    if (modalOpen && modalCancionId && programacion) {
      // Buscar si el usuario actual ya está asignado como líder para esta canción y programación
      const asignacionActual = Object.values(asignacionesDanza).flat().find(
        asignacion => asignacion.cancionId === modalCancionId && asignacion.usuarioId === session?.user?.id
      )
      setLiderActual(asignacionActual ? asignacionActual.usuarioId : null)
    }
  }, [modalOpen, modalCancionId, session?.user?.id, programacion, asignacionesDanza])

  const asignarLider = async (usuarioId: string) => {
    if (!programacion) return;
    setAsignando(true)
    setErrorModal('')
    try {
      const res = await fetch(`/api/programaciones/danza-asignaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId,
          cancionId: modalCancionId,
          programacionId: programacion.id
        })
      })
      if (!res.ok) throw new Error('Error al asignar líder')
      setModalOpen(false)
    } catch (err) {
      setErrorModal('No se pudo asignar líder')
    } finally {
      setAsignando(false)
    }
  }

  if (cargando) {
    return (
      <Layout titulo="Detalles Programación">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (error || !programacion) {
    return (
      <Layout titulo="Error">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error || 'Programación no encontrada'}</p>
          <Link href={getReturnUrl(searchParams)} className="text-blue-600 hover:text-blue-500">
          </Link>
        </div>
      </Layout>
    )
  }

  const estadisticas = calcularEstadisticas()

  return (
    <Layout titulo={`Programación ${formatearTipoServicio(programacion.tipoServicio)}`}>
      <div className="space-y-4">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/servicios?from=servicios"
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold">
                  {formatearTipoServicio(programacion.tipoServicio)}
                </h1>
                <p className="text-purple-100 flex items-center gap-2 mt-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  {formatearFecha(programacion.fecha)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${programacion.activa
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-500 text-white'
                  }`}
              >
                {programacion.activa ? 'Activa' : 'Inactiva'}
              </span>

              {puedeEditar && (
                <Link
                  href={`/programacion/${programacion.id}/editar`}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  title="Editar"
                >
                  <Edit className="h-5 w-5" />
                </Link>
              )}

              {puedeEliminar && (
                <button
                  onClick={eliminarProgramacion}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  title="Eliminar"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.totalCanciones}</p>
                <p className="text-sm text-gray-600 font-medium">Canciones</p>
              </div>
            </div>
          </div>

          {esDanza && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{estadisticas.cantantesUnicos}</p>
                    <p className="text-sm text-gray-600 font-medium">Cantantes</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{estadisticas.preparados}</p>
                    <p className="text-sm text-gray-600 font-medium">Preparados</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{estadisticas.porcentajePreparacion}%</p>
                    <p className="text-sm text-gray-600 font-medium">Preparación</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {esDanza && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{estadisticas.totalCanciones}</p>
                    <p className="text-sm text-gray-600 font-medium">Canciones para Danza</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-xl">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{estadisticas.totalCanciones}</p>
                    <p className="text-sm text-gray-600 font-medium">Con Video</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">100%</p>
                    <p className="text-sm text-gray-600 font-medium">Disponibles</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notas */}
        {programacion.notas && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">Notas del Servicio</h3>
            </div>
            <p className="text-blue-800 leading-relaxed">{programacion.notas}</p>
          </div>
        )}

        {/* Sección de asignaciones según el rol */}
        {esDanza ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 p-6 border-b border-gray-200">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
                <Music className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Canciones para Danza</h2>
              {session?.user?.role === 'LIDER_DANZA' && (
                <span className="ml-auto text-sm text-purple-600 font-medium bg-purple-50 px-4 py-2 rounded-lg">
                  Asigna líderes específicos para cada canción en este servicio
                </span>
              )}
            </div>
            <div className="p-6">
              {programacion.asignaciones.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay canciones</h3>
                  <p className="text-gray-600 mb-4">Aún no se han programado canciones para este servicio.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(programacion?.asignaciones?.reduce((acc: Record<string, { cancion: Asignacion['cancion'], asignaciones: Asignacion[] }>, asignacion: Asignacion) => {
                    const id = asignacion.cancion.id;
                    if (!acc[id]) acc[id] = { cancion: asignacion.cancion, asignaciones: [] };
                    acc[id].asignaciones.push(asignacion);
                    return acc;
                  }, {} as Record<string, { cancion: Asignacion['cancion'], asignaciones: Asignacion[] }>)).map(([cancionId, { cancion, asignaciones }]) => (
                    <div key={cancionId} className="bg-green-50 border border-green-200 shadow rounded-xl p-6 mb-6">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base mb-1">{cancion.titulo} <span className="text-gray-500 font-normal">por {cancion.artista}</span> {cancion.tonalidad && (<span className="ml-2 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{cancion.tonalidad}</span>)}</p>
                        
                        {/* Mostrar estado del video de danza - editable para líderes */}
                        {(session?.user?.role === 'LIDER_DANZA' || session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA' || session?.user?.role === 'DANZA') && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">Estado Video:</span>
                            {session?.user?.role === 'LIDER_DANZA' || session?.user?.role === 'ADMINISTRADOR' ? (
                              editandoEstadoVideo === cancionId ? (
                                <select
                                  value={cancion.estadoVideoDanza || 'SIN_GRABAR'}
                                  onChange={(e) => actualizarEstadoVideo(cancionId, e.target.value)}
                                  disabled={actualizandoVideo}
                                  className="text-xs rounded px-2 py-1 border focus:outline-none bg-white"
                                >
                                  <option value="SIN_GRABAR">Sin Grabar</option>
                                  <option value="GRABADO">Grabado</option>
                                  <option value="REGRABAR">Regrabar</option>
                                </select>
                              ) : (
                                <button
                                  onClick={() => setEditandoEstadoVideo(cancionId)}
                                  className={`text-xs rounded px-2 py-1 border font-semibold hover:bg-opacity-80 transition-colors ${obtenerColorEstadoVideo(cancion.estadoVideoDanza || 'SIN_GRABAR')}`}
                                >
                                  {obtenerTextoEstadoVideo(cancion.estadoVideoDanza || 'SIN_GRABAR')}
                                </button>
                              )
                            ) : (
                              <span className={`text-xs rounded px-2 py-1 border font-semibold ${obtenerColorEstadoVideo(cancion.estadoVideoDanza || 'SIN_GRABAR')}`}>
                                {obtenerTextoEstadoVideo(cancion.estadoVideoDanza || 'SIN_GRABAR')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Mostrar asignaciones de danza individuales */}
                        {(() => {
                          const asignaciones = asignacionesDanza[cancionId] || []
                          console.log(`Renderizando asignaciones para canción ${cancionId}:`, asignaciones)
                          return asignaciones.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                Danzoras Asignadas: ({asignaciones.length})
                              </span>
                              <div className="flex flex-wrap gap-2">
                              {asignaciones.map((asignacion: AsignacionDanza) => (
                                <div key={asignacion.id} className="flex items-center gap-2 text-xs bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                                  <span className="text-purple-900 font-medium flex items-center gap-1">
                                    <User className="h-3 w-3" />{asignacion.usuario.nombre}
                                  </span>
                                  {session?.user?.id === asignacion.usuarioId ? (
                                    <select
                                      value={asignacion.estadoPreparacion}
                                      onChange={(e) => {
                                        console.log('Cambiando estado de preparación de danza:', {
                                          asignacionId: asignacion.id,
                                          usuarioId: asignacion.usuarioId,
                                          nuevoEstado: e.target.value,
                                          sessionUserId: session?.user?.id
                                        })
                                        actualizarEstadoPreparacionDanza(asignacion.id, e.target.value)
                                      }}
                                      className={`text-xs rounded px-2 py-1 border focus:outline-none ${asignacion.estadoPreparacion === 'PREPARADO' ? 'bg-green-100 text-green-700' : asignacion.estadoPreparacion === 'NECESITA_AYUDA' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                      <option value="PENDIENTE">Pendiente</option>
                                      <option value="EN_PRACTICA">En Práctica</option>
                                      <option value="PREPARADO">Preparado</option>
                                      <option value="NECESITA_AYUDA">Necesita Ayuda</option>
                                    </select>
                                  ) : (
                                    <span className={`text-xs rounded px-2 py-1 border font-semibold ${asignacion.estadoPreparacion === 'PREPARADO' ? 'bg-green-100 text-green-700 border-green-200' : asignacion.estadoPreparacion === 'NECESITA_AYUDA' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                      {asignacion.estadoPreparacion === 'PENDIENTE' ? 'Pendiente' : asignacion.estadoPreparacion === 'EN_PRACTICA' ? 'En Práctica' : asignacion.estadoPreparacion === 'PREPARADO' ? 'Preparado' : 'Necesita Ayuda'}
                                    </span>
                                  )}
                                </div>
                                                              ))}
                              </div>
                            </div>
                          ) : null
                        })()}
                        <div className="flex flex-wrap items-center gap-4 mb-2">
                          {asignaciones.map((asig: Asignacion) => (
                            <div key={asig.id} className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                              <span className="text-gray-800 font-medium flex items-center gap-1 min-w-0"><User className="h-4 w-4" />{asig.usuario.nombre}</span>
                              <span className="text-gray-500 flex items-center gap-1 min-w-0"><Music className="h-4 w-4" />{formatearRol(asig.rolCancion)}</span>
                              {session?.user?.id === asig.usuario.id ? (
                                <select
                                  value={asig.estadoPreparacion}
                                  onChange={e => cambiarEstadoPreparacion(asig.id, e.target.value)}
                                  className={`text-xs rounded px-2 py-1 border focus:outline-none ${asig.estadoPreparacion === 'PREPARADO' ? 'bg-green-100 text-green-700' : asig.estadoPreparacion === 'NECESITA_AYUDA' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                  <option value="PENDIENTE">Pendiente</option>
                                  <option value="EN_PRACTICA">En Práctica</option>
                                  <option value="PREPARADO">Preparado</option>
                                  <option value="NECESITA_AYUDA">Necesita Ayuda</option>
                                </select>
                              ) : (
                                <span className={`text-xs rounded px-2 py-1 border font-semibold ${asig.estadoPreparacion === 'PREPARADO' ? 'bg-green-100 text-green-700 border-green-200' : asig.estadoPreparacion === 'NECESITA_AYUDA' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                  {asig.estadoPreparacion === 'PENDIENTE' ? 'Pendiente' : asig.estadoPreparacion === 'EN_PRACTICA' ? 'En Práctica' : asig.estadoPreparacion === 'PREPARADO' ? 'Preparado' : 'Necesita Ayuda'}
                                </span>
                              )}
                              {(session?.user?.role === 'LIDER_ALABANZA' || session?.user?.role === 'ADMINISTRADOR') && (
                                <button
                                  onClick={() => eliminarAsignacion(asig.id)}
                                  className="text-gray-400 hover:text-red-600 p-1"
                                  title="Eliminar asignación"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-2 md:mt-0 md:flex-row">
                        {/* Mensaje contextual sobre el card */}
                        {mensajeCard[cancionId] && (
                          <div className="absolute -top-8 left-0 right-0 flex justify-center z-10">
                            <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl border border-yellow-300 shadow text-xs sm:text-sm font-semibold">
                              {mensajeCard[cancionId]}
                            </span>
                          </div>
                        )}
                        <Link
                          href={`/canciones/${cancion.id}?from=programacion&id=${programacion.id}`}
                          className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white border-2 border-gray-200 rounded-xl shadow hover:bg-gray-50 transition-all duration-200 font-semibold text-gray-700 text-xs sm:text-base min-w-0 w-full sm:w-auto flex-1 truncate"
                          title="Ver detalles de la canción"
                        >
                          <Info className="h-5 w-5" />
                          <span className="break-words">Detalles</span>
                        </Link>
                        
                        {/* Botón para reproducir canción original */}
                        <button
                          className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white border-2 border-green-200 rounded-xl shadow hover:bg-green-50 transition-all duration-200 font-semibold text-green-700 text-xs sm:text-base min-w-0 w-full sm:w-auto flex-1 truncate"
                          title="Reproducir canción original"
                          onClick={async () => {
                            const res = await fetch(`/api/canciones/${cancion.id}/recursos`);
                            if (!res.ok) return;
                            const recursos = await res.json();
                            const recurso = (recursos as Array<{ tipo: string, plataforma: string, url: string }>).find((r) => r.tipo === 'CANCION_ORIGINAL' && r.plataforma === 'MP3_LOCAL');
                            if (!recurso) {
                              setMensajeCard(prev => ({ ...prev, [cancionId]: 'No hay canción original disponible para esta canción.' }));
                              if (timeoutRef.current[cancionId]) clearTimeout(timeoutRef.current[cancionId]);
                              timeoutRef.current[cancionId] = setTimeout(() => {
                                setMensajeCard(prev => ({ ...prev, [cancionId]: '' }));
                              }, 3500);
                              return;
                            }
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
                            reproducirRecurso(cancion.id, cancion.titulo, cancion.artista, 'CANCION_ORIGINAL');
                          }}
                        >
                          <Headphones className="h-5 w-5" />
                          <span className="break-words">Canción</span>
                        </button>

                        {/* Botón para reproducir pista instrumental - solo para cantantes, músicos, líderes de alabanza y admin */}
                        {(session?.user?.role === 'CANTANTE' || session?.user?.role === 'MUSICO' || session?.user?.role === 'LIDER_ALABANZA' || session?.user?.role === 'ADMINISTRADOR') && (
                          <button
                            className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white border-2 border-green-200 rounded-xl shadow hover:bg-green-50 transition-all duration-200 font-semibold text-green-700 text-xs sm:text-base min-w-0 w-full sm:w-auto flex-1 truncate"
                            title="Reproducir pista instrumental"
                            onClick={async () => {
                            const res = await fetch(`/api/canciones/${cancion.id}/recursos`);
                            if (!res.ok) return;
                            const recursos = await res.json();
                            const recurso = (recursos as Array<{ tipo: string, plataforma: string, url: string }>).find((r) => r.tipo === 'PISTA_INSTRUMENTAL' && r.plataforma === 'MP3_LOCAL');
                            if (!recurso) {
                              setMensajeCard(prev => ({ ...prev, [cancionId]: 'No hay pista instrumental disponible para esta canción.' }));
                              if (timeoutRef.current[cancionId]) clearTimeout(timeoutRef.current[cancionId]);
                              timeoutRef.current[cancionId] = setTimeout(() => {
                                setMensajeCard(prev => ({ ...prev, [cancionId]: '' }));
                              }, 3500);
                              return;
                            }
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
                            reproducirRecurso(cancion.id, cancion.titulo, cancion.artista, 'PISTA_INSTRUMENTAL');
                          }}
                        >
                          <Headphones className="h-5 w-5" />
                          <span className="break-words">Pista</span>
                        </button>
                        )}

                        {/* Botón para ver video de danza */}
                        {cancion.videoDanza && (
                          <a
                            href={cancion.videoDanza}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white border-2 border-red-200 rounded-xl shadow hover:bg-red-50 transition-all duration-200 font-semibold text-red-700 text-xs sm:text-base min-w-0 w-full sm:w-auto flex-1 truncate"
                            title="Ver video de danza en YouTube"
                          >
                            <Youtube className="h-5 w-5" />
                            <span className="break-words">Video Danza</span>
                          </a>
                        )}
                        
                        {/* Botón para asignar líder de danza */}
                        {(session?.user?.role === 'LIDER_DANZA') && (
                          <button
                            className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold text-xs sm:text-base min-w-0 w-full sm:w-auto flex-1 truncate"
                            title="Asignar líder de danza"
                            onClick={() => abrirModalDanza(cancionId, cancion.titulo)}
                          >
                            <UserCheck className="h-5 w-5" />
                            <span className="break-words">Asignar líder</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col items-center justify-center gap-3 p-6 border-b border-gray-200 md:flex-row">
              <div className='flex'>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              <h2 className="ml-2 text-lg sm:text-xl font-semibold text-gray-900">Asignaciones de Cantantes</h2>
              </div>
              {puedeAsignar && (
                <Link
                  href={`/programacion/${programacion.id}/asignar`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm md:ml-auto"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Asignación
                </Link>
              )}
            </div>
            <div className="p-6">
              {programacion.asignaciones.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asignaciones</h3>
                  <p className="text-gray-600 mb-4">Aún no se han asignado canciones para esta programación.</p>
                  {puedeAsignar && (
                    <Link
                      href={`/programacion/${programacion.id}/asignar`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Crear Primera Asignación
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(programacion.asignaciones.reduce((acc: Record<string, { cancion: Asignacion['cancion'], asignaciones: Asignacion[] }>, asignacion: Asignacion) => {
                    const id = asignacion.cancion.id;
                    if (!acc[id]) acc[id] = { cancion: asignacion.cancion, asignaciones: [] };
                    acc[id].asignaciones.push(asignacion);
                    return acc;
                  }, {} as Record<string, { cancion: Asignacion['cancion'], asignaciones: Asignacion[] }>)).map(([cancionId, { cancion, asignaciones }]) => (
                    <div key={cancionId} className="bg-gray-50 rounded-lg p-4 flex flex-col xl:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base mb-1">{cancion.titulo} <span className="text-gray-500 font-normal">por {cancion.artista}</span> {cancion.tonalidad && (<span className="ml-2 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{cancion.tonalidad}</span>)}</p>
                        {/* Mostrar líderes de danza asignados para esta canción - solo para roles autorizados */}
                        {(session?.user?.role === 'LIDER_DANZA' || session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA' || session?.user?.role === 'DANZA') && (
                          lideresPorCancion[cancionId]?.lideres && lideresPorCancion[cancionId].lideres.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">Líder(es):</span>
                              {lideresPorCancion[cancionId].lideres.map(lider => (
                                <span key={lider.id} className="text-xs text-purple-900 bg-purple-100 px-2 py-1 rounded flex items-center gap-1">
                                  <UserCheck className="h-4 w-4" />{lider.nombre}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-gray-500">Sin líder asignado</div>
                          )
                        )}
                        {asignaciones.map((asig: Asignacion) => (
                          <div key={asig.id} className="flex flex-col items-center gap-2 text-sm mb-1 sm:flex-row my-4">
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-medium flex items-center gap-1"><User className="h-4 w-4" />{asig.usuario.nombre}</span>
                              <span className="text-gray-500 flex items-center gap-1"><Music className="h-4 w-4" />{formatearRol(asig.rolCancion)}</span>
                            </div>
                            <div className="sm:ml-auto md:mr-50">
                              {session?.user?.id === asig.usuario.id ? (
                                <select
                                  value={asig.estadoPreparacion}
                                  onChange={e => cambiarEstadoPreparacion(asig.id, e.target.value)}
                                  className={`text-xs rounded px-2 py-1 border focus:outline-none ${asig.estadoPreparacion === 'PREPARADO' ? 'bg-green-100 text-green-700' : asig.estadoPreparacion === 'NECESITA_AYUDA' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                  <option value="PENDIENTE">Pendiente</option>
                                  <option value="EN_PRACTICA">En Práctica</option>
                                  <option value="PREPARADO">Preparado</option>
                                  <option value="NECESITA_AYUDA">Necesita Ayuda</option>
                                </select>
                              ) : (
                                <span className={`text-xs rounded px-2 py-1 border font-semibold ${asig.estadoPreparacion === 'PREPARADO' ? 'bg-green-100 text-green-700 border-green-200' : asig.estadoPreparacion === 'NECESITA_AYUDA' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                  {asig.estadoPreparacion === 'PENDIENTE' ? 'Pendiente' : asig.estadoPreparacion === 'EN_PRACTICA' ? 'En Práctica' : asig.estadoPreparacion === 'PREPARADO' ? 'Preparado' : 'Necesita Ayuda'}
                                </span>
                              )}
                              {(session?.user?.role === 'LIDER_ALABANZA' || session?.user?.role === 'ADMINISTRADOR') && (
                                <button
                                  onClick={() => eliminarAsignacion(asig.id)}
                                  className="text-gray-400 hover:text-red-600 p-1"
                                  title="Eliminar asignación"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2 mt-2 md:mt-0 md:flex-row">
                        {/* Mensaje contextual sobre el card */}
                        {mensajeCard[cancionId] && (
                          <div className="absolute -top-8 left-0 right-0 flex justify-center z-10">
                            <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl border border-yellow-300 shadow text-xs sm:text-sm font-semibold">
                              {mensajeCard[cancionId]}
                            </span>
                          </div>
                        )}
                        <Link
                          href={`/canciones/${cancion.id}?from=programacion&id=${programacion.id}`}
                          className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow hover:bg-gray-50 transition-all duration-200 font-semibold text-gray-700 text-base"
                          title="Ver detalles de la canción"
                        >
                          <Info className="h-5 w-5" />
                          <span>Detalles</span>
                        </Link>
                        <button
                          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-200 rounded-xl shadow hover:bg-green-50 transition-all duration-200 font-semibold text-green-700 text-base"
                          title="Reproducir pista instrumental"
                          onClick={async () => {
                            const res = await fetch(`/api/canciones/${cancion.id}/recursos`);
                            if (!res.ok) return;
                            const recursos = await res.json();
                            const recurso = (recursos as Array<{ tipo: string, plataforma: string, url: string }>).find((r) => r.tipo === 'CANCION_ORIGINAL' && r.plataforma === 'MP3_LOCAL');
                            if (!recurso) {
                              setMensajeCard(prev => ({ ...prev, [cancionId]: 'No hay pista instrumental disponible para esta canción.' }));
                              if (timeoutRef.current[cancionId]) clearTimeout(timeoutRef.current[cancionId]);
                              timeoutRef.current[cancionId] = setTimeout(() => {
                                setMensajeCard(prev => ({ ...prev, [cancionId]: '' }));
                              }, 3500);
                              return;
                            }
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
                            reproducirRecurso(cancion.id, cancion.titulo, cancion.artista, 'CANCION_ORIGINAL');
                          }}
                        >
                          <Headphones className="h-5 w-5" />
                          <span>Canción</span>
                        </button>
                        {/* Botón para reproducir pista instrumental - solo para cantantes, músicos, líderes de alabanza y admin */}
                        {(session?.user?.role === 'CANTANTE' || session?.user?.role === 'MUSICO' || session?.user?.role === 'LIDER_ALABANZA' || session?.user?.role === 'ADMINISTRADOR') && (
                          <button
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-200 rounded-xl shadow hover:bg-green-50 transition-all duration-200 font-semibold text-green-700 text-base"
                            title="Reproducir pista instrumental"
                            onClick={async () => {
                              const res = await fetch(`/api/canciones/${cancion.id}/recursos`);
                              if (!res.ok) return;
                              const recursos = await res.json();
                              const recurso = (recursos as Array<{ tipo: string, plataforma: string, url: string }>).find((r) => r.tipo === 'PISTA_INSTRUMENTAL' && r.plataforma === 'MP3_LOCAL');
                              if (!recurso) {
                                setMensajeCard(prev => ({ ...prev, [cancionId]: 'No hay pista instrumental disponible para esta canción.' }));
                                if (timeoutRef.current[cancionId]) clearTimeout(timeoutRef.current[cancionId]);
                                timeoutRef.current[cancionId] = setTimeout(() => {
                                  setMensajeCard(prev => ({ ...prev, [cancionId]: '' }));
                                }, 3500);
                                return;
                              }
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
                              reproducirRecurso(cancion.id, cancion.titulo, cancion.artista, 'PISTA_INSTRUMENTAL');
                            }}
                          >
                            <Headphones className="h-5 w-5" />
                            <span>Pista</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de asignación de líderes de danza */}
        {modalOpen && modalCancionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Asignar líder(es) de danza</h2>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-sm text-purple-800 font-semibold mb-1">Canción: {programacion.asignaciones.find(a => a.cancion.id === modalCancionId)?.cancion.titulo}</p>
                  <p className="text-xs text-purple-600">
                    Esta asignación es específica para esta canción en este servicio.
                  </p>
                </div>
              </div>
              <button onClick={cerrarModalDanza} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold">×</button>

              <div className="mb-3">
                <p className="text-sm text-gray-700 mb-2">Selecciona quién liderará esta canción:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cargandoDanzoras ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Cargando usuarios...</p>
                    </div>
                  ) : danzoras.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No se encontraron usuarios de danza</p>
                    </div>
                  ) : (
                    (danzoras as Array<{ id: string, nombre: string }> ).map((d) => (
                      <label key={d.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer border border-gray-100 hover:border-gray-200 transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(d.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSeleccionadas(prev => [...prev, d.id])
                            } else {
                              setSeleccionadas(prev => prev.filter(id => id !== d.id))
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 focus:ring-2"
                        />
                        <span className="text-gray-800 font-medium">{d.nombre}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={cerrarModalDanza}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarLideresDanza}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-pink-400 active:scale-95"
                  disabled={guardando}
                >
                  {guardando ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </div>
                  ) : (
                    'Guardar Asignación'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
