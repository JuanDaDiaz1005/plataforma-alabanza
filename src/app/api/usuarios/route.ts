import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { RolUsuario } from '@prisma/client'

// GET /api/usuarios - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA' && session.user.role !== 'LIDER_DANZA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda') || ''
    const rol = searchParams.get('rol')
    const activo = searchParams.get('activo')
    const page = parseInt(searchParams.get('page') || '1')
    const limite = parseInt(searchParams.get('limite') || '6')
    const offset = (page - 1) * limite

    // Construir filtros
    const filtros: Prisma.UsuarioWhereInput = {}
    
    if (busqueda) {
      filtros.OR = [
        { nombre: { contains: busqueda } },
        { email: { contains: busqueda } }
      ]
    }
    if (rol && Object.values(RolUsuario).includes(rol as RolUsuario)) {
      filtros.rol = rol as RolUsuario
    }
    if (typeof activo === 'string') {
      if (activo === 'true') filtros.activo = true;
      else if (activo === 'false') filtros.activo = false;
    }

    console.log('SESION:', session)
    console.log('FILTROS:', filtros)

    // Obtener usuarios con paginación
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where: filtros,
        skip: offset,
        take: limite,
        orderBy: { fechaCreacion: 'desc' },
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
      }),
      prisma.usuario.count({ where: filtros })
    ])

    return NextResponse.json({
      usuarios,
      pagination: {
        pagina: page,
        limite,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
        hasNext: page < Math.ceil(total / limite),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/usuarios - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const datos = await request.json()
    const { nombre, email, password, rol, rangoVocal } = datos
    
    // Validar datos requeridos
    if (!nombre || !email || !password || !rol) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, email, password, rol' },
        { status: 400 }
      )
    }

    // Verificar que el email no esté en uso
    const emailEnUso = await prisma.usuario.findUnique({
      where: { email }
    })

    if (emailEnUso) {
      return NextResponse.json(
        { error: 'El email ya está en uso' },
        { status: 400 }
      )
    }

    // Encriptar password
    const passwordEncriptado = await bcrypt.hash(password, 12)

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: passwordEncriptado,
        rol,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        fechaCreacion: true,
        fechaActualizacion: true
      }
    })

    return NextResponse.json(nuevoUsuario, { status: 201 })

  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}