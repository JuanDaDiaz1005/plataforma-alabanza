import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { CategoriaRecursoAlabanza } from '@prisma/client'

// GET /api/recursos-alabanza - Listar recursos de alabanza
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario tenga acceso (LIDER_ALABANZA, CANTANTE, MUSICO, ADMINISTRADOR)
    if (!['LIDER_ALABANZA', 'CANTANTE', 'MUSICO', 'ADMINISTRADOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda')
    const categoria = searchParams.get('categoria')

    // Validar categoría si se proporciona
    const categoriasValidas = ['VOCAL', 'GUITARRA', 'PIANO', 'BATERIA', 'BAJO', 'TEORIA', 'PREDICA', 'OTRO']
    const categoriaValida = categoria && categoriasValidas.includes(categoria.toUpperCase()) 
      ? categoria.toUpperCase() as CategoriaRecursoAlabanza 
      : undefined

    // Usar la nueva tabla RecursoAlabanza
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
      ...(categoriaValida && {
        categoria: categoriaValida
      })
    }

    const recursos = await prisma.recursoAlabanza.findMany({
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
    console.error('Error al obtener recursos de alabanza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/recursos-alabanza - Crear nuevo recurso de alabanza
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario tenga acceso (LIDER_ALABANZA, CANTANTE, MUSICO, ADMINISTRADOR)
    if (!['LIDER_ALABANZA', 'CANTANTE', 'MUSICO', 'ADMINISTRADOR'].includes(session.user.role)) {
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
    const categoriasValidas = ['vocal', 'guitarra', 'piano', 'bateria', 'bajo', 'teoria', 'predica', 'otro']
    if (!categoriasValidas.includes(datos.categoria)) {
      return NextResponse.json(
        { error: 'Categoría no válida' },
        { status: 400 }
      )
    }

    // Crear el recurso usando la nueva tabla RecursoAlabanza
    const nuevoRecurso = await prisma.recursoAlabanza.create({
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
    console.error('Error al crear recurso de alabanza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 