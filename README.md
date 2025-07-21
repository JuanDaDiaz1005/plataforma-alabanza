# 🎵 Plataforma de Alabanza y Adoración

Una aplicación web moderna para la gestión integral de equipos de alabanza y adoración, facilitando la organización de canciones, asignación de roles y acceso a recursos musicales.

## ✨ Características Principales

- 👥 **Gestión de Usuarios**: Sistema de roles (Administrador, Líder, Cantante)
- 🎼 **Catálogo de Canciones**: CRUD completo con letras, acordes y metadatos
- 📅 **Programación de Servicios**: Calendario de eventos con asignaciones
- 🎧 **Reproductor Integrado**: Soporte para Spotify, YouTube y archivos MP3
- 🔍 **Búsqueda Avanzada**: Filtros por género, dificultad, asignaciones
- 📱 **Responsive**: Optimizado para móviles y tablets
- 🔔 **Notificaciones**: Sistema de alertas para asignaciones y cambios

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Git

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd plataforma-alabanza
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Copiar el template de variables de entorno
   cp env-template.txt .env.local
   ```
   
   Editar `.env.local` con tus configuraciones:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="tu-clave-secreta-super-segura"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Configurar base de datos**
   ```bash
   # Generar cliente de Prisma
   npx prisma generate
   
   # Ejecutar migraciones
   npx prisma migrate dev
   
   # Poblar con datos de prueba
   npm run seed
   ```

5. **Iniciar desarrollo**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:3000`

## 👤 Credenciales de Prueba

Después de ejecutar el seed, puedes usar estas credenciales:

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| **Administrador** | admin@alabanza.com | Admin123! | Acceso completo al sistema |
| **Líder de Alabanza** | lider@alabanza.com | Lider123! | Programación y asignaciones |
| **Cantante** | ana@alabanza.com | Cantante123! | Soprano, vista de cantante |
| **Cantante** | david@alabanza.com | Cantante123! | Bajo, vista de cantante |

## 🗄️ Estructura de la Base de Datos

### Modelos Principales

- **Usuario**: Información personal, roles, rangos vocales, disponibilidad
- **Cancion**: Título, artista, género, letras, acordes, dificultad
- **Programacion**: Fechas de servicios, tipos (Miércoles, Domingo, etc.)
- **AsignacionCancion**: Relación usuario-canción-programación con roles
- **RecursoAudio**: Enlaces a Spotify, YouTube, archivos MP3
- **Notificacion**: Sistema de mensajes y alertas

### Roles de Usuario

```typescript
enum RolUsuario {
  ADMINISTRADOR    // Gestión completa del sistema
  LIDER_ALABANZA  // Programación y asignaciones  
  CANTANTE        // Vista de asignaciones personales
}
```

### Estados de Preparación

```typescript
enum EstadoPreparacion {
  PENDIENTE         // Recién asignado
  EN_PRACTICA      // Estudiando la canción
  PREPARADO        // Listo para el servicio
  NECESITA_AYUDA   // Requiere apoyo adicional
}
```

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** - React Framework con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Lucide React** - Iconografía moderna

### Backend
- **Next.js API Routes** - Endpoints REST
- **Prisma** - ORM y manejo de base de datos
- **SQLite** - Base de datos (desarrollo)
- **bcryptjs** - Hash de contraseñas

### Autenticación
- **NextAuth.js** - Sistema de autenticación
- **JWT** - Tokens de sesión

## 📁 Estructura del Proyecto

```
plataforma-alabanza/
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   ├── seed.ts            # Datos de prueba
│   └── migrations/        # Migraciones SQL
├── src/
│   ├── app/               # App Router (Next.js 13+)
│   │   ├── page.tsx       # Página principal
│   │   ├── layout.tsx     # Layout global
│   │   └── globals.css    # Estilos globales
│   ├── lib/
│   │   ├── prisma.ts      # Cliente de Prisma
│   │   └── utils.ts       # Utilidades comunes
│   └── types/
│       └── index.ts       # Tipos TypeScript
├── requerimientos-plataforma-alabanza.md  # Documentación de requerimientos
└── env-template.txt       # Template de variables de entorno
```

## 🔧 Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build para producción
npm run start      # Servidor de producción
npm run lint       # Linter ESLint
npm run seed       # Poblar base de datos con datos de prueba
```

## 🔮 Próximas Funcionalidades

### Fase 2 (En desarrollo)
- [ ] Sistema de autenticación completo
- [ ] Dashboard personalizado por rol
- [ ] CRUD de canciones con interfaz
- [ ] Programación de servicios

### Fase 3 (Planeado)
- [ ] Integración con Spotify Web API
- [ ] Integración con YouTube Data API
- [ ] Reproductor de audio avanzado
- [ ] Sistema de notificaciones
- [ ] Subida de archivos MP3
- [ ] Reportes y estadísticas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- Inspirado en la necesidad real de equipos de alabanza organizados
- Construido con amor para la comunidad cristiana
- Tecnologías modernas para una experiencia excepcional

---

**¿Necesitas ayuda?** Abre un issue o contacta al equipo de desarrollo.

**¡Que la música sea para la gloria de Dios!** 🎵✨
