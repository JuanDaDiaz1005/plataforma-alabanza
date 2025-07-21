-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'LIDER_ALABANZA', 'CANTANTE', 'LIDER_DANZA', 'DANZA', 'MUSICO');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('MIERCOLES', 'DOMINGO', 'SABADO', 'JUEVES', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "RolCancion" AS ENUM ('CANTANTE_PRINCIPAL', 'COROS', 'ARMONIAS', 'RESPALDO');

-- CreateEnum
CREATE TYPE "EstadoPreparacion" AS ENUM ('PENDIENTE', 'EN_PRACTICA', 'PREPARADO', 'NECESITA_AYUDA');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('CANCION_ORIGINAL', 'PISTA_INSTRUMENTAL', 'MULTITRACK', 'TUTORIAL_VOCES', 'TUTORIAL_GUITARRA', 'TUTORIAL_BAJO', 'TUTORIAL_BATERIA', 'TUTORIAL_TECLADO', 'TUTORIAL_VIOLIN');

-- CreateEnum
CREATE TYPE "PlataformaAudio" AS ENUM ('MP3_LOCAL', 'SPOTIFY', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('NUEVA_ASIGNACION', 'CAMBIO_PROGRAMACION', 'RECORDATORIO_ENSAYO', 'MENSAJE_GENERAL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CANTANTE',
    "instrumentos" TEXT,
    "disponibilidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "artista" TEXT NOT NULL,
    "album" TEXT,
    "duracionSegundos" INTEGER,
    "letra" TEXT,
    "acordes" TEXT,
    "tonalidad" TEXT,
    "videoDanza" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programaciones" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipoServicio" "TipoServicio" NOT NULL,
    "notas" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_canciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cancionId" TEXT NOT NULL,
    "programacionId" TEXT NOT NULL,
    "rolCancion" "RolCancion" NOT NULL,
    "estadoPreparacion" "EstadoPreparacion" NOT NULL DEFAULT 'PENDIENTE',
    "notasPersonales" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_canciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos_audio" (
    "id" TEXT NOT NULL,
    "cancionId" TEXT NOT NULL,
    "tipo" "TipoRecurso" NOT NULL,
    "plataforma" "PlataformaAudio" NOT NULL,
    "url" TEXT,
    "titulo" TEXT,
    "descripcion" TEXT,
    "metadatos" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recursos_audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cancionId" TEXT,
    "programacionId" TEXT,
    "contenido" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lideres_danza_asignacion" (
    "id" TEXT NOT NULL,
    "programacionId" TEXT NOT NULL,
    "cancionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lideres_danza_asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_canciones_usuarioId_cancionId_programacionId_key" ON "asignaciones_canciones"("usuarioId", "cancionId", "programacionId");

-- CreateIndex
CREATE UNIQUE INDEX "lideres_danza_asignacion_programacionId_cancionId_usuarioId_key" ON "lideres_danza_asignacion"("programacionId", "cancionId", "usuarioId");

-- AddForeignKey
ALTER TABLE "asignaciones_canciones" ADD CONSTRAINT "asignaciones_canciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_canciones" ADD CONSTRAINT "asignaciones_canciones_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_canciones" ADD CONSTRAINT "asignaciones_canciones_programacionId_fkey" FOREIGN KEY ("programacionId") REFERENCES "programaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos_audio" ADD CONSTRAINT "recursos_audio_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_programacionId_fkey" FOREIGN KEY ("programacionId") REFERENCES "programaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lideres_danza_asignacion" ADD CONSTRAINT "lideres_danza_asignacion_programacionId_fkey" FOREIGN KEY ("programacionId") REFERENCES "programaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lideres_danza_asignacion" ADD CONSTRAINT "lideres_danza_asignacion_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lideres_danza_asignacion" ADD CONSTRAINT "lideres_danza_asignacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
