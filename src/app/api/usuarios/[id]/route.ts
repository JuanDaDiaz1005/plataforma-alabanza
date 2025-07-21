import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/usuarios/[id] - Obtener usuario específico
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

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        fechaCreacion: true,
        fechaActualizacion: true,
        _count: {
          select: {
            asignaciones: true,
            comentarios: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuario)

  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/usuarios/[id] - Actualizar usuario
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
    const body = await request.json()
    // Eliminar toda la lógica relacionada con ultimaCancionReproducidaId
    const { nombre, email, rol, passwordActual, passwordNueva } = body

    // Verificar permisos: administrador puede editar cualquier usuario, 
    // otros usuarios solo pueden editarse a sí mismos
    const esAdministrador = session.user.role === 'ADMINISTRADOR'
    const esPropio = session.user.id === id
    
    if (!esAdministrador && !esPropio) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Validaciones y actualización solo para nombre, email, rol y contraseñas
    const datosActualizacion: Record<string, unknown> = {};
    if (nombre) datosActualizacion.nombre = nombre;
    if (email) datosActualizacion.email = email;

    // Solo administradores pueden cambiar el rol
    if (esAdministrador && rol !== undefined) {
      datosActualizacion.rol = rol
    }

    // Manejar cambio de contraseña
    if (passwordActual && passwordNueva) {
      
      // Verificar contraseña actual
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id }
      })
      if (!usuarioExistente) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
      const passwordValida = await bcrypt.compare(passwordActual, usuarioExistente.passwordHash)
      if (!passwordValida) {
        return NextResponse.json(
          { error: 'La contraseña actual es incorrecta' },
          { status: 400 }
        )
      }

      // Validar nueva contraseña
      if (passwordNueva.length < 6) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }

      // Encriptar nueva contraseña
      const passwordEncriptada = await bcrypt.hash(passwordNueva, 12)
      datosActualizacion.passwordHash = passwordEncriptada
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: datosActualizacion,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        fechaCreacion: true,
        fechaActualizacion: true,
        _count: {
          select: {
            asignaciones: true,
            comentarios: true
          }
        }
      }
    })

    return NextResponse.json(usuarioActualizado)

  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/usuarios/[id] - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // No permitir que el usuario se elimine a sí mismo
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
                  _count: {
            select: {
              asignaciones: true,
              comentarios: true
            }
          }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Eliminar el usuario (las relaciones se manejan con cascada en el schema)
    await prisma.usuario.delete({
      where: { id }
    })

    return NextResponse.json({ 
      mensaje: 'Usuario eliminado exitosamente',
              datosEliminados: {
          nombre: usuario.nombre,
          email: usuario.email,
          asignaciones: usuario._count.asignaciones,
          comentarios: usuario._count.comentarios
        }
    })

  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 