-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CANTANTE',
    "rangoVocal" TEXT,
    "instrumentos" TEXT,
    "disponibilidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "canciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "artista" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "duracionSegundos" INTEGER,
    "dificultad" TEXT NOT NULL DEFAULT 'INTERMEDIO',
    "letra" TEXT,
    "acordes" TEXT,
    "tonalidad" TEXT,
    "etiquetas" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "programaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "tipoServicio" TEXT NOT NULL,
    "notas" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "asignaciones_canciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "cancionId" TEXT NOT NULL,
    "programacionId" TEXT NOT NULL,
    "rolCancion" TEXT NOT NULL,
    "estadoPreparacion" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notasPersonales" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "asignaciones_canciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asignaciones_canciones_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asignaciones_canciones_programacionId_fkey" FOREIGN KEY ("programacionId") REFERENCES "programaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recursos_audio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cancionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "metadatos" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recursos_audio_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "cancionId" TEXT,
    "programacionId" TEXT,
    "contenido" TEXT NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comentarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comentarios_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comentarios_programacionId_fkey" FOREIGN KEY ("programacionId") REFERENCES "programaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_canciones_usuarioId_cancionId_programacionId_key" ON "asignaciones_canciones"("usuarioId", "cancionId", "programacionId");
