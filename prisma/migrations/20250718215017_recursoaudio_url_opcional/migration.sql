-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recursos_audio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cancionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "url" TEXT,
    "titulo" TEXT,
    "descripcion" TEXT,
    "metadatos" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "recursos_audio_cancionId_fkey" FOREIGN KEY ("cancionId") REFERENCES "canciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_recursos_audio" ("activo", "cancionId", "descripcion", "fechaActualizacion", "fechaCreacion", "id", "metadatos", "plataforma", "tipo", "titulo", "url") SELECT "activo", "cancionId", "descripcion", "fechaActualizacion", "fechaCreacion", "id", "metadatos", "plataforma", "tipo", "titulo", "url" FROM "recursos_audio";
DROP TABLE "recursos_audio";
ALTER TABLE "new_recursos_audio" RENAME TO "recursos_audio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
