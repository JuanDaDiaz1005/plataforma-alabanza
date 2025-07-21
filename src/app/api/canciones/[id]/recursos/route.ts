import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/canciones/[id]/recursos - Obtener recursos de una canción
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

    const recursos = await prisma.recursoAudio.findMany({
      where: { 
        cancionId: id,
        activo: true
      },
      orderBy: [
        { tipo: 'asc' },
        { fechaCreacion: 'desc' }
      ]
    })

    return NextResponse.json(recursos)

  } catch (error) {
    console.error('Error al obtener recursos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/canciones/[id]/recursos - Crear nuevo recurso
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo administradores y líderes pueden crear recursos
    if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tipo, url, titulo, descripcion } = body

    // Validaciones
    if (!tipo || !url) {
      return NextResponse.json(
        { error: 'Tipo y URL son requeridos' },
        { status: 400 }
      )
    }

    // Validar que la canción existe
    const cancion = await prisma.cancion.findUnique({
      where: { id }
    })

    if (!cancion) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    // Validar URL de YouTube solo si el tipo es VIDEO
    if (tipo === 'VIDEO') {
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        return NextResponse.json(
          { error: 'Por favor ingresa una URL válida de YouTube' },
          { status: 400 }
        )
      }
    }
    // Para AUDIO/MP3, permitir cualquier URL (por ejemplo, Cloudflare)

    // Crear recurso
    const data: {
      cancionId: string;
      tipo: string;
      plataforma: string;
      url: string;
      titulo?: string;
      descripcion?: string;
    } = {
      cancionId: id,
      tipo,
      plataforma: tipo === 'VIDEO' ? 'YOUTUBE' : 'MP3_LOCAL',
      url: url.trim()
    }
    if (titulo && titulo.trim() !== '') data.titulo = titulo.trim()
    if (descripcion && descripcion.trim() !== '') data.descripcion = descripcion.trim()

    const nuevoRecurso = await prisma.recursoAudio.create({
      data
    })

    return NextResponse.json(nuevoRecurso, { status: 201 })

  } catch (error) {
    console.error('Error al crear recurso:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 