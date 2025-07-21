import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMINISTRADOR' && session.user.role !== 'LIDER_ALABANZA')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

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