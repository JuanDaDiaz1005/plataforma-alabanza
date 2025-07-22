import React from 'react';
import { Calendar, Music, ChevronRight, CheckCircle, AlertCircle, Mic } from 'lucide-react';

interface ProximoServicioResumenProps {
  proximoServicio: {
    id: string;
    fecha: string;
    tipoServicio: string;
    asignaciones: AsignacionServicio[];
    totalAsignaciones: number;
    asignacionesPendientes: number;
  };
  colorGradiente: string; // ej: 'from-blue-500 to-purple-600'
  colorAcento: string; // ej: 'text-blue-600'
  icono?: React.ReactNode;
  obtenerColorEstado: (estado: string) => string;
  obtenerTextoEstado: (estado: string) => string;
  obtenerTextoRol: (rol: string) => string;
}

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
    rolCancion: string;
  };
  rolCancion: string;
  estadoPreparacion: string;
}

export default function ProximoServicioResumen({
  proximoServicio,
  colorGradiente,
  colorAcento,
  icono,
  obtenerColorEstado,
  obtenerTextoEstado,
  obtenerTextoRol
}: ProximoServicioResumenProps) {
  // Agrupar asignaciones por canción
  const agrupadas = proximoServicio.asignaciones.reduce((acc: Record<string, { cancion: AsignacionServicio['cancion']; asignaciones: AsignacionServicio[]; index: number } & { _order?: string[] }>, asignacion: AsignacionServicio) => {
    const id = asignacion.cancion.id;
    if (!acc[id]) acc[id] = { cancion: asignacion.cancion, asignaciones: [], index: acc._order ? acc._order.length : 0 };
    acc[id].asignaciones.push(asignacion);
    if (!acc._order) acc._order = [];
    if (!acc._order.includes(id)) acc._order.push(id);
    return acc;
  }, {} as Record<string, { cancion: AsignacionServicio['cancion']; asignaciones: AsignacionServicio[]; index: number } & { _order?: string[] }>);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`bg-gradient-to-r ${colorGradiente} p-2 rounded-lg`}>
          {icono || <Calendar className="h-6 w-6 text-white" />}
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
                <span className={`bg-gradient-to-r ${colorGradiente} text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg`}>
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
            {/* Agrupar asignaciones por canción en orden de registro */}
            {proximoServicio.asignaciones.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`bg-gradient-to-r ${colorGradiente} p-1.5 rounded-lg`}>
                    <Music className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Repertorio programado:</p>
                </div>
                <div className="space-y-3">
                  {Object.entries(agrupadas)
                    .filter(([key]) => key !== '_order')
                    .sort((a, b) => {
                      const orderA = proximoServicio.asignaciones.findIndex((asig: AsignacionServicio) => asig.cancion.id === a[0]);
                      const orderB = proximoServicio.asignaciones.findIndex((asig: AsignacionServicio) => asig.cancion.id === b[0]);
                      return orderA - orderB;
                    })
                    .map(([cancionId, { cancion, asignaciones }]) => (
                      <div key={cancionId} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="font-bold text-gray-900 text-sm mb-1">{cancion.titulo} <span className="text-gray-500 font-normal">por {cancion.artista}</span></div>
                        <div className="space-y-1">
                          {asignaciones.map((asig) => (
                            <div key={asig.id} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-800 font-medium flex items-center gap-1"><Mic className={`h-3 w-3 ${colorAcento}`} />{asig.usuario.nombre}</span>
                              <span className="text-gray-500 flex items-center gap-1">{obtenerTextoRol(asig.rolCancion)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${obtenerColorEstado(asig.estadoPreparacion)}`}>{obtenerTextoEstado(asig.estadoPreparacion)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="ml-6">
            <div className={`bg-gradient-to-r ${colorGradiente} p-3 rounded-full shadow-lg`}>
              <ChevronRight className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}