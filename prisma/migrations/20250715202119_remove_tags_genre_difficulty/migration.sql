/*
  Warnings:

  - You are about to drop the column `dificultad` on the `canciones` table. All the data in the column will be lost.
  - You are about to drop the column `etiquetas` on the `canciones` table. All the data in the column will be lost.
  - You are about to drop the column `genero` on the `canciones` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_canciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "artista" TEXT NOT NULL,
    "album" TEXT,
    "duracionSegundos" INTEGER,
    "letra" TEXT,
    "acordes" TEXT,
    "tonalidad" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
);
INSERT INTO "new_canciones" ("acordes", "album", "artista", "duracionSegundos", "fechaActualizacion", "fechaCreacion", "id", "letra", "titulo", "tonalidad") SELECT "acordes", "album", "artista", "duracionSegundos", "fechaActualizacion", "fechaCreacion", "id", "letra", "titulo", "tonalidad" FROM "canciones";
DROP TABLE "canciones";
ALTER TABLE "new_canciones" RENAME TO "canciones";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
