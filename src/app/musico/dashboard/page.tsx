"use client"

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Calendar, Music, ArrowRight } from 'lucide-react'
import ProximoServicioResumen from '@/components/ProximoServicioResumen';

export default function DashboardMusico() {
  const [proximoServicio, setProximoServicio] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarProximoServicio = async () => {
      setCargando(true)
      const res = await fetch('/api/programaciones?page=1&limite=1&activa=true')
      if (res.ok) {
        const data = await res.json()
        setProximoServicio(data.programaciones?.[0] || null)
      }
      setCargando(false)
    }
    cargarProximoServicio()
  }, [])

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmado':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'Pendiente';
      case 'Confirmado':
        return 'Confirmado';
      case 'Cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  const obtenerTextoRol = (rol: string) => {
    switch (rol) {
      case 'Músico':
        return 'Músico';
      case 'Director':
        return 'Director';
      case 'Cantante':
        return 'Cantante';
      default:
        return rol;
    }
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