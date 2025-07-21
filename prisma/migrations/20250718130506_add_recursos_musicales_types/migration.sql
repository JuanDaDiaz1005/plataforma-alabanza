/*
  Warnings:

  - Added the required column `fechaActualizacion` to the `recursos_audio` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recursos_audio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cancionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titulo" TEXT,
    "descripcion" TEXT,
    "metadatos" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "recursos_audio_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Migrar datos existentes y mapear tipos antiguos a nuevos
INSERT INTO "new_recursos_audio" ("activo", "cancionId", "fechaCreacion", "fechaActualizacion", "id", "metadatos", "plataforma", "tipo", "url", "titulo", "descripcion") 
SELECT 
  "activo", 
  "cancionId", 
  "fechaCreacion", 
  "fechaCreacion" as "fechaActualizacion", -- Usar fechaCreacion como valor inicial
  "id", 
  "metadatos", 
  "plataforma", 
  CASE 
    WHEN "tipo" = 'PISTA_VOCAL' THEN 'TUTORIAL_VOCES'
    WHEN "tipo" = 'ACORDES' THEN 'TUTORIAL_GUITARRA'
    ELSE "tipo"
  END as "tipo",
  "url",
  NULL as "titulo",
  NULL as "descripcion"
FROM "recursos_audio";
DROP TABLE "recursos_audio";
ALTER TABLE "new_recursos_audio" RENAME TO "recursos_audio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
