import Link from 'next/link';
import { Calendar, Music } from 'lucide-react';
import React from 'react';

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
}

interface ServicioCardProps {
  id: string;
  tipoServicio: string;
  fecha: string;
  activa: boolean;
  notas?: string;
  canciones: Cancion[];
  acciones?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  esDanza?: boolean;
}

export default function ServicioCard({
  id,
  tipoServicio,
  fecha,
  activa,
  notas,
  canciones,
  acciones,
  onClick,
  href,
  esDanza
}: ServicioCardProps) {
  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // Formatear tipo de servicio
  const formatearTipoServicio = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'MIERCOLES': 'Miércoles',
      'DOMINGO': 'Domingo',
      'SABADO': 'Sábado',
      'JUEVES': 'Jueves',
      'ESPECIAL': 'Especial'
    };
    return tipos[tipo] || tipo;
  };

  const CardContent = (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      <div className="block p-6 cursor-pointer">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {formatearTipoServicio(tipoServicio)}
            </h3>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm text-gray-600">
                {formatearFecha(fecha)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activa
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>
        {notas && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 line-clamp-2">
              {notas}
            </p>
          </div>
        )}
        <div className="space-y-3 mb-12">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1.5 rounded-lg">
              <Music className="h-3 w-3 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">
              {esDanza ? 'Canciones para Danza:' : 'Repertorio:'}
            </h4>
          </div>
          <div className="space-y-2">
            {canciones.slice(0, 3).map((cancion) => (
              <div key={cancion.id} className="text-sm text-gray-600 flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="truncate font-medium">{cancion.titulo}</span>
                <span className="text-gray-500 text-xs">- {cancion.artista}</span>
              </div>
            ))}
            {canciones.length > 3 && (
              <div className="text-center">
                <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                  +{canciones.length - 3} canciones más
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Acciones (botones) */}
      {acciones && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          {acciones}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} onClick={onClick}>{CardContent}</Link>;
  }
  return CardContent;
}