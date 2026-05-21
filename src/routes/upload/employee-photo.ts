import { createFileRoute } from '@tanstack/react-router'
import { minioClient, ensureBucketExists, getFileUrl } from '../../lib/minio'
import { prisma } from '../../lib/prisma'
import { uid } from '../../lib/storage'
import path from 'path'

export const Route = createFileRoute('/upload/employee-photo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await ensureBucketExists()

          const formData = await request.formData()
          const file = formData.get('file') as File | null
          const employeeId = formData.get('employeeId') as string | null

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
            process.env.MINIO_BUCKET as string,
            filename,
            buffer,
            buffer.length,
            { 'Content-Type': file.type }
          )

          const fileUrl = getFileUrl(filename)

          // If employeeId is provided, save it to the database
          if (employeeId && employeeId.length > 10) {
            const existing = await prisma.employee.findUnique({ where: { id: employeeId } })
            if (existing) {
              await prisma.employee.update({
                where: { id: employeeId },
                data: { photoUrl: fileUrl }
              })
            }
          }

          return new Response(JSON.stringify({ url: fileUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error: any) {
          console.error('Upload employee photo error:', error)
          return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
