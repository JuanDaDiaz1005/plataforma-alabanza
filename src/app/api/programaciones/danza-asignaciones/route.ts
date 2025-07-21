import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/programaciones/danza-asignaciones?usuarioId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')

    if (!usuarioId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // Verificar que el usuario solicitado es el mismo que la sesión o es líder de danza
    if (session.user.id !== usuarioId && session.user.role !== 'LIDER_DANZA') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Obtener asignaciones de danza del usuario
    const asignaciones = await prisma.liderDanzaAsignacion.findMunknown({
      where: {
        usuarioId: usuarioId,
        programacion: {
          fecha: {
            gte: new Date() // Solo futuras programaciones
          }
        }
      },
      include: {
        cancion: {
          select: {
            id: true,
            titulo: true,
            artista: true,
            videoDanza: true
          }
        },
        programacion: {
          select: {
            id: true,
            fecha: true,
            tipoServicio: true
          }
        }
      },
      orderBy: {
        programacion: {
          fecha: 'asc'
        }
      }
    })

    // Mapear a la estructura esperada
    const asignacionesMapeadas = asignaciones.map(asignacion => ({
      id: asignacion.id,
      cancion: {
        id: asignacion.cancion.id,
        titulo: asignacion.cancion.titulo,
        artista: asignacion.cancion.artista,
        videoDanza: asignacion.cancion.videoDanza
      },
      programacion: {
        id: asignacion.programacion.id,
        fecha: asignacion.programacion.fecha,
        tipoServicio: asignacion.programacion.tipoServicio
      },
      tipo: 'LIDER_DANZA',
      fechaCreacion: asignacion.fechaCreacion
    }))

    return NextResponse.json({
      asignaciones: asignacionesMapeadas
    })

  } catch (error) {
    console.error('Error al obtener asignaciones de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 