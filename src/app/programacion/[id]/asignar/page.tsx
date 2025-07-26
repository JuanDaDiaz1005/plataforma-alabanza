'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  ArrowLeft, 
  Save,
  Loader2,
  Search,
  Music,
  Users
} from 'lucide-react'

interface Cancion {
  id: string
  titulo: string
  artista: string
  album?: string
  duracionSegundos?: number
  tonalidad?: string
}

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string // <- Añadido para tipado correcto
}

interface FormularioAsignacion {
  cancionId: string
  usuarioId: string
  rolCancion: string
  estadoPreparacion: string
  notasPersonales: string
}

interface Programacion {
  id: string;
  fecha: string;
  tipoServicio: string;
  notas?: string;
  activa: boolean;
  fechaCreacion: string;
  asignaciones: Asignacion[];
  comentarios: Comentario[];
}

interface Asignacion {
  id: string;
  rolCancion: string;
  estadoPreparacion: string;
  notasPersonales?: string;
  fechaCreacion: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  cancion: {
    id: string;
    titulo: string;
    artista: string;
    duracionSegundos?: number;
    tonalidad?: string;
  };
}

interface Comentario {
  id: string;
  contenido: string;
  fechaCreacion: string;
  usuario: {
    id: string;
    nombre: string;
    role: string;
  };
}

const ROLES_CANCION = [
  { value: 'CANTANTE_PRINCIPAL', label: 'Cantante Principal' },
  { value: 'COROS', label: 'Coros' },
  { value: 'ARMONIAS', label: 'Armonías' },
  { value: 'RESPALDO', label: 'Respaldo' }
]

const ESTADOS_PREPARACION = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PRACTICA', label: 'En Práctica' },
  { value: 'PREPARADO', label: 'Preparado' },
  { value: 'NECESITA_AYUDA', label: 'Necesita Ayuda' }
]

export default function AsignarCancion() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const programacionId = params?.id as string

  const [programacion, setProgramacion] = useState<Programacion | null>(null)
  const [canciones, setCanciones] = useState<Cancion[]>([])
  const [cantantes, setCantantes] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Estados para búsqueda
  const [busquedaCancion, setBusquedaCancion] = useState('')
  const [busquedaCantante, setBusquedaCantante] = useState('')

  // Formulario
  const [formulario, setFormulario] = useState<FormularioAsignacion>({
    cancionId: '',
    usuarioId: '',
    rolCancion: 'COROS',
    estadoPreparacion: 'PENDIENTE',
    notasPersonales: ''
  })

  // Verificar permisos
  const puedeAsignar = session?.user?.role === 'ADMINISTRADOR' || session?.user?.role === 'LIDER_ALABANZA'

  // Cargar datos iniciales
  const cargarDatos = async () => {
    try {
      setCargando(true)
      setCantantes([])
      
      const [programacionRes, cancionesRes, cantantesRes] = await Promise.all([
        fetch(`/api/programaciones/${programacionId}`),
        fetch('/api/canciones?limite=500'),
        fetch('/api/usuarios?rol=CANTANTE,LIDER_ALABANZA')
      ])

      if (!programacionRes.ok) {
        throw new Error('Programación no encontrada')
      }

      

      const [programacionData, cancionesData, cantantesData] = await Promise.all([
        programacionRes.json(),
        cancionesRes.json(),
        cantantesRes.json()
      ])

  
      // Validar respuestas de las APIs
      setProgramacion(programacionData)
      setCanciones(Array.isArray(cancionesData.canciones) ? cancionesData.canciones : (Array.isArray(cancionesData) ? cancionesData : []))
      
      // Asegurar que cantantes sea siempre un array
      if (cantantesRes.ok && cantantesData) {
        // Usar solo la propiedad 'usuarios' si existe
        const cantantesArray = Array.isArray(cantantesData.usuarios) ? cantantesData.usuarios : (Array.isArray(cantantesData) ? cantantesData : [])
        setCantantes(cantantesArray)
      } else {
        console.error('Error al cargar cantantes:', cantantesData)
        setCantantes([]) // Array vacío como fallback
      }

      console.log(cantantesData)

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar los datos')
      // Asegurar que los arrays estén inicializados
      setCanciones([])
      setCantantes([])
    } finally {
      setCargando(false)
    }
  }

  // Manejar cambios en el formulario
  const manejarCambio = (campo: keyof FormularioAsignacion, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  // Enviar formulario
  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      // Validaciones
      if (!formulario.cancionId || !formulario.usuarioId || !formulario.rolCancion) {
        throw new Error('Faltan campos requeridos: canción, cantante y rol')
      }

      const response = await fetch(`/api/programaciones/${programacionId}/asignaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formulario)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la asignación')
      }

      // Redirigir a la página de detalles del servicio
      router.push(`/programacion/${programacionId}`)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear la asignación')
    } finally {
      setGuardando(false)
    }
  }

  // Filtrar canciones
  const cancionesFiltradas = canciones.filter(cancion =>
    cancion.titulo.toLowerCase().includes(busquedaCancion.toLowerCase()) ||
    cancion.artista.toLowerCase().includes(busquedaCancion.toLowerCase())
  )

  // Filtrar cantantes - asegurar que sea un array y filtrar por rol
  const cantantesFiltrados = Array.isArray(cantantes) ? cantantes.filter(cantante =>
    (cantante.rol === 'CANTANTE' || cantante.rol === 'LIDER_ALABANZA') &&
    cantante.nombre.toLowerCase().includes(busquedaCantante.toLowerCase())
  ) : []

  // Formatear duración
  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (programacionId) {
      cargarDatos()
    }
  }, [programacionId])

  if (!puedeAsignar) {
    return (
      <Layout titulo="Asignar Canción">
        <div className="text-center py-12">
          <p className="text-red-600">No tienes permisos para asignar canciones</p>
          <Link href={`/programacion/${programacionId}`} className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
            ← Volver a Servicio
          </Link>
        </div>
      </Layout>
    )
  }

  if (cargando) {
    return (
      <Layout titulo="Asignar Canción">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (error && !programacion) {
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
    <Layout titulo="Asignar Canción">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href={`/programacion/${programacionId}`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Asignación</h1>
            {programacion && (
              <p className="text-gray-600">
                Programación: {programacion.tipoServicio} - {(() => {
                  const fecha = programacion.fecha;
                  let fechaObj: Date;
                  
                  if (fecha.includes('T')) {
                    const fechaSolo = fecha.split('T')[0];
                    const [year, month, day] = fechaSolo.split('-').map(Number);
                    fechaObj = new Date(year, month - 1, day);
                  } else {
                    const [year, month, day] = fecha.split('-').map(Number);
                    fechaObj = new Date(year, month - 1, day);
                  }
                  
                  return fechaObj.toLocaleDateString('es-ES');
                })()}
              </p>
            )}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Selección de Canción */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Canción</h3>
                
                {/* Búsqueda de canción */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar canción..."
                      value={busquedaCancion}
                      onChange={(e) => setBusquedaCancion(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* Lista de canciones */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {cancionesFiltradas.map((cancion) => (
                    <div
                      key={cancion.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        formulario.cancionId === cancion.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => manejarCambio('cancionId', cancion.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{cancion.titulo}</h4>
                          <p className="text-sm text-gray-600">{cancion.artista}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            {cancion.album && <span>{cancion.album}</span>}
                            {cancion.duracionSegundos && <span>{formatearDuracion(cancion.duracionSegundos)}</span>}
                            {cancion.tonalidad && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {cancion.tonalidad}
                              </span>
                            )}
                          </div>
                        </div>
                        {formulario.cancionId === cancion.id && (
                          <div className="text-blue-600">
                            <Music className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {cancionesFiltradas.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron canciones
                    </div>
                  )}
                </div>
              </div>

              {/* Selección de Cantante */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Cantante</h3>
                
                {/* Búsqueda de cantante */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar cantante..."
                      value={busquedaCantante}
                      onChange={(e) => setBusquedaCantante(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* Lista de cantantes */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {cantantesFiltrados.map((cantante) => (
                    <div
                      key={cantante.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        formulario.usuarioId === cantante.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => manejarCambio('usuarioId', cantante.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{cantante.nombre}</h4>
                          <p className="text-sm text-gray-600">{cantante.email}</p>
                        </div>
                        {formulario.usuarioId === cantante.id && (
                          <div className="text-blue-600">
                            <Users className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {cantantesFiltrados.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron cantantes
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detalles de la asignación */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles de la Asignación</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol en la Canción <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formulario.rolCancion}
                    onChange={(e) => manejarCambio('rolCancion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    {ROLES_CANCION.map(rol => (
                      <option key={rol.value} value={rol.value}>
                        {rol.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de Preparación
                  </label>
                  <select
                    value={formulario.estadoPreparacion}
                    onChange={(e) => manejarCambio('estadoPreparacion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {ESTADOS_PREPARACION.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Personales
                </label>
                <textarea
                  value={formulario.notasPersonales}
                  onChange={(e) => manejarCambio('notasPersonales', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Notas adicionales para el cantante (opcional)"
                />
              </div>
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
                disabled={guardando || !formulario.cancionId || !formulario.usuarioId}
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
                    Crear Asignación
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