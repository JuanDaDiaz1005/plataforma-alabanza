import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { RecursoAudio, Cancion, TipoRecurso, PlataformaAudio } from '@prisma/client'

// GET /api/biblioteca - Obtener canciones con recursos de audio para la biblioteca
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda') || ''
    const tipoRecurso = searchParams.get('tipo') || ''
    const plataforma = searchParams.get('plataforma') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')
    const offset = (page - 1) * limite

    // Construir filtros (SQLite no soporta mode: insensitive)
    interface FiltrosCancion {
      OR?: Array<{ titulo?: { contains: string }; artista?: { contains: string }; album?: { contains: string } }>
    }
    const filtros: FiltrosCancion = {};
    if (busqueda) {
      const busquedaLower: string = busqueda.toLowerCase();
      filtros.OR = [
        { titulo: { contains: busquedaLower } },
        { artista: { contains: busquedaLower } },
        { album: { contains: busquedaLower } }
      ];
    }

    // Filtros para recursosAudio usando enums de Prisma
    const recursoAudioWhere: Partial<Pick<RecursoAudio, 'activo' | 'tipo' | 'plataforma'>> = { activo: true };
    if (tipoRecurso && Object.values(TipoRecurso).includes(tipoRecurso as TipoRecurso)) {
      recursoAudioWhere.tipo = tipoRecurso as TipoRecurso;
    }
    if (plataforma && Object.values(PlataformaAudio).includes(plataforma as PlataformaAudio)) {
      recursoAudioWhere.plataforma = plataforma as PlataformaAudio;
    }

    // Obtener canciones con al menos un recurso de audio
    const [canciones, total] = await Promise.all([
      prisma.cancion.findMany({
        where: {
          ...filtros,
          recursosAudio: {
            some: recursoAudioWhere
          }
        },
        include: {
          recursosAudio: {
            where: recursoAudioWhere,
            orderBy: [
              { tipo: 'asc' },
              { fechaCreacion: 'desc' }
            ]
          },
          _count: {
            select: {
              asignaciones: true,
              comentarios: true
            }
          }
        },
        skip: offset,
        take: limite,
        orderBy: { titulo: 'asc' }
      }),
      prisma.cancion.count({
        where: {
          ...filtros,
          recursosAudio: {
            some: recursoAudioWhere
          }
        }
      })
    ])

    // Tipos explícitos para el mapeo de canciones usando Prisma
    type CancionExtendida = Cancion & {
      recursosAudio: RecursoAudio[];
      _count: { asignaciones: number; comentarios: number };
    };
    const cancionesConRecursos: CancionExtendida[] = canciones.map((cancion) => ({
      ...cancion,
      recursosAudio: (cancion.recursosAudio ?? []).map((recurso) => ({
        ...recurso,
        metadatos: recurso.metadatos ? JSON.parse(recurso.metadatos as string) : null
      }))
    }))

    return NextResponse.json({
      canciones: cancionesConRecursos,
      total,
      page,
      totalPages: Math.ceil(total / limite),
      hasNext: page < Math.ceil(total / limite),
      hasPrev: page > 1
    })

  } catch (error) {
    console.error('Error al obtener biblioteca:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}