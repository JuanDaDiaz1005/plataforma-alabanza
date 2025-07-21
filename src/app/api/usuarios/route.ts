import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/usuarios - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA' && session.user.role !== 'LIDER_DANZA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda') || ''
    const rol = searchParams.get('rol') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limite = parseInt(searchParams.get('limite') || '12')
    const offset = (page - 1) * limite

    // Construir filtros
    const filtros: any = {}
    
    if (busqueda) {
      filtros.OR = [
        { nombre: { contains: busqueda } },
        { email: { contains: busqueda } }
      ]
    }

    // Si el filtro de rol es para asignaciones, mostrar múltiples roles
    if (rol === 'CANTANTE,LIDER_ALABANZA') {
      filtros.OR = [
        { rol: 'CANTANTE' },
        { rol: 'LIDER_ALABANZA' }
      ]
    } else if (rol === 'DANZA,LIDER_DANZA') {
      filtros.OR = [
        { rol: 'DANZA' },
        { rol: 'LIDER_DANZA' }
      ]
    } else if (rol) {
      filtros.rol = rol
    }

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
        page,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite)
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