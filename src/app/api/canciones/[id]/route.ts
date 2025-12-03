import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/canciones/[id] - Obtener canción específica
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

    const cancion = await prisma.cancion.findUnique({
      where: { id },
      include: {
        asignaciones: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rol: true
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
              fecha: 'desc'
            }
          }
        },
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                rol: true
              }
            }
          },
          orderBy: {
            fechaCreacion: 'desc'
          }
        },
        recursosAudio: {
          orderBy: {
            fechaCreacion: 'desc'
          }
        }
      }
    })

    if (!cancion) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    return NextResponse.json(cancion)

  } catch (error) {
    console.error('Error al obtener canción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/canciones/[id] - Actualizar canción
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { titulo, artista, album, duracionSegundos, letra, acordes, tonalidad } = body

    // Validaciones básicas
    if (!titulo || !artista) {
      return NextResponse.json(
        { error: 'Título y artista son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la canción existe
    const cancionExistente = await prisma.cancion.findUnique({
      where: { id }
    })

    if (!cancionExistente) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    // Actualizar canción
    const cancionActualizada = await prisma.cancion.update({
      where: { id },
      data: {
        titulo: titulo.trim(),
        artista: artista.trim(),
        album: album?.trim() || null,
        duracionSegundos: duracionSegundos ? parseInt(duracionSegundos) : null,
        letra: letra?.trim() || null,
        acordes: acordes?.trim() || null,
        tonalidad: tonalidad?.trim() || null
      }
    })

    return NextResponse.json(cancionActualizada)

  } catch (error) {
    console.error('Error al actualizar canción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/canciones/[id] - Eliminar canción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la canción existe
    const cancion = await prisma.cancion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            asignaciones: true,
            comentarios: true,
            recursosAudio: true
          }
        }
      }
    })

    if (!cancion) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    // Eliminar la canción (las relaciones se manejan con cascada)
    await prisma.cancion.delete({
      where: { id }
    })

    return NextResponse.json({ 
      mensaje: 'Canción eliminada exitosamente',
      datosEliminados: {
        titulo: cancion.titulo,
        artista: cancion.artista,
        asignaciones: cancion._count.asignaciones,
        comentarios: cancion._count.comentarios,
        recursosAudio: cancion._count.recursosAudio
      }
    })

  } catch (error) {
    console.error('Error al eliminar canción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 