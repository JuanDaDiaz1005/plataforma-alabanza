import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
    const filtros: unknown = {}
    
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      (filtros as unknown).OR = [
        { titulo: { contains: busquedaLower } },
        { artista: { contains: busquedaLower } },
        { album: { contains: busquedaLower } }
      ]
    }

    // Obtener canciones con al menos un recurso de audio
    const [canciones, total] = await Promise.all([
      prisma.cancion.findMunknown({
        where: {
          ...filtros,
          recursosAudio: {
            some: {
              activo: true,
              ...(tipoRecurso && { tipo: tipoRecurso }),
              ...(plataforma && { plataforma: plataforma })
            }
          }
        },
        include: {
          recursosAudio: {
            where: {
              activo: true,
              ...(tipoRecurso && { tipo: tipoRecurso }),
              ...(plataforma && { plataforma: plataforma })
            },
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
            some: {
              activo: true,
              ...(tipoRecurso && { tipo: tipoRecurso }),
              ...(plataforma && { plataforma: plataforma })
            }
          }
        }
      })
    ])

    // Procesar metadatos JSON
    const cancionesConRecursos = canciones.map(cancion => ({
      ...cancion,
      recursosAudio: cancion.recursosAudio.map(recurso => ({
        ...recurso,
        metadatos: recurso.metadatos ? JSON.parse(recurso.metadatos) : null
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