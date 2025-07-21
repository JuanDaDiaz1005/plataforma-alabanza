import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { validarPermisosCancion } from '@/lib/utils'
import { authOptions } from '@/lib/auth'

// GET /api/canciones - Listar canciones con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')
    const offset = (page - 1) * limite

    // Construir filtros dinámicamente
    const filtros: unknown = {}
    
    if (busqueda) {
      (filtros as any).OR = [
        { titulo: { contains: busqueda } },
        { artista: { contains: busqueda } },
        { letra: { contains: busqueda } }
      ]
    }

    // Obtener canciones con paginación
    const [canciones, total] = await Promise.all([
      prisma.cancion.findMany({
        where: filtros as any,
        skip: offset,
        take: limite,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          recursosAudio: true,
          _count: {
            select: {
              asignaciones: true,
              comentarios: true
            }
          }
        }
      }),
      prisma.cancion.count({ where: filtros as any })
    ])

    return NextResponse.json({
      canciones,
      total,
      page,
      totalPages: Math.ceil(total / limite)
    })

  } catch (error) {
    console.error('Error al obtener canciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/canciones - Crear nueva canción
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin y líderes pueden crear canciones
    if (!validarPermisosCancion(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const datos = await request.json()
    
    // Validar datos requeridos
    if (!datos.titulo || !datos.artista) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: título, artista' },
        { status: 400 }
      )
    }

    // Crear canción
    const nuevaCancion = await prisma.cancion.create({
      data: {
        titulo: datos.titulo.trim(),
        artista: datos.artista.trim(),
        album: datos.album?.trim() || null,
        duracionSegundos: datos.duracionSegundos ? parseInt(datos.duracionSegundos) : null,
        letra: datos.letra || null,
        acordes: datos.acordes || null,
        tonalidad: datos.tonalidad || null
      },
      include: {
        recursosAudio: true
      }
    })

    return NextResponse.json(nuevaCancion, { status: 201 })

  } catch (error) {
    console.error('Error al crear canción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 
