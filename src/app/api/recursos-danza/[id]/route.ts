import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// PUT /api/recursos-danza/[id] - Actualizar recurso de danza
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const datos = await request.json()

    // Verificar que el recurso existe
    const recursoExistente = await prisma.recursoDanza.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    if (!recursoExistente) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
    }

    // Solo el creador del recurso, líderes de danza o administradores pueden editar
    if (
      recursoExistente.usuarioId !== session.user.id &&
      session.user.role !== 'LIDER_DANZA' &&
      session.user.role !== 'ADMINISTRADOR'
    ) {
      return NextResponse.json({ error: 'Sin permisos para editar este recurso' }, { status: 403 })
    }

    // Validar datos requeridos
    if (!datos.titulo || !datos.descripcion || !datos.url || !datos.categoria) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, descripcion, url, categoria' },
        { status: 400 }
      )
    }

    // Validar que la URL sea de YouTube
    if (!datos.url.includes('youtube.com') && !datos.url.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'La URL debe ser de YouTube' },
        { status: 400 }
      )
    }

    // Validar categoría
    const categoriasValidas = ['tutorial', 'predica', 'coreografia', 'tecnica', 'otro']
    if (!categoriasValidas.includes(datos.categoria)) {
      return NextResponse.json(
        { error: 'Categoría no válida' },
        { status: 400 }
      )
    }

    // Actualizar el recurso
    const recursoActualizado = await prisma.recursoDanza.update({
      where: { id },
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        url: datos.url,
        categoria: datos.categoria.toUpperCase()
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    const recursoRespuesta = {
      id: recursoActualizado.id,
      titulo: recursoActualizado.titulo,
      descripcion: recursoActualizado.descripcion,
      url: recursoActualizado.url,
      categoria: recursoActualizado.categoria.toLowerCase(),
      creadoPor: {
        id: recursoActualizado.usuario.id,
        nombre: recursoActualizado.usuario.nombre
      },
      fechaCreacion: recursoActualizado.fechaCreacion.toISOString()
    }

    return NextResponse.json(recursoRespuesta)

  } catch (error) {
    console.error('Error al actualizar recurso de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/recursos-danza/[id] - Eliminar recurso de danza
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el recurso existe
    const recursoExistente = await prisma.recursoDanza.findUnique({
      where: { id }
    })

    if (!recursoExistente) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
    }

    // Solo el creador del recurso, líderes de danza o administradores pueden eliminar
    if (
      recursoExistente.usuarioId !== session.user.id &&
      session.user.role !== 'LIDER_DANZA' &&
      session.user.role !== 'ADMINISTRADOR'
    ) {
      return NextResponse.json({ error: 'Sin permisos para eliminar este recurso' }, { status: 403 })
    }

    // Eliminación lógica (marcar como inactivo)
    await prisma.recursoDanza.update({
      where: { id },
      data: { activo: false }
    })

    return NextResponse.json({ mensaje: 'Recurso eliminado exitosamente' })

  } catch (error) {
    console.error('Error al eliminar recurso de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 