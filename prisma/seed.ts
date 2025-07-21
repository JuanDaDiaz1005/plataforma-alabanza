import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Limpiar datos existentes
  await prisma.comentario.deleteMany()
  await prisma.notificacion.deleteMany()
  await prisma.recursoAudio.deleteMany()
  await prisma.asignacionCancion.deleteMany()
  await prisma.programacion.deleteMany()
  await prisma.cancion.deleteMany()
  await prisma.usuario.deleteMany()

  console.log('🧹 Datos anteriores limpiados')

  // Crear usuarios de prueba
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const liderPassword = await bcrypt.hash('Lider123!', 12)
  const cantantePassword = await bcrypt.hash('Cantante123!', 12)

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@alabanza.com',
      nombre: 'María Administradora',
      passwordHash: adminPassword,
      rol: 'ADMINISTRADOR',
      telefono: '+57 300 123 4567',
      activo: true
    }
  })

  const lider = await prisma.usuario.create({
    data: {
      email: 'lider@alabanza.com',
      nombre: 'Carlos Líder',
      passwordHash: liderPassword,
      rol: 'LIDER_ALABANZA',
      rangoVocal: 'TENOR',
      telefono: '+57 300 234 5678',
      instrumentos: JSON.stringify(['Guitarra', 'Piano']),
      disponibilidad: JSON.stringify([
        { dia: 'MIERCOLES', disponible: true },
        { dia: 'DOMINGO', disponible: true },
        { dia: 'SABADO', disponible: false }
      ]),
      activo: true
    }
  })

  const cantante1 = await prisma.usuario.create({
    data: {
      email: 'ana@alabanza.com',
      nombre: 'Ana Soprano',
      passwordHash: cantantePassword,
      rol: 'CANTANTE',
      rangoVocal: 'SOPRANO',
      telefono: '+57 300 345 6789',
      instrumentos: JSON.stringify(['Voz']),
      disponibilidad: JSON.stringify([
        { dia: 'MIERCOLES', disponible: true },
        { dia: 'DOMINGO', disponible: true }
      ]),
      activo: true
    }
  })

  const cantante2 = await prisma.usuario.create({
    data: {
      email: 'david@alabanza.com',
      nombre: 'David Bajo',
      passwordHash: cantantePassword,
      rol: 'CANTANTE',
      rangoVocal: 'BAJO',
      telefono: '+57 300 456 7890',
      instrumentos: JSON.stringify(['Voz', 'Bajo']),
      disponibilidad: JSON.stringify([
        { dia: 'MIERCOLES', disponible: true },
        { dia: 'DOMINGO', disponible: true },
        { dia: 'SABADO', disponible: true }
      ]),
      activo: true
    }
  })

  console.log('👥 Usuarios creados')

  // Crear canciones de prueba
  const cancion1 = await prisma.cancion.create({
    data: {
      titulo: 'Sublime Gracia',
      artista: 'Tradicional',
      genero: 'TRADICIONAL',
      duracionSegundos: 240,
      dificultad: 'INTERMEDIO',
      letra: `Sublime gracia del Señor\nQue a un infeliz salvó\nFui ciego mas hoy veo ya\nPerdido y él me halló`,
      acordes: 'G - D - Em - C - G - D - G',
      tonalidad: 'G Mayor',
      etiquetas: JSON.stringify(['clasica', 'congregacional', 'gracia'])
    }
  })

  const cancion2 = await prisma.cancion.create({
    data: {
      titulo: 'Reckless Love',
      artista: 'Cory Asbury',
      genero: 'CONTEMPORANEO',
      duracionSegundos: 300,
      dificultad: 'AVANZADO',
      letra: `Before I spoke a word, You were singing over me\nYou have been so, so good to me`,
      acordes: 'C - Am - F - G - C - Am - F - G',
      tonalidad: 'C Mayor',
      etiquetas: JSON.stringify(['contemporaneo', 'amor', 'adoracion'])
    }
  })

  const cancion3 = await prisma.cancion.create({
    data: {
      titulo: 'Way Maker',
      artista: 'Sinach',
      genero: 'GOSPEL',
      duracionSegundos: 280,
      dificultad: 'INTERMEDIO',
      letra: `You are here, moving in our midst\nI worship You, I worship You`,
      acordes: 'Em - C - G - D - Em - C - G - D',
      tonalidad: 'Em',
      etiquetas: JSON.stringify(['milagros', 'fe', 'contemporaneo'])
    }
  })

  console.log('🎵 Canciones creadas')

  // Crear recursos de audio
  await prisma.recursoAudio.createMany({
    data: [
      {
        cancionId: cancion1.id,
        tipo: 'CANCION_ORIGINAL',
        plataforma: 'YOUTUBE',
        url: 'https://www.youtube.com/watch?v=CDdvReNKKuk',
        metadatos: JSON.stringify({ duracion: '4:00', calidad: 'HD' })
      },
      {
        cancionId: cancion2.id,
        tipo: 'CANCION_ORIGINAL',
        plataforma: 'SPOTIFY',
        url: 'spotify:track:7qtXCPGGZmUPwP6xZoB7fO',
        metadatos: JSON.stringify({ duracion: '5:00', album: 'Reckless Love' })
      },
      {
        cancionId: cancion3.id,
        tipo: 'CANCION_ORIGINAL',
        plataforma: 'YOUTUBE',
        url: 'https://www.youtube.com/watch?v=29IZh85cmi4',
        metadatos: JSON.stringify({ duracion: '4:40', vistas: '100M+' })
      }
    ]
  })

  console.log('🎧 Recursos de audio creados')

  // Crear programación de ejemplo
  const proximoDomingo = new Date()
  proximoDomingo.setDate(proximoDomingo.getDate() + (7 - proximoDomingo.getDay()))

  const programacion = await prisma.programacion.create({
    data: {
      fecha: proximoDomingo,
      tipoServicio: 'DOMINGO',
      notas: 'Servicio especial de adoración',
      activa: true
    }
  })

  console.log('📅 Programación creada')

  // Crear asignaciones
  await prisma.asignacionCancion.createMany({
    data: [
      {
        usuarioId: lider.id,
        cancionId: cancion1.id,
        programacionId: programacion.id,
        rolCancion: 'CANTANTE_PRINCIPAL',
        estadoPreparacion: 'PREPARADO'
      },
      {
        usuarioId: cantante1.id,
        cancionId: cancion1.id,
        programacionId: programacion.id,
        rolCancion: 'COROS',
        estadoPreparacion: 'EN_PRACTICA'
      },
      {
        usuarioId: cantante2.id,
        cancionId: cancion2.id,
        programacionId: programacion.id,
        rolCancion: 'CANTANTE_PRINCIPAL',
        estadoPreparacion: 'PENDIENTE'
      },
      {
        usuarioId: cantante1.id,
        cancionId: cancion3.id,
        programacionId: programacion.id,
        rolCancion: 'ARMONIAS',
        estadoPreparacion: 'PREPARADO'
      }
    ]
  })

  console.log('🎤 Asignaciones creadas')

  // Crear notificaciones de ejemplo
  await prisma.notificacion.createMany({
    data: [
      {
        usuarioId: cantante1.id,
        titulo: 'Nueva asignación',
        mensaje: 'Te han asignado la canción "Sublime Gracia" para el próximo domingo',
        tipo: 'NUEVA_ASIGNACION',
        leida: false
      },
      {
        usuarioId: cantante2.id,
        titulo: 'Recordatorio de ensayo',
        mensaje: 'Ensayo general mañana a las 7:00 PM',
        tipo: 'RECORDATORIO_ENSAYO',
        leida: false
      }
    ]
  })

  console.log('🔔 Notificaciones creadas')

  console.log('✅ Seed completado exitosamente!')
  console.log('\n📋 Credenciales de prueba:')
  console.log('Admin: admin@alabanza.com / Admin123!')
  console.log('Líder: lider@alabanza.com / Lider123!')
  console.log('Cantante 1: ana@alabanza.com / Cantante123!')
  console.log('Cantante 2: david@alabanza.com / Cantante123!')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 