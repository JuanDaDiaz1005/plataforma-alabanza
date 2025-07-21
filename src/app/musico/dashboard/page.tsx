"use client"

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Calendar, Music, ArrowRight } from 'lucide-react'

export default function DashboardMusico() {
  const [proximoServicio, setProximoServicio] = useState<unknown>(null)
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
          ) : proximoServicio ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{proximoServicio.tipoServicio}</h3>
                  <p className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                    {new Date(proximoServicio.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <div className="bg-green-100 p-1 rounded-lg">
                      <Music className="h-4 w-4 text-green-600" />
                    </div>
                    Canciones Programadas:
                  </h4>
                  <div className="space-y-2">
                    {proximoServicio.asignaciones?.map((a: unknown) => (
                      <div key={a.cancion.id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                        <p className="font-medium text-gray-900">{a.cancion.titulo}</p>
                        <p className="text-sm text-gray-500">{a.cancion.artista}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No hay servicios próximos programados.</p>
            </div>
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