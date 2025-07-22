import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { validarPermisosCancion } from '@/lib/utils'
import { authOptions } from '@/lib/auth'

// GET /api/programaciones - Listar programaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pagina = parseInt(searchParams.get('page') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const tipoServicio = searchParams.get('tipoServicio')
    const activa = searchParams.get('activa')
    const cantanteId = searchParams.get('cantanteId')

    const skip = (pagina - 1) * limite

    // Construir filtros
    const filtros: unknown = {}
    
    if (fechaDesde || fechaHasta) {
      (filtros as unknown as { fecha?: { gte?: Date; lte?: Date } }).fecha = {}
      if (fechaDesde) (filtros as unknown as { fecha?: { gte?: Date; lte?: Date } }).fecha.gte = new Date(fechaDesde)
      if (fechaHasta) (filtros as unknown as { fecha?: { gte?: Date; lte?: Date } }).fecha.lte = new Date(fechaHasta)
    }

    if (tipoServicio) {
      (filtros as unknown as { tipoServicio?: string }).tipoServicio = tipoServicio
    }

    if (activa !== null && activa !== undefined) {
      (filtros as unknown as { activa?: boolean }).activa = activa === 'true'
    }

    // Si se solicita por cantante, devolver asignaciones específicas
    if (cantanteId) {
      const asignaciones = await prisma.asignacionCancion.findMany({
        where: {
          usuarioId: cantanteId,
          programacion: {
            fecha: {
              gte: new Date() // Solo futuras programaciones
            }
          }
        },
        include: {
          cancion: {
            select: {
              id: true,
              titulo: true,
              artista: true,
              duracionSegundos: true,
              album: true,
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
        },
        orderBy: {
          programacion: {
            fecha: 'asc'
          }
        }
      })

      // Mapear a la estructura esperada por el dashboard
      const asignacionesMapeadas = asignaciones.map(asignacion => ({
        id: asignacion.id,
        cancion: {
          id: asignacion.cancion.id,
          titulo: asignacion.cancion.titulo,
          artista: asignacion.cancion.artista,
          duracionSegundos: asignacion.cancion.duracionSegundos,
          album: asignacion.cancion.album,
          tonalidad: asignacion.cancion.tonalidad
        },
        programacion: {
          id: asignacion.programacion.id,
          fecha: asignacion.programacion.fecha,
          tipoServicio: asignacion.programacion.tipoServicio
        },
        rolCancion: asignacion.rolCancion,
        estadoPreparacion: asignacion.estadoPreparacion,
        notasPersonales: asignacion.notasPersonales
      }))

      return NextResponse.json({
        asignaciones: asignacionesMapeadas
      })
    }

    // Obtener programaciones
    const [programaciones, total] = await Promise.all([
      prisma.programacion.findMany({
        where: filtros,
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
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limite
      }),
      prisma.programacion.count({ where: filtros })
    ])

    return NextResponse.json({
      programaciones,
      pagination: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite)
      }
    })

  } catch (error) {
    console.error('Error al obtener programaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/programaciones - Crear nueva programación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin y líderes pueden crear programaciones
    if (!validarPermisosCancion(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const datos = await request.json()
    
    // Validar datos requeridos
    if (!datos.fecha || !datos.tipoServicio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: fecha, tipoServicio' },
        { status: 400 }
      )
    }

    // Validar que la fecha no sea en el pasado
    const fechaProgramacion = new Date(datos.fecha)
    const ahora = new Date()
    if (fechaProgramacion < ahora) {
      return NextResponse.json(
        { error: 'La fecha de programación no puede ser en el pasado' },
        { status: 400 }
      )
    }

    // Crear programación
    const nuevaProgramacion = await prisma.programacion.create({
      data: {
        fecha: fechaProgramacion,
        tipoServicio: datos.tipoServicio,
        notas: datos.notas || null
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

    return NextResponse.json(nuevaProgramacion, { status: 201 })

  } catch (error) {
    console.error('Error al crear programación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 
