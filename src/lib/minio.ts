import * as Minio from 'minio'

const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
const portStr = process.env.MINIO_PORT || '9100'
const port = parseInt(portStr, 10)
const useSSL = process.env.MINIO_USE_SSL === 'true'
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin'
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin'
const bucketName = process.env.MINIO_BUCKET || 'uploads'

export const minioClient = new Minio.Client({
  endPoint: endpoint,
  port: port,
  useSSL: useSSL,
  accessKey: accessKey,
  secretKey: secretKey
})

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(bucketName)
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1')
      console.log(`Bucket '${bucketName}' created.`)
    }

    // Always set bucket policy to public read-only
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    }
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
    console.log(`Bucket '${bucketName}' configured with public read-only policy.`)
  } catch (error) {
    console.error(`Error ensuring MinIO bucket '${bucketName}' exists and is configured:`, error)
  }
}

export function getFileUrl(filename: string): string {
  const protocol = useSSL ? 'https' : 'http'
  // URL standard format: http://localhost:9100/uploads/filename
  return `${protocol}://${endpoint}:${port}/${bucketName}/${filename}`
}
