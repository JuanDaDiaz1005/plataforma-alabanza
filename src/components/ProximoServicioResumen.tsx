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
  esDanza?: boolean; // Para vista de danza (solo danzoras)
  esLiderOAdmin?: boolean; // Para líderes y admin (todos los roles)
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
  obtenerTextoRol,
  esDanza = false,
  esLiderOAdmin = false
}: ProximoServicioResumenProps) {
  // Filtrar asignaciones según el rol
  const asignacionesFiltradas = esLiderOAdmin 
    ? proximoServicio.asignaciones // Líderes y admin ven TODOS los roles
    : esDanza 
      ? proximoServicio.asignaciones.filter(asignacion => 
          asignacion.usuario.rolCancion === 'DANZA' || asignacion.usuario.rolCancion === 'LIDER_DANZA'
        ) // Vista de danza: solo danzoras
      : proximoServicio.asignaciones.filter(asignacion => 
          asignacion.usuario.rolCancion !== 'DANZA' && asignacion.usuario.rolCancion !== 'LIDER_DANZA'
        ); // Vista regular: cantantes y músicos

  // Agrupar asignaciones por canción y mantener el orden
  const agrupadas: Record<string, { cancion: AsignacionServicio['cancion']; asignaciones: AsignacionServicio[]; index: number }> = {};
  const order: string[] = [];
  asignacionesFiltradas.forEach((asignacion) => {
    const id = asignacion.cancion.id;
    if (!agrupadas[id]) {
      agrupadas[id] = { cancion: asignacion.cancion, asignaciones: [], index: order.length };
      order.push(id);
    }
    agrupadas[id].asignaciones.push(asignacion);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className={`bg-gradient-to-r ${colorGradiente} p-2 rounded-lg`}>
          {icono || <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            Próximo Servicio
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Estado del equipo y programación</p>
        </div>
      </div>
      <a 
        href={`/programacion/${proximoServicio.id}`}
        className="block bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border border-blue-100 hover:border-blue-200 hover:shadow-md"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 capitalize break-words">
                {proximoServicio.fecha}
              </h4>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`bg-gradient-to-r ${colorGradiente} text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg`}>
                  {proximoServicio.tipoServicio}
                </span>
                <span className="text-gray-500 text-xs sm:text-sm bg-white px-2 sm:px-3 py-1 rounded-full border">
                  {proximoServicio.totalAsignaciones} asignaciones
                </span>
              </div>
            </div>
            <div className="flex items-center">
              {proximoServicio.asignacionesPendientes > 0 ? (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 sm:px-4 py-2 rounded-lg">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">
                    {proximoServicio.asignacionesPendientes} asignaciones pendientes
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 sm:px-4 py-2 rounded-lg">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">Todo el equipo está listo</span>
                </div>
              )}
            </div>
            {/* Agrupar asignaciones por canción en orden de registro */}
            {asignacionesFiltradas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`bg-gradient-to-r ${colorGradiente} p-1.5 rounded-lg`}>
                    <Music className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">Repertorio programado:</p>
                </div>
                <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-none overflow-y-auto">
                  {order.map((cancionId) => {
                    const { cancion, asignaciones } = agrupadas[cancionId];
                    return (
                      <div key={cancionId} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm mb-1 break-words">
                          <span className="block sm:inline">{cancion.titulo}</span>{' '}
                          <span className="text-gray-500 font-normal text-xs block sm:inline">por {cancion.artista}</span>
                        </div>
                        <div className="space-y-1">
                          {asignaciones.map((asig) => (
                            <div key={asig.id} className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                              <span className="text-gray-800 font-medium flex items-center gap-1 min-w-0">
                                <Mic className={`h-3 w-3 ${colorAcento} flex-shrink-0`} />
                                <span className="truncate">{asig.usuario.nombre}</span>
                              </span>
                              <span className="text-gray-500 flex items-center gap-1 text-xs">
                                <span className="truncate">{obtenerTextoRol(asig.rolCancion)}</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${obtenerColorEstado(asig.estadoPreparacion)} flex-shrink-0`}>
                                {obtenerTextoEstado(asig.estadoPreparacion)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center sm:block sm:ml-4 lg:ml-6">
            <div className={`bg-gradient-to-r ${colorGradiente} p-2 sm:p-3 rounded-full shadow-lg flex-shrink-0`}>
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}