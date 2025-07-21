// Tipos de la base de datos
export type RolUsuario = 'ADMINISTRADOR' | 'LIDER_ALABANZA' | 'CANTANTE'
export type GeneroMusical = 'CONTEMPORANEO' | 'TRADICIONAL' | 'ROCK_CRISTIANO' | 'GOSPEL' | 'BALADA' | 'ADORACION' | 'ALABANZA'
export type NivelDificultad = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO'
export type TipoServicio = 'MIERCOLES' | 'DOMINGO' | 'SABADO' | 'JUEVES' | 'ESPECIAL'
export type RolCancion = 'CANTANTE_PRINCIPAL' | 'COROS' | 'ARMONIAS' | 'RESPALDO'
export type EstadoPreparacion = 'PENDIENTE' | 'EN_PRACTICA' | 'PREPARADO' | 'NECESITA_AYUDA'
export type TipoRecurso = 'CANCION_ORIGINAL' | 'PISTA_INSTRUMENTAL' | 'PISTA_VOCAL' | 'ACORDES'
export type PlataformaAudio = 'MP3_LOCAL' | 'SPOTIFY' | 'YOUTUBE'
export type TipoNotificacion = 'NUEVA_ASIGNACION' | 'CAMBIO_PROGRAMACION' | 'RECORDATORIO_ENSAYO' | 'MENSAJE_GENERAL'

// Interfaces para formularios
export interface FormularioRegistroUsuario {
  nombre: string
  email: string
  password: string
  telefono?: string
  instrumentos?: string[]
  disponibilidad?: DiaDisponibilidad[]
}

export interface FormularioCancion {
  titulo: string
  artista: string
  genero: GeneroMusical
  duracionSegundos?: number
  dificultad: NivelDificultad
  letra?: string
  acordes?: string
  tonalidad?: string
  etiquetas?: string[]
}

export interface FormularioProgramacion {
  fecha: Date
  tipoServicio: TipoServicio
  notas?: string
  canciones: AsignacionProgramacion[]
}

// Interfaces auxiliares
export interface DiaDisponibilidad {
  dia: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'
  disponible: boolean
  horarios?: string[]
}

export interface AsignacionProgramacion {
  cancionId: string
  asignaciones: {
    usuarioId: string
    rolCancion: RolCancion
  }[]
}

export interface FiltrosCanciones {
  texto?: string
  genero?: GeneroMusical
  dificultad?: NivelDificultad
  conRecursosAudio?: boolean
  soloMisAsignaciones?: boolean
  fechaDesde?: Date
  fechaHasta?: Date
}

export interface FiltrosProgramaciones {
  fechaDesde?: Date
  fechaHasta?: Date
  tipoServicio?: TipoServicio
  soloActivas?: boolean
}

// Interfaces para APIs externas
export interface CancionSpotify {
  id: string
  nombre: string
  artistas: string[]
  duracionMs: number
  urlExterna: string
  imagenAlbum?: string
}

export interface CancionYoutube {
  id: string
  titulo: string
  canal: string
  duracionSegundos: number
  urlVideo: string
  thumbnail?: string
}

// Interfaces para el reproductor
export interface EstadoReproductor {
  cancionActual?: string
  reproduciendo: boolean
  volumen: number
  posicion: number
  duracionTotal: number
  plataforma: PlataformaAudio
  cola: string[]
}

// Interfaces para estadísticas
export interface EstadisticasUsuario {
  totalAsignaciones: number
  cancionesPreparadas: number
  participacionesMes: number
  generosFavoritos: { genero: GeneroMusical; cantidad: number }[]
}

export interface EstadisticasGenerales {
  totalUsuarios: number
  totalCanciones: number
  programacionesMes: number
  cancionesMasUsadas: { cancion: string; usos: number }[]
} 