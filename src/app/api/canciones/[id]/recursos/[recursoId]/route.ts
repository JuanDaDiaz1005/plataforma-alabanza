import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// PUT /api/canciones/[id]/recursos/[recursoId] - Actualizar recurso
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recursoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo administradores y líderes pueden actualizar recursos
    if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, recursoId } = await params
    const body = await request.json()
    const { tipo, url, titulo, descripcion } = body

    // Validaciones
    if (!tipo || !url) {
      return NextResponse.json(
        { error: 'Tipo y URL son requeridos' },
        { status: 400 }
      )
    }

    // Validar URL de YouTube
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'Por favor ingresa una URL válida de YouTube' },
        { status: 400 }
      )
    }

    // Verificar que el recurso existe y pertenece a la canción
    const recursoExistente = await prisma.recursoAudio.findFirst({
      where: {
        id: recursoId,
        cancionId: id
      }
    })

    if (!recursoExistente) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
    }

    // Actualizar recurso
    const data: unknown = {
      tipo,
      url: url.trim()
    }
    if (titulo && titulo.trim() !== '') (data as unknown as { titulo?: string }).titulo = titulo.trim()
    if (descripcion && descripcion.trim() !== '') (data as unknown as { descripcion?: string }).descripcion = descripcion.trim()

    const recursoActualizado = await prisma.recursoAudio.update({
      where: { id: recursoId },
      data
    })

    return NextResponse.json(recursoActualizado)

  } catch (error) {
    console.error('Error al actualizar recurso:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/canciones/[id]/recursos/[recursoId] - Eliminar recurso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recursoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo administradores y líderes pueden eliminar recursos
    if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, recursoId } = await params

    // Verificar que el recurso existe y pertenece a la canción
    const recursoExistente = await prisma.recursoAudio.findFirst({
      where: {
        id: recursoId,
        cancionId: id
      }
    })

    if (!recursoExistente) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
    }

    // Eliminación física: borrar el recurso de la base de datos
    await prisma.recursoAudio.delete({
      where: { id: recursoId }
    })

    return NextResponse.json({ mensaje: 'Recurso eliminado exitosamente' })

  } catch (error) {
    console.error('Error al eliminar recurso:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 