/*
  Warnings:

  - You are about to drop the column `ultimaCancionReproducidaId` on the `usuarios` table. All the data in the column will be lost.

*/
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
