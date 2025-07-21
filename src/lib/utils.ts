import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilidades para fechas
export function formatearFecha(fecha: Date | string): string {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha)
  
  if (isNaN(fechaObj.getTime())) {
    return 'Fecha inválida'
  }
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(fechaObj)
}

export function formatearFechaCorta(fecha: Date | string): string {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha)
  
  if (isNaN(fechaObj.getTime())) {
    return 'Fecha inválida'
  }
  
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric'
  }).format(fechaObj)
}

// Utilidades para audio
export function formatearDuracion(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
  const segs = segundos % 60
  return `${minutos}:${segs.toString().padStart(2, '0')}`
}

// Utilidades para roles y permisos
export function puedeAdministrar(rolUsuario: string): boolean {
  return rolUsuario === 'ADMINISTRADOR'
}

export function puedeProgramar(rolUsuario: string): boolean {
  return ['ADMINISTRADOR', 'LIDER_ALABANZA'].includes(rolUsuario)
}

// Utilidades para validación
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function validarPassword(password: string): { valida: boolean; mensaje?: string } {
  if (password.length < 8) {
    return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valida: false, mensaje: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' }
  }
  return { valida: true }
}

// Utilidades específicas para canciones
export function validarPermisosCancion(rolUsuario: string): boolean {
  return ['ADMINISTRADOR', 'LIDER_ALABANZA'].includes(rolUsuario)
} 

// Utilidades específicas para danza
export function puedeEditarVideoDanza(rolUsuario: string): boolean {
  return rolUsuario === 'LIDER_DANZA'
}

export function puedeVerServicios(rolUsuario: string): boolean {
  return ['ADMINISTRADOR', 'LIDER_ALABANZA', 'CANTANTE', 'LIDER_DANZA', 'DANZA'].includes(rolUsuario)
}

export function puedeVerBiblioteca(rolUsuario: string): boolean {
  return ['ADMINISTRADOR', 'LIDER_ALABANZA', 'CANTANTE', 'LIDER_DANZA', 'DANZA'].includes(rolUsuario)
} 

export function getReturnUrl(searchParams: URLSearchParams) {
  const from = searchParams.get('from');
  const fromId = searchParams.get('id');
  if (from === 'programacion' && fromId) return `/programacion/${fromId}`;
  if (from === 'biblioteca') return '/biblioteca';
  if (from === 'asignaciones') return '/canciones';
  if (from === 'cantante-dashboard') return '/cantante/dashboard';
  if (from === 'servicios') return '/servicios';
  if (from === 'usuarios') return '/usuarios';
  return '/canciones';
}

export function getReturnText(searchParams: URLSearchParams) {
  const from = searchParams.get('from');
  if (from === 'programacion') return 'Volver a Programación';
  if (from === 'biblioteca') return 'Volver a Biblioteca';
  if (from === 'asignaciones') return 'Volver a Asignaciones';
  if (from === 'cantante-dashboard') return 'Volver al Dashboard';
  if (from === 'servicios') return 'Volver a Servicios';
  if (from === 'usuarios') return 'Volver a Usuarios';
  return 'Volver a Canciones';
} 