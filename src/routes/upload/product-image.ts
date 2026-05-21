import { createFileRoute } from '@tanstack/react-router'
import { minioClient, ensureBucketExists, getFileUrl } from '../../lib/minio'
import { prisma } from '../../lib/prisma'
import { uid } from '../../lib/storage'
import path from 'path'

export const Route = createFileRoute('/upload/product-image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await ensureBucketExists()

          const formData = await request.formData()
          const file = formData.get('file') as File | null
          const productId = formData.get('productId') as string | null

          if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          // Generate a unique filename
          const fileExt = path.extname(file.name) || '.jpg'
          const filename = `${uid()}-${Date.now()}${fileExt}`

          // Upload to MinIO
          const buffer = Buffer.from(await file.arrayBuffer())
          await minioClient.putObject(
            process.env.MINIO_BUCKET || 'uploads',
            filename,
            buffer,
            buffer.length,
            { 'Content-Type': file.type }
          )

          const fileUrl = getFileUrl(filename)

          // If productId is provided, save it to the database
          if (productId && productId.length > 10) {
            const existing = await prisma.product.findUnique({ where: { id: productId } })
            if (existing) {
              await prisma.product.update({
                where: { id: productId },
                data: { imageUrl: fileUrl }
              })
            }
          }

          return new Response(JSON.stringify({ url: fileUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error: any) {
          console.error('Upload product image error:', error)
          return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
