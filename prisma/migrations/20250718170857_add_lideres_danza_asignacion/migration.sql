/*
  Warnings:

  - You are about to drop the column `rangoVocal` on the `usuarios` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "lideres_danza_asignacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programacionId" TEXT NOT NULL,
    "cancionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lideres_danza_asignacion_programacionId_fkey" FOREIGN KEY ("programacionId") REFERENCES "programaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lideres_danza_asignacion_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lideres_danza_asignacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CANTANTE',
    "instrumentos" TEXT,
    "disponibilidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
);
INSERT INTO "new_usuarios" ("activo", "disponibilidad", "email", "fechaActualizacion", "fechaCreacion", "id", "instrumentos", "nombre", "passwordHash", "rol", "telefono") SELECT "activo", "disponibilidad", "email", "fechaActualizacion", "fechaCreacion", "id", "instrumentos", "nombre", "passwordHash", "rol", "telefono" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "lideres_danza_asignacion_programacionId_cancionId_usuarioId_key" ON "lideres_danza_asignacion"("programacionId", "cancionId", "usuarioId");
