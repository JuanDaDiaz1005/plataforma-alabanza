import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10) // Cambia la contraseña si quieres

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@plataforma.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@plataforma.com',
      passwordHash,
      rol: 'ADMINISTRADOR',
      activo: true,
    },
  })

  console.log('Usuario admin creado:', admin)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })