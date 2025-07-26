import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/recursos-danza - Listar recursos de danza
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario tenga acceso (DANZA o LIDER_DANZA)
    if (!['DANZA', 'LIDER_DANZA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda')
    const categoria = searchParams.get('categoria')

    // Usar la nueva tabla RecursoDanza
    const whereClause = {
      activo: true,
      ...(busqueda && {
        OR: [
          {
            titulo: {
              contains: busqueda,
              mode: 'insensitive' as const
            }
          },
          {
            descripcion: {
              contains: busqueda,
              mode: 'insensitive' as const
            }
          }
        ]
      }),
      ...(categoria && {
        categoria: categoria.toUpperCase()
      })
    }

    const recursos = await prisma.recursoDanza.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    })

    // Mapear los recursos al formato esperado
    const recursosMapeados = recursos.map(recurso => ({
      id: recurso.id,
      titulo: recurso.titulo,
      descripcion: recurso.descripcion,
      url: recurso.url,
      categoria: recurso.categoria.toLowerCase(),
      creadoPor: {
        id: recurso.usuario.id,
        nombre: recurso.usuario.nombre
      },
      fechaCreacion: recurso.fechaCreacion.toISOString()
    }))

    return NextResponse.json({ recursos: recursosMapeados })

  } catch (error) {
    console.error('Error al obtener recursos de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/recursos-danza - Crear nuevo recurso de danza
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario tenga acceso (DANZA o LIDER_DANZA)
    if (!['DANZA', 'LIDER_DANZA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const datos = await request.json()
    
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

    // Crear el recurso usando la nueva tabla RecursoDanza
    const nuevoRecurso = await prisma.recursoDanza.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        url: datos.url,
        categoria: datos.categoria.toUpperCase(),
        usuarioId: session.user.id
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
      id: nuevoRecurso.id,
      titulo: nuevoRecurso.titulo,
      descripcion: nuevoRecurso.descripcion,
      url: nuevoRecurso.url,
      categoria: nuevoRecurso.categoria.toLowerCase(),
      creadoPor: {
        id: nuevoRecurso.usuario.id,
        nombre: nuevoRecurso.usuario.nombre
      },
      fechaCreacion: nuevoRecurso.fechaCreacion.toISOString()
    }

    return NextResponse.json(recursoRespuesta, { status: 201 })

  } catch (error) {
    console.error('Error al crear recurso de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 