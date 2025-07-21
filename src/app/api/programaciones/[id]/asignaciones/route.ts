import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { validarPermisosCancion } from '@/lib/utils'
import { authOptions } from '@/lib/auth'

// POST /api/programaciones/[id]/asignaciones - Crear nueva asignación
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin y líderes pueden crear asignaciones
    if (!validarPermisosCancion(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id: programacionId } = await params
    const datos = await request.json()
    
    // Validar datos requeridos
    if (!datos.usuarioId || !datos.cancionId || !datos.rolCancion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: usuarioId, cancionId, rolCancion' },
        { status: 400 }
      )
    }

    // Verificar que la programación existe
    const programacion = await prisma.programacion.findUnique({
      where: { id: programacionId }
    })

    if (!programacion) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 })
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: datos.usuarioId }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que la canción existe
    const cancion = await prisma.cancion.findUnique({
      where: { id: datos.cancionId }
    })

    if (!cancion) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    // Verificar que no existe ya una asignación igual
    const asignacionExistente = await prisma.asignacionCancion.findUnique({
      where: {
        usuarioId_cancionId_programacionId: {
          usuarioId: datos.usuarioId,
          cancionId: datos.cancionId,
          programacionId: programacionId
        }
      }
    })

    if (asignacionExistente) {
      return NextResponse.json(
        { error: 'Ya existe una asignación para este usuario y canción en esta programación' },
        { status: 409 }
      )
    }

    // Crear asignación
    const nuevaAsignacion = await prisma.asignacionCancion.create({
      data: {
        usuarioId: datos.usuarioId,
        cancionId: datos.cancionId,
        programacionId: programacionId,
        rolCancion: datos.rolCancion,
        estadoPreparacion: datos.estadoPreparacion || 'PENDIENTE',
        notasPersonales: datos.notasPersonales || null
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        cancion: {
          select: {
            id: true,
            titulo: true,
            artista: true,
            album: true,
            duracionSegundos: true,
            letra: true,
            acordes: true,
            tonalidad: true
          }
        },
        programacion: {
          select: {
            id: true,
            fecha: true,
            tipoServicio: true
          }
        }
      }
    })

    return NextResponse.json(nuevaAsignacion, { status: 201 })

  } catch (error) {
    console.error('Error al crear asignación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/programaciones/[id]/asignaciones - Listar asignaciones de una programación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: programacionId } = await params

    // Verificar que la programación existe
    const programacion = await prisma.programacion.findUnique({
      where: { id: programacionId }
    })

    if (!programacion) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 })
    }

    // Obtener asignaciones
    const asignaciones = await prisma.asignacionCancion.findMany({
      where: { programacionId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        cancion: {
          select: {
            id: true,
            titulo: true,
            artista: true,
            album: true,
            duracionSegundos: true,
            letra: true,
            acordes: true,
            tonalidad: true
          }
        }
      },
      orderBy: [
        { cancion: { titulo: 'asc' } },
        { rolCancion: 'asc' }
      ]
    })

    return NextResponse.json(asignaciones)

  } catch (error) {
    console.error('Error al obtener asignaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/programaciones/[id]/asignaciones - Actualizar estado de asignación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: programacionId } = await params
    const datos = await request.json()

    // Validar datos requeridos
    if (!datos.asignacionId) {
      return NextResponse.json(
        { error: 'ID de asignación requerido' },
        { status: 400 }
      )
    }

    // Verificar que la asignación existe
    const asignacion = await prisma.asignacionCancion.findUnique({
      where: { id: datos.asignacionId },
      include: { usuario: true }
    })

    if (!asignacion) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }

    // Verificar permisos: el usuario asignado puede cambiar su estado, admin/líder puede cambiar cualquiera
    const puedeEditar = session.user.role === 'ADMINISTRADOR' || 
                       session.user.role === 'LIDER_ALABANZA' ||
                       session.user.id === asignacion.usuarioId

    if (!puedeEditar) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Preparar datos para actualización
    const datosActualizacion: unknown = {}

    if (datos.hasOwnProperty('preparado')) {
      // Convertir boolean a enum para retrocompatibilidad
      (datosActualizacion as any).estadoPreparacion = datos.preparado ? 'PREPARADO' : 'PENDIENTE'
    } else if (datos.estadoPreparacion) {
      (datosActualizacion as any).estadoPreparacion = datos.estadoPreparacion
    }

    if (datos.notasPersonales !== undefined) {
      (datosActualizacion as any).notasPersonales = datos.notasPersonales
    }

    // Actualizar asignación
    const asignacionActualizada = await prisma.asignacionCancion.update({
      where: { id: datos.asignacionId },
      data: datosActualizacion,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        cancion: {
          select: {
            id: true,
            titulo: true,
            artista: true,
            album: true,
            duracionSegundos: true,
            letra: true,
            acordes: true,
            tonalidad: true
          }
        }
      }
    })

    return NextResponse.json(asignacionActualizada)

  } catch (error) {
    console.error('Error al actualizar asignación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/programaciones/[id]/asignaciones - Eliminar asignación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin y líderes pueden eliminar asignaciones
    if (!validarPermisosCancion(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id: programacionId } = await params
    const datos = await request.json()

    // Validar datos requeridos
    if (!datos.asignacionId) {
      return NextResponse.json(
        { error: 'ID de asignación requerido' },
        { status: 400 }
      )
    }

    // Verificar que la asignación existe
    const asignacion = await prisma.asignacionCancion.findUnique({
      where: { id: datos.asignacionId }
    })

    if (!asignacion) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }

    // Eliminar asignación
    await prisma.asignacionCancion.delete({
      where: { id: datos.asignacionId }
    })

    return NextResponse.json({ mensaje: 'Asignación eliminada correctamente' })

  } catch (error) {
    console.error('Error al eliminar asignación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 