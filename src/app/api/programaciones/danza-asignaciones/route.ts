import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/programaciones/danza-asignaciones?usuarioId=xxx OR ?programacionId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')
    const programacionId = searchParams.get('programacionId')

    if (!usuarioId && !programacionId) {
      return NextResponse.json({ error: 'ID de usuario o programación requerido' }, { status: 400 })
    }

    // Construir where clause según los parámetros
    const whereClause: { usuarioId?: string; programacionId?: string; programacion?: { fecha: { gte: Date } } } = {}

    if (usuarioId) {
      // Verificar que el usuario solicitado es el mismo que la sesión o es líder de danza
      if (session.user.id !== usuarioId && session.user.role !== 'LIDER_DANZA' && session.user.role !== 'ADMINISTRADOR') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
      
      whereClause.usuarioId = usuarioId
      whereClause.programacion = {
        fecha: {
          gte: new Date() // Solo futuras programaciones
        }
      }
    }

    if (programacionId) {
      // Verificar permisos para ver asignaciones de la programación
      if (session.user.role !== 'LIDER_DANZA' && session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA' && session.user.role !== 'DANZA') {
        console.log(`API: Usuario ${session.user.id} con rol ${session.user.role} sin permisos para ver asignaciones de programación`)
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
      
      console.log(`API: Usuario ${session.user.id} con rol ${session.user.role} consultando asignaciones de programación ${programacionId}`)
      whereClause.programacionId = programacionId
    }

    // Obtener asignaciones de danza
    const asignaciones = await prisma.liderDanzaAsignacion.findMany({
      where: whereClause,
      include: {
        cancion: {
          select: {
            id: true,
            titulo: true,
            artista: true,
            videoDanza: true,
            estadoVideoDanza: true
          }
        },
        programacion: {
          select: {
            id: true,
            fecha: true,
            tipoServicio: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        programacion: {
          fecha: 'asc'
        }
      }
    })

    console.log(`API: Encontradas ${asignaciones.length} asignaciones de danza para ${usuarioId ? 'usuario ' + usuarioId : 'programación ' + programacionId}`)

    // Mapear a la estructura esperada
    const asignacionesMapeadas = asignaciones.map(asignacion => ({
      id: asignacion.id,
      usuarioId: asignacion.usuarioId,
      cancionId: asignacion.cancionId,
      estadoPreparacion: asignacion.estadoPreparacion,
      notasPersonales: asignacion.notasPersonales,
      fechaActualizacion: asignacion.fechaActualizacion,
      usuario: {
        id: asignacion.usuario.id,
        nombre: asignacion.usuario.nombre,
        email: asignacion.usuario.email
      },
      cancion: {
        id: asignacion.cancion.id,
        titulo: asignacion.cancion.titulo,
        artista: asignacion.cancion.artista,
        videoDanza: asignacion.cancion.videoDanza,
        estadoVideoDanza: asignacion.cancion.estadoVideoDanza
      },
      programacion: {
        id: asignacion.programacion.id,
        fecha: asignacion.programacion.fecha,
        tipoServicio: asignacion.programacion.tipoServicio
      }
    }))

    // Si es para un usuario específico, devolver en el formato esperado por el dashboard
    if (usuarioId) {
      return NextResponse.json(asignacionesMapeadas)
    }

    // Si es para una programación, devolver directamente el array
    return NextResponse.json(asignacionesMapeadas)

  } catch (error) {
    console.error('Error al obtener asignaciones de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 