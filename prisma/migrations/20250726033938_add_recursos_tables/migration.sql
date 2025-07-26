-- CreateEnum
CREATE TYPE "CategoriaRecursoDanza" AS ENUM ('TUTORIAL', 'PREDICA', 'COREOGRAFIA', 'TECNICA', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaRecursoAlabanza" AS ENUM ('VOCAL', 'GUITARRA', 'PIANO', 'BATERIA', 'BAJO', 'TEORIA', 'PREDICA', 'OTRO');

-- CreateTable
CREATE TABLE "recursos_danza" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "categoria" "CategoriaRecursoDanza" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recursos_danza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos_alabanza" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "categoria" "CategoriaRecursoAlabanza" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recursos_alabanza_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recursos_danza" ADD CONSTRAINT "recursos_danza_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos_alabanza" ADD CONSTRAINT "recursos_alabanza_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
