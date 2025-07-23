"use client"

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Calendar, Music, ArrowRight } from 'lucide-react'
import ProximoServicioResumen from '@/components/ProximoServicioResumen';

// Tipos literales para estado y rol
export type EstadoPreparacionMusico = 'Pendiente' | 'Confirmado' | 'Cancelado';
export type RolMusico = 'Músico' | 'Director' | 'Cantante';

interface AsignacionServicio {
  id: string;
  cancion: {
    id: string;
    titulo: string;
    artista: string;
  };
  usuario: {
    id: string;
    nombre: string;
    rolCancion: RolMusico;
  };
  rolCancion: RolMusico;
  estadoPreparacion: EstadoPreparacionMusico;
}

interface ProximoServicioMusico {
  id: string;
  fecha: string;
  tipoServicio: string;
  asignaciones: AsignacionServicio[];
  totalAsignaciones: number;
  asignacionesPendientes: number;
}

// Tipo para la asignación recibida de la API
interface AsignacionServicioApi {
  id: string;
  cancion: {
    id: string;
    titulo: string;
    artista: string;
  };
  usuario: {
    id: string;
    nombre: string;
    rolCancion: RolMusico;
  };
  rolCancion: RolMusico;
  estadoPreparacion: EstadoPreparacionMusico;
}

export default function DashboardMusico() {
  const [proximoServicio, setProximoServicio] = useState<ProximoServicioMusico | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarProximoServicio = async () => {
      setCargando(true)
      const res = await fetch('/api/programaciones?page=1&limite=1&activa=true')
      if (res.ok) {
        const data = await res.json()
        const servicio = data.programaciones?.[0]
        if (servicio) {
          // Validar y mapear asignaciones
          const asignaciones: AsignacionServicio[] = (servicio.asignaciones ?? []).map((a: AsignacionServicioApi) => ({
            id: a.id,
            cancion: {
              id: a.cancion.id,
              titulo: a.cancion.titulo,
              artista: a.cancion.artista
            },
            usuario: {
              id: a.usuario.id,
              nombre: a.usuario.nombre,
              rolCancion: a.rolCancion
            },
            rolCancion: a.rolCancion,
            estadoPreparacion: a.estadoPreparacion
          }))
          setProximoServicio({
            id: servicio.id,
            fecha: new Date(servicio.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            tipoServicio: servicio.tipoServicio,
            asignaciones,
            totalAsignaciones: asignaciones.length,
            asignacionesPendientes: asignaciones.filter((a) => a.estadoPreparacion === 'Pendiente').length
          })
        } else {
          setProximoServicio(null)
        }
      }
      setCargando(false)
    }
    cargarProximoServicio()
  }, [])

  // Funciones compatibles con string, usando type guard
  const obtenerColorEstado = (estado: string) => {
    if (estado === 'Pendiente' || estado === 'Confirmado' || estado === 'Cancelado') {
      switch (estado) {
        case 'Pendiente':
          return 'bg-yellow-100 text-yellow-800';
        case 'Confirmado':
          return 'bg-green-100 text-green-800';
        case 'Cancelado':
          return 'bg-red-100 text-red-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  const obtenerTextoEstado = (estado: string) => {
    if (estado === 'Pendiente' || estado === 'Confirmado' || estado === 'Cancelado') {
      return estado;
    }
    return estado;
  };

  const obtenerTextoRol = (rol: string) => {
    if (rol === 'Músico' || rol === 'Director' || rol === 'Cantante') {
      return rol;
    }
    return rol;
  };

  return (
    <Layout titulo="Dashboard Músico">
      <div className="space-y-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">¡Bienvenido, Músico! 🎸</h1>
              <p className="text-green-100">Consulta el próximo servicio y accede a toda la biblioteca musical.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-3">
                <Music className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">🎵</div>
                <div className="text-sm text-green-100">Músico</div>
              </div>
            </div>
          </div>
        </div>

        {/* Próximo Servicio mejorado */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Próximo Servicio</h2>
          </div>
          
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : proximoServicio && (
            <ProximoServicioResumen
              proximoServicio={proximoServicio}
              colorGradiente="from-green-500 to-teal-600"
              colorAcento="text-green-600"
              obtenerColorEstado={obtenerColorEstado}
              obtenerTextoEstado={obtenerTextoEstado}
              obtenerTextoRol={obtenerTextoRol}
            />
          )}
        </div>

        {/* Biblioteca Musical mejorada */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
              <Music className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Biblioteca Musical</h2>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <p className="text-gray-700 mb-4">Explora todas las canciones y recursos disponibles para preparar tu instrumento.</p>
            <Link 
              href="/biblioteca" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              Ir a la Biblioteca <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}