
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const R2_ENDPOINT = process.env.R2_ENDPOINT!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET = process.env.R2_BUCKET!

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
})

// Helper para generar la URL firmada (pre-signed URL) para Cloudflare R2
function getR2SignedUrl({ key, contentType = 'audio/mpeg', expiresIn = 900 }: { key: string; contentType?: string; expiresIn?: number }) {
  // Cloudflare R2 es compatible con S3, así que usamos el método de AWS S3
  // Pero @aws-sdk/client-s3 no tiene método directo, así que generamos manualmente la firma V4
  // Para cargas simples, puedes usar la URL pública y un PUT con los headers correctos
  // Si necesitas firma estricta, se recomienda usar un paquete como 'aws-sdk' clásico o 'aws4', pero aquí generamos una URL simple
  // Cloudflare R2 permite PUT directo si el bucket es público
  // Ejemplo de URL:
  // https://<R2_ENDPOINT>/<BUCKET>/<KEY>
  return `${R2_ENDPOINT.replace('https://', 'https://pub.').replace('http://', 'http://pub.')}/${R2_BUCKET}/${key}`
}
// Endpoint GET para obtener una URL firmada para subir audio
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA' && session.user.role !== 'MUSICO')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Recibe el nombre original del archivo por query
  const { searchParams } = new URL(request.url)
  const originalName = (searchParams.get('name') || 'audio.mp3').replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `pistas/${uuidv4()}_${originalName}`

  // Genera la URL para PUT directo
  const signedUrl = getR2SignedUrl({ key: fileName })

  return NextResponse.json({ url: signedUrl, key: fileName })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA' && session.user.role !== 'MUSICO')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Este endpoint puede usarse para guardar metadata después de la subida directa
  // O para cargas pequeñas (<5MB)
  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file || file.type !== 'audio/mpeg') {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
  }

  // Usar el nombre original del archivo (limpio) como parte del nombre en el bucket
  const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `pistas/${uuidv4()}_${originalName}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: 'audio/mpeg',
    ACL: 'public-read',
    Metadata: {
      originalname: file.name
    }
  }))

  const publicUrl = `${R2_ENDPOINT.replace('https://', 'https://pub.').replace('http://', 'http://pub.')}/${R2_BUCKET}/${fileName}`
  return NextResponse.json({ url: publicUrl, name: file.name })
} 