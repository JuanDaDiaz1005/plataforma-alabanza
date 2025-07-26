import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { puedeEditarVideoDanza } from '@/lib/utils'
import { authOptions } from '@/lib/auth'

// PUT /api/canciones/[id]/video-danza - Actualizar video de danza
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo líder de danza puede editar videos de danza
    if (!puedeEditarVideoDanza(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos para editar videos de danza' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { videoDanza, estadoVideoDanza } = body

    // Validar URL de YouTube si se proporciona
    if (videoDanza && !videoDanza.includes('youtube.com') && !videoDanza.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'Debe ser una URL válida de YouTube' },
        { status: 400 }
      )
    }

    // Validar estado del video de danza si se proporciona
    const estadosValidos = ['SIN_GRABAR', 'GRABADO', 'REGRABAR']
    if (estadoVideoDanza && !estadosValidos.includes(estadoVideoDanza)) {
      return NextResponse.json(
        { error: 'Estado de video inválido. Debe ser: SIN_GRABAR, GRABADO o REGRABAR' },
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

    // Preparar datos para actualización
    const datosActualizacion: any = {}
    
    if (videoDanza !== undefined) {
      datosActualizacion.videoDanza = videoDanza || null
    }
    
    if (estadoVideoDanza) {
      datosActualizacion.estadoVideoDanza = estadoVideoDanza
    }

    // Actualizar campos de video de danza
    const cancionActualizada = await prisma.cancion.update({
      where: { id },
      data: datosActualizacion,
      select: {
        id: true,
        titulo: true,
        artista: true,
        videoDanza: true,
        estadoVideoDanza: true
      }
    })

    return NextResponse.json(cancionActualizada)

  } catch (error) {
    console.error('Error al actualizar video de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/canciones/[id]/video-danza - Eliminar video de danza
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo líder de danza puede eliminar videos de danza
    if (!puedeEditarVideoDanza(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos para eliminar videos de danza' }, { status: 403 })
    }

    const { id } = await params

    // Verificar que la canción existe
    const cancionExistente = await prisma.cancion.findUnique({
      where: { id }
    })

    if (!cancionExistente) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    // Eliminar video de danza
    const cancionActualizada = await prisma.cancion.update({
      where: { id },
      data: {
        videoDanza: null
      },
      select: {
        id: true,
        titulo: true,
        artista: true,
        videoDanza: true
      }
    })

    return NextResponse.json(cancionActualizada)

  } catch (error) {
    console.error('Error al eliminar video de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 