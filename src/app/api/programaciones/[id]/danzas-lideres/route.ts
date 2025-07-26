import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { EstadoPreparacion } from '@prisma/client'

// GET /api/programaciones/[id]/danzas-lideres
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id: programacionId } = await params
    // Traer líderes de danza por canción para el servicio
    const lideres = await prisma.liderDanzaAsignacion.findMany({
      where: { programacionId },
      include: {
        usuario: { select: { id: true, nombre: true } },
        cancion: { select: { id: true, titulo: true } }
      }
    })
    // Agrupar por canción
    const porCancion: Record<string, { cancionId: string, titulo: string, lideres: Array<{ id: string, nombre: string }> }> = {}
    lideres.forEach(l => {
      if (!porCancion[l.cancionId]) {
        porCancion[l.cancionId] = { cancionId: l.cancionId, titulo: l.cancion.titulo, lideres: [] }
      }
      porCancion[l.cancionId].lideres.push({ id: l.usuario.id, nombre: l.usuario.nombre })
    })
    return NextResponse.json(Object.values(porCancion))
  } catch (error) {
    console.error('Error al obtener líderes de danza:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/programaciones/[id]/danzas-lideres
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'LIDER_DANZA') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id: programacionId } = await params
    const body = await request.json()
    const { cancionId, usuarioIds } = body // usuarioIds: string[]
    if (!cancionId || !Array.isArray(usuarioIds)) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    // Eliminar líderes previos para esa canción/servicio
    await prisma.liderDanzaAsignacion.deleteMany({ where: { programacionId, cancionId } })
    // Crear nuevas asignaciones
    const nuevas = await prisma.liderDanzaAsignacion.createMany({
      data: usuarioIds.map((usuarioId: string) => ({ programacionId, cancionId, usuarioId }))
    })
    return NextResponse.json({ mensaje: 'Líderes de danza asignadas', creadas: nuevas.count })
  } catch (error) {
    console.error('Error al asignar líderes de danza:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT /api/programaciones/[id]/danzas-lideres - Actualizar estado de preparación de danza
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: programacionId } = await params
    const datos = await request.json()

    // Validar datos requeridos
    if (!datos.asignacionDanzaId) {
      return NextResponse.json(
        { error: 'ID de asignación de danza requerido' },
        { status: 400 }
      )
    }

    // Verificar que la asignación de danza existe
    const asignacionDanza = await prisma.liderDanzaAsignacion.findUnique({
      where: { id: datos.asignacionDanzaId },
      include: { usuario: true }
    })

    if (!asignacionDanza) {
      return NextResponse.json({ error: 'Asignación de danza no encontrada' }, { status: 404 })
    }

    // Verificar permisos: la danzora asignada puede cambiar su estado, líder de danza/admin puede cambiar cualquiera
    const puedeEditar = session.user.role === 'ADMINISTRADOR' || 
                       session.user.role === 'LIDER_DANZA' ||
                       session.user.id === asignacionDanza.usuarioId

    if (!puedeEditar) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Validar estado de preparación si se proporciona
    const estadosValidos = ['PENDIENTE', 'EN_PRACTICA', 'PREPARADO', 'NECESITA_AYUDA']
    if (datos.estadoPreparacion && !estadosValidos.includes(datos.estadoPreparacion)) {
      return NextResponse.json(
        { error: 'Estado de preparación inválido. Debe ser: PENDIENTE, EN_PRACTICA, PREPARADO o NECESITA_AYUDA' },
        { status: 400 }
      )
    }

    // Preparar datos para actualización
    const datosActualizacion: { estadoPreparacion?: EstadoPreparacion; notasPersonales?: string | null } = {}

    if (datos.estadoPreparacion) {
      datosActualizacion.estadoPreparacion = datos.estadoPreparacion as EstadoPreparacion
    }

    if (datos.notasPersonales !== undefined) {
      datosActualizacion.notasPersonales = datos.notasPersonales
    }

    // Actualizar la asignación de danza
    const asignacionActualizada = await prisma.liderDanzaAsignacion.update({
      where: { id: datos.asignacionDanzaId },
      data: datosActualizacion,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true
          }
        },
        cancion: {
          select: {
            id: true,
            titulo: true,
            artista: true
          }
        },
        programacion: {
          select: {
            id: true,
            fecha: true,
            tipoServicio: true
          }
        }
      }
    })

    return NextResponse.json({
      mensaje: 'Estado de preparación actualizado exitosamente',
      asignacion: asignacionActualizada
    })

  } catch (error) {
    console.error('Error al actualizar estado de preparación de danza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/programaciones/[id]/danzas-lideres
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'LIDER_DANZA') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id: programacionId } = await params
    const body = await request.json()
    const { cancionId, usuarioId } = body
    if (!cancionId || !usuarioId) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    await prisma.liderDanzaAsignacion.deleteMany({ where: { programacionId, cancionId, usuarioId } })
    return NextResponse.json({ mensaje: 'Líder de danza eliminada' })
  } catch (error) {
    console.error('Error al eliminar líder de danza:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 