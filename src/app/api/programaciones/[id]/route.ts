import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { validarPermisosCancion } from '@/lib/utils'
import { authOptions } from '@/lib/auth'

// GET /api/programaciones/[id] - Obtener programación específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const programacion = await prisma.programacion.findUnique({
      where: { id },
      include: {
        asignaciones: {
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
                tonalidad: true,
                videoDanza: true,
                estadoVideoDanza: true
              }
            }
          },
          orderBy: { fechaCreacion: 'asc' }
        },
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true
              }
            }
          },
          orderBy: { fechaCreacion: 'desc' }
        }
      }
    })

    if (!programacion) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 })
    }

    return NextResponse.json(programacion)

  } catch (error) {
    console.error('Error al obtener programación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/programaciones/[id] - Actualizar programación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin y líderes pueden editar programaciones
    if (!validarPermisosCancion(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id } = await params
    
    // Verificar que la programación existe
    const programacionExistente = await prisma.programacion.findUnique({
      where: { id }
    })

    if (!programacionExistente) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 })
    }

    const datos = await request.json()
    
    // Validar datos requeridos
    if (!datos.fecha || !datos.tipoServicio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: fecha, tipoServicio' },
        { status: 400 }
      )
    }

    // Actualizar programación
    const programacionActualizada = await prisma.programacion.update({
      where: { id },
      data: {
        fecha: new Date(datos.fecha),
        tipoServicio: datos.tipoServicio,
        notas: datos.notas || null,
        activa: datos.activa !== undefined ? datos.activa : undefined
      },
      include: {
        asignaciones: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true
              }
            },
            cancion: {
              select: {
                id: true,
                titulo: true,
                artista: true
              }
            }
          }
        },
        _count: {
          select: {
            asignaciones: true,
            comentarios: true
          }
        }
      }
    })

    return NextResponse.json(programacionActualizada)

  } catch (error) {
    console.error('Error al actualizar programación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/programaciones/[id] - Eliminar programación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo administradores pueden eliminar programaciones
    if (session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Sin permisos para eliminar' }, { status: 403 })
    }

    const { id } = await params
    
    // Verificar que la programación existe
    const programacionExistente = await prisma.programacion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            asignaciones: true
          }
        }
      }
    })

    if (!programacionExistente) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 })
    }

    // Eliminar programación (esto también eliminará las asignaciones por la relación en cascada)
    await prisma.programacion.delete({
      where: { id }
    })

    return NextResponse.json({ 
      mensaje: 'Programación eliminada correctamente',
      asignacionesEliminadas: programacionExistente._count.asignaciones
    })

  } catch (error) {
    console.error('Error al eliminar programación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 