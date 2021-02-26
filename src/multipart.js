import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListMultipartUploadsCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3'

const region = process.env.REACT_APP_REGION
const bucketName = process.env.REACT_APP_BUCKET
const identityPoolId = process.env.REACT_APP_IDENTITY_POOL_ID

const chunkSizeBytes = 5 * 1024 * 1024

const delay = t => new Promise(resolve => setTimeout(resolve, t))

const s3 = new S3Client({
  region: region,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region }),
    identityPoolId,
  }),
})

export function listUploads() {
  return s3.send(
    new ListMultipartUploadsCommand({
      Bucket: bucketName,
    })
  )
}

export function listParts(upload) {
  return s3.send(
    new ListPartsCommand({
      Bucket: bucketName,
      UploadId: upload.UploadId,
      Key: upload.Key,
    })
  )
}

export async function upload(file, emitter) {
  const totalSizeBytes = file.size
  const key = file.name

  if (totalSizeBytes < chunkSizeBytes) {
    return s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
      })
    )
  }

  const numberOfPartsToUpload = Math.ceil(totalSizeBytes / chunkSizeBytes)

  const createUploadResult = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
    })
  )

  try {
    const parts = []

    for (let partIndex = 0; partIndex < numberOfPartsToUpload; partIndex++) {
      const partNumber = partIndex + 1
      const start = partIndex * chunkSizeBytes
      const end = start + Math.min(chunkSizeBytes, totalSizeBytes - start)

      const body = file.slice(start, end)

      while (true) {
        try {
          const uploadPartResult = await s3.send(
            new UploadPartCommand({
              PartNumber: partNumber,
              Body: body,
              UploadId: createUploadResult.UploadId,
              Key: key,
              Bucket: bucketName,
            })
          )

          parts.push({
            PartNumber: partNumber,
            ETag: uploadPartResult.ETag,
          })

          break
        } catch (err) {
          emitter.emit('pause', partNumber)
          await delay(5000)
          emitter.emit('resume', partNumber)
        }
      }

      emitter.emit('progress', partNumber / numberOfPartsToUpload)
    }

    return s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: createUploadResult.UploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
    )
  } catch (err) {
    return s3.send(
      new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: createUploadResult.UploadId,
      })
    )
  }
}
