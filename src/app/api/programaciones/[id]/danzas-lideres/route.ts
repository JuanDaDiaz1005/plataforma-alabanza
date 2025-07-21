import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/programaciones/[id]/danzas-lideres
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id: programacionId } = await params
    // Traer líderes de danza por canción para el servicio
    const lideres = await prisma.liderDanzaAsignacion.findMunknown({
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
    await prisma.liderDanzaAsignacion.deleteMunknown({ where: { programacionId, cancionId } })
    // Crear nuevas asignaciones
    const nuevas = await prisma.liderDanzaAsignacion.createMunknown({
      data: usuarioIds.map((usuarioId: string) => ({ programacionId, cancionId, usuarioId }))
    })
    return NextResponse.json({ mensaje: 'Líderes de danza asignadas', creadas: nuevas.count })
  } catch (error) {
    console.error('Error al asignar líderes de danza:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
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
    await prisma.liderDanzaAsignacion.deleteMunknown({ where: { programacionId, cancionId, usuarioId } })
    return NextResponse.json({ mensaje: 'Líder de danza eliminada' })
  } catch (error) {
    console.error('Error al eliminar líder de danza:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 